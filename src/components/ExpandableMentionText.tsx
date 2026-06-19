"use client";

import { useState } from "react";
import MentionText from "./MentionText";

interface ExpandableMentionTextProps {
  content: string;
  limit?: number;
}

export default function ExpandableMentionText({ content, limit = 250 }: ExpandableMentionTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If the content is short, just render it fully
  if (content.length <= limit) {
    return (
      <div className="whitespace-pre-wrap break-words">
        <MentionText content={content} />
      </div>
    );
  }

  // Otherwise, handle truncation
  const truncatedText = content.substring(0, limit);

  return (
    <div className="space-y-1">
      <div className="whitespace-pre-wrap break-words">
        {isExpanded ? (
          <MentionText content={content} />
        ) : (
          <>
            <MentionText content={truncatedText} />
            <span className="text-zinc-550 select-none">...</span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="inline-block text-[11px] font-bold text-lime-400 hover:text-lime-300 transition-colors mt-0.5 select-none cursor-pointer focus:outline-none"
      >
        {isExpanded ? "daha az göster zzz" : "devamını oku 🐝"}
      </button>
    </div>
  );
}
