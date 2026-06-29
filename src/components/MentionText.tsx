"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

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

// Subcomponent: Click-to-reveal lazy loader for videos/tweets
function EmbedWrapper({ type, children }: { type: "twitter" | "video"; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Re-trigger Twitter widgets compile if we open a tweet embed
    if (isOpen && type === "twitter") {
      const win = window as any;
      if (win.twttr && win.twttr.widgets) {
        win.twttr.widgets.load();
      } else {
        const script = document.createElement("script");
        script.setAttribute("src", "https://platform.twitter.com/widgets.js");
        script.setAttribute("charset", "utf-8");
        script.setAttribute("async", "true");
        document.head.appendChild(script);
      }
    }
  }, [isOpen, type]);

  if (!isOpen) {
    return (
      <div className="my-2.5">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-zinc-850 bg-zinc-900/10 hover:bg-lime-500/5 hover:border-lime-500/20 text-zinc-400 hover:text-lime-400 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer group"
        >
          {type === "twitter" ? (
            <>
              <span className="text-sm group-hover:scale-110 transition-transform duration-150">🐦</span>
              <span>X/Twitter içeriğini göster</span>
            </>
          ) : (
            <>
              <span className="text-sm group-hover:scale-110 transition-transform duration-150">🎥</span>
              <span>videoyu göster</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="my-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
      {children}
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-900 bg-zinc-950/20 text-zinc-500 hover:text-zinc-300 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
      >
        <span>✕ gizle</span>
      </button>
    </div>
  );
}

export default function MentionText({ content }: MentionTextProps) {
  useEffect(() => {
    // Fallback widget loader on mount if any open embeds already exist
    if (document.querySelector(".twitter-tweet")) {
      const win = window as any;
      if (win.twttr && win.twttr.widgets) {
        win.twttr.widgets.load();
      } else {
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
  const combinedRegex = /@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)|\(bkz:\s*([^\)]+)\)|\((?:gbkz|gizli bkz):\s*([^\)]+)\)/gi;
  
  // Custom parser handles URLs individually to wrap them inside EmbedWrapper correctly
  const urlRegex = /(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+(?:\?\S*)?)|(https?:\/\/\S+\.(?:mp4|webm|ogg|mov)(?:\?\S*)?)|(https?:\/\/[^\s\)]+)/gi;

  const parseContent = (text: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // First, pass through combined regex for mentions and bkz/gbkz
    combinedRegex.lastIndex = 0;
    let key = 0;
    
    // We parse the entire block, but also watch out for URLs. 
    // To make sure all features work recursively, we split by combinedRegex, 
    // and for the plain text blocks in between, we parse URLs!
    
    const parseUrls = (subText: string) => {
      const subParts: React.ReactNode[] = [];
      let subLastIndex = 0;
      let urlMatch;
      urlRegex.lastIndex = 0;
      
      while ((urlMatch = urlRegex.exec(subText)) !== null) {
        const urlMatchIndex = urlMatch.index;
        if (urlMatchIndex > subLastIndex) {
          subParts.push(<React.Fragment key={key++}>{subText.substring(subLastIndex, urlMatchIndex)}</React.Fragment>);
        }
        
        const [_, tweetUrl, videoUrl, normalUrl] = urlMatch;
        
        if (tweetUrl) {
          subParts.push(
            <EmbedWrapper key={key++} type="twitter">
              <div className="max-w-lg border border-zinc-900 bg-zinc-950/40 rounded-2xl p-0.5 overflow-hidden">
                <blockquote className="twitter-tweet" data-theme="dark" data-align="center" data-dnt="true">
                  <a href={tweetUrl} rel="nofollow"></a>
                </blockquote>
              </div>
            </EmbedWrapper>
          );
        } else if (videoUrl) {
          subParts.push(
            <EmbedWrapper key={key++} type="video">
              <div className="max-w-lg rounded-xl overflow-hidden border border-zinc-900 bg-black/40">
                <video src={videoUrl} controls className="w-full max-h-[400px] object-contain" preload="metadata" />
              </div>
            </EmbedWrapper>
          );
        } else if (normalUrl) {
          subParts.push(
            <a
              key={key++}
              href={normalUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-lime-400 font-semibold hover:underline break-all"
            >
              {normalUrl}
            </a>
          );
        }
        
        subLastIndex = urlRegex.lastIndex;
      }
      
      if (subLastIndex < subText.length) {
        subParts.push(<React.Fragment key={key++}>{subText.substring(subLastIndex)}</React.Fragment>);
      }
      return subParts;
    };

    while ((match = combinedRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      
      // Parse URLs inside the plain text block before this mention/bkz
      if (matchIndex > lastIndex) {
        parts.push(...parseUrls(text.substring(lastIndex, matchIndex)));
      }
      
      const [_, mentionUser, bkzTitle, gbkzTitle] = match;
      
      if (mentionUser) {
        parts.push(
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
        parts.push(
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
        parts.push(
          <Link
            key={key++}
            href={`/baslik/${slug}`}
            className="text-lime-400 border-b border-dashed border-lime-500/50 hover:text-lime-300 font-semibold transition-colors"
          >
            {gbkzTitle}
          </Link>
        );
      }
      
      lastIndex = combinedRegex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push(...parseUrls(text.substring(lastIndex)));
    }
    
    return parts;
  };

  return <>{parseContent(content)}</>;
}
