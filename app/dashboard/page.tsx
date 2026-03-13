import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMetadataUsuario } from "@/lib/rate-limit";
import { criarPortalSession } from "@/lib/stripe";

const NOMES_PLANO: Record<string, string> = {
  gratuito: "Gratuito",
  pro: "Pro",
  enterprise: "Enterprise",
};

const LIMITES_TEIA: Record<string, number | string> = {
  gratuito: 2,
  pro: "Ilimitado",
  enterprise: "Ilimitado",
};

function mesAtual() {
  return new Date().toISOString().slice(0, 7);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard");

  const user = await currentUser();
  const meta = await getMetadataUsuario(userId);

  const plano = meta.plano ?? "gratuito";
  const teiasUsadas = meta.teiasMes === mesAtual() ? (meta.teiasUsadas ?? 0) : 0;
  const limiteTeia = LIMITES_TEIA[plano];
  const stripeCustomerId = (meta as Record<string, unknown>).stripeCustomerId as string | undefined;

  let portalUrl: string | null = null;
  if (stripeCustomerId) {
    try {
      const portal = await criarPortalSession(stripeCustomerId);
      portalUrl = portal.url;
    } catch {
      // sem customer no Stripe ainda
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {searchParams.success && (
        <div className="card border-emerald-700 bg-emerald-950/30 mb-6">
          <p className="text-emerald-300 text-sm font-medium">
            Pagamento confirmado! Seu plano foi atualizado.
          </p>
        </div>
      )}

      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

      {/* Info do usuário */}
      <div className="card mb-6 flex items-center gap-4">
        {user?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.imageUrl} alt="Avatar" className="w-12 h-12 rounded-full" />
        )}
        <div>
          <p className="font-semibold text-white">{user?.fullName ?? "Usuário"}</p>
          <p className="text-sm text-zinc-500">{user?.emailAddresses[0]?.emailAddress}</p>
        </div>
      </div>

      {/* Plano atual */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Plano atual</p>
            <p className="text-xl font-bold text-white">{NOMES_PLANO[plano]}</p>
          </div>
          {plano === "gratuito" ? (
            <Link href="/planos" className="btn-primary text-sm">
              Fazer upgrade
            </Link>
          ) : portalUrl ? (
            <a href={portalUrl} className="btn-secondary text-sm">
              Gerenciar assinatura
            </a>
          ) : null}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Teias usadas este mês</p>
          <p className="text-3xl font-bold text-white">
            {teiasUsadas}
            {typeof limiteTeia === "number" && (
              <span className="text-lg text-zinc-500"> / {limiteTeia}</span>
            )}
          </p>
          {typeof limiteTeia === "string" && (
            <p className="text-sm text-zinc-500 mt-1">Ilimitado</p>
          )}
          {plano === "gratuito" && typeof limiteTeia === "number" && teiasUsadas >= limiteTeia && (
            <p className="text-xs text-amber-400 mt-2">Limite atingido — <Link href="/planos" className="underline">upgrade</Link></p>
          )}
        </div>

        <div className="card">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Camadas de expansão</p>
          <p className="text-3xl font-bold text-white">
            {plano === "gratuito" ? 2 : plano === "pro" ? 5 : 10}
          </p>
          <p className="text-sm text-zinc-500 mt-1">por teia</p>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="btn-secondary text-sm">
            🔍 Consultar CNPJ
          </Link>
          <Link href="/planos" className="btn-secondary text-sm">
            📋 Ver planos
          </Link>
          {portalUrl && (
            <a href={portalUrl} className="btn-secondary text-sm">
              💳 Portal de pagamento
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
