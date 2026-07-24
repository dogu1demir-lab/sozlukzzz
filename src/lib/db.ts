import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import path from "path";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const getDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL;
  if (!envUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL ortam değişkeni production ortamında tanımlı olmalıdır.");
    }
    // Development fallback: local SQLite database
    return `file:${path.resolve(process.cwd(), "./prisma/dev.db")}`;
  }
  if (envUrl.startsWith("file:")) {
    const filePath = envUrl.replace("file:", "");
    // Resolve relative path to project root
    const absolutePath = path.resolve(process.cwd(), filePath);
    return `file:${absolutePath}`;
  }
  return envUrl;
};

const getPrismaClient = () => {
  const url = getDatabaseUrl();
  if (url.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({
      url,
    });
    return new PrismaClient({ adapter });
  }

  // Standard direct connection client for PostgreSQL (Supabase)
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma = globalThis.prismaGlobal ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
