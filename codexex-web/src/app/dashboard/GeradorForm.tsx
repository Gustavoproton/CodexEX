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

      setResumo(JSON.parse(res.headers.get("X-Resumo") || "[]"));

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
      <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
        Cole o escopo da OS (um item por linha):
      </label>
      <textarea
        value={escopo}
        onChange={(e) => setEscopo(e.target.value)}
        placeholder={EXEMPLO}
        rows={12}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #ccc",
          fontFamily: "monospace",
          fontSize: 14,
        }}
      />

      <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
        <button
          onClick={gerar}
          disabled={carregando}
          style={{
            padding: "10px 18px",
            borderRadius: 6,
            border: "none",
            background: "#111",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {carregando ? "Gerando..." : "Gerar planilhas"}
        </button>
        <button
          onClick={() => setEscopo(EXEMPLO)}
          type="button"
          style={{ padding: "10px 14px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
        >
          Usar exemplo
        </button>
      </div>

      {erro && <p style={{ color: "crimson", marginTop: 16 }}>{erro}</p>}

      {resumo && resumo.length > 0 && (
        <div style={{ marginTop: 20, padding: 16, background: "#f6f6f6", borderRadius: 8 }}>
          <strong>Resumo:</strong>
          <ul>
            {resumo.map((linha, i) => (
              <li key={i}>{linha}</li>
            ))}
          </ul>
          <p style={{ color: "#666", fontSize: 13 }}>
            O topo de cada planilha (Solicitante, Cliente, OS etc.) ficou em branco -&gt; preencher manualmente.
          </p>
        </div>
      )}
    </div>
  );
}
