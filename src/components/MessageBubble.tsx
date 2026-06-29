"use client";

import React, { useState, useTransition } from "react";
import { deleteMessageAction, editMessageAction } from "@/app/actions";
import { Edit3, Trash2, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { playBuzzSound } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string | Date;
}

interface MessageBubbleProps {
  msg: Message;
  currentUserId: string;
}

export default function MessageBubble({ msg, currentUserId }: MessageBubbleProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content);
  const [isPending, startTransition] = useTransition();
  const isMe = msg.senderId === currentUserId;

  const handleEditSave = () => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      alert("Mesaj en fazla 2000 karakter olabilir zzz.");
      return;
    }

    startTransition(async () => {
      const res = await editMessageAction(msg.id, trimmed);
      if (res.error) {
        alert(res.error);
      } else {
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Bu mesajı kökten silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
      return;
    }

    playBuzzSound(false, "/eylemhareket.mp3");

    startTransition(async () => {
      const res = await deleteMessageAction(msg.id);
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div
      className={`group flex items-start gap-2 max-w-[80%] ${
        isMe ? "self-end flex-row-reverse" : "self-start flex-row"
      }`}
    >
      {/* Message Card */}
      <div
        className={`flex flex-col rounded-2xl px-4 py-2.5 text-sm w-full transition-all relative ${
          isMe
            ? "bg-lime-500 text-black rounded-tr-none font-medium"
            : "bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800"
        }`}
      >
        {isEditing ? (
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <textarea
              rows={2}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isPending}
              maxLength={2000}
              className="w-full bg-zinc-950 text-zinc-100 rounded-lg p-2 text-xs border border-zinc-850 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all resize-none"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditContent(msg.content); }}
                disabled={isPending}
                className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                title="İptal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={isPending || !editContent.trim()}
                className="p-1 rounded bg-lime-600 hover:bg-lime-700 text-black cursor-pointer"
                title="Kaydet"
              >
                <Check className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="break-all whitespace-pre-wrap">{msg.content}</span>
            <span
              className={`text-[8.5px] text-right mt-1.5 block select-none ${
                isMe ? "text-zinc-800" : "text-zinc-500"
              }`}
            >
              {new Date(msg.createdAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Istanbul"
              })}
            </span>
          </>
        )}
      </div>

      {/* Edit/Delete Controls (shows on hover or mobile tap) */}
      {isMe && !isEditing && (
        <div className="flex flex-col md:flex-row gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 self-center select-none bg-zinc-950/40 p-1 rounded-lg border border-zinc-900">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-zinc-500 hover:text-teal-400 rounded transition-colors cursor-pointer"
            title="Mesajı Düzenle"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors cursor-pointer"
            title="Mesajı Sil"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
