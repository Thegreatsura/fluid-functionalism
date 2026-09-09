"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/registry/radix/button";
import { useIcon } from "@/lib/icon-context";

interface CopyPromptButtonProps {
  /** The prompt text written to the clipboard. */
  prompt: string;
}

/** Primary "Copy prompt" button for the Installation block of every doc
 *  page. Copies a self-contained brief for an AI coding agent (see
 *  `install-prompt.ts`). The label flips to "Copied" for 2s with a check
 *  icon; both labels share one grid cell so the button keeps its width. */
export function CopyPromptButton({ prompt }: CopyPromptButtonProps) {
  const CopyIcon = useIcon("copy");
  const CheckIcon = useIcon("check");
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    let ok = true;
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // Clipboard API unavailable or denied: fall back to execCommand on an
      // off-screen textarea, same as InputCopy.
      const textarea = document.createElement("textarea");
      textarea.value = prompt;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(textarea);
    }
    if (!ok) return;
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [prompt]);

  return (
    <Button
      variant="primary"
      leadingIcon={copied ? CheckIcon : CopyIcon}
      onClick={handleCopy}
      className="w-fit shrink-0"
      aria-live="polite"
    >
      <span className="inline-grid">
        <span className={copied ? "col-start-1 row-start-1" : "col-start-1 row-start-1 invisible"} aria-hidden={!copied}>
          Copied
        </span>
        <span className={copied ? "col-start-1 row-start-1 invisible" : "col-start-1 row-start-1"} aria-hidden={copied}>
          Copy prompt
        </span>
      </span>
    </Button>
  );
}
