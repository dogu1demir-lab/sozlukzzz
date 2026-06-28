import Link from "next/link";
import React from "react";

interface MentionTextProps {
  content: string;
}

// Client-side helper to convert Turkish text to SEO Slug (matching server's convertToSlug)
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
  // Pattern regex matches:
  // 1. Mentions: @username
  // 2. Visible reference: (bkz: konu adı)
  // 3. Hidden reference: (gbkz: konu adı) or (gizli bkz: konu adı)
  const combinedRegex = /@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)|\(bkz:\s*([^\)]+)\)|\((?:gbkz|gizli bkz):\s*([^\)]+)\)/g;
  
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
    
    const [_, mentionUser, bkzTitle, gbkzTitle] = match;
    
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
    }
    
    lastIndex = combinedRegex.lastIndex;
  }
  
  // Add remaining plain text
  if (lastIndex < content.length) {
    result.push(<React.Fragment key={key++}>{content.substring(lastIndex)}</React.Fragment>);
  }
  
  return <>{result}</>;
}
