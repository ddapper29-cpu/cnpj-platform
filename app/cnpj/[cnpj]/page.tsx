import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buscarEmpresa } from "@/lib/brasilapi";
import { validarCNPJ, formatarCNPJ } from "@/lib/cnpj-utils";
import EmpresaCard from "@/components/EmpresaCard";
import BuscaCNPJ from "@/components/BuscaCNPJ";

interface Props {
  params: { cnpj: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cnpj = params.cnpj.replace(/\D/g, "");
  if (!validarCNPJ(cnpj)) return { title: "CNPJ inválido" };

  try {
    const empresa = await buscarEmpresa(cnpj);
    return {
      title: empresa.razao_social,
      description: `Dados completos de ${empresa.razao_social} — CNPJ ${formatarCNPJ(cnpj)}`,
    };
  } catch {
    return { title: "Empresa não encontrada" };
  }
}

export default async function PaginaEmpresa({ params }: Props) {
  const cnpj = params.cnpj.replace(/\D/g, "");

  if (!validarCNPJ(cnpj)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">CNPJ inválido</h1>
        <p className="text-zinc-400 mb-8">O número informado não é um CNPJ válido.</p>
        <BuscaCNPJ />
      </div>
    );
  }

  let empresa;
  try {
    empresa = await buscarEmpresa(cnpj);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "CNPJ não encontrado") notFound();
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Erro ao consultar</h1>
        <p className="text-zinc-400 mb-8">{msg || "Tente novamente em instantes."}</p>
        <Link href="/" className="btn-primary">Voltar ao início</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb + nova busca */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <nav className="text-sm text-zinc-500">
          <Link href="/" className="hover:text-white transition-colors">Início</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-300 font-mono">{formatarCNPJ(cnpj)}</span>
        </nav>
        <div className="w-full sm:w-72">
          <BuscaCNPJ size="sm" placeholder="Buscar outro CNPJ" />
        </div>
      </div>

      {/* Botão teia */}
      <div className="mb-6">
        <Link
          href={`/teia/${cnpj}`}
          className="inline-flex items-center gap-2 btn-secondary text-sm"
        >
          <span>🕸️</span> Ver teia de relacionamentos
        </Link>
      </div>

      <EmpresaCard empresa={empresa} />
    </div>
  );
}
