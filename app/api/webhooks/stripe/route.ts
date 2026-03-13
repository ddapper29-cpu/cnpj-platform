import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { atualizarPlano } from "@/lib/rate-limit";
import type { Plano } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook inválido" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const plano = session.metadata?.plano as Plano;

    if (userId && plano) {
      await atualizarPlano(userId, plano);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    // Busca userId pelo customer ID via metadata da subscription
    const userId = (subscription.metadata as Record<string, string>)?.userId;
    if (userId) await atualizarPlano(userId, "gratuito");
  }

  return NextResponse.json({ received: true });
}
