import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { buscarEmpresa } from "@/lib/brasilapi";
import { buscarEmpresasPorCPF } from "@/lib/receitaws";
import { validarCNPJ } from "@/lib/cnpj-utils";
import { podeUsarTeia, incrementarTeias, getPlano } from "@/lib/rate-limit";

export interface TeiaNode {
  id: string;
  label: string;
  tipo: "empresa" | "pessoa";
  cnpj?: string;
  cpf?: string;
  situacao?: string;
}

export interface TeiaEdge {
  source: string;
  target: string;
  label: string;
}

export interface TeiaData {
  nodes: TeiaNode[];
  edges: TeiaEdge[];
  camada: number;
  limiteAtingido?: boolean;
}

const CAMADAS_POR_PLANO: Record<string, number> = {
  gratuito: 2,
  pro: 5,
  enterprise: 10,
};

export async function GET(
  req: NextRequest,
  { params }: { params: { cnpj: string } }
) {
  const cnpj = params.cnpj.replace(/\D/g, "");

  if (!validarCNPJ(cnpj)) {
    return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
  }

  const { userId } = auth();
  const camadaParam = Number(req.nextUrl.searchParams.get("camada") ?? "1");

  // Verifica limite de teias (apenas na camada 1, que é o início)
  if (camadaParam === 1) {
    if (!userId) {
      return NextResponse.json(
        { error: "Faça login para usar a teia de relacionamentos", requiresAuth: true },
        { status: 401 }
      );
    }

    const pode = await podeUsarTeia(userId);
    if (!pode) {
      return NextResponse.json(
        { error: "Limite de 2 teias/mês atingido. Faça upgrade para o plano Pro.", limiteAtingido: true },
        { status: 403 }
      );
    }

    await incrementarTeias(userId);
  }

  const plano = userId ? await getPlano(userId) : "gratuito";
  const maxCamadas = CAMADAS_POR_PLANO[plano] ?? 2;
  const limiteAtingido = camadaParam >= maxCamadas;

  try {
    const empresa = await buscarEmpresa(cnpj);
    const nodes: TeiaNode[] = [];
    const edges: TeiaEdge[] = [];
    const vistos = new Set<string>();

    // Nó raiz — a empresa consultada
    nodes.push({
      id: cnpj,
      label: empresa.razao_social || cnpj,
      tipo: "empresa",
      cnpj,
      situacao: empresa.descricao_situacao_cadastral,
    });
    vistos.add(cnpj);

    // Processa sócios
    const promessas = (empresa.qsa ?? []).map(async (socio) => {
      const docLimpo = socio.cnpj_cpf_do_socio.replace(/\D/g, "");
      const isPJ = docLimpo.length === 14;
      const isPF = docLimpo.length === 11;
      const nodeId = docLimpo || socio.nome_socio;

      if (!vistos.has(nodeId)) {
        vistos.add(nodeId);

        if (isPJ) {
          // Sócio pessoa jurídica — busca dados da empresa
          try {
            const empresaSocia = await buscarEmpresa(docLimpo);
            nodes.push({
              id: nodeId,
              label: empresaSocia.razao_social || nodeId,
              tipo: "empresa",
              cnpj: nodeId,
              situacao: empresaSocia.descricao_situacao_cadastral,
            });
          } catch {
            nodes.push({ id: nodeId, label: nodeId, tipo: "empresa", cnpj: nodeId });
          }
        } else {
          // Sócio pessoa física
          nodes.push({
            id: nodeId,
            label: socio.nome_socio,
            tipo: "pessoa",
            cpf: isPF ? nodeId : undefined,
          });

          // Expande outras empresas do CPF (requer ReceitaWS)
          if (!limiteAtingido && isPF) {
            const empresasDoCPF = await buscarEmpresasPorCPF(nodeId);
            for (const emp of empresasDoCPF) {
              if (!vistos.has(emp.cnpj) && emp.cnpj !== cnpj) {
                vistos.add(emp.cnpj);
                nodes.push({
                  id: emp.cnpj,
                  label: emp.razao_social || emp.cnpj,
                  tipo: "empresa",
                  cnpj: emp.cnpj,
                  situacao: emp.situacao,
                });
                edges.push({ source: nodeId, target: emp.cnpj, label: emp.qualificacao });
              }
            }
          }
        }
      }

      edges.push({
        source: cnpj,
        target: nodeId,
        label: socio.qualificacao_socio,
      });
    });

    await Promise.all(promessas);

    const resultado: TeiaData = { nodes, edges, camada: camadaParam, limiteAtingido };
    return NextResponse.json(resultado, {
      headers: { "Cache-Control": "public, s-maxage=1800" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
