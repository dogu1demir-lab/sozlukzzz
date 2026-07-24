import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getSessionUser } from "@/lib/auth";
import YonetimDashboard from "./YonetimDashboard";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

type ReportedEntry = Prisma.EntryGetPayload<{ include: { topic: true; author: true } }>;
type ReportedComment = Prisma.CommentGetPayload<{ include: { author: true; entry: { include: { topic: true } } } }>;

export default async function YonetimPage() {
  const user = await getSessionUser();

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl border border-red-500/20 bg-red-950/10 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h1 className="text-xl font-bold text-red-400">Yetkisiz Giriş zzz.</h1>
        <p className="text-xs text-zinc-400">
          Bu sayfayı görüntülemek için moderatör veya yönetici (Admin) yetkisine sahip olmalısınız.
        </p>
        <Link 
          href="/bugun" 
          className="inline-block px-5 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-350 hover:text-white hover:border-zinc-700 transition-all"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  // Fetch all reports
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: {
          username: true
        }
      }
    }
  });

  // Resolve target contents in batch (N+1 yerine toplu sorgular + map)
  const entryIds = reports.filter(r => r.targetType === "ENTRY").map(r => r.targetId);
  const commentIds = reports.filter(r => r.targetType === "COMMENT").map(r => r.targetId);

  let entryMap = new Map<string, ReportedEntry>();
  let commentMap = new Map<string, ReportedComment>();
  const rankByEntryId = new Map<string, number>();
  let resolveError = false;

  try {
    const [entries, comments] = await Promise.all([
      prisma.entry.findMany({
        where: { id: { in: entryIds } },
        include: { topic: true, author: true }
      }),
      prisma.comment.findMany({
        where: { id: { in: commentIds } },
        include: { author: true, entry: { include: { topic: true } } }
      })
    ]);

    entryMap = new Map(entries.map(e => [e.id, e]));
    commentMap = new Map(comments.map(c => [c.id, c]));

    // Bildirim sayfalama kuralı: entry'nin konudaki createdAt rank'i / sayfa boyutu 10
    const relatedTopicIds = [
      ...new Set([
        ...entries.map(e => e.topicId),
        ...comments.map(c => c.entry.topicId)
      ])
    ];
    if (relatedTopicIds.length > 0) {
      const topicEntries = await prisma.entry.findMany({
        where: { topicId: { in: relatedTopicIds } },
        select: { id: true, topicId: true },
        orderBy: { createdAt: "asc" }
      });
      const counters = new Map<string, number>();
      for (const e of topicEntries) {
        const next = (counters.get(e.topicId) ?? 0) + 1;
        counters.set(e.topicId, next);
        rankByEntryId.set(e.id, next);
      }
    }
  } catch (e) {
    console.error("Yonetim rapor hedefleri çözümlenirken veritabanı hatası:", e);
    resolveError = true;
  }

  const urlForEntry = (slug: string, entryId: string) => {
    const rank = rankByEntryId.get(entryId) ?? 1;
    const page = Math.ceil(rank / 10);
    return `/baslik/${slug}?p=${page}#entry-${entryId}`;
  };

  const resolvedReports = reports.map((report) => {
    let targetContent = "";
    let targetAuthor = "";
    let targetUrl = "";

    if (resolveError) {
      targetContent = "[İçerik yüklenirken veritabanı hatası]";
    } else if (report.targetType === "ENTRY") {
      const entry = entryMap.get(report.targetId);
      if (entry) {
        targetContent = entry.content;
        targetAuthor = entry.author.username;
        targetUrl = urlForEntry(entry.topic.slug, entry.id);
      } else {
        targetContent = "[Bu entry silinmiş veya bulunamadı]";
      }
    } else if (report.targetType === "COMMENT") {
      const comment = commentMap.get(report.targetId);
      if (comment) {
        targetContent = comment.content;
        targetAuthor = comment.author.username;
        targetUrl = urlForEntry(comment.entry.topic.slug, comment.entry.id);
      } else {
        targetContent = "[Bu yorum silinmiş veya bulunamadı]";
      }
    }

    return {
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      createdAt: report.createdAt,
      reporter: {
        username: report.reporter.username
      },
      targetContent,
      targetAuthor,
      targetUrl
    };
  });

  return <YonetimDashboard reports={resolvedReports} />;
}
