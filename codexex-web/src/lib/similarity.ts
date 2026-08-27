export function normalizar(texto: string): string {
  const semAcento = texto
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
  return semAcento.replace(/(\d)\s+([A-Z])/g, "$1$2");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

export function ratio(a: string, b: string): number {
  if (!a && !b) return 100;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  return ((maxLen - dist) / maxLen) * 100;
}

const STOPWORDS = new Set([
  "DE", "DA", "DO", "DAS", "DOS", "E", "COM", "PARA", "EM", "A", "O", "AS", "OS",
]);

function tokenize(texto: string): string[] {
  return texto.split(/\s+/).filter((t) => t && !STOPWORDS.has(t));
}

export function tokenSetRatio(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));

  const intersecao = [...tokensA].filter((t) => tokensB.has(t)).sort();
  const soA = [...tokensA].filter((t) => !tokensB.has(t)).sort();
  const soB = [...tokensB].filter((t) => !tokensA.has(t)).sort();

  const interStr = intersecao.join(" ");
  const combinadoA = [interStr, soA.join(" ")].filter(Boolean).join(" ").trim();
  const combinadoB = [interStr, soB.join(" ")].filter(Boolean).join(" ").trim();

  return Math.max(
    ratio(interStr, combinadoA),
    ratio(interStr, combinadoB),
    ratio(combinadoA, combinadoB)
  );
}

const NUM_RE = /\d+[.,]?\d*/g;

export function extrairNumeros(texto: string): Set<string> {
  const matches = texto.match(NUM_RE);
  return new Set(matches ?? []);
}

function intersecta<T>(a: Set<T>, b: Set<T>): boolean {
  for (const item of a) if (b.has(item)) return true;
  return false;
}

export interface ItemCatalogo {
  categoria: string;
  codigo: string;
  descricao: string;
  descricaoNorm: string;
  und: string;
  valor: number;
}

export interface MatchResultado {
  item: ItemCatalogo | null;
  score: number;
}

const MATCH_THRESHOLD = 70;

export function casarItem(
  descOriginal: string,
  catalogo: ItemCatalogo[]
): MatchResultado {
  const consulta = normalizar(descOriginal);
  const numerosConsulta = extrairNumeros(consulta);

  const candidatos = catalogo
    .map((item, idx) => ({ idx, score: tokenSetRatio(consulta, item.descricaoNorm) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const qualificados: { idx: number; score: number }[] = [];
  for (const { idx, score } of candidatos) {
    if (score < MATCH_THRESHOLD) continue;
    if (numerosConsulta.size > 0) {
      const numerosCat = extrairNumeros(catalogo[idx].descricaoNorm);
      if (!intersecta(numerosConsulta, numerosCat)) continue;
    }
    qualificados.push({ idx, score });
  }

  if (qualificados.length > 0) {
    const melhorScore = qualificados[0].score;
    let empatados = qualificados.filter((q) => Math.abs(q.score - melhorScore) < 0.01);

    if (empatados.length > 1) {
      empatados = [...empatados].sort(
        (a, b) =>
          ratio(consulta, catalogo[b.idx].descricaoNorm) -
          ratio(consulta, catalogo[a.idx].descricaoNorm)
      );
      const melhorSecundario = ratio(consulta, catalogo[empatados[0].idx].descricaoNorm);
      const reempatados = empatados.filter(
        (q) => Math.abs(ratio(consulta, catalogo[q.idx].descricaoNorm) - melhorSecundario) < 0.01
      );
      const { idx, score } = empatados[0];
      const scoreFinal = reempatados.length > 1 ? Math.min(score, 90) : score;
      return { item: catalogo[idx], score: scoreFinal };
    }

    const { idx, score } = qualificados[0];
    return { item: catalogo[idx], score };
  }

  if (candidatos.length > 0 && numerosConsulta.size === 0 && candidatos[0].score >= 92) {
    const { idx, score } = candidatos[0];
    return { item: catalogo[idx], score };
  }

  return { item: null, score: candidatos[0]?.score ?? 0 };
}
