import ExcelJS from "exceljs";
import { normalizar, type ItemCatalogo } from "./similarity";

export async function carregarCatalogo(caminhoOuBuffer: string | Buffer): Promise<ItemCatalogo[]> {
  const wb = new ExcelJS.Workbook();
  if (typeof caminhoOuBuffer === "string") {
    await wb.xlsx.readFile(caminhoOuBuffer);
  } else {
    await wb.xlsx.load(caminhoOuBuffer as any);
  }
  const ws = wb.getWorksheet("PLANILHA_COMPLETA");
  if (!ws) throw new Error('Aba "PLANILHA_COMPLETA" não encontrada no catálogo.');

  const catalogo: ItemCatalogo[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const categoria = String(row.getCell(1).value ?? "").trim().toUpperCase();
    const codigo = String(row.getCell(2).value ?? "").trim();
    const descricao = String(row.getCell(3).value ?? "").trim();
    const und = String(row.getCell(4).value ?? "UN").trim() || "UN";
    const valorRaw = row.getCell(5).value;
    const valor = typeof valorRaw === "number" ? valorRaw : parseFloat(String(valorRaw ?? "0")) || 0;

    if (!descricao) return;
    catalogo.push({
      categoria,
      codigo,
      descricao,
      descricaoNorm: normalizar(descricao),
      und,
      valor,
    });
  });
  return catalogo;
}

export interface ItemEscopo {
  descricaoOriginal: string;
  qtd: number;
}

const LINE_RE =
  /^\s*(?:(\d+)\s*[xX]?\s*[-–]?\s*)?(.+?)(?:\s*[-–xX]\s*(\d+)\s*(?:un\.?|und\.?|unid\w*)?)?\s*$/;

export function parseEscopo(texto: string): ItemEscopo[] {
  const itens: ItemEscopo[] = [];
  for (const linhaRaw of texto.split(/\r?\n/)) {
    const linha = linhaRaw.trim();
    if (!linha) continue;
    const m = LINE_RE.exec(linha);
    if (!m) continue;
    const desc = (m[2] ?? "").trim().replace(/^[-–]+|[-–]+$/g, "").trim();
    const qtdStr = m[1] ?? m[3] ?? "1";
    if (desc) {
      itens.push({ descricaoOriginal: desc, qtd: parseInt(qtdStr, 10) });
    }
  }
  return itens;
}
