"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contaCriada = searchParams.get("criado") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setCarregando(false);

    if (res?.error) {
      setErro("E-mail ou senha inválidos.");
    } else {
      const dest = searchParams.get("callbackUrl") || "/dashboard";
      router.push(dest);
      router.refresh();
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-mark">C</div>
        <h1>Entrar no CodexEX</h1>
        <p className="subtitle">Acesse com sua conta da equipe</p>

        {contaCriada && (
          <p className="success-text">Conta criada! Faça login abaixo.</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {erro && <p className="error-text">{erro}</p>}

          <button type="submit" className="btn-primary" disabled={carregando}>
            {carregando && <span className="spinner" />}
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="login-hint">
          Não tem conta? <Link href="/signup">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
