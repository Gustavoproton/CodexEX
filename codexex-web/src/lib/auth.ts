import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "./mongodb";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const db = await getDb();
        const user = await db.collection("users").findOne({ email });
        if (!user) return null;

        const senhaOk = await bcrypt.compare(password, user.passwordHash);
        if (!senhaOk) return null;

        return {
          id: String(user._id),
          email: user.email,
          name: user.name ?? user.email,
        };
      },
    }),
  ],
});
