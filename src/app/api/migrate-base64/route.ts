import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const revalidate = 0; // Dynamic route

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  const expectedSecret = process.env.MIGRATION_SECRET || "sinek-vizzz-9988";
  if (secret !== expectedSecret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  console.log("=== STARTING LIVE BASE64 MIGRATION ===");
  
  const results = {
    usersFound: 0,
    usersMigrated: 0,
    entriesFound: 0,
    entriesMigrated: 0,
    errors: [] as string[]
  };

  // Helper to save base64 to file
  function saveBase64ToFile(base64Str: string, folderName: string) {
    if (!base64Str || !base64Str.startsWith("data:image")) return null;

    try {
      const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (!matches || matches.length < 3) return null;

      const contentType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // Define local directory inside Next.js public/ folder
      const relativeDir = path.join("uploads", folderName);
      const absoluteDir = path.join(process.cwd(), "public", relativeDir);

      if (!fs.existsSync(absoluteDir)) {
        fs.mkdirSync(absoluteDir, { recursive: true });
      }

      // Generate filename
      let extension = "webp"; // Fallback to webp
      if (contentType.includes("png")) extension = "png";
      else if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = "jpg";
      else if (contentType.includes("gif")) extension = "gif";

      const filename = `${crypto.randomBytes(16).toString("hex")}.${extension}`;
      const absolutePath = path.join(absoluteDir, filename);
      const relativePath = `/${relativeDir}/${filename}`.replace(/\\/g, "/");

      fs.writeFileSync(absolutePath, buffer);
      return relativePath;
    } catch (e: any) {
      console.error("Error writing base64 file:", e);
      throw e;
    }
  }

  try {
    // 1. Migrate Users
    const users = await prisma.user.findMany({
      where: {
        avatarUrl: {
          startsWith: "data:image"
        }
      },
      select: { id: true, username: true, avatarUrl: true }
    });

    results.usersFound = users.length;

    for (const user of users) {
      try {
        if (user.avatarUrl) {
          const filePath = saveBase64ToFile(user.avatarUrl, "avatars");
          if (filePath) {
            await prisma.user.update({
              where: { id: user.id },
              data: { avatarUrl: filePath }
            });
            results.usersMigrated++;
          }
        }
      } catch (err: any) {
        const errMsg = `User ${user.username} migration failed: ${err.message}`;
        results.errors.push(errMsg);
        console.error(errMsg);
      }
    }

    // 2. Migrate Entries
    const entries = await prisma.entry.findMany({
      where: {
        imageUrl: {
          startsWith: "data:image"
        }
      },
      select: { id: true, imageUrl: true }
    });

    results.entriesFound = entries.length;

    for (const entry of entries) {
      try {
        if (entry.imageUrl) {
          const filePath = saveBase64ToFile(entry.imageUrl, "entries");
          if (filePath) {
            await prisma.entry.update({
              where: { id: entry.id },
              data: { imageUrl: filePath }
            });
            results.entriesMigrated++;
          }
        }
      } catch (err: any) {
        const errMsg = `Entry ${entry.id} migration failed: ${err.message}`;
        results.errors.push(errMsg);
        console.error(errMsg);
      }
    }

    console.log("=== MIGRATION COMPLETED ===", results);
    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ success: false, error: error.message, results });
  }
}
