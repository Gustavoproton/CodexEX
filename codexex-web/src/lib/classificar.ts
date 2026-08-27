import { casarItem, type ItemCatalogo } from "./similarity";
import type { ItemEscopo } from "./catalogo";

export interface LinhaItem {
  codigo: string;
  descricao: string;
  und: string;
  qtd: number;
  valorUnit: number;
  descricaoOriginal: string;
  score: number;
}

export interface ItemNaoEncontrado extends ItemEscopo {
  score: number;
}

export type Grupos = {
  ATIVO: LinhaItem[];
  CONSUMIVEL: LinhaItem[];
  GAS: LinhaItem[];
  ACETILENO: LinhaItem[];
};

export function classificar(
  itens: ItemEscopo[],
  catalogo: ItemCatalogo[]
): { grupos: Grupos; naoEncontrados: ItemNaoEncontrado[] } {
  const base: Record<"ATIVO" | "CONSUMIVEL" | "GAS", LinhaItem[]> = {
    ATIVO: [],
    CONSUMIVEL: [],
    GAS: [],
  };
  const naoEncontrados: ItemNaoEncontrado[] = [];

  for (const item of itens) {
    const { item: match, score } = casarItem(item.descricaoOriginal, catalogo);
    if (!match) {
      naoEncontrados.push({ ...item, score });
      continue;
    }
    const linha: LinhaItem = {
      codigo: match.codigo,
      descricao: match.descricao,
      und: match.und,
      qtd: item.qtd,
      valorUnit: match.valor,
      descricaoOriginal: item.descricaoOriginal,
      score,
    };
    const categoria = (["ATIVO", "CONSUMIVEL", "GAS"] as const).includes(match.categoria as any)
      ? (match.categoria as "ATIVO" | "CONSUMIVEL" | "GAS")
      : "CONSUMIVEL";
    base[categoria].push(linha);
  }

  const acetileno = base.GAS.filter((g) => g.descricao.toUpperCase().includes("ACETILENO"));
  const outrosGases = base.GAS.filter((g) => !acetileno.includes(g));

  const grupos: Grupos = {
    ATIVO: base.ATIVO,
    CONSUMIVEL: base.CONSUMIVEL,
    GAS: outrosGases,
    ACETILENO: acetileno,
  };

  return { grupos, naoEncontrados };
}
