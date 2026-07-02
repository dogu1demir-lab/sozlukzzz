"use client";

import { useState, useRef, useTransition, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createTopicAndEntryAction, createPollTopicAction, getAllUsernamesAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { X, Plus } from "lucide-react";

function NewThreadContent() {
  const [type, setType] = useState<"normal" | "poll">("normal");
  const searchParams = useSearchParams();
  const titleParam = searchParams.get("title") || "";
  
  // Normal Thread State
  const [title, setTitle] = useState(titleParam);

  useEffect(() => {
    if (titleParam) {
      setTitle(titleParam);
    }
  }, [titleParam]);
  const [content, setContent] = useState("");
  const [base64Image, setBase64Image] = useState<string | null>(null);

  // Mentions Autocomplete States
  const [allUsernames, setAllUsernames] = useState<string[]>([]);
  const [filteredUsernames, setFilteredUsernames] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(0);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);

  // Poll State
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isSubmittingOrPending = isPending || submitting;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

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
      const tx = document.getElementById("new-topic-textarea") as HTMLTextAreaElement;
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

  const handleTabChange = (newType: "normal" | "poll") => {
    setType(newType);
    setError("");
    playBuzzSound();
  };

  const handleAddOption = () => {
    playBuzzSound();
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    playBuzzSound();
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert("Görsel boyutu 1.5MB'dan küçük olmalıdır zzz.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBase64Image(reader.result as string);
      playBuzzSound();
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setBase64Image(null);
    playBuzzSound();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingOrPending || submittingRef.current) return;
    setError("");

    if (!title.trim()) {
      setError("Lütfen başlık girin.");
      return;
    }

    if (type === "normal") {
      if (!content.trim()) {
        setError("Lütfen içerik girin.");
        return;
      }

      if (content.trim().length < 45) {
        setError("İçerik en az 45 karakter olmalıdır zzz.");
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);
      
      try {
        const result = await createTopicAndEntryAction(title, content, base64Image || undefined);
        if (result.error) {
          setError(result.error);
          setSubmitting(false);
          submittingRef.current = false;
        } else if (result.success && result.slug) {
          triggerConfetti();
          playBuzzSound(false, "/eylemhareket.mp3");
          // Give 600ms for sound and confetti to play before redirecting
          setTimeout(() => {
            window.location.href = `/baslik/${result.slug}`;
          }, 600);
        }
      } catch (e) {
        setError("Başlık oluşturulurken teknik bir sorun oluştu.");
        setSubmitting(false);
        submittingRef.current = false;
      }
    } else {
      if (!pollQuestion.trim()) {
        setError("Lütfen anket sorusunu girin.");
        return;
      }

      const validOptions = pollOptions.map(o => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setError("Lütfen en az 2 geçerli seçenek girin.");
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);
      
      try {
        const result = await createPollTopicAction(title, pollQuestion, validOptions);
        if (result.error) {
          setError(result.error);
          setSubmitting(false);
          submittingRef.current = false;
        } else if (result.success && result.slug) {
          triggerConfetti();
          playBuzzSound(false, "/eylemhareket.mp3");
          // Give 600ms for sound and confetti to play before redirecting
          setTimeout(() => {
            window.location.href = `/baslik/${result.slug}`;
          }, 600);
        }
      } catch (e) {
        setError("Anket oluşturulurken teknik bir sorun oluştu.");
        setSubmitting(false);
        submittingRef.current = false;
      }
    }
  };

  const triggerConfetti = () => {
    import("canvas-confetti").then((mod) => {
      mod.default({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#14b8a6", "#3b82f6", "#8b5cf6"],
      });
    });
  };

  const handleInsertBkz = () => {
    const textarea = document.getElementById("new-topic-textarea") as HTMLTextAreaElement;
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

  const handleCancel = () => {
    playBuzzSound();
    router.push("/");
  };

  return (
    <div className="new-thread-page animate-in fade-in duration-300">
      <h1>Yeni Konu Aç</h1>
      
      <div className="post-type-selector">
        <button
          type="button"
          className={`post-type-btn ${type === "normal" ? "active" : ""}`}
          onClick={() => handleTabChange("normal")}
        >
          💬 Normal Konu
        </button>
        <button
          type="button"
          className={`post-type-btn ${type === "poll" ? "active" : ""}`}
          onClick={() => handleTabChange("poll")}
        >
          📊 Anket
        </button>
      </div>

      <form onSubmit={handleSubmit} className="new-thread-form" noValidate>
        {error && (
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400">
            {error}
          </div>
        )}

        <label>
          Başlık
          <input
            type="text"
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Konunun başlığı…"
            disabled={isSubmittingOrPending}
          />
        </label>

        {type === "normal" ? (
          <>
            <label>
              İçerik
              <div className="mention-wrap relative">
                <textarea
                  id="new-topic-textarea"
                  required
                  rows={8}
                  value={content}
                  onFocus={handleFocus}
                  onChange={(e) => handleTextareaChange(e.target.value, e.target.selectionStart)}
                  onKeyDown={handleKeyDown}
                  placeholder="Konunuzun içeriğini buraya yazın…"
                  disabled={isSubmittingOrPending}
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
            </label>

            {base64Image && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-750 mt-2 shrink-0 group">
                <img src={base64Image} alt="Yüklenen görsel" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="poll-builder flex flex-col gap-4">
            <label>
              Anket Sorusu
              <textarea
                className="poll-question-input"
                required
                maxLength={300}
                rows={3}
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Sorunuzu buraya yazın…"
                disabled={isSubmittingOrPending}
              />
              <span className="text-[10px] text-slate-500 self-end mt-1">
                {pollQuestion.length}/300
              </span>
            </label>

            <div className="poll-options-list flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-350">Seçenekler</p>
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="poll-option-row flex items-center gap-2">
                  <input
                    type="text"
                    required={idx < 2}
                    maxLength={200}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Seçenek ${idx + 1}`}
                    className="flex-1"
                    disabled={isSubmittingOrPending}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 border border-slate-800 hover:border-red-500/50 rounded-lg hover:text-red-400 transition-colors text-slate-500 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {pollOptions.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 mt-1 rounded-lg border border-dashed border-slate-700 hover:border-teal-500 text-xs font-bold text-slate-350 hover:text-white transition-all bg-slate-900/10 hover:bg-slate-900/30"
                  disabled={isSubmittingOrPending}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Seçenek Ekle</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="form-actions mt-4 flex items-center justify-end gap-2.5">
          {type === "normal" && (
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-slate-750 hover:border-teal-500 text-xs font-bold text-slate-350 hover:text-white transition-all bg-slate-900/60 cursor-pointer select-none"
              onClick={handleInsertBkz}
              title="Bakınız Ekle"
            >
              bkz
            </button>
          )}
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-slate-700 hover:border-teal-500 text-xs font-bold text-slate-350 hover:text-white transition-all bg-slate-900/60"
            onClick={handleCancel}
            disabled={isSubmittingOrPending}
          >
            İptal
          </button>
          
          {type === "normal" && (
            <>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={isSubmittingOrPending}
              />
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-700 hover:border-teal-500 text-xs font-bold text-slate-350 hover:text-white transition-all bg-slate-900/60"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmittingOrPending}
              >
                Fotoğraf Ekle
              </button>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmittingOrPending}
            className="px-6 py-2 rounded-lg bg-teal-500 text-white text-xs font-bold hover:bg-teal-400 transition-colors disabled:opacity-50"
          >
            {isSubmittingOrPending ? "Paylaşılıyor..." : type === "normal" ? "Konuyu Paylaş" : "Anketi Paylaş"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewThread() {
  return (
    <Suspense fallback={<div className="text-zinc-500 text-xs p-6 text-center animate-pulse">yükleniyor zzz...</div>}>
      <NewThreadContent />
    </Suspense>
  );
}
