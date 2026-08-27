import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  const { nome, email, senha, codigo } = await req.json();

  if (!nome || !email || !senha || !codigo) {
    return NextResponse.json({ erro: "Preencha todos os campos." }, { status: 400 });
  }

  const codigoEsperado = process.env.SIGNUP_CODE;
  if (!codigoEsperado) {
    return NextResponse.json(
      { erro: "Cadastro desativado (SIGNUP_CODE não configurado no servidor)." },
      { status: 500 }
    );
  }
  if (codigo !== codigoEsperado) {
    return NextResponse.json({ erro: "Código de convite inválido." }, { status: 403 });
  }

  if (String(senha).length < 6) {
    return NextResponse.json(
      { erro: "A senha precisa ter pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  const emailNormalizado = String(email).trim().toLowerCase();
  const db = await getDb();

  const existente = await db.collection("users").findOne({ email: emailNormalizado });
  if (existente) {
    return NextResponse.json({ erro: "Já existe uma conta com esse e-mail." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(senha, 10);
  await db.collection("users").insertOne({
    name: String(nome).trim(),
    email: emailNormalizado,
    passwordHash,
    criadoEm: new Date(),
  });

  return NextResponse.json({ ok: true });
}
