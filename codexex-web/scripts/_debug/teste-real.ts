import { readFile } from "fs/promises";
import path from "path";
import { carregarCatalogo, parseEscopo } from "../../src/lib/catalogo";
import { classificar } from "../../src/lib/classificar";
import { gerarArquivos } from "../../src/lib/gerarXlsx";

async function main() {
  const inicio = Date.now();
  const catalogo = await carregarCatalogo(path.join(process.cwd(), "data", "catalogo_produtos.xlsx"));
  const templateBuffer = await readFile(path.join(process.cwd(), "data", "template_os.xlsx"));

  const escopo = `Caixa metálica de 1,5 metro cúbico
Esmerilhadeira angular de 7 polegadas (18 cm) 220V - 1 unidade
Jogo de chaves (10" / 12" / 14" / 18" / 24") - 1 unidade
Penetrante - 10 unidades
Extensão elétrica de 220 V - 1 unidade`;

  const itens = parseEscopo(escopo);
  const { grupos, naoEncontrados } = classificar(itens, catalogo);
  const arquivos = await gerarArquivos(templateBuffer, grupos);

  console.log("OK em", Date.now() - inicio, "ms ->", arquivos.map(a => a.nomeArquivo), "| não encontrados:", naoEncontrados.length);
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
