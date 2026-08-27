import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import GeradorForm from "./GeradorForm";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>CodexEX</h1>
          <p style={{ color: "#666", margin: 0 }}>Olá, {session.user?.name}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
          >
            Sair
          </button>
        </form>
      </div>

      <GeradorForm />
    </main>
  );
}
