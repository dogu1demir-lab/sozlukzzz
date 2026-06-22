"use client";

import { useEffect, useRef } from "react";

interface ChatScrollAnchorProps {
  messageCount: number;
}

export default function ChatScrollAnchor({ messageCount }: ChatScrollAnchorProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const isInitial = useRef(true);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (anchor) {
      const container = anchor.parentElement;
      if (container) {
        const timer = setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: isInitial.current ? "auto" : "smooth"
          });
          isInitial.current = false;
        }, 100); // Small delay to let DOM render
        return () => clearTimeout(timer);
      }
    }
  }, [messageCount]);

  return <div ref={anchorRef} className="h-px w-full" aria-hidden="true" />;
}
