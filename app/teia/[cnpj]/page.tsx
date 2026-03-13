import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import dynamic from "next/dynamic";
import { buscarEmpresa } from "@/lib/brasilapi";
import { validarCNPJ, formatarCNPJ } from "@/lib/cnpj-utils";
import { getPlano } from "@/lib/rate-limit";

// Cytoscape não funciona no SSR — carrega apenas no cliente
const TeiaGrafo = dynamic(() => import("@/components/TeiaGrafo"), {
  ssr: false,
  loading: () => (
    <div className="card flex items-center justify-center" style={{ height: 520 }}>
      <p className="text-zinc-500 text-sm">Carregando grafo…</p>
    </div>
  ),
});

const CAMADAS_POR_PLANO: Record<string, number> = {
  gratuito: 2,
  pro: 5,
  enterprise: 10,
};

interface Props {
  params: { cnpj: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cnpj = params.cnpj.replace(/\D/g, "");
  try {
    const empresa = await buscarEmpresa(cnpj);
    return {
      title: `Teia — ${empresa.razao_social}`,
      description: `Teia de relacionamentos de ${empresa.razao_social} (${formatarCNPJ(cnpj)})`,
    };
  } catch {
    return { title: "Teia de relacionamentos" };
  }
}

export default async function PaginaTeia({ params }: Props) {
  const cnpj = params.cnpj.replace(/\D/g, "");

  if (!validarCNPJ(cnpj)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">CNPJ inválido</h1>
        <Link href="/" className="btn-primary inline-block mt-4">Voltar ao início</Link>
      </div>
    );
  }

  let empresa;
  try {
    empresa = await buscarEmpresa(cnpj);
  } catch {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Empresa não encontrada</h1>
        <Link href="/" className="btn-primary inline-block mt-4">Voltar ao início</Link>
      </div>
    );
  }

  const { userId } = auth();
  const plano = userId ? await getPlano(userId) : "gratuito";
  const maxCamadas = CAMADAS_POR_PLANO[plano] ?? 2;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-zinc-500 mb-6">
        <Link href="/" className="hover:text-white transition-colors">Início</Link>
        <span className="mx-2">/</span>
        <Link href={`/cnpj/${cnpj}`} className="hover:text-white transition-colors">
          {formatarCNPJ(cnpj)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Teia</span>
      </nav>

      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{empresa.razao_social}</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Teia de relacionamentos · {formatarCNPJ(cnpj)}
        </p>
      </div>

      {/* Info do plano */}
      {!userId && (
        <div className="card border-blue-800 bg-blue-950/30 mb-6">
          <p className="text-blue-300 text-sm">
            <strong>Faça login</strong> para visualizar a teia de relacionamentos.{" "}
            Plano gratuito inclui 2 teias/mês.
          </p>
        </div>
      )}

      {userId && plano === "gratuito" && (
        <div className="card border-zinc-700 mb-6 flex items-center justify-between gap-4">
          <p className="text-zinc-400 text-sm">
            Plano gratuito: até <strong className="text-white">2 teias/mês</strong> e{" "}
            <strong className="text-white">{maxCamadas} camadas</strong> de expansão.
          </p>
          <Link href="/planos" className="btn-primary text-sm shrink-0">
            Fazer upgrade
          </Link>
        </div>
      )}

      {/* Grafo */}
      <TeiaGrafo cnpjInicial={cnpj} maxCamadas={maxCamadas} />
    </div>
  );
}
