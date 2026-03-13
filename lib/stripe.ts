import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const PLANOS = {
  pro: {
    nome: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO!,
    valor: "R$79/mês",
  },
  enterprise: {
    nome: "Enterprise",
    priceId: process.env.STRIPE_PRICE_ENTERPRISE!,
    valor: "R$299/mês",
  },
} as const;

export async function criarCheckoutSession(
  userId: string,
  userEmail: string,
  priceId: string,
  plano: "pro" | "enterprise"
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, plano },
    success_url: `${baseUrl}/dashboard?success=1`,
    cancel_url: `${baseUrl}/planos`,
  });
}

export async function criarPortalSession(customerId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/dashboard`,
  });
}
