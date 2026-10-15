"use client";

import { useEffect, useRef, useState } from "react";

/** Copies text to the clipboard; `copied` stays true for 1.2 s, for an icon or tooltip swap. */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1200);
    } catch {
      // The browser refused clipboard access; the text stays selectable.
    }
  }

  return { copied, copy };
}
