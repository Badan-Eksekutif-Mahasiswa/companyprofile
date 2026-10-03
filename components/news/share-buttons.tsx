"use client";

import * as React from "react";
import { Check, Link2 } from "lucide-react";
import { buttonVariants } from "@/components/ui";

export function ShareButtons({ title, label = "Bagikan" }: { title: string; label?: string }) {
  const [url, setUrl] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => setUrl(window.location.href), []);

  const enc = encodeURIComponent;
  const cls = buttonVariants({ variant: "outline", size: "sm" });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="mr-1 text-sm font-bold text-navy">{label}</span>
      <a className={cls} target="_blank" rel="noopener noreferrer" href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`}>
        X<span className="sr-only"> (buka di tab baru)</span>
      </a>
      <a className={cls} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${enc(`${title} ${url}`)}`}>
        WhatsApp<span className="sr-only"> (buka di tab baru)</span>
      </a>
      <button type="button" className={cls} onClick={copy}>
        {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
        {copied ? "Tersalin" : "Salin Link"}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link disalin" : ""}
      </span>
    </div>
  );
}
