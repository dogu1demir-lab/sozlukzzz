"use client";

import { useState, useTransition, useEffect } from "react";
import {
  resolveReportAction,
  adminSearchUsersAction,
  adminUpdateUserRoleAction,
  adminSearchTopicsAction,
  adminRenameTopicAction,
  adminMergeTopicsAction,
  adminDeleteTopicAction,
  adminGetSettingsAction,
  adminUpdateSettingsAction,
  adminGetStatsAction,
  adminSendGiftAction,
  adminRemoveGiftAction,
  getUserGiftsAction
} from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import {
  Flag,
  Trash2,
  Check,
  ExternalLink,
  ShieldAlert,
  Users,
  Hash,
  Settings,
  Activity,
  Search,
  Edit2,
  GitMerge,
  Ban,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  X,
  Database,
  Gift
} from "lucide-react";
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

const ALL_GIFTS_MAP: Record<string, { name: string; emoji: string; description: string; type: "MEDAL" | "CERTIFICATE" }> = {
  SWEET: { name: "Tatlı Sinek", emoji: "🍬", description: "Pozitif, sevecen ve tatlı dilli yazarlara verilir.", type: "MEDAL" },
  KING: { name: "Kral Sinek", emoji: "👑", description: "Derin, yüksek kaliteli yazılar yazan bilge yazarlara verilir.", type: "MEDAL" },
  SWATTER: { name: "Sinek Raketi", emoji: "🎾", description: "Trolleri raporlayarak asayişi koruyan yazarlara verilir.", type: "MEDAL" },
  LIGHTNING: { name: "Yıldırım Vızıltı", emoji: "⚡", description: "Gündemdeki sıcak haberleri çok hızlı giren yazarlara verilir.", type: "MEDAL" },
  STEEL: { name: "Çelik Kanat", emoji: "🛡️", description: "Sözlüğün ilk gününden beri destek veren en sadık emektarlara verilir.", type: "MEDAL" },
  MIDNIGHT: { name: "Gece Sinekleri", emoji: "☕", description: "Gece geç saatlerde aktif olan, gece kuşu yazarlara verilir.", type: "MEDAL" },
  WATERMELON: { name: "Karpuz Dilimi", emoji: "🍉", description: "Sözlükde herkesi güldüren mizah yetenekli yazarlara verilir.", type: "MEDAL" },
  TECH: { name: "Detektör Sinek", emoji: "🔍", description: "Teknik hataları bildiren ve gelişime destek veren yazarlara verilir.", type: "MEDAL" },
  SOCIAL: { name: "Röportajcı", emoji: "🎤", description: "Sık anket açan ve yazarlarla etkileşimi yüksek olan sosyal yazarlara verilir.", type: "MEDAL" },
  TREND: { name: "Alev Kanat", emoji: "🔥", description: "Açtığı başlıklar veya entryler trend olan popüler yazarlara verilir.", type: "MEDAL" },
  AMBER: { name: "Kehribar Sinek", emoji: "💎", description: "Sözlük tarihinde ölümsüzleşen, en elit efsane yazarlara verilir.", type: "MEDAL" },
  ACHIEVEMENT: { name: "Üstün Başarı Belgesi", emoji: "📜", description: "Sözlüğün kalkınmasında olağanüstü emek veren yazarlara verilir.", type: "CERTIFICATE" },
  HONOR: { name: "Sözlük Onur Belgesi", emoji: "🎖️", description: "Hiç ceza almamış, örnek ahlaka sahip saygın yazarlara verilir.", type: "CERTIFICATE" },
  AGENT: { name: "Gizli Teşkilat Belgesi", emoji: "🕵️‍♂️", description: "Trolleri ve spam grupları deşifre eden istihbarat yazarlarına verilir.", type: "CERTIFICATE" },
  ACADEMY: { name: "Vızıltı Akademisi Diploması", emoji: "🎓", description: "Felsefi, bilimsel veya akademik derinliği olan yazılar yazanlara verilir.", type: "CERTIFICATE" }
};

type TabType = "REPORTS" | "USERS" | "TOPICS" | "SETTINGS";

export default function YonetimDashboard({ reports: initialReports }: YonetimDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("REPORTS");
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState(false);

  // --- Reports Tab State ---
  const [reports, setReports] = useState<ReportData[]>(initialReports);
  const [reportFilter, setReportFilter] = useState<"ALL" | "ENTRY" | "COMMENT">("ALL");

  // --- Users Tab State ---
  const [userQuery, setUserQuery] = useState("");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearching, setUserSearching] = useState(false);

  // --- Topics Tab State ---
  const [topicQuery, setTopicQuery] = useState("");
  const [topicsList, setTopicsList] = useState<any[]>([]);
  const [topicSearching, setTopicSearching] = useState(false);
  
  // Topic Rename state
  const [renamingTopicId, setRenamingTopicId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState("");
  
  // Topic Merge state
  const [mergingTopic, setMergingTopic] = useState<any | null>(null);
  const [mergeTargetQuery, setMergeTargetQuery] = useState("");
  const [mergeTargetResults, setMergeTargetResults] = useState<any[]>([]);
  const [mergeSearching, setMergeSearching] = useState(false);

  // --- Settings Tab State ---
  const [settings, setSettings] = useState({ disableSignups: false, disablePozkes: false, disableSelfDeletion: false, xPixelId: "", xSignupEventId: "" });
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // --- Gift Tab State ---
  const [giftTargetUser, setGiftTargetUser] = useState<any | null>(null);
  const [giftList, setGiftList] = useState<any[]>([]);
  const [giftListLoading, setGiftListLoading] = useState(false);
  const [selectedGiftType, setSelectedGiftType] = useState("SWEET");
  const [giftNote, setGiftNote] = useState("");

  // Clear feedback message after 4 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Load Settings & Stats on demand when Tab changes to SETTINGS
  useEffect(() => {
    if (activeTab === "SETTINGS") {
      fetchSettingsAndStats();
    }
  }, [activeTab]);

  const showFeedback = (msg: string, isErr = false) => {
    setStatusMessage(msg);
    setStatusError(isErr);
    playBuzzSound();
  };

  const fetchSettingsAndStats = () => {
    setSettingsLoading(true);
    startTransition(async () => {
      const settingsRes = await adminGetSettingsAction();
      const statsRes = await adminGetStatsAction();

      setSettingsLoading(false);

      if (settingsRes.error) {
        showFeedback(settingsRes.error, true);
        return;
      }
      if (statsRes.error) {
        showFeedback(statsRes.error, true);
        return;
      }

      if (settingsRes.success && settingsRes.disableSignups !== undefined && settingsRes.disablePozkes !== undefined) {
        setSettings({
          disableSignups: settingsRes.disableSignups,
          disablePozkes: settingsRes.disablePozkes,
          disableSelfDeletion: !!settingsRes.disableSelfDeletion,
          xPixelId: settingsRes.xPixelId || "",
          xSignupEventId: settingsRes.xSignupEventId || ""
        });
      }

      if (statsRes.success) {
        setStats(statsRes.stats);
        setHealth(statsRes.health);
      }
    });
  };

  // --- Report Actions ---
  const handleResolveReport = (reportId: string, actionType: "DISMISS" | "DELETE_CONTENT") => {
    const msg = actionType === "DELETE_CONTENT" 
      ? "Bu içeriği silmek ve şikayeti kapatmak istediğinize emin misiniz zzz?"
      : "Şikayeti kapatmak istediğinize emin misiniz zzz?";
    
    if (!confirm(msg)) return;

    startTransition(async () => {
      const result = await resolveReportAction(reportId, actionType);
      if (result.error) {
        showFeedback(result.error, true);
      } else {
        setReports(prev => prev.filter(r => r.id !== reportId));
        showFeedback("Şikayet başarıyla çözümlendi zzz.");
      }
    });
  };

  // --- User Actions ---
  const handleSearchUsers = () => {
    if (!userQuery.trim()) return;
    setUserSearching(true);
    playBuzzSound();
    startTransition(async () => {
      const result = await adminSearchUsersAction(userQuery);
      setUserSearching(false);
      if (result.error) {
        showFeedback(result.error, true);
      } else if (result.users) {
        setUsersList(result.users);
      }
    });
  };

  const handleUpdateRole = (userId: string, newRole: string, username: string) => {
    const actionText = newRole === "BANNED" ? "engellemek" : newRole === "ADMIN" ? "yönetici yapmak" : "yazar statüsüne almak";
    if (!confirm(`@${username} kullanıcısını ${actionText} istediğinizden emin misiniz zzz?`)) return;

    startTransition(async () => {
      const result = await adminUpdateUserRoleAction(userId, newRole);
      if (result.error) {
        showFeedback(result.error, true);
      } else {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        showFeedback(`@${username} başarıyla güncellendi zzz.`);
      }
    });
  };

  // --- Gift Handlers ---
  const handleOpenGiftModal = (usr: any) => {
    setGiftTargetUser(usr);
    setGiftListLoading(true);
    setGiftNote("");
    setSelectedGiftType("SWEET");
    playBuzzSound();
    
    startTransition(async () => {
      const result = await getUserGiftsAction(usr.username);
      setGiftListLoading(false);
      if (result.error) {
        showFeedback(result.error, true);
      } else if (result.gifts) {
        setGiftList(result.gifts);
      }
    });
  };

  const handleSendGift = () => {
    if (!giftTargetUser) return;
    
    startTransition(async () => {
      const result = await adminSendGiftAction(giftTargetUser.id, selectedGiftType, giftNote);
      if (result.error) {
        showFeedback(result.error, true);
      } else if (result.gift) {
        const freshGiftsRes = await getUserGiftsAction(giftTargetUser.username);
        if (freshGiftsRes.gifts) {
          setGiftList(freshGiftsRes.gifts);
        }
        setGiftNote("");
        showFeedback("Hediye başarıyla gönderildi zzz.");
      }
    });
  };

  const handleRemoveGift = (userGiftId: string) => {
    if (!confirm("Bu hediyeyi/belgeyi geri almak istediğinizden emin misiniz zzz?")) return;
    
    startTransition(async () => {
      const result = await adminRemoveGiftAction(userGiftId);
      if (result.error) {
        showFeedback(result.error, true);
      } else {
        setGiftList(prev => prev.filter(g => g.id !== userGiftId));
        showFeedback("Hediye başarıyla geri alındı zzz.");
      }
    });
  };

  // --- Topic Actions ---
  const handleSearchTopics = () => {
    if (!topicQuery.trim()) return;
    setTopicSearching(true);
    playBuzzSound();
    startTransition(async () => {
      const result = await adminSearchTopicsAction(topicQuery);
      setTopicSearching(false);
      if (result.error) {
        showFeedback(result.error, true);
      } else if (result.topics) {
        setTopicsList(result.topics);
      }
    });
  };

  const handleRenameTopic = (topicId: string) => {
    if (!renamingTitle.trim()) return;

    startTransition(async () => {
      const result = await adminRenameTopicAction(topicId, renamingTitle);
      if (result.error) {
        showFeedback(result.error, true);
      } else if (result.topic) {
        setTopicsList(prev => prev.map(t => t.id === topicId ? { ...t, title: result.topic.title, slug: result.topic.slug } : t));
        setRenamingTopicId(null);
        setRenamingTitle("");
        showFeedback("Başlık başarıyla yeniden adlandırıldı zzz.");
      }
    });
  };

  const handleSearchMergeTargets = () => {
    if (!mergeTargetQuery.trim()) return;
    setMergeSearching(true);
    startTransition(async () => {
      const result = await adminSearchTopicsAction(mergeTargetQuery);
      setMergeSearching(false);
      if (result.topics) {
        // Exclude the source topic from search results
        setMergeTargetResults(result.topics.filter((t: any) => t.id !== mergingTopic.id));
      }
    });
  };

  const handleMergeTopics = (targetTopicId: string, targetTitle: string) => {
    if (!mergingTopic) return;
    if (!confirm(`"${mergingTopic.title}" başlığını "${targetTitle}" başlığı ile birleştirmek istediğinize emin misiniz?\n\nBu işlem "${mergingTopic.title}" başlığındaki tüm entry'leri "${targetTitle}" başlığına taşıyacak ve eski başlığı tamamen silecektir zzz!`)) return;

    startTransition(async () => {
      const result = await adminMergeTopicsAction(mergingTopic.id, targetTopicId);
      if (result.error) {
        showFeedback(result.error, true);
      } else {
        setTopicsList(prev => prev.filter(t => t.id !== mergingTopic.id));
        setMergingTopic(null);
        setMergeTargetQuery("");
        setMergeTargetResults([]);
        showFeedback("Başlıklar başarıyla birleştirildi zzz.");
      }
    });
  };

  const handleDeleteTopic = (topicId: string, title: string) => {
    if (!confirm(`"${title}" başlığını VE ALTINDAKİ TÜM ENTRY'LERİ silmek istediğinize emin misiniz zzz?\nBu işlem geri alınamaz!`)) return;

    startTransition(async () => {
      const result = await adminDeleteTopicAction(topicId);
      if (result.error) {
        showFeedback(result.error, true);
      } else {
        setTopicsList(prev => prev.filter(t => t.id !== topicId));
        showFeedback("Başlık ve içeriği başarıyla silindi zzz.");
      }
    });
  };

  // --- Setting Actions ---
  const handleToggleSetting = (key: "disableSignups" | "disablePozkes" | "disableSelfDeletion") => {
    const updatedSettings = {
      ...settings,
      [key]: !settings[key]
    };

    setSettings(updatedSettings);

    startTransition(async () => {
      const result = await adminUpdateSettingsAction(
        updatedSettings.disableSignups,
        updatedSettings.disablePozkes,
        updatedSettings.disableSelfDeletion,
        updatedSettings.xPixelId,
        updatedSettings.xSignupEventId
      );
      if (result.error) {
        showFeedback(result.error, true);
        // Revert UI switch
        setSettings(settings);
      } else {
        showFeedback("Sistem ayarları başarıyla güncellendi zzz.");
      }
    });
  };

  const handleSaveXPixel = () => {
    playBuzzSound();
    startTransition(async () => {
      const result = await adminUpdateSettingsAction(
        settings.disableSignups,
        settings.disablePozkes,
        settings.disableSelfDeletion,
        settings.xPixelId,
        settings.xSignupEventId
      );
      if (result.error) {
        showFeedback(result.error, true);
      } else {
        showFeedback("Twitter (X) piksel ayarları başarıyla güncellendi zzz.");
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 min-h-screen pb-20 animate-in fade-in duration-300">
      
      {/* Upper Title Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-lime-400" />
            <span>Sözlükzzz <span className="text-lime-400 font-mono">Yönetim</span> Paneli</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Moderatör ve yöneticiler için sistem denetimi ve veri yönetimi arayüzü zzz.
          </p>
        </div>

        {/* Action feedback banner */}
        {statusMessage && (
          <div className={`px-4 py-2 rounded-lg border text-xs font-bold animate-pulse ${
            statusError 
              ? "border-red-500/20 bg-red-500/10 text-red-400" 
              : "border-lime-500/20 bg-lime-500/10 text-lime-400"
          }`}>
            {statusMessage}
          </div>
        )}
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-900 pb-3">
        <button
          onClick={() => { playBuzzSound(); setActiveTab("REPORTS"); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all border ${
            activeTab === "REPORTS" 
              ? "bg-lime-500 text-black border-lime-500" 
              : "bg-zinc-950/60 text-zinc-400 border-zinc-900 hover:text-zinc-200 hover:border-zinc-800"
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Şikayetler ({reports.length})</span>
        </button>

        <button
          onClick={() => { playBuzzSound(); setActiveTab("USERS"); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all border ${
            activeTab === "USERS" 
              ? "bg-lime-500 text-black border-lime-500" 
              : "bg-zinc-950/60 text-zinc-400 border-zinc-900 hover:text-zinc-200 hover:border-zinc-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Yazar Yönetimi</span>
        </button>

        <button
          onClick={() => { playBuzzSound(); setActiveTab("TOPICS"); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all border ${
            activeTab === "TOPICS" 
              ? "bg-lime-500 text-black border-lime-500" 
              : "bg-zinc-950/60 text-zinc-400 border-zinc-900 hover:text-zinc-200 hover:border-zinc-800"
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Başlık Yönetimi</span>
        </button>

        <button
          onClick={() => { playBuzzSound(); setActiveTab("SETTINGS"); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all border ${
            activeTab === "SETTINGS" 
              ? "bg-lime-500 text-black border-lime-500" 
              : "bg-zinc-950/60 text-zinc-400 border-zinc-900 hover:text-zinc-200 hover:border-zinc-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Sistem Sağlığı & Ayarlar</span>
        </button>
      </div>

      {/* --- TAB 1: REPORTS --- */}
      {activeTab === "REPORTS" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-zinc-950/20 p-3 rounded-lg border border-zinc-900">
            <span className="text-xs text-zinc-400 font-medium">Şikayet Tipi Filtresi:</span>
            <div className="flex gap-1">
              {(["ALL", "ENTRY", "COMMENT"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { playBuzzSound(); setReportFilter(f); }}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    reportFilter === f 
                      ? "bg-zinc-900 text-lime-400 border border-zinc-800" 
                      : "text-zinc-550 hover:text-zinc-350"
                  }`}
                >
                  {f === "ALL" ? "Tümü" : f === "ENTRY" ? "Entryler" : "Yorumlar"}
                </button>
              ))}
            </div>
          </div>

          {reports.filter(r => reportFilter === "ALL" || r.targetType === reportFilter).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-900 p-16 text-center bg-zinc-950/10">
              <Flag className="w-10 h-10 text-zinc-850 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-400">Şu an incelenecek şikayet bulunmuyor zzz.</p>
              <p className="text-xs text-zinc-650 mt-1">Harika! Sözlük asayiş berkemal.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports
                .filter(r => reportFilter === "ALL" || r.targetType === reportFilter)
                .map((report) => (
                  <div
                    key={report.id}
                    className="group rounded-xl border border-zinc-900 bg-zinc-950/30 p-5 hover:border-zinc-850 transition-all flex flex-col gap-4"
                  >
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
                      <div className="text-zinc-650 text-[10px] font-mono">
                        {new Date(report.createdAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5">
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
                              className="text-zinc-400 hover:text-white flex items-center gap-1 hover:underline text-[11px]"
                            >
                              <span>İçeriğe Git</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-900 text-sm text-zinc-300 italic whitespace-pre-wrap leading-relaxed">
                        {report.targetContent || <span className="text-red-500/60">[Bu içerik silinmiş veya bulunamadı]</span>}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-1 pt-3 border-t border-zinc-900/40">
                      <div className="text-xs text-red-400 flex items-start gap-1.5">
                        <span className="font-bold shrink-0">Şikayet Nedeni:</span>
                        <span className="bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 italic text-zinc-300">
                          {report.reason}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => handleResolveReport(report.id, "DISMISS")}
                          disabled={isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 text-[11px] font-bold text-zinc-400 hover:text-white hover:border-zinc-700 transition-all bg-zinc-950/20 active:scale-95 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Şikayeti Yoksay</span>
                        </button>

                        <button
                          onClick={() => handleResolveReport(report.id, "DELETE_CONTENT")}
                          disabled={isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[11px] font-bold text-red-400 border border-red-500/20 transition-all active:scale-95 disabled:opacity-50"
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
      )}

      {/* --- TAB 2: USERS --- */}
      {activeTab === "USERS" && (
        <div className="space-y-6">
          <div className="bg-zinc-950/30 p-5 rounded-xl border border-zinc-900 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-lime-400" />
              <span>Yazar Arama & Yönetimi</span>
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-650" />
                <input
                  type="text"
                  placeholder="Kullanıcı adı veya e-posta adresi ile ara..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                  className="w-full h-10 pl-9 pr-4 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-lime-500 transition-all"
                />
              </div>
              <button
                onClick={handleSearchUsers}
                disabled={userSearching || isPending}
                className="h-10 px-5 rounded-lg bg-lime-500 text-black font-extrabold text-xs hover:bg-lime-400 active:scale-95 transition-all disabled:opacity-50"
              >
                {userSearching ? "Aranıyor..." : "Ara"}
              </button>
            </div>
          </div>

          {/* User Results List */}
          {usersList.length > 0 ? (
            <div className="grid gap-3">
              {usersList.map((usr) => (
                <div
                  key={usr.id}
                  className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 hover:border-zinc-850 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    {/* User Avatar mimicking default UI */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-black select-none shrink-0"
                      style={{ backgroundColor: usr.avatarColor || "#14b8a6" }}
                    >
                      {usr.username.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/yazar/${usr.username}`}
                          target="_blank"
                          className="text-xs font-bold text-white hover:underline hover:text-lime-400"
                        >
                          @{usr.username}
                        </Link>
                        
                        {/* Role Badges */}
                        {usr.role === "ADMIN" ? (
                          <span className="text-[9px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded font-black tracking-wide">
                            ADMIN
                          </span>
                        ) : usr.role === "BANNED" ? (
                          <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-black tracking-wide flex items-center gap-0.5 animate-pulse">
                            <Ban className="w-2 h-2" /> ENGELENDİ
                          </span>
                        ) : (
                          <span className="text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700/60 px-1.5 py-0.5 rounded font-bold">
                            YAZAR
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-zinc-550">{usr.email}</p>
                      
                      <p className="text-[10px] text-zinc-650">
                        Kayıt: {new Date(usr.createdAt).toLocaleDateString("tr-TR")} • {usr._count.entries} entry • {usr._count.comments} yorum
                      </p>
                    </div>
                  </div>

                  {/* Moderator Controls */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {usr.role === "BANNED" ? (
                      <button
                        onClick={() => handleUpdateRole(usr.id, "USER", usr.username)}
                        disabled={isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded bg-lime-500/15 text-lime-400 hover:bg-lime-500/25 border border-lime-500/20 text-[10px] font-black tracking-wide transition-all active:scale-95"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>ENGELİ KALDIR</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenGiftModal(usr)}
                          disabled={isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-[10px] font-bold transition-all active:scale-95"
                        >
                          <Gift className="w-3 h-3 text-amber-400" />
                          <span>Hediye 🎁</span>
                        </button>

                        {usr.role === "ADMIN" ? (
                          <button
                            onClick={() => handleUpdateRole(usr.id, "USER", usr.username)}
                            disabled={isPending}
                            className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-bold border border-zinc-750 transition-all active:scale-95"
                          >
                            Yazar Yap
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateRole(usr.id, "ADMIN", usr.username)}
                            disabled={isPending}
                            className="px-3 py-1.5 rounded bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 text-[10px] font-black transition-all active:scale-95"
                          >
                            Admin Yap
                          </button>
                        )}

                        <button
                          onClick={() => handleUpdateRole(usr.id, "BANNED", usr.username)}
                          disabled={isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-[10px] font-black tracking-wide transition-all active:scale-95"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>BANLA</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : userQuery.trim() && !userSearching ? (
            <div className="text-center py-8 text-xs text-zinc-550 italic">
              Aranan kriterlere uygun yazar bulunamadı zzz.
            </div>
          ) : null}

          {/* Gift/Badge Moderation Modal */}
          {giftTargetUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-zinc-950 border border-zinc-850 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 text-left">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>Hediye & Belge Yönetimi: @{giftTargetUser.username}</span>
                  </h3>
                  <button
                    onClick={() => { setGiftTargetUser(null); setGiftList([]); }}
                    className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Left side: Current gifts list */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-zinc-400 block">Yazarın Mevcut Hediyeleri & Belgeleri</span>
                  {giftListLoading ? (
                    <div className="py-4 text-center text-xs text-zinc-550">Yükleniyor...</div>
                  ) : giftList.length === 0 ? (
                    <div className="text-[11px] text-zinc-650 italic bg-zinc-900/10 border border-dashed border-zinc-900 p-4 rounded text-center">
                      Bu yazarın henüz hiç hediyesi/belgesi yok zzz.
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      {giftList.map((g) => {
                        const giftInfo = ALL_GIFTS_MAP[g.giftType] || { name: g.giftType, emoji: "🎁", description: "" };
                        return (
                          <div key={g.id} className="flex justify-between items-center bg-zinc-900/40 border border-zinc-900 p-2 rounded text-xs gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base select-none">{giftInfo.emoji}</span>
                              <div>
                                <span className="font-bold text-zinc-200">{giftInfo.name}</span>
                                {g.note && <p className="text-[10px] text-zinc-550 italic mt-0.5">"{g.note}"</p>}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveGift(g.id)}
                              disabled={isPending}
                              className="p-1.5 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                              title="Hediyeyi Geri Al"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right side: Send new gift form */}
                <div className="space-y-3.5 border-t border-zinc-900/80 pt-3">
                  <span className="text-[11px] font-bold text-zinc-400 block">Yeni Hediye / Belge Takdim Et</span>
                  
                  {/* Select Gift Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-550 font-bold block">Hediye Türü</label>
                    <select
                      value={selectedGiftType}
                      onChange={(e) => setSelectedGiftType(e.target.value)}
                      className="w-full h-9 rounded bg-zinc-900 border border-zinc-800 px-2 text-xs text-zinc-200 focus:outline-none focus:border-lime-500"
                    >
                      <optgroup label="Sinek Rozetleri & Madalyaları">
                        <option value="SWEET">🍬 Tatlı Sinek</option>
                        <option value="KING">👑 Kral Sinek</option>
                        <option value="SWATTER">🎾 Sinek Raketi</option>
                        <option value="LIGHTNING">⚡ Yıldırım Vızıltı</option>
                        <option value="STEEL">🛡️ Çelik Kanat</option>
                        <option value="MIDNIGHT">☕ Gece Sinekleri</option>
                        <option value="WATERMELON">🍉 Karpuz Dilimi</option>
                        <option value="TECH">🔍 Detektör Sinek</option>
                        <option value="SOCIAL">🎤 Röportajcı</option>
                        <option value="TREND">🔥 Alev Kanat</option>
                        <option value="AMBER">💎 Kehribar Sinek (EFSANEVİ)</option>
                      </optgroup>
                      <optgroup label="Resmi Başarı & Onur Belgeleri">
                        <option value="ACHIEVEMENT">📜 Üstün Başarı Belgesi</option>
                        <option value="HONOR">🎖️ Sözlük Onur Belgesi</option>
                        <option value="AGENT">🕵️‍♂️ Gizli Teşkilat Belgesi</option>
                        <option value="ACADEMY">🎓 Vızıltı Akademisi Diploması</option>
                      </optgroup>
                    </select>
                    
                    {/* Selected Gift description */}
                    {ALL_GIFTS_MAP[selectedGiftType] && (
                      <p className="text-[10px] text-zinc-550 italic px-1 mt-1">
                        {ALL_GIFTS_MAP[selectedGiftType].description}
                      </p>
                    )}
                  </div>

                  {/* Congratulations Note */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-550 font-bold block">Tebrik/Hediye Notu (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      placeholder="örn: Harika vızıltıların için tebrikler zzz!"
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value)}
                      maxLength={120}
                      className="w-full h-9 rounded bg-zinc-900 border border-zinc-800 px-3 text-xs text-zinc-200 focus:outline-none focus:border-lime-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={handleSendGift}
                      disabled={isPending}
                      className="px-5 py-2 rounded-lg bg-lime-500 text-black font-extrabold text-xs hover:bg-lime-400 active:scale-95 transition-all"
                    >
                      Hediyeyi Takdim Et zzz
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: TOPICS --- */}
      {activeTab === "TOPICS" && (
        <div className="space-y-6">
          <div className="bg-zinc-950/30 p-5 rounded-xl border border-zinc-900 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-lime-400" />
              <span>Başlık Arama & Düzenleme</span>
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-655" />
                <input
                  type="text"
                  placeholder="Başlık adı girerek arayın..."
                  value={topicQuery}
                  onChange={(e) => setTopicQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchTopics()}
                  className="w-full h-10 pl-9 pr-4 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-lime-500 transition-all"
                />
              </div>
              <button
                onClick={handleSearchTopics}
                disabled={topicSearching || isPending}
                className="h-10 px-5 rounded-lg bg-lime-500 text-black font-extrabold text-xs hover:bg-lime-400 active:scale-95 transition-all disabled:opacity-50"
              >
                {topicSearching ? "Aranıyor..." : "Ara"}
              </button>
            </div>
          </div>

          {/* Merge Target Modal Overlay */}
          {mergingTopic && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-zinc-950 border border-zinc-850 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <GitMerge className="w-4 h-4 text-lime-400" />
                    <span>Başlık Birleştir</span>
                  </h3>
                  <button
                    onClick={() => { setMergingTopic(null); setMergeTargetQuery(""); setMergeTargetResults([]); }}
                    className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 bg-zinc-950/60 p-3 rounded-lg border border-zinc-900 text-xs">
                  <p className="text-zinc-400">
                    <strong className="text-lime-400">Kaynak Başlık:</strong> "{mergingTopic.title}" ({mergingTopic.entryCount} entry)
                  </p>
                  <p className="text-[10px] text-zinc-550 mt-1">
                    Bu başlığın altındaki tüm entryler aşağıdaki hedef başlığa taşınacak ve bu başlık tamamen silinecektir.
                  </p>
                </div>

                {/* Target Search Box */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 block">Hedef Başlık Ara</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Birleştirilecek hedef başlığı ara..."
                      value={mergeTargetQuery}
                      onChange={(e) => setMergeTargetQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchMergeTargets()}
                      className="flex-1 h-9 rounded bg-zinc-900 border border-zinc-800 px-3 text-xs text-zinc-200 focus:outline-none focus:border-lime-500"
                    />
                    <button
                      onClick={handleSearchMergeTargets}
                      disabled={mergeSearching || isPending}
                      className="px-3 rounded bg-zinc-850 border border-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
                    >
                      {mergeSearching ? "..." : "Bul"}
                    </button>
                  </div>
                </div>

                {/* Search Target Results */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-zinc-900/60 pr-1">
                  {mergeTargetResults.map(target => (
                    <div key={target.id} className="flex justify-between items-center py-2 text-xs">
                      <div>
                        <span className="font-semibold text-zinc-200">"{target.title}"</span>
                        <span className="text-zinc-650 text-[10px] ml-2">({target.entryCount} entry)</span>
                      </div>
                      <button
                        onClick={() => handleMergeTopics(target.id, target.title)}
                        className="px-2.5 py-1 rounded bg-lime-500 text-black font-extrabold text-[10px] hover:bg-lime-400 transition-colors"
                      >
                        Bu Başlığa Aktar
                      </button>
                    </div>
                  ))}

                  {mergeTargetQuery.trim() && !mergeSearching && mergeTargetResults.length === 0 && (
                    <p className="text-center text-[10px] text-zinc-550 py-3 italic">
                      Hedef başlık bulunamadı.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Topics Listing */}
          {topicsList.length > 0 ? (
            <div className="grid gap-3">
              {topicsList.map((topic) => (
                <div
                  key={topic.id}
                  className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 hover:border-zinc-850 transition-all flex flex-col gap-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/baslik/${topic.slug}`}
                          target="_blank"
                          className="text-xs font-bold text-white hover:underline flex items-center gap-1 hover:text-lime-400"
                        >
                          <span>#{topic.title}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-600" />
                        </Link>
                        <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                          {topic.entryCount} entry
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-600">
                        Oluşturulma: {new Date(topic.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          setRenamingTopicId(renamingTopicId === topic.id ? null : topic.id);
                          setRenamingTitle(topic.title);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-400 hover:text-white text-[10px] font-bold transition-all"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Adlandır</span>
                      </button>

                      <button
                        onClick={() => {
                          setMergingTopic(topic);
                          setMergeTargetQuery("");
                          setMergeTargetResults([]);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded border border-zinc-850 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 text-[10px] font-bold transition-all"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>Birleştir</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTopic(topic.id, topic.title)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] font-bold transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Başlığı Sil</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Renaming Input */}
                  {renamingTopicId === topic.id && (
                    <div className="flex gap-2 items-center bg-zinc-950/80 p-3 rounded-lg border border-zinc-900 animate-in slide-in-from-top-2 duration-150">
                      <input
                        type="text"
                        value={renamingTitle}
                        onChange={(e) => setRenamingTitle(e.target.value)}
                        className="flex-1 h-8 rounded bg-zinc-900 border border-zinc-800 px-3 text-xs text-zinc-200 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500"
                        placeholder="Yeni başlık adı yazın..."
                      />
                      <button
                        onClick={() => handleRenameTopic(topic.id)}
                        disabled={isPending}
                        className="px-3.5 h-8 rounded bg-lime-500 text-black font-extrabold text-[10px] hover:bg-lime-400 transition-colors"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={() => { setRenamingTopicId(null); setRenamingTitle(""); }}
                        className="px-3.5 h-8 rounded border border-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-zinc-200"
                      >
                        İptal
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : topicQuery.trim() && !topicSearching ? (
            <div className="text-center py-8 text-xs text-zinc-550 italic">
              Aranan kriterlere uygun başlık bulunamadı zzz.
            </div>
          ) : null}
        </div>
      )}

      {/* --- TAB 4: SYSTEM SETTINGS & HEALTH --- */}
      {activeTab === "SETTINGS" && (
        <div className="space-y-6">
          {settingsLoading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-lime-400 animate-spin mx-auto" />
              <p className="text-xs text-zinc-550 font-bold">İstatistikler ve Sistem Verileri Yükleniyor...</p>
            </div>
          ) : (
            <>
              {/* Health Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Database Health Card */}
                <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-950/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg border ${
                      health?.db === "OK" 
                        ? "bg-lime-500/10 border-lime-500/20 text-lime-400" 
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}>
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-350">Veritabanı Durumu</h3>
                      <p className="text-[10px] text-zinc-550 mt-0.5">PostgreSQL Supabase Pooler</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${health?.db === "OK" ? "bg-lime-500 animate-pulse" : "bg-red-500 animate-ping"}`} />
                    <span className={`text-[10px] font-black ${health?.db === "OK" ? "text-lime-400" : "text-red-400"}`}>
                      {health?.db === "OK" ? "AKTİF" : "BAĞLANTI HATASI"}
                    </span>
                  </div>
                </div>

                {/* Redis Health Card */}
                <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-950/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg border ${
                      health?.redis === "OK" 
                        ? "bg-lime-500/10 border-lime-500/20 text-lime-400" 
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-350">Bellek / Redis Durumu</h3>
                      <p className="text-[10px] text-zinc-550 mt-0.5">Session & IP Cache Store</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${health?.redis === "OK" ? "bg-lime-500 animate-pulse" : "bg-red-500 animate-ping"}`} />
                    <span className={`text-[10px] font-black ${health?.redis === "OK" ? "text-lime-400" : "text-red-400"}`}>
                      {health?.redis === "OK" ? "AKTİF" : "BAĞLANTI HATASI"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Counters Grid */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/30 text-center space-y-1">
                    <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Toplam Yazar</p>
                    <p className="text-xl font-black text-lime-400">{stats.totalUsers}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/30 text-center space-y-1">
                    <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Toplam Başlık</p>
                    <p className="text-xl font-black text-white">{stats.totalTopics}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/30 text-center space-y-1">
                    <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Bugünkü Entry</p>
                    <p className="text-xl font-black text-white">{stats.todayEntries}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/30 text-center space-y-1">
                    <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Bugünkü Yorum</p>
                    <p className="text-xl font-black text-white">{stats.todayComments}</p>
                  </div>
                </div>
              )}

              {/* Global Settings Actions Card */}
              <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-950/30 space-y-5">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <Settings className="w-4.5 h-4.5 text-lime-400" />
                  <h3 className="text-sm font-bold text-white">Küresel Site Ayarları</h3>
                </div>

                <div className="divide-y divide-zinc-900/60">
                  {/* Signup Toggle */}
                  <div className="flex justify-between items-center py-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Yeni Üye Kaydını Kapat</span>
                      <p className="text-[10px] text-zinc-550 max-w-md">
                        Aktif edildiğinde yeni kullanıcıların kaydolması durdurulur, "kaydol" sayfası hata döndürür.
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting("disableSignups")}
                      disabled={isPending}
                      className={`w-12 h-6.5 rounded-full p-1 transition-colors relative flex items-center ${
                        settings.disableSignups ? "bg-red-500 justify-end" : "bg-zinc-800 justify-start"
                      }`}
                    >
                      <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform" />
                    </button>
                  </div>

                  {/* PozKes Toggle */}
                  <div className="flex justify-between items-center py-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">PozKes Paylaşımını Kapat</span>
                      <p className="text-[10px] text-zinc-555 max-w-md">
                        Aktif edildiğinde yazarların PozKes'e yeni fotoğraf/görsel yüklemesi geçici olarak kapatılır.
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting("disablePozkes")}
                      disabled={isPending}
                      className={`w-12 h-6.5 rounded-full p-1 transition-colors relative flex items-center ${
                        settings.disablePozkes ? "bg-red-500 justify-end" : "bg-zinc-800 justify-start"
                      }`}
                    >
                      <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform" />
                    </button>
                  </div>

                  {/* Self Deletion Toggle */}
                  <div className="flex justify-between items-center py-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Yazarların Kendi Hesabını Silmesini Kapat</span>
                      <p className="text-[10px] text-zinc-555 max-w-md">
                        Aktif edildiğinde yazarlar kendi hesaplarını ayarlar sayfasından silemezler.
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting("disableSelfDeletion")}
                      disabled={isPending}
                      className={`w-12 h-6.5 rounded-full p-1 transition-colors relative flex items-center ${
                        settings.disableSelfDeletion ? "bg-red-500 justify-end" : "bg-zinc-800 justify-start"
                      }`}
                    >
                      <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform" />
                    </button>
                  </div>

                  {/* Twitter (X) Pixel ID */}
                  <div className="flex flex-col gap-2 py-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Twitter (X) Pixel ID</span>
                      <p className="text-[10px] text-zinc-550 max-w-md">
                        Twitter reklam dönüşümlerini izlemek için piksel kimliğini (örn: rd6i8) girin. Boş bırakırsanız piksel izleme kodu siteden tamamen kaldırılır.
                      </p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={settings.xPixelId || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, xPixelId: e.target.value }))}
                        disabled={isPending}
                        placeholder="Örn: rd6i8"
                        className="max-w-xs h-9 rounded-lg bg-zinc-900 border border-zinc-800 px-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all w-full"
                      />
                    </div>
                  </div>

                  {/* Twitter (X) Yeni Kayıt Event ID */}
                  <div className="flex flex-col gap-2 py-4 border-t border-zinc-900/40">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Twitter (X) Yeni Kayıt Event ID</span>
                      <p className="text-[10px] text-zinc-550 max-w-md">
                        Yeni üye kayıtlarını takip etmek için olay (event) kimliğini (örn: tw-rd6i8-rd8qk) girin.
                      </p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={settings.xSignupEventId || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, xSignupEventId: e.target.value }))}
                        disabled={isPending}
                        placeholder="Örn: tw-rd6i8-rd8qk"
                        className="max-w-xs h-9 rounded-lg bg-zinc-900 border border-zinc-800 px-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all w-full"
                      />
                    </div>
                    <div className="mt-2">
                      <button
                        onClick={handleSaveXPixel}
                        disabled={isPending}
                        className="px-4 py-2 bg-lime-500 hover:bg-lime-400 disabled:opacity-50 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Twitter Piksel Ayarlarını Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
