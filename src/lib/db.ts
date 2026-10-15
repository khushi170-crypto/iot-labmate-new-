import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Resolves the DATABASE_URL for SQLite so the runtime client and the Prisma CLI
 * point at the same file. Prisma 7 resolves relative `file:` URLs against the
 * config file location (project root), so we resolve against `process.cwd()`.
 */
function resolveDatabaseUrl(raw: string | undefined): string {
  const value = raw?.trim() || "file:./dev.db";
  if (!value.startsWith("file:")) return value;
  let rest = value.slice("file:".length);
  if (rest.startsWith("./")) rest = rest.slice(2);
  if (path.isAbsolute(rest)) return rest.replace(/\\/g, "/");
  return path.join(/* turbopackIgnore: true */ process.cwd(), rest).replace(/\\/g, "/");
}

function createClient(): PrismaClient {
  const url = resolveDatabaseUrl(process.env.DATABASE_URL);
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}