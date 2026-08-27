import ExcelJS from "exceljs";
import type { LinhaItem, Grupos, ItemNaoEncontrado } from "./classificar";

const PRIMEIRA_LINHA_ITEM = 19;
const COLUNAS_ITEM = ["A", "B", "G", "H", "I", "J"] as const;

const CELULAS_CABECALHO_EM_BRANCO = [
  "B6", "H6", "A8", "F8", "B10", "B11", "G11",
  "C13", "H13", "C14", "H14", "C15", "H15", "C16", "J16",
];

const FILL_REVISAR: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFF2CC" },
};

async function novoWorkbookDoTemplate(templateBuffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(templateBuffer as any);
  return wb;
}

function copiarEstiloCelula(origem: ExcelJS.Cell, destino: ExcelJS.Cell) {
  destino.font = { ...origem.font };
  destino.border = { ...origem.border };
  destino.fill = origem.fill as ExcelJS.Fill;
  destino.numFmt = origem.numFmt;
  destino.alignment = { ...origem.alignment };
}

function montarAba(
  wb: ExcelJS.Workbook,
  templateWs: ExcelJS.Worksheet,
  nomeAba: string,
  itens: LinhaItem[]
) {
  const ws = wb.addWorksheet(nomeAba.slice(0, 31));

  ws.properties.defaultRowHeight = templateWs.properties.defaultRowHeight;
  templateWs.columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
  });

  const merges: string[] = (templateWs.model as any).merges ?? [];
  for (const range of merges) {
    ws.mergeCells(range);
  }

  templateWs.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const novaLinha = ws.getRow(rowNumber);
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const novaCelula = novaLinha.getCell(colNumber);
      const éEscrava = cell.isMerged && cell.master && cell.master.address !== cell.address;
      if (!éEscrava) {
        novaCelula.value = cell.value;
      }
      copiarEstiloCelula(cell, novaCelula);
    });
    novaLinha.height = row.height;
  });
  ws.views = templateWs.views;
  ws.pageSetup = { ...templateWs.pageSetup };

  for (const coord of CELULAS_CABECALHO_EM_BRANCO) {
    ws.getCell(coord).value = null;
  }

  const ultimaLinhaModelo = templateWs.actualRowCount;
  for (let linha = PRIMEIRA_LINHA_ITEM; linha <= ultimaLinhaModelo; linha++) {
    for (const col of COLUNAS_ITEM) {
      ws.getCell(`${col}${linha}`).value = null;
    }
  }

  let linha = PRIMEIRA_LINHA_ITEM;
  for (const it of itens) {
    if (linha > ultimaLinhaModelo) {
      for (const col of COLUNAS_ITEM) {
        copiarEstiloCelula(ws.getCell(`${col}${ultimaLinhaModelo}`), ws.getCell(`${col}${linha}`));
      }
      ws.mergeCells(`B${linha}:F${linha}`);
    }

    const revisar = it.score < 95;

    ws.getCell(`A${linha}`).value = it.codigo;
    let desc = it.descricao;
    if (revisar) {
      desc += `  (conferir: digitado como "${it.descricaoOriginal}")`;
    }
    ws.getCell(`B${linha}`).value = desc;
    ws.getCell(`G${linha}`).value = it.und;
    ws.getCell(`H${linha}`).value = it.qtd;
    ws.getCell(`I${linha}`).value = it.valorUnit;
    ws.getCell(`I${linha}`).numFmt = "#,##0.00";
    ws.getCell(`J${linha}`).value = { formula: `H${linha}*I${linha}` } as any;
    ws.getCell(`J${linha}`).numFmt = "#,##0.00";

    if (revisar) {
      for (const col of COLUNAS_ITEM) {
        ws.getCell(`${col}${linha}`).fill = FILL_REVISAR;
      }
    }

    linha++;
  }

  const linhaTotal = Math.max(linha, ultimaLinhaModelo + 1);
  if (linhaTotal > ultimaLinhaModelo) {
    for (const col of COLUNAS_ITEM) {
      copiarEstiloCelula(ws.getCell(`${col}${ultimaLinhaModelo}`), ws.getCell(`${col}${linhaTotal}`));
    }
    ws.mergeCells(`B${linhaTotal}:F${linhaTotal}`);
  }
  ws.getCell(`B${linhaTotal}`).value = "TOTAL GERAL";
  ws.getCell(`B${linhaTotal}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`B${linhaTotal}`).alignment = { horizontal: "right" };
  ws.getCell(`J${linhaTotal}`).value = itens.length
    ? ({ formula: `SUM(J${PRIMEIRA_LINHA_ITEM}:J${linhaTotal - 1})` } as any)
    : 0;
  ws.getCell(`J${linhaTotal}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`J${linhaTotal}`).numFmt = "#,##0.00";

  return ws;
}

interface ArquivoGerado {
  nomeArquivo: string;
  buffer: Buffer;
  abas: { nome: string; qtd: number }[];
}

const ARQUIVOS_SAIDA: { sufixo: string; categorias: [keyof Grupos, string][] }[] = [
  { sufixo: "Ativos", categorias: [["ATIVO", "Ativos"]] },
  {
    sufixo: "Consumiveis",
    categorias: [
      ["CONSUMIVEL", "Consumíveis"],
      ["GAS", "Gases"],
    ],
  },
  { sufixo: "Acetileno", categorias: [["ACETILENO", "Acetileno"]] },
];

export async function gerarArquivos(
  templateBuffer: Buffer,
  grupos: Grupos
): Promise<ArquivoGerado[]> {
  const resultados: ArquivoGerado[] = [];

  for (const { sufixo, categorias } of ARQUIVOS_SAIDA) {
    const categoriasComItem = categorias.filter(([chave]) => grupos[chave].length > 0);
    if (categoriasComItem.length === 0) continue;

    const wb = await novoWorkbookDoTemplate(templateBuffer);
    const templateWs = wb.worksheets[0];

    const abas: { nome: string; qtd: number }[] = [];
    for (const [chave, nomeAba] of categoriasComItem) {
      montarAba(wb, templateWs, nomeAba, grupos[chave]);
      abas.push({ nome: nomeAba, qtd: grupos[chave].length });
    }
    wb.removeWorksheet(templateWs.id);

    const buffer = Buffer.from(await wb.xlsx.writeBuffer());
    resultados.push({ nomeArquivo: `${sufixo}.xlsx`, buffer, abas });
  }

  return resultados;
}

export async function gerarArquivoNaoEncontrados(
  itens: ItemNaoEncontrado[]
): Promise<Buffer | null> {
  if (itens.length === 0) return null;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Não encontrados");
  ws.getCell("A1").value = "Descrição digitada no escopo";
  ws.getCell("B1").value = "Qtde";
  ws.getCell("C1").value = "Melhor score encontrado";
  for (const c of ["A1", "B1", "C1"]) {
    ws.getCell(c).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    ws.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
  }
  let linha = 2;
  for (const item of itens) {
    ws.getCell(`A${linha}`).value = item.descricaoOriginal;
    ws.getCell(`B${linha}`).value = item.qtd;
    ws.getCell(`C${linha}`).value = Math.round(item.score * 10) / 10;
    linha++;
  }
  ws.getColumn(1).width = 45;
  ws.getColumn(2).width = 10;
  ws.getColumn(3).width = 20;

  return Buffer.from(await wb.xlsx.writeBuffer());
}
