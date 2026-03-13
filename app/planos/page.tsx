"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

const RECURSOS = [
  { label: "Consultas CNPJ", gratuito: "10/dia", pro: "Ilimitado", enterprise: "Ilimitado" },
  { label: "Teia de relacionamentos", gratuito: "2/mês", pro: "Ilimitado (5 camadas)", enterprise: "Ilimitado (10 camadas)" },
  { label: "Exportar teia (PNG)", gratuito: "❌", pro: "✅", enterprise: "✅" },
  { label: "Exportar dados (Excel)", gratuito: "❌", pro: "✅", enterprise: "✅" },
  { label: "Monitoramento de CNPJs", gratuito: "❌", pro: "5 CNPJs", enterprise: "Ilimitado" },
  { label: "Acesso via API", gratuito: "❌", pro: "❌", enterprise: "✅" },
  { label: "Anúncios", gratuito: "✅", pro: "❌", enterprise: "❌" },
];

export default function PlanosPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const assinar = async (plano: "pro" | "enterprise") => {
    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/planos");
      return;
    }
    setLoading(plano);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Planos simples e transparentes</h1>
        <p className="text-zinc-400 text-lg">Comece grátis, faça upgrade quando precisar.</p>
      </div>

      {/* Cards de planos */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {/* Gratuito */}
        <div className="card flex flex-col">
          <div className="mb-6">
            <p className="text-sm text-zinc-500 mb-1">Gratuito</p>
            <p className="text-4xl font-bold text-white">R$0</p>
            <p className="text-zinc-500 text-sm mt-1">para sempre</p>
          </div>
          <ul className="space-y-2 text-sm text-zinc-400 flex-1 mb-6">
            <li>✓ 10 consultas de CNPJ/dia</li>
            <li>✓ 2 teias de relacionamentos/mês</li>
            <li>✓ 2 camadas de expansão</li>
            <li className="text-zinc-600">✗ Exportação de dados</li>
            <li className="text-zinc-600">✗ Monitoramento</li>
          </ul>
          <button disabled className="btn-secondary opacity-60 cursor-default w-full">
            Plano atual
          </button>
        </div>

        {/* Pro */}
        <div className="card flex flex-col border-brand-600 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-brand-600 text-white">
            Mais popular
          </span>
          <div className="mb-6">
            <p className="text-sm text-zinc-500 mb-1">Pro</p>
            <p className="text-4xl font-bold text-white">R$79</p>
            <p className="text-zinc-500 text-sm mt-1">por mês</p>
          </div>
          <ul className="space-y-2 text-sm text-zinc-400 flex-1 mb-6">
            <li>✓ Consultas ilimitadas</li>
            <li>✓ Teia ilimitada (5 camadas)</li>
            <li>✓ Exportar PNG e Excel</li>
            <li>✓ Monitorar 5 CNPJs</li>
            <li className="text-zinc-600">✗ Acesso via API</li>
          </ul>
          <button
            onClick={() => assinar("pro")}
            disabled={loading === "pro"}
            className="btn-primary w-full"
          >
            {loading === "pro" ? "Redirecionando…" : "Assinar Pro"}
          </button>
        </div>

        {/* Enterprise */}
        <div className="card flex flex-col">
          <div className="mb-6">
            <p className="text-sm text-zinc-500 mb-1">Enterprise</p>
            <p className="text-4xl font-bold text-white">R$299</p>
            <p className="text-zinc-500 text-sm mt-1">por mês</p>
          </div>
          <ul className="space-y-2 text-sm text-zinc-400 flex-1 mb-6">
            <li>✓ Tudo do Pro</li>
            <li>✓ Teia com 10 camadas</li>
            <li>✓ Monitoramento ilimitado</li>
            <li>✓ Acesso via API REST</li>
            <li>✓ Suporte prioritário</li>
          </ul>
          <button
            onClick={() => assinar("enterprise")}
            disabled={loading === "enterprise"}
            className="btn-secondary w-full"
          >
            {loading === "enterprise" ? "Redirecionando…" : "Assinar Enterprise"}
          </button>
        </div>
      </div>

      {/* Tabela comparativa */}
      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-white mb-4">Comparativo completo</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-2 pr-4 text-zinc-500 font-medium">Recurso</th>
              <th className="text-center py-2 px-4 text-zinc-400 font-medium">Gratuito</th>
              <th className="text-center py-2 px-4 text-brand-400 font-medium">Pro</th>
              <th className="text-center py-2 px-4 text-zinc-400 font-medium">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {RECURSOS.map((r) => (
              <tr key={r.label} className="border-b border-zinc-800/50 last:border-0">
                <td className="py-2.5 pr-4 text-zinc-400">{r.label}</td>
                <td className="py-2.5 px-4 text-center text-zinc-400">{r.gratuito}</td>
                <td className="py-2.5 px-4 text-center text-zinc-300">{r.pro}</td>
                <td className="py-2.5 px-4 text-center text-zinc-400">{r.enterprise}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
