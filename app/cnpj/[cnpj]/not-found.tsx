import Link from "next/link";
import BuscaCNPJ from "@/components/BuscaCNPJ";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-5xl mb-4">🔍</p>
      <h1 className="text-2xl font-bold text-white mb-2">Empresa não encontrada</h1>
      <p className="text-zinc-400 mb-8">
        Não encontramos nenhuma empresa com esse CNPJ. Verifique o número e tente novamente.
      </p>
      <BuscaCNPJ />
      <Link href="/" className="inline-block mt-6 text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
        Voltar ao início
      </Link>
    </div>
  );
}
