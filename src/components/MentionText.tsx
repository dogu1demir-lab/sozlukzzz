import Link from "next/link";
import React from "react";

interface MentionTextProps {
  content: string;
}

export default function MentionText({ content }: MentionTextProps) {
  // Matches @username where username has letters, numbers, underscores and Turkish characters
  const mentionRegex = /@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)/g;
  const parts = content.split(mentionRegex);
  
  if (parts.length === 1) {
    return <>{content}</>;
  }

  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          return (
            <Link
              key={i}
              href={`/yazar/${part}`}
              className="text-lime-400 font-bold hover:underline"
            >
              @{part}
            </Link>
          );
        }
        return part;
      })}
    </>
  );
}
