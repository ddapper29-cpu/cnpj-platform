import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { criarCheckoutSession, PLANOS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { plano } = await req.json() as { plano: "pro" | "enterprise" };
  if (!plano || !PLANOS[plano]) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  const session = await criarCheckoutSession(userId, email, PLANOS[plano].priceId, plano);
  return NextResponse.json({ url: session.url });
}
