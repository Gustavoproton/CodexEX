# CodexEX

**De uma lista de itens digitada à mão até planilhas de Ativos, Consumíveis
e Acetileno prontas pra Nota Fiscal — em segundos, com código e valor
puxados automaticamente do catálogo da empresa.**

🔗 [codexex-web.vercel.app](https://codexex-web.vercel.app)

---

## O problema

Toda Ordem de Serviço (OS) de locação de equipamentos precisa virar uma
requisição de NF — mas os itens chegam escritos em texto livre (às vezes
com marcadores, às vezes sem, às vezes com "220 V" e às vezes "220V"), e
alguém precisa manualmente:

1. Achar o código de cada item num catálogo de ~200 produtos
2. Separar o que é **Ativo** do que é **Consumível**
3. Isolar o **Acetileno** de outros gases (por segurança — eles não podem
   ser transportados/armazenados juntos)
4. Montar isso tudo numa planilha no modelo oficial da empresa

O CodexEX faz isso automaticamente.

## Como funciona
"2 Esmerilhadeira angular de 4,5 polegadas 220V"
│
▼
motor de fuzzy matching
(compara com ~200 itens do catálogo)
│
▼
ESM412R21200D01 · Esmerilhadeira 4.1/2 Pol 220V
Ativos.xlsx · linha 19 · R$ 1.906,88

- **Matching tolerante a erro de digitação e formatação** — reconhece que
  "220 V" e "220V" são a mesma coisa, ignora palavras de ligação
  ("de", "para"), e lida com marcadores de lista (`*`, `-`, `1.`) e
  quantidade em formatos variados (`"- 2 unidades"`, `"x2"`, `"QT: 2"`).
- **Trava de segurança no matching**: se a descrição digitada tem um
  número (mm, polegada, tonelada) que não bate com nenhum candidato do
  catálogo, o item **não** é forçado a um código errado — fica marcado
  pra revisão manual em vez de arriscar um valor/código incorreto na NF.
- **Regra do acetileno**: sempre isolado numa planilha própria quando
  aparece junto com outros gases.
- Gera os arquivos **clonando célula a célula o modelo oficial** da
  empresa (bordas, cores, mescla de células) — não recria do zero.

## Stack

- **Next.js 16** (App Router, TypeScript) — hospedado na **Vercel**
- **Auth.js v5** — login por credenciais, com config separada
  edge-safe/full pra funcionar no Edge Middleware da Vercel
- **MongoDB Atlas** — usuários e histórico de gerações
- **ExcelJS** — clonagem e geração dos `.xlsx` no servidor
- **Motor de fuzzy matching próprio**, escrito em TypeScript (porta de
  uma versão original em Python com `rapidfuzz`) — implementa
  Levenshtein ratio e token-set ratio do zero, sem dependências pesadas
- **UptimeRobot** — monitoramento de disponibilidade

## Desafios técnicos resolvidos

- **Edge Runtime x MongoDB**: o middleware do Next.js roda por padrão no
  Edge Runtime, que não suporta o driver do MongoDB nem `bcrypt`. Separar
  a config do Auth.js em duas partes — uma "leve" (edge-safe) pro
  middleware e uma completa pras rotas de API — resolveu o crash em
  produção sem abrir mão de credentials-based auth.
- **Clonagem fiel de planilha**: replicar exatamente a formatação de um
  `.xlsx` corporativo (bordas, merges, cores) exigia clonar célula a
  célula preservando a ordem correta entre mesclagem e escrita de
  valores — inverter essa ordem duplicava conteúdo silenciosamente.
- **Fuzzy matching sem bibliotecas prontas em Node**: o ecossistema JS não
  tem um equivalente direto ao `rapidfuzz` do Python, então o
  `token_set_ratio` e o Levenshtein ratio foram implementados na mão.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com suas credenciais
npm run dev
```

Variáveis de ambiente necessárias — veja `.env.example`:
`MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`, `SIGNUP_CODE`.

## Estrutura

| Caminho | Papel |
|---|---|
| `src/lib/similarity.ts` | Motor de fuzzy matching |
| `src/lib/catalogo.ts` | Leitura do catálogo + parser do escopo colado |
| `src/lib/classificar.ts` | Classificação Ativo/Consumível/Gás/Acetileno |
| `src/lib/gerarXlsx.ts` | Clonagem do modelo e geração dos arquivos |
| `src/lib/auth.config.ts` | Config edge-safe do Auth.js (middleware) |
| `src/lib/auth.ts` | Config completa do Auth.js (rotas de API) |
| `data/*.xlsx` | Catálogo e modelo oficial (versionados no repo) |

---

Feito com Next.js, TypeScript e bastante depuração de bundler de Edge
Function. 🛠️
