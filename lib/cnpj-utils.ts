/** Remove tudo que não for dígito */
export function limparCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

/** Formata CNPJ: 00.000.000/0001-00 */
export function formatarCNPJ(cnpj: string): string {
  const d = limparCNPJ(cnpj).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Valida CNPJ pelos dígitos verificadores */
export function validarCNPJ(cnpj: string): boolean {
  const d = limparCNPJ(cnpj);
  if (d.length !== 14) return false;
  if (/^(\d)\1+$/.test(d)) return false; // todos iguais

  const calcDigito = (base: string, pesos: number[]) => {
    const soma = base.split("").reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcDigito(d.slice(0, 12), pesos1);
  const d2 = calcDigito(d.slice(0, 13), pesos2);

  return d1 === Number(d[12]) && d2 === Number(d[13]);
}
