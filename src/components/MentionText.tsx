"use client";

import Link from "next/link";
import React, { useEffect } from "react";

interface MentionTextProps {
  content: string;
}

// Client-side helper to convert Turkish text to SEO Slug
function convertToSlugClient(text: string): string {
  let slug = text.trim().toLowerCase();
  const turkishChars: { [key: string]: string } = {
    'ı': 'i', 'ş': 's', 'ç': 'c', 'ğ': 'g', 'ü': 'u', 'ö': 'o',
    'â': 'a', 'î': 'i', 'û': 'u'
  };
  
  for (const char in turkishChars) {
    slug = slug.replaceAll(char, turkishChars[char]);
  }
  
  slug = slug
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')         // Replace spaces with -
    .replace(/-+/g, '-');         // Replace multiple dashes
    
  return slug;
}

export default function MentionText({ content }: MentionTextProps) {
  useEffect(() => {
    // Check if there are any Twitter embeds that need rendering
    if (document.querySelector(".twitter-tweet")) {
      const win = window as any;
      if (win.twttr && win.twttr.widgets) {
        win.twttr.widgets.load();
      } else {
        // Load the official Twitter widget script dynamically
        const script = document.createElement("script");
        script.setAttribute("src", "https://platform.twitter.com/widgets.js");
        script.setAttribute("charset", "utf-8");
        script.setAttribute("async", "true");
        document.head.appendChild(script);
      }
    }
  }, [content]);

  // Combined Regex to match:
  // 1. Mentions: @username
  // 2. Visible reference: (bkz: konu adı)
  // 3. Hidden reference: (gbkz: konu adı) or (gizli bkz: konu adı)
  // 4. Twitter / X Status: https://twitter.com/user/status/123 or https://x.com/user/status/123
  // 5. Direct Video URLs: https://.../video.mp4 (or webm/ogg/mov)
  // 6. Normal URLs: https://...
  const combinedRegex = /@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)|\(bkz:\s*([^\)]+)\)|\((?:gbkz|gizli bkz):\s*([^\)]+)\)|(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+(?:\?\S*)?)|(https?:\/\/\S+\.(?:mp4|webm|ogg|mov)(?:\?\S*)?)|(https?:\/\/[^\s\)]+)/gi;
  
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  combinedRegex.lastIndex = 0;
  
  let key = 0;
  while ((match = combinedRegex.exec(content)) !== null) {
    const matchIndex = match.index;
    
    // Add plain text before match
    if (matchIndex > lastIndex) {
      result.push(<React.Fragment key={key++}>{content.substring(lastIndex, matchIndex)}</React.Fragment>);
    }
    
    const [_, mentionUser, bkzTitle, gbkzTitle, tweetUrl, videoUrl, normalUrl] = match;
    
    if (mentionUser) {
      result.push(
        <Link
          key={key++}
          href={`/yazar/${mentionUser}`}
          className="text-lime-400 font-bold hover:underline"
        >
          @{mentionUser}
        </Link>
      );
    } else if (bkzTitle) {
      const slug = convertToSlugClient(bkzTitle);
      result.push(
        <Link
          key={key++}
          href={`/baslik/${slug}`}
          className="text-lime-400 font-semibold hover:underline"
        >
          (bkz: {bkzTitle})
        </Link>
      );
    } else if (gbkzTitle) {
      const slug = convertToSlugClient(gbkzTitle);
      result.push(
        <Link
          key={key++}
          href={`/baslik/${slug}`}
          className="text-lime-400 border-b border-dashed border-lime-500/50 hover:text-lime-300 font-semibold transition-colors"
        >
          {gbkzTitle}
        </Link>
      );
    } else if (tweetUrl) {
      result.push(
        <div key={key++} className="my-4 max-w-lg border border-zinc-900 bg-zinc-950/40 rounded-2xl p-0.5 overflow-hidden">
          <blockquote className="twitter-tweet" data-theme="dark" data-align="center">
            <a href={tweetUrl}></a>
          </blockquote>
        </div>
      );
    } else if (videoUrl) {
      result.push(
        <div key={key++} className="my-4 max-w-lg rounded-xl overflow-hidden border border-zinc-900 bg-black/40">
          <video src={videoUrl} controls className="w-full max-h-[400px] object-contain" preload="metadata" />
        </div>
      );
    } else if (normalUrl) {
      result.push(
        <a
          key={key++}
          href={normalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lime-400 font-semibold hover:underline break-all"
        >
          {normalUrl}
        </a>
      );
    }
    
    lastIndex = combinedRegex.lastIndex;
  }
  
  // Add remaining plain text
  if (lastIndex < content.length) {
    result.push(<React.Fragment key={key++}>{content.substring(lastIndex)}</React.Fragment>);
  }
  
  return <>{result}</>;
}
