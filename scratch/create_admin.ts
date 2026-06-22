import fs from "fs";
import path from "path";

// Read and parse .env manually
try {
  const envPath = path.resolve(__dirname, "../.env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (match && match[1]) {
    process.env.DATABASE_URL = match[1];
    console.log("Database URL loaded from .env:", match[1].substring(0, 30) + "...");
  }
} catch (e) {
  console.error("Failed to load .env file manually:", e);
}

import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  // Dynamically import prisma so that process.env.DATABASE_URL is set first
  const { prisma } = await import("../src/lib/db");

  const username = "dogu";
  const password = "dogu123456"; // Temporary password
  const email = "dogu@sozlukzzz.tr";

  console.log(`Checking if user "${username}" exists in database...`);

  const existingUser = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: 'insensitive'
      }
    }
  });

  if (existingUser) {
    console.log(`User "${username}" already exists! Promoting to ADMIN...`);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: "ADMIN" }
    });
    console.log("Success! User promoted to ADMIN.");
    process.exit(0);
  }

  console.log(`Creating new ADMIN user: @${username}...`);
  const colors = ["#14b8a6", "#f97316", "#a855f7", "#ec4899", "#3b82f6", "#22c55e", "#ef4444"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const user = await prisma.user.create({
    data: {
      username: username,
      passwordHash: hashPassword(password),
      email: email,
      avatarColor: randomColor,
      role: "ADMIN"
    }
  });

  console.log(`Successfully created ADMIN user:`);
  console.log(`Username: ${user.username}`);
  console.log(`Email: ${user.email}`);
  console.log(`Temporary Password: ${password}`);
  process.exit(0);
}

main().catch(err => {
  console.error("Error creating admin:", err);
  process.exit(1);
});
