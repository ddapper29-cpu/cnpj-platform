export interface Socio {
  nome_socio: string;
  cnpj_cpf_do_socio: string;
  qualificacao_socio: string;
  data_entrada_sociedade: string;
}

export interface CNAE {
  codigo: number;
  descricao: string;
}

export interface EmpresaData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  descricao_situacao_cadastral: string;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  cnaes_secundarios: CNAE[];
  natureza_juridica: string;
  descricao_natureza_juridica: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  ddd_telefone_1: string;
  email: string;
  porte: string;
  descricao_porte: string;
  capital_social: number;
  qsa: Socio[];
}

const BRASILAPI_URL = "https://brasilapi.com.br/api/cnpj/v1";
const CNPJWS_URL = "https://publica.cnpj.ws/cnpj";

/** Normaliza resposta do CNPJ.ws para o mesmo formato da BrasilAPI */
function normalizarCNPJws(data: Record<string, unknown>): EmpresaData {
  const est = (data.estabelecimento as Record<string, unknown>) ?? {};
  const socios = ((data.socios as unknown[]) ?? []).map((s) => {
    const socio = s as Record<string, unknown>;
    return {
      nome_socio: String(socio.nome ?? ""),
      cnpj_cpf_do_socio: String(socio.cpf_cnpj_socio ?? ""),
      qualificacao_socio: String((socio.qualificacao_socio as Record<string, unknown>)?.descricao ?? ""),
      data_entrada_sociedade: String(socio.data_entrada_sociedade ?? ""),
    };
  });

  const endereco = est as Record<string, unknown>;
  return {
    cnpj: String(est.cnpj ?? ""),
    razao_social: String(data.razao_social ?? ""),
    nome_fantasia: String(est.nome_fantasia ?? ""),
    situacao_cadastral: String((est.situacao_cadastral as Record<string, unknown>)?.id ?? ""),
    descricao_situacao_cadastral: String((est.situacao_cadastral as Record<string, unknown>)?.descricao ?? ""),
    data_inicio_atividade: String(est.data_inicio_atividade ?? ""),
    cnae_fiscal: Number((est.atividade_principal as Record<string, unknown>)?.subclasse ?? 0),
    cnae_fiscal_descricao: String((est.atividade_principal as Record<string, unknown>)?.descricao ?? ""),
    cnaes_secundarios: [],
    natureza_juridica: String((data.natureza_juridica as Record<string, unknown>)?.id ?? ""),
    descricao_natureza_juridica: String((data.natureza_juridica as Record<string, unknown>)?.descricao ?? ""),
    logradouro: String(endereco.logradouro ?? ""),
    numero: String(endereco.numero ?? ""),
    complemento: String(endereco.complemento ?? ""),
    bairro: String(endereco.bairro ?? ""),
    municipio: String((endereco.cidade as Record<string, unknown>)?.nome ?? ""),
    uf: String((endereco.estado as Record<string, unknown>)?.sigla ?? ""),
    cep: String(endereco.cep ?? ""),
    ddd_telefone_1: String(est.ddd1 ?? "") + String(est.telefone1 ?? ""),
    email: String(est.email ?? ""),
    porte: String((data.porte as Record<string, unknown>)?.id ?? ""),
    descricao_porte: String((data.porte as Record<string, unknown>)?.descricao ?? ""),
    capital_social: Number(data.capital_social ?? 0),
    qsa: socios,
  };
}

export async function buscarEmpresa(cnpj: string): Promise<EmpresaData> {
  const cnpjLimpo = cnpj.replace(/\D/g, "");

  // Tenta BrasilAPI primeiro
  try {
    const res = await fetch(`${BRASILAPI_URL}/${cnpjLimpo}`, {
      next: { revalidate: 3600 }, // cache de 1 hora
    });
    if (res.ok) {
      return res.json() as Promise<EmpresaData>;
    }
  } catch {
    // fallthrough para CNPJ.ws
  }

  // Fallback: CNPJ.ws
  const res = await fetch(`${CNPJWS_URL}/${cnpjLimpo}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("CNPJ não encontrado");
    throw new Error("Erro ao consultar CNPJ. Tente novamente.");
  }

  const data = await res.json();
  return normalizarCNPJws(data);
}
