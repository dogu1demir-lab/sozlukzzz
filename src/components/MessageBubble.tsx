"use client";

import React from "react";

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
  const isMe = msg.senderId === currentUserId;

  return (
    <div
      className={`flex items-start gap-2 max-w-[80%] ${
        isMe ? "self-end" : "self-start"
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
      </div>
    </div>
  );
}
