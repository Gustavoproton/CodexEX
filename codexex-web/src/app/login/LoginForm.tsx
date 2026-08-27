"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const res = await fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        email,
        password,
        redirect: "false",
        json: "true",
      }),
    });

    setCarregando(false);

    if (res.ok) {
      const dest = searchParams.get("callbackUrl") || "/dashboard";
      router.push(dest);
      router.refresh();
    } else {
      setErro("E-mail ou senha inválidos.");
    }
  }

  return (
    <main style={{ maxWidth: 380, margin: "80px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>CodexEX</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Entre com sua conta da equipe</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
        />
        {erro && <p style={{ color: "crimson", fontSize: 14 }}>{erro}</p>}
        <button
          type="submit"
          disabled={carregando}
          style={{
            padding: 10,
            borderRadius: 6,
            border: "none",
            background: "#111",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p style={{ color: "#999", fontSize: 13, marginTop: 20 }}>
        Não tem conta? Peça pra um administrador criar com{" "}
        <code>npm run criar-usuario</code>.
      </p>
    </main>
  );
}
