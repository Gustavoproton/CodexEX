"use client";

import { useState } from "react";

const EXEMPLO = `2 Alicates
2 Chave inglesa
2 Chave de boca nº 17
4 Manilha de 2 toneladas
1 Acetileno
1 Cilindro oxigênio 10m`;

export default function GeradorForm() {
  const [escopo, setEscopo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resumo, setResumo] = useState<string[] | null>(null);

  async function gerar() {
    setErro(null);
    setResumo(null);
    if (!escopo.trim()) {
      setErro("Cole a lista de itens do escopo antes de gerar.");
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escopo }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.erro || "Falha ao gerar a planilha.");
      }

      const resumoHeader = res.headers.get("X-Resumo") || "%5B%5D";
      setResumo(JSON.parse(decodeURIComponent(resumoHeader)));

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "CodexEX.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErro(e.message ?? "Erro inesperado.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div>
      <div className="section-label">Escopo da OS</div>

      <div className="console">
        <textarea
          value={escopo}
          onChange={(e) => setEscopo(e.target.value)}
          placeholder={"Cole aqui a lista de itens, um por linha:\n\n" + EXEMPLO}
          rows={14}
        />
      </div>

      <div className="actions-row">
        <button onClick={gerar} disabled={carregando} className="btn-primary" style={{ width: "auto" }}>
          {carregando && <span className="spinner" />}
          {carregando ? "Gerando..." : "Gerar planilhas"}
        </button>
        <button onClick={() => setEscopo(EXEMPLO)} type="button" className="btn-ghost">
          Usar exemplo
        </button>
      </div>

      {erro && <p className="error-text" style={{ marginTop: 16 }}>{erro}</p>}

      {resumo && resumo.length > 0 && (
        <div className="results-wrap">
          <div className="section-label">Gerado</div>
          {resumo.map((linha, i) => {
            const [arquivo, ...resto] = linha.split(" - ");
            const extensao = (arquivo.split(".").pop() || "xlsx").toUpperCase();
            return (
              <div className="ticket" key={i}>
                <div className="ticket-icon">{extensao.slice(0, 3)}</div>
                <div>
                  <div className="ticket-file">{arquivo}</div>
                  {resto.length > 0 && <div className="ticket-meta">{resto.join(" - ")}</div>}
                </div>
              </div>
            );
          })}
          <p className="hint-box">
            O topo de cada planilha (Solicitante, Cliente, OS etc.) ficou em
            branco — preencher manualmente antes de emitir a NF.
          </p>
        </div>
      )}
    </div>
  );
}
