/**
 * Cria (ou atualiza a senha de) um usuário no MongoDB.
 * Uso:
 *   npm run criar-usuario -- "Nome da Pessoa" email@empresa.com "senha temporária"
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

async function main() {
  const [, , nome, email, senha] = process.argv;

  if (!nome || !email || !senha) {
    console.error('Uso: npm run criar-usuario -- "Nome" email@empresa.com "senha"');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI não definida (crie um .env.local com a connection string).");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "codexex");

  const passwordHash = await bcrypt.hash(senha, 10);
  const emailNormalizado = email.trim().toLowerCase();

  await db.collection("users").updateOne(
    { email: emailNormalizado },
    { $set: { name: nome, email: emailNormalizado, passwordHash, atualizadoEm: new Date() } },
    { upsert: true }
  );

  console.log(`Usuário salvo: ${nome} <${emailNormalizado}>`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
