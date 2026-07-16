"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createEntryAction, getAllUsernamesAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { Send, AlertCircle } from "lucide-react";

interface AddEntryFormProps {
  topicId: string;
  isLoggedIn: boolean;
}

export default function AddEntryForm({ topicId, isLoggedIn }: AddEntryFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "redirecting">(() => {
    if (typeof window !== "undefined" && (window as any).isUculuyor) {
      return "redirecting";
    }
    return "idle";
  });
  const [isPending, startTransition] = useTransition();
  const isSubmittingOrPending = isPending || submitStatus !== "idle";
  const router = useRouter();
  const searchParams = useSearchParams();
  const submittingRef = useRef(false);

  const [redirectUrl, setRedirectUrl] = useState("");
  const [showEscape, setShowEscape] = useState(false);

  useEffect(() => {
    if (submitStatus === "redirecting") {
      const timer = setTimeout(() => {
        setShowEscape(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowEscape(false);
    }
  }, [submitStatus]);

  // Mentions Autocomplete States
  const [allUsernames, setAllUsernames] = useState<string[]>([]);
  const [filteredUsernames, setFilteredUsernames] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(0);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);

  const replyTo = searchParams.get("replyTo");
  const replyIndex = searchParams.get("replyIndex");

  const handleFocus = async () => {
    if (allUsernames.length === 0) {
      try {
        const users = await getAllUsernamesAction();
        setAllUsernames(users);
      } catch (err) {
        console.error("Failed to load usernames for mentions:", err);
      }
    }
  };

  const handleTextareaChange = (val: string, cursorIndex: number) => {
    setContent(val);
    
    // Check if we are currently typing a username mention
    const textBeforeCursor = val.slice(0, cursorIndex);
    const lastWordMatch = textBeforeCursor.match(/@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]*)$/);
    
    if (lastWordMatch) {
      const searchStr = lastWordMatch[1];
      const matchStart = lastWordMatch.index;
      setMentionSearch(searchStr);
      setMentionIndex(matchStart !== undefined ? matchStart : -1);
      
      const filtered = allUsernames
        .filter(name => name.toLowerCase().includes(searchStr.toLowerCase()))
        .slice(0, 5);
      setFilteredUsernames(filtered);
      setShowDropdown(filtered.length > 0);
      setDropdownIndex(0);
    } else {
      setShowDropdown(false);
      setMentionSearch(null);
    }
  };

  const selectMention = (username: string) => {
    if (mentionIndex === -1) return;
    const before = content.slice(0, mentionIndex);
    const searchLen = mentionSearch !== null ? mentionSearch.length : 0;
    const after = content.slice(mentionIndex + searchLen + 1); // +1 for '@'
    const newContent = `${before}@${username} ${after}`;
    setContent(newContent);
    setShowDropdown(false);
    setMentionSearch(null);
    
    // Return focus to textarea and place cursor after the added mention
    setTimeout(() => {
      const tx = document.getElementById("entry-textarea") as HTMLTextAreaElement;
      if (tx) {
        tx.focus();
        const newPos = mentionIndex + username.length + 2; // +1 for '@', +1 for space
        tx.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDropdown && filteredUsernames.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setDropdownIndex((prev) => (prev + 1) % filteredUsernames.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setDropdownIndex((prev) => (prev - 1 + filteredUsernames.length) % filteredUsernames.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMention(filteredUsernames[dropdownIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowDropdown(false);
      }
    }
  };

  useEffect(() => {
    if (replyTo) {
      setContent(prev => {
        if (!prev.trim() || prev === `@${replyTo} `) {
          return `@${replyTo} `;
        }
        if (!prev.includes(`@${replyTo}`)) {
          return `@${replyTo} ${prev}`;
        }
        return prev;
      });
    }
  }, [replyTo]);

  const handleInsertBkz = () => {
    const textarea = document.getElementById("entry-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = `(bkz: ${selectedText})`;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + 7 + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingOrPending || submittingRef.current) return;
    setError("");

    if (!isLoggedIn) {
      setError("Entry girmek için lütfen giriş yapın.");
      return;
    }

    if (!content.trim()) {
      setError("Entry içeriği boş olamaz.");
      return;
    }

    if (content.trim().length < 45) {
      setError("Entry en az 45 karakter olmalıdır zzz.");
      return;
    }

    submittingRef.current = true;
    setSubmitStatus("submitting");
    
    if (typeof window !== "undefined" && document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
    
    try {
      const result = await createEntryAction(topicId, content);
      if (result.error) {
        setError(result.error);
        setSubmitStatus("idle");
        submittingRef.current = false;
      } else {
        setContent("");
        playBuzzSound(false, "/eylemhareket.mp3");
        
        const targetUrl = (result.page && result.entryId)
          ? `${window.location.pathname}?p=${result.page}#entry-${result.entryId}`
          : "";
        setRedirectUrl(targetUrl);
        setSubmitStatus("redirecting");
        if (typeof window !== "undefined") {
          (window as any).isUculuyor = true;
        }
        
        setTimeout(() => {
          if (targetUrl) {
            window.location.href = targetUrl;
          } else {
            window.location.reload();
          }
        }, 1600);
      }
    } catch (err) {
      setError("Entry gönderilirken teknik bir hata oluştu.");
      setSubmitStatus("idle");
      submittingRef.current = false;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center bg-zinc-900/10">
        <p className="text-sm text-zinc-400">
          Bu başlığa entry girmek için lütfen{" "}
          <a href="/giris" className="text-lime-400 font-bold hover:underline">giriş yapın</a>{" "}
          veya{" "}
          <a href="/kaydol" className="text-lime-400 font-bold hover:underline">kaydolun</a>.{" "}
          (Yazar alımları başladı, acele et!)
        </p>
      </div>
    );
  }

  return (
    <form id="reply-form" onSubmit={handleSubmit} className="space-y-4 border-t border-zinc-900 pt-6">
      <h3 className="text-sm font-bold text-zinc-300">başlığa vızılda</h3>
      
      {replyTo && (
        <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 border border-zinc-800 p-2.5 text-xs text-zinc-400 animate-in fade-in duration-200">
          <span className="flex items-center gap-1">
            <span className="text-lime-400 font-bold">@{replyTo}</span>
            <span>isimli yazarın {replyIndex ? `#${replyIndex} nolu` : ""} entry'sine cevap yazıyorsunuz</span>
          </span>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.delete("replyTo");
              params.delete("replyIndex");
              const newSearch = params.toString() ? "?" + params.toString() : "";
              router.replace(`${window.location.pathname}${newSearch}#reply-form`, { scroll: false });
            }}
            className="text-zinc-500 hover:text-white transition-colors font-bold"
          >
            vazgeç
          </button>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="relative">
        <textarea
          id="entry-textarea"
          rows={4}
          value={content}
          onFocus={handleFocus}
          onChange={(e) => handleTextareaChange(e.target.value, e.target.selectionStart)}
          onKeyDown={handleKeyDown}
          placeholder="fikirlerini buraya vızıldat zzz..."
          disabled={isSubmittingOrPending}
          className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all resize-y"
        />

        {/* Autocomplete Mentions Dropdown */}
        {showDropdown && filteredUsernames.length > 0 && (
          <div className="absolute z-50 left-4 bottom-full mb-1.5 w-52 bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="p-2.5 border-b border-zinc-900 bg-zinc-950 text-[10px] text-zinc-500 font-bold uppercase tracking-wider select-none">
              yazarlar
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredUsernames.map((username, idx) => (
                <button
                  key={username}
                  type="button"
                  onClick={() => selectMention(username)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    idx === dropdownIndex 
                      ? "bg-lime-500 text-black font-bold" 
                      : "text-zinc-300 hover:bg-zinc-900/60 hover:text-white"
                  }`}
                >
                  <span>@{username}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleInsertBkz}
            title="Bakınız Ekle"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-lime-400 hover:border-lime-500/20 text-xs font-semibold transition-colors cursor-pointer select-none"
          >
            <span>bkz</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmittingOrPending}
          className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-lime-500 text-black font-semibold text-xs hover:bg-lime-400 transition-colors shadow-lg shadow-lime-500/10 disabled:opacity-50"
        >
          <Send className="h-3 w-3" />
          <span>{isSubmittingOrPending ? "vızıldanıyor..." : "vızıldat"}</span>
        </button>
      </div>

      {/* Uçuş Portalı Overlay */}
      {submitStatus === "redirecting" && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4 text-center p-6 animate-in zoom-in-95 duration-300">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-lime-500/10 border border-lime-500/20 shadow-[0_0_40px_rgba(132,204,22,0.2)] animate-pulse">
              <span className="text-4xl animate-bounce duration-700">🐝</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide font-sans">
              vızıldatıldı! uçuluyor... 🚀
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              sayfaya yönlendiriliyorsunuz, lütfen bekleyin
            </p>

            {/* Escape Hatch */}
            {showEscape && (
              <div className="mt-4 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="text-[11px] text-zinc-500">
                  bağlantı yavaş mı kaldı?
                </p>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      if (redirectUrl) {
                        window.location.href = redirectUrl;
                      } else {
                        window.location.reload();
                      }
                    }}
                    className="text-lime-400 hover:text-lime-300 transition-colors underline cursor-pointer"
                  >
                    zorla yenile
                  </button>
                  <span className="text-zinc-650">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitStatus("idle");
                      if (typeof window !== "undefined") {
                        (window as any).isUculuyor = false;
                      }
                      submittingRef.current = false;
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors underline cursor-pointer"
                  >
                    iptal et
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
