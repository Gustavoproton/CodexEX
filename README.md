# CodexEX

**Gerador inteligente de planilhas de Ordem de Serviço** — transforma uma
lista de itens escrita à mão em planilhas de Ativos, Consumíveis e
Acetileno, já com código e valor do catálogo da empresa, prontas para
emissão de Nota Fiscal.

🔗 **App em produção:** [codexex-web.vercel.app](https://codexex-web.vercel.app)
📄 **Documentação técnica completa:** [`codexex-web/README.md`](./codexex-web/README.md)

---

## O problema que resolve

Cada Ordem de Serviço (OS) de locação de equipamentos vem com uma lista de
itens em texto livre — formatos inconsistentes, sem código, sem separação
entre o que é ativo e o que é consumível. Alguém precisava fazer isso à
mão todas as vezes. O CodexEX automatiza:

- **Reconhecimento dos itens** via fuzzy matching contra um catálogo de
  ~200 produtos, tolerante a variações de digitação ("220V" = "220 V")
- **Classificação automática** em Ativos, Consumíveis e Gases
- **Isolamento do Acetileno** numa planilha própria (regra de segurança:
  não pode ser transportado/armazenado junto com outros gases)
- **Geração da planilha no modelo oficial** da empresa, célula a célula

## Sobre este repositório

O projeto passou por duas versões:

1. **Protótipo em Python** (`gerar_planilha.py`, na raiz) — script de
   terminal, primeira versão funcional, usada pra validar a lógica de
   matching e a geração das planilhas.
2. **Aplicação web completa** (pasta [`codexex-web/`](./codexex-web)) —
   reescrita em Next.js + TypeScript, com login, histórico no MongoDB e
   deploy na Vercel. É essa versão que está em produção.

Toda a documentação técnica (stack, arquitetura, desafios de engenharia
resolvidos, como rodar localmente) está no README dentro de
[`codexex-web/`](./codexex-web/README.md).

## Stack

Next.js 16 · TypeScript · Auth.js · MongoDB Atlas · ExcelJS · Vercel · UptimeRobot

---

Desenvolvido por [Gustavo Chernicharo](https://github.com/Gustavoproton).
