import { clerkClient } from "@clerk/nextjs/server";

export type Plano = "gratuito" | "pro" | "enterprise";

const LIMITES: Record<Plano, number> = {
  gratuito: 2,
  pro: Infinity,
  enterprise: Infinity,
};

interface TeiaMetadata {
  teiasUsadas?: number;
  teiasMes?: string; // "YYYY-MM"
  plano?: Plano;
}

function mesAtual(): string {
  return new Date().toISOString().slice(0, 7); // "2024-03"
}

export async function getMetadataUsuario(userId: string): Promise<TeiaMetadata> {
  const user = await clerkClient.users.getUser(userId);
  return (user.privateMetadata as TeiaMetadata) ?? {};
}

export async function getTeiasUsadas(userId: string): Promise<number> {
  const meta = await getMetadataUsuario(userId);
  if (meta.teiasMes !== mesAtual()) return 0; // virou o mês, zera
  return meta.teiasUsadas ?? 0;
}

export async function getPlano(userId: string): Promise<Plano> {
  const meta = await getMetadataUsuario(userId);
  return meta.plano ?? "gratuito";
}

export async function podeUsarTeia(userId: string): Promise<boolean> {
  const plano = await getPlano(userId);
  const limite = LIMITES[plano];
  if (limite === Infinity) return true;
  const usadas = await getTeiasUsadas(userId);
  return usadas < limite;
}

export async function incrementarTeias(userId: string): Promise<void> {
  const meta = await getMetadataUsuario(userId);
  const mes = mesAtual();
  const usadas = meta.teiasMes === mes ? (meta.teiasUsadas ?? 0) : 0;

  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: {
      ...meta,
      teiasUsadas: usadas + 1,
      teiasMes: mes,
    },
  });
}

export async function atualizarPlano(userId: string, plano: Plano): Promise<void> {
  const meta = await getMetadataUsuario(userId);
  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: { ...meta, plano },
  });
}
