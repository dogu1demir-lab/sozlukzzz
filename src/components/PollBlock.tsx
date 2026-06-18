"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { voteInPollAction, getPollVotersAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { X } from "lucide-react";
import Link from "next/link";

interface PollOption {
  id: string;
  text: string;
  votesCount: number;
  hasVoted: boolean;
}

interface PollBlockProps {
  pollId: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  isLoggedIn: boolean;
  hasVotedAny: boolean;
}

interface Voter {
  id: string;
  username: string;
  avatarColor: string;
  avatarUrl: string | null;
}

interface VoterGroup {
  id: string;
  text: string;
  voters: Voter[];
}

export default function PollBlock({
  pollId,
  question,
  options,
  totalVotes,
  isLoggedIn,
  hasVotedAny,
}: PollBlockProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showVoters, setShowVoters] = useState(false);
  const [votersLoading, setVotersLoading] = useState(false);
  const [votersData, setVotersData] = useState<VoterGroup[] | null>(null);

  const handleVote = (optionId: string) => {
    if (!isLoggedIn) {
      alert("Oy vermek için lütfen giriş yapın zzz.");
      return;
    }

    playBuzzSound();

    startTransition(async () => {
      const result = await voteInPollAction(pollId, optionId);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleShowVoters = async () => {
    playBuzzSound();
    setShowVoters(true);
    setVotersLoading(true);

    try {
      const result = await getPollVotersAction(pollId);
      if (result.success && result.options) {
        setVotersData(result.options as VoterGroup[]);
      } else {
        alert(result.error || "Seçmen listesi yüklenemedi.");
      }
    } catch {
      alert("Bir hata oluştu.");
    } finally {
      setVotersLoading(false);
    }
  };

  return (
    <div className="poll-block animate-in fade-in duration-300">
      <p className="poll-question">{question}</p>
      
      <ul className="poll-options">
        {options.map((opt) => {
          const percent = totalVotes > 0 ? Math.round((opt.votesCount / totalVotes) * 100) : 0;
          return (
            <li
              key={opt.id}
              className={`poll-option ${opt.hasVoted ? "poll-option--voted" : ""}`}
            >
              <button
                type="button"
                className="poll-option-btn"
                onClick={() => handleVote(opt.id)}
                disabled={isPending}
                aria-pressed={opt.hasVoted}
                title={opt.hasVoted ? "Oyunu geri al" : hasVotedAny ? "Oyunu değiştir" : undefined}
              >
                <span className="poll-option-text">
                  {opt.hasVoted && <span className="poll-voted-check">✓ </span>}
                  {opt.text}
                </span>
                {hasVotedAny && (
                  <span className="poll-option-percent">{percent}%</span>
                )}
              </button>

              {hasVotedAny && (
                <div className="poll-bar-track" aria-hidden="true">
                  <div
                    className="poll-bar-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="poll-total-votes">
        <button
          type="button"
          className="poll-voters-btn"
          onClick={handleShowVoters}
        >
          {totalVotes} oy
        </button>
        {hasVotedAny && (
          <span className="poll-change-hint">
            {" "}• Seçeneğe tıklayarak oyunu değiştirebilirsin
          </span>
        )}
        {!isLoggedIn && (
          <span className="poll-login-hint">
            {" "}• Oy vermek için <Link href="/giris" onClick={() => playBuzzSound()}>giriş yapın</Link>
          </span>
        )}
      </p>

      {/* Voters List Lightbox Modal */}
      {showVoters && (
        <div className="poll-voters-modal-backdrop animate-in fade-in duration-250">
          <div className="poll-voters-modal-container bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="poll-voters-modal-header p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="text-teal-400 font-extrabold text-sm sm:text-base">
                Oylar — {question}
              </h3>
              <button
                onClick={() => {
                  playBuzzSound();
                  setShowVoters(false);
                }}
                className="p-1 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="poll-voters-modal-body p-4 overflow-y-auto space-y-4 flex-1">
              {votersLoading ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">Yükleniyor…</div>
              ) : votersData ? (
                votersData.map((group) => (
                  <div key={group.id} className="poll-voters-option-block space-y-2">
                    <div className="poll-voters-option-header flex justify-between items-baseline border-b border-slate-800 pb-1">
                      <span className="text-xs font-extrabold text-slate-200 truncate">
                        {group.text}
                      </span>
                      <span className="text-[10px] text-teal-400 font-bold shrink-0">
                        {group.voters.length} oy
                      </span>
                    </div>

                    {group.voters.length === 0 ? (
                      <p className="poll-voters-empty text-[10px] text-slate-500 italic pl-1">Henüz oy yok.</p>
                    ) : (
                      <div className="poll-voters-users-list flex flex-wrap gap-1.5 pl-1">
                        {group.voters.map((voter) => (
                          <Link
                            key={voter.id}
                            href={`/yazar/${voter.username}`}
                            onClick={() => {
                              playBuzzSound();
                              setShowVoters(false);
                            }}
                            className="poll-voters-user-chip flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-800 bg-slate-950/40 hover:border-teal-500/50 hover:bg-slate-900/50 text-[10px] font-semibold text-slate-350 hover:text-white transition-all"
                          >
                            {voter.avatarUrl ? (
                              <img
                                src={voter.avatarUrl}
                                alt={voter.username}
                                className="w-4 h-4 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-black text-[8px] shrink-0"
                                style={{ backgroundColor: voter.avatarColor }}
                              >
                                {voter.username.substring(0, 1).toUpperCase()}
                              </div>
                            )}
                            <span>@{voter.username}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 italic">Bilgi bulunamadı.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
