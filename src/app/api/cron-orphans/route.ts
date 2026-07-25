import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const IMAGE_EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"]);
// Yarıda kalmış/devam eden yüklemeleri korumak için bu süreden yeni dosyalara dokunulmaz
const MIN_AGE_MS = 24 * 60 * 60 * 1000;

// DB'deki resim referansını (tam URL, /uploads/..., query'li) normalize eder:
// uploads klasörüne göreli yol döner (örn. "entries/abc.webp"); uploads dışıysa null
function normalizeRef(url: string | null | undefined): string | null {
  if (!url || url.startsWith("data:")) return null;
  let p = url.trim();
  p = p.replace(/^https?:\/\/[^/]+/i, ""); // host'u at
  p = p.split("?")[0]; // query'yi at
  const idx = p.indexOf("/uploads/");
  if (idx === -1) return null;
  return p.substring(idx + "/uploads/".length).replace(/^\/+/, "");
}

async function collectFiles(dir: string, base: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) {
      out.push(...(await collectFiles(full, rel)));
    } else if (IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase())) {
      out.push(rel);
    }
  }
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return new NextResponse("Server misconfigured", { status: 500 });
  }
  const secret = searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  if (secret !== expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // mode=report (varsayılan, hiçbir şey silmez) | mode=delete
  const mode = searchParams.get("mode") === "delete" ? "delete" : "report";

  try {
    // 1. DB'deki tüm resim referanslarını topla
    const [entryImages, users] = await Promise.all([
      prisma.entry.findMany({
        where: { imageUrl: { not: null } },
        select: { imageUrl: true }
      }),
      prisma.user.findMany({
        select: { avatarUrl: true, profilePhotos: true }
      })
    ]);

    const referenced = new Set<string>();
    for (const e of entryImages) {
      const rel = normalizeRef(e.imageUrl);
      if (rel) referenced.add(rel);
    }
    for (const u of users) {
      const avatar = normalizeRef(u.avatarUrl);
      if (avatar) referenced.add(avatar);
      for (const photo of u.profilePhotos || []) {
        const rel = normalizeRef(photo);
        if (rel) referenced.add(rel);
      }
    }

    // 2. Diskteki dosyaları tara, referanssız ve yeterince eski olanları bul
    const diskFiles = await collectFiles(UPLOADS_DIR, "");
    const now = Date.now();
    const orphans: { file: string; sizeBytes: number }[] = [];
    let skippedYoung = 0;

    for (const rel of diskFiles) {
      if (referenced.has(rel)) continue;
      const full = path.join(UPLOADS_DIR, rel);
      try {
        const stat = await fs.stat(full);
        if (now - stat.mtimeMs < MIN_AGE_MS) {
          skippedYoung++;
          continue;
        }
        orphans.push({ file: rel, sizeBytes: stat.size });
      } catch {
        // stat hatası: dokunma
      }
    }

    // 3. delete modunda yalnızca yetimleri sil
    const deleted: string[] = [];
    const failed: string[] = [];
    if (mode === "delete") {
      for (const o of orphans) {
        const full = path.join(UPLOADS_DIR, o.file);
        // Güvenlik: yalnızca uploads kökü altındaki dosyalar
        if (!full.startsWith(UPLOADS_DIR + path.sep)) {
          failed.push(o.file);
          continue;
        }
        try {
          await fs.unlink(full);
          deleted.push(o.file);
        } catch {
          failed.push(o.file);
        }
      }
    }

    const totalBytes = orphans.reduce((sum, o) => sum + o.sizeBytes, 0);
    return NextResponse.json({
      ok: true,
      mode,
      diskFileCount: diskFiles.length,
      referencedCount: referenced.size,
      orphanCount: orphans.length,
      orphanTotalMB: Math.round((totalBytes / 1024 / 1024) * 100) / 100,
      skippedYoungFiles: skippedYoung,
      deletedCount: deleted.length,
      failedCount: failed.length,
      orphans: orphans.map((o) => o.file),
      failed
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
