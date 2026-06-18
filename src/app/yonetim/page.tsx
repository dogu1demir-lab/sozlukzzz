import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import YonetimDashboard from "./YonetimDashboard";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

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
          href="/" 
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

  // Resolve target content for each report
  const resolvedReports = await Promise.all(
    reports.map(async (report) => {
      let targetContent = "";
      let targetAuthor = "";
      let targetUrl = "";

      try {
        if (report.targetType === "ENTRY") {
          const entry = await prisma.entry.findUnique({
            where: { id: report.targetId },
            include: { topic: true, author: true }
          });
          if (entry) {
            targetContent = entry.content;
            targetAuthor = entry.author.username;
            targetUrl = `/baslik/${entry.topic.slug}#entry-${entry.id}`;
          } else {
            targetContent = "[Bu entry silinmiş veya bulunamadı]";
          }
        } else if (report.targetType === "COMMENT") {
          const comment = await prisma.comment.findUnique({
            where: { id: report.targetId },
            include: { author: true, entry: { include: { topic: true } } }
          });
          if (comment) {
            targetContent = comment.content;
            targetAuthor = comment.author.username;
            targetUrl = `/baslik/${comment.entry.topic.slug}#entry-${comment.entry.id}`;
          } else {
            targetContent = "[Bu yorum silinmiş veya bulunamadı]";
          }
        }
      } catch (e) {
        targetContent = "[İçerik yüklenirken veritabanı hatası]";
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
    })
  );

  return <YonetimDashboard reports={resolvedReports} />;
}
