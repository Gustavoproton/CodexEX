import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodexEX",
  description: "Gerador de planilhas de OS (Ativos / Consumíveis / Acetileno)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
