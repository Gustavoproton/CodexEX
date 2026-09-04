import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { erro: "Cadastro desativado. Este é um projeto de demonstração." },
    { status: 403 }
  );
}