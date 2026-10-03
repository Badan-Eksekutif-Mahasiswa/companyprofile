"use client";

import * as React from "react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui";
import type { NewsAttachment } from "@/lib/news";

/**
 * Lampiran artikel. PDF bisa dipratinjau di halaman (dimuat hanya setelah tombol ditekan,
 * supaya halaman tetap ringan). Browser yang tidak bisa menampilkan PDF inline (mis. banyak
 * browser HP) mendapat tautan "Buka di tab baru".
 */
export function Attachments({ items }: { items: NewsAttachment[] }) {
  const [open, setOpen] = React.useState<string | null>(null);
  if (items.length === 0) return null;
  const btn = buttonVariants({ variant: "outline", size: "sm" });

  return (
    <section aria-labelledby="lampiran" className="mt-12 max-w-[720px]">
      <h2 id="lampiran" className="text-xl font-extrabold text-navy">
        Lampiran
      </h2>
      <ul className="mt-4 space-y-4">
        {items.map((a) => {
          const pdf = a.tipe === "pdf";
          const shown = open === a.url;
          return (
            <li key={a.url} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <FileText aria-hidden className="size-6 shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-navy">{a.nama}</p>
                  <p className="text-[13px] text-muted">
                    {(a.tipe ?? "berkas").toUpperCase()}
                    {a.ukuran ? ` · ${a.ukuran}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pdf && (
                    <button
                      type="button"
                      className={btn}
                      aria-expanded={shown}
                      aria-controls={`pdf-${encodeURIComponent(a.url)}`}
                      onClick={() => setOpen(shown ? null : a.url)}
                    >
                      {shown ? "Tutup pratinjau" : "Pratinjau"}
                    </button>
                  )}
                  <a className={btn} href={a.url} download target="_blank" rel="noopener noreferrer">
                    <Download className="size-4" aria-hidden />
                    Unduh<span className="sr-only"> {a.nama}</span>
                  </a>
                </div>
              </div>
              {pdf && shown && (
                <div id={`pdf-${encodeURIComponent(a.url)}`} className="mt-4">
                  <object data={`${a.url}#view=FitH`} type="application/pdf" className="h-[70vh] w-full rounded-xl border border-border">
                    <p className="p-4 text-sm text-secondary">
                      Browser ini tidak bisa menampilkan PDF di halaman.{" "}
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-accent underline underline-offset-2">
                        Buka di tab baru <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </p>
                  </object>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
