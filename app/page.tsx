import BuscaCNPJ from "@/components/BuscaCNPJ";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero */}
      <section className="py-24 text-center">
        <span className="badge bg-brand-900 text-brand-300 mb-6">
          Consulta gratuita · Sem cadastro
        </span>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
          Consulte qualquer CNPJ{" "}
          <span className="text-brand-500">em segundos</span>
        </h1>
        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          Dados completos de empresas brasileiras com visualização da{" "}
          <strong className="text-white">teia de relacionamentos</strong> entre sócios e empresas vinculadas.
        </p>

        <div className="max-w-2xl mx-auto">
          <BuscaCNPJ size="lg" />
        </div>

        <p className="mt-4 text-sm text-zinc-600">
          Exemplos: 33.000.167/0001-01 (Petrobras) · 60.701.190/0001-04 (Itaú)
        </p>
      </section>

      {/* Features */}
      <section className="grid sm:grid-cols-3 gap-6 pb-24">
        {[
          {
            icon: "🔍",
            title: "Dados completos",
            desc: "Razão social, CNAEs, sócios, endereço, situação cadastral e muito mais.",
          },
          {
            icon: "🕸️",
            title: "Teia de relacionamentos",
            desc: "Visualize o grafo de conexões entre sócios e empresas de forma interativa.",
          },
          {
            icon: "⚡",
            title: "Resposta rápida",
            desc: "Dados em tempo real via BrasilAPI com cache inteligente.",
          },
        ].map((f) => (
          <div key={f.title} className="card">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-white mb-1">{f.title}</h3>
            <p className="text-sm text-zinc-400">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
