"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatarCNPJ, validarCNPJ, limparCNPJ } from "@/lib/cnpj-utils";

interface BuscaCNPJProps {
  size?: "sm" | "lg";
  placeholder?: string;
}

export default function BuscaCNPJ({ size = "lg", placeholder = "Digite o CNPJ" }: BuscaCNPJProps) {
  const router = useRouter();
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCNPJ(e.target.value);
    setValor(formatado);
    setErro("");
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const cnpj = limparCNPJ(valor);

      if (!validarCNPJ(cnpj)) {
        setErro("CNPJ inválido. Verifique os dígitos e tente novamente.");
        return;
      }

      setLoading(true);
      router.push(`/cnpj/${cnpj}`);
    },
    [valor, router]
  );

  const isLg = size === "lg";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex gap-2 ${isLg ? "flex-col sm:flex-row" : "flex-row"}`}>
        <div className="flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={valor}
            onChange={handleChange}
            placeholder={placeholder}
            maxLength={18}
            className={`w-full bg-zinc-900 border ${
              erro ? "border-red-500" : "border-zinc-700"
            } rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
              isLg ? "px-5 py-4 text-lg" : "px-4 py-2.5 text-sm"
            }`}
          />
          {erro && <p className="mt-1.5 text-sm text-red-400">{erro}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || limparCNPJ(valor).length < 14}
          className={`btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
            isLg ? "px-8 py-4 text-base" : "px-4 py-2.5 text-sm"
          }`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Consultar
            </>
          )}
        </button>
      </div>
    </form>
  );
}
