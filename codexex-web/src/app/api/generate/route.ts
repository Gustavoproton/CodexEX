import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import JSZip from "jszip";
import { auth } from "@/lib/auth";
import { carregarCatalogo, parseEscopo } from "@/lib/catalogo";
import { classificar } from "@/lib/classificar";
import { gerarArquivos, gerarArquivoNaoEncontrados } from "@/lib/gerarXlsx";
import { getDb } from "@/lib/mongodb";

const CATALOGO_PATH = path.join(process.cwd(), "data", "catalogo_produtos.xlsx");
const TEMPLATE_PATH = path.join(process.cwd(), "data", "template_os.xlsx");

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { escopo } = await req.json();
  if (!escopo || typeof escopo !== "string" || !escopo.trim()) {
    return NextResponse.json({ erro: "Escopo vazio." }, { status: 400 });
  }

  const [catalogo, templateBuffer] = await Promise.all([
    carregarCatalogo(CATALOGO_PATH),
    readFile(TEMPLATE_PATH),
  ]);

  const itens = parseEscopo(escopo);
  const { grupos, naoEncontrados } = classificar(itens, catalogo);

  const arquivos = await gerarArquivos(templateBuffer, grupos);
  const naoEncontradosBuffer = await gerarArquivoNaoEncontrados(naoEncontrados);

  const zip = new JSZip();
  const resumo: string[] = [];
  for (const arq of arquivos) {
    zip.file(arq.nomeArquivo, arq.buffer);
    for (const aba of arq.abas) {
      resumo.push(`${arq.nomeArquivo} - aba "${aba.nome}": ${aba.qtd} item(ns)`);
    }
  }
  if (naoEncontradosBuffer) {
    zip.file("Nao_encontrados.xlsx", naoEncontradosBuffer);
    resumo.push(`Nao_encontrados.xlsx: ${naoEncontrados.length} item(ns) pra revisar`);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  // histórico no Mongo (não bloqueia a resposta se falhar)
  try {
    const db = await getDb();
    await db.collection("geracoes").insertOne({
      usuario: session.user?.email,
      criadoEm: new Date(),
      totalItens: itens.length,
      totalNaoEncontrados: naoEncontrados.length,
      arquivos: arquivos.map((a) => a.nomeArquivo),
    });
  } catch (e) {
    console.error("Falha ao gravar histórico no Mongo:", e);
  }

  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="CodexEX.zip"',
      "X-Resumo": JSON.stringify(resumo),
    },
  });
}
