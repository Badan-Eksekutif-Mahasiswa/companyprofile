"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const SIZES = [
  { key: "sm", label: "A", title: "Huruf kecil", cls: "text-[13px]" },
  { key: "md", label: "A", title: "Huruf normal", cls: "text-[16px]" },
  { key: "lg", label: "A", title: "Huruf besar", cls: "text-[20px]" },
] as const;

export function ReaderTools() {
  const [fs, setFs] = React.useState<string>("md");
  React.useEffect(() => {
    try {
      const v = localStorage.getItem("news:fs");
      if (v) setFs(v);
    } catch {}
  }, []);
  React.useEffect(() => {
    document.documentElement.dataset.fs = fs;
  }, [fs]);
  const pick = (k: string) => {
    setFs(k);
    try { localStorage.setItem("news:fs", k); } catch {}
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="group" aria-label="Ukuran huruf" className="inline-flex overflow-hidden rounded-full border-[1.5px] border-border bg-white">
        {SIZES.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={fs === s.key}
            aria-label={s.title}
            title={s.title}
            onClick={() => pick(s.key)}
            className={cn("px-3.5 py-1.5 font-extrabold outline-none transition-colors duration-fast focus-visible:ring-4 focus-visible:ring-pink-pale", s.cls, fs === s.key ? "bg-navy text-white" : "text-navy hover:bg-navy-5")}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
