import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppHeader from "./AppHeader";
import GeradorForm from "./GeradorForm";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <AppHeader nome={session.user?.name ?? session.user?.email ?? ""} />
      <main className="app-main">
        <GeradorForm />
      </main>
    </>
  );
}
