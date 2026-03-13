/**
 * ReceitaWS — API paga para cruzamento CPF→CNPJs
 * Se RECEITAWS_API_KEY não estiver configurada, retorna lista vazia
 * e a teia é montada apenas com os dados da BrasilAPI (sem expansão de PF).
 */

export interface EmpresaDoCPF {
  cnpj: string;
  razao_social: string;
  situacao: string;
  qualificacao: string;
}

export async function buscarEmpresasPorCPF(cpf: string): Promise<EmpresaDoCPF[]> {
  const apiKey = process.env.RECEITAWS_API_KEY;
  if (!apiKey) return []; // sem chave = teia parcial, sem erro

  const cpfLimpo = cpf.replace(/\D/g, "");
  if (cpfLimpo.length !== 11) return [];

  try {
    const res = await fetch(
      `https://www.receitaws.com.br/v1/cpf/${cpfLimpo}/empresas`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data.empresas ?? []).map((e: Record<string, unknown>) => ({
      cnpj: String(e.cnpj ?? "").replace(/\D/g, ""),
      razao_social: String(e.razao_social ?? ""),
      situacao: String(e.situacao ?? ""),
      qualificacao: String(e.qualificacao ?? ""),
    }));
  } catch {
    return [];
  }
}
