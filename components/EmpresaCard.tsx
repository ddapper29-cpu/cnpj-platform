import { EmpresaData } from "@/lib/brasilapi";
import { formatarCNPJ } from "@/lib/cnpj-utils";

interface Props {
  empresa: EmpresaData;
}

function Campo({ label, valor }: { label: string; valor: string | number | undefined }) {
  if (!valor && valor !== 0) return null;
  return (
    <div>
      <dt className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-zinc-100">{String(valor)}</dd>
    </div>
  );
}

function situacaoCor(situacao: string) {
  const s = situacao?.toLowerCase();
  if (s === "ativa" || s === "2") return "bg-emerald-900 text-emerald-300";
  if (s === "baixada" || s === "8") return "bg-red-900 text-red-300";
  return "bg-zinc-800 text-zinc-300";
}

function formatarCapital(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function formatarCEP(cep: string) {
  const d = cep?.replace(/\D/g, "") ?? "";
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : cep;
}

function formatarTelefone(tel: string) {
  const d = tel?.replace(/\D/g, "") ?? "";
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return tel;
}

export default function EmpresaCard({ empresa }: Props) {
  const endereco = [
    empresa.logradouro,
    empresa.numero && `nº ${empresa.numero}`,
    empresa.complemento,
    empresa.bairro,
    empresa.municipio && `${empresa.municipio}/${empresa.uf}`,
    empresa.cep && formatarCEP(empresa.cep),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{empresa.razao_social}</h1>
            {empresa.nome_fantasia && (
              <p className="text-zinc-400 mt-0.5">{empresa.nome_fantasia}</p>
            )}
            <p className="text-sm text-zinc-500 mt-1 font-mono">{formatarCNPJ(empresa.cnpj)}</p>
          </div>
          <span className={`badge ${situacaoCor(empresa.descricao_situacao_cadastral)}`}>
            {empresa.descricao_situacao_cadastral || empresa.situacao_cadastral}
          </span>
        </div>
      </div>

      {/* Dados principais */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Dados cadastrais</h2>
        <dl className="grid sm:grid-cols-2 gap-4">
          <Campo label="Natureza jurídica" valor={empresa.descricao_natureza_juridica} />
          <Campo label="Porte" valor={empresa.descricao_porte} />
          <Campo label="Capital social" valor={empresa.capital_social ? formatarCapital(empresa.capital_social) : undefined} />
          <Campo label="Data de abertura" valor={empresa.data_inicio_atividade} />
          <Campo label="Telefone" valor={empresa.ddd_telefone_1 ? formatarTelefone(empresa.ddd_telefone_1) : undefined} />
          <Campo label="E-mail" valor={empresa.email} />
        </dl>
      </div>

      {/* Endereço */}
      {endereco && (
        <div className="card">
          <h2 className="font-semibold text-white mb-2">Endereço</h2>
          <p className="text-sm text-zinc-300">{endereco}</p>
        </div>
      )}

      {/* CNAEs */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Atividades econômicas</h2>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="badge bg-brand-900 text-brand-300 shrink-0 mt-0.5">Principal</span>
            <span className="text-sm text-zinc-300">{empresa.cnae_fiscal_descricao}</span>
          </div>
          {empresa.cnaes_secundarios?.map((cnae) => (
            <div key={cnae.codigo} className="flex items-start gap-3">
              <span className="badge bg-zinc-800 text-zinc-400 shrink-0 mt-0.5">Secundária</span>
              <span className="text-sm text-zinc-400">{cnae.descricao}</span>
            </div>
          ))}
        </div>
      </div>

      {/* QSA — Sócios */}
      {empresa.qsa?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-white mb-4">
            Quadro de sócios e administradores ({empresa.qsa.length})
          </h2>
          <div className="space-y-3">
            {empresa.qsa.map((socio, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{socio.nome_socio}</p>
                  <p className="text-xs text-zinc-500">{socio.qualificacao_socio}</p>
                </div>
                {socio.data_entrada_sociedade && (
                  <span className="text-xs text-zinc-600">desde {socio.data_entrada_sociedade}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
