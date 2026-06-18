import { PrismaClient } from "@/generated/prisma/client";
import path from "path";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const getDatabaseUrl = () => {
  let url = process.env.DATABASE_URL || "file:./prisma/dev.db";
  if (url.startsWith("file:")) {
    const filePath = url.replace("file:", "");
    // Resolve relative path to project root
    const absolutePath = path.resolve(process.cwd(), filePath);
    url = `file:${absolutePath}`;
  }
  return url;
};

const getPrismaClient = () => {
  const url = getDatabaseUrl();
  if (url.startsWith("file:")) {
    // Dynamically import SQLite adapter so it doesn't run on Postgres
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({
      url,
    });
    return new PrismaClient({ adapter });
  }
  
  // Standard direct connection client for PostgreSQL (Supabase)
  const { Pool } = require("pg");
  const { PrismaPg } = require("@prisma/adapter-pg");
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma = globalThis.prismaGlobal ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

