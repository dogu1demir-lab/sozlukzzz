"use client";

import { useState, useTransition } from "react";
import { resolveReportAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { Flag, Trash2, Check, ExternalLink, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface ReportData {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: Date;
  reporter: {
    username: string;
  };
  targetContent: string;
  targetAuthor: string;
  targetUrl: string;
}

interface YonetimDashboardProps {
  reports: ReportData[];
}

export default function YonetimDashboard({ reports: initialReports }: YonetimDashboardProps) {
  const [reports, setReports] = useState<ReportData[]>(initialReports);
  const [filter, setFilter] = useState<"ALL" | "ENTRY" | "COMMENT">("ALL");
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState("");

  const handleResolve = (reportId: string, actionType: "DISMISS" | "DELETE_CONTENT") => {
    const confirmationMsg = 
      actionType === "DELETE_CONTENT"
        ? "Bu şikayet edilen içeriği kalıcı olarak silmek ve şikayeti kapatmak istediğinize emin misiniz zzz?"
        : "Bu şikayeti yoksaymak ve kapatmak istiyor musunuz zzz?";

    if (!confirm(confirmationMsg)) return;

    playBuzzSound();
    setStatusMessage("");

    startTransition(async () => {
      const result = await resolveReportAction(reportId, actionType);
      if (result.error) {
        setStatusMessage(`Hata: ${result.error}`);
      } else {
        setReports(prev => prev.filter(r => r.id !== reportId));
        setStatusMessage("İşlem başarıyla gerçekleştirildi zzz.");
      }
    });
  };

  const filteredReports = reports.filter(r => {
    if (filter === "ALL") return true;
    return r.targetType === filter;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 min-h-screen pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-lime-400" />
            <span>Sözlükzzz <span className="text-lime-400 font-mono">Moderatör</span> Paneli</span>
          </h1>
          <p className="text-xs text-zinc-550 mt-1">
            Yazarlar tarafından kurallara aykırı olduğu gerekçesiyle bildirilen tüm şikayetler zzz.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 border border-zinc-900 rounded-lg shrink-0">
          <button
            onClick={() => { playBuzzSound(); setFilter("ALL"); }}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
              filter === "ALL" ? "bg-zinc-900 text-lime-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Tümü ({reports.length})
          </button>
          <button
            onClick={() => { playBuzzSound(); setFilter("ENTRY"); }}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
              filter === "ENTRY" ? "bg-zinc-900 text-lime-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Entry ({reports.filter(r => r.targetType === "ENTRY").length})
          </button>
          <button
            onClick={() => { playBuzzSound(); setFilter("COMMENT"); }}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
              filter === "COMMENT" ? "bg-zinc-900 text-lime-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Yorum ({reports.filter(r => r.targetType === "COMMENT").length})
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-lg border text-xs font-semibold ${
          statusMessage.startsWith("Hata") 
            ? "border-red-500/20 bg-red-500/10 text-red-400" 
            : "border-lime-500/20 bg-lime-500/10 text-lime-400"
        }`}>
          {statusMessage}
        </div>
      )}

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-900 p-16 text-center bg-zinc-950/10">
          <Flag className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-400">Şu an incelenecek şikayet bulunmuyor zzz.</p>
          <p className="text-xs text-zinc-650 mt-1">Harika! Sözlük asayiş berkemal.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="group relative rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 hover:border-zinc-850 hover:bg-zinc-950/60 transition-all flex flex-col gap-4"
            >
              {/* Top row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${
                    report.targetType === "ENTRY" 
                      ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" 
                      : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  }`}>
                    {report.targetType === "ENTRY" ? "ENTRY ŞİKAYETİ" : "YORUM ŞİKAYETİ"}
                  </span>
                  <span className="text-zinc-600 text-[11px] font-mono">•</span>
                  <span className="text-zinc-500 text-[11px]">
                    Bildiren: <span className="font-semibold text-zinc-350">@{report.reporter.username}</span>
                  </span>
                </div>
                <div className="text-zinc-600 text-[10px] font-mono">
                  {new Date(report.createdAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
                </div>
              </div>

              {/* Middle section (Content and context) */}
              <div className="space-y-2.5">
                <div className="text-xs text-zinc-550 flex items-center gap-1.5">
                  <span>Paylaşan:</span>
                  <Link
                    href={`/yazar/${report.targetAuthor}`}
                    prefetch={false}
                    className="font-bold text-lime-400 hover:underline"
                  >
                    @{report.targetAuthor}
                  </Link>
                  {report.targetUrl && (
                    <>
                      <span className="text-zinc-700">•</span>
                      <Link
                        href={report.targetUrl}
                        target="_blank"
                        prefetch={false}
                        className="text-zinc-400 hover:text-white flex items-center gap-1 hover:underline"
                      >
                        <span>İçeriğe Git</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </>
                  )}
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-950/90 border border-zinc-900 text-sm text-zinc-300 italic whitespace-pre-wrap leading-relaxed">
                  {report.targetContent || <span className="text-red-500/60">[Bu içerik bulunamadı veya silinmiş olabilir]</span>}
                </div>
              </div>

              {/* Bottom row (Reason & Resolution Actions) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-1 pt-3 border-t border-zinc-900/40">
                <div className="text-xs text-red-400 flex items-start gap-1.5">
                  <span className="font-bold shrink-0">Şikayet Nedeni:</span>
                  <span className="bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 italic text-zinc-300">
                    {report.reason}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {/* Dismiss report button */}
                  <button
                    onClick={() => handleResolve(report.id, "DISMISS")}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-800 text-[11px] font-bold text-zinc-400 hover:text-white hover:border-zinc-700 transition-all bg-zinc-950/20 active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Şikayeti Yoksay</span>
                  </button>

                  {/* Delete content button */}
                  <button
                    onClick={() => handleResolve(report.id, "DELETE_CONTENT")}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[11px] font-bold text-red-400 border border-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>İçeriği Sil ve Kapat</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
