"use client";

import { signOut } from "next-auth/react";

export default function AppHeader({ nome }: { nome: string }) {
  return (
    <header className="app-header">
      <div>
        <div className="wordmark">CodexEX</div>
        <p className="greeting">Olá, {nome}</p>
      </div>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Sair
      </button>
    </header>
  );
}
