import { NextRequest, NextResponse } from "next/server";
import { buscarEmpresa } from "@/lib/brasilapi";
import { validarCNPJ } from "@/lib/cnpj-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { cnpj: string } }
) {
  const cnpj = params.cnpj.replace(/\D/g, "");

  if (!validarCNPJ(cnpj)) {
    return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
  }

  try {
    const empresa = await buscarEmpresa(cnpj);
    return NextResponse.json(empresa, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const status = message === "CNPJ não encontrado" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
