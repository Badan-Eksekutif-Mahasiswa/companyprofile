"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ArticleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <main id="main" className="mx-auto max-w-wrap px-4 py-32 text-center sm:px-6">
      <h1 className="text-3xl font-bold text-navy">Artikel belum dapat dimuat</h1>
      <p className="mt-3 text-secondary">Sedang ada gangguan sementara. Silakan coba lagi.</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
        <Button disabled={pending} onClick={() => startTransition(() => { router.refresh(); reset(); })}>
          <RefreshCw aria-hidden className={pending ? "animate-spin" : undefined} />
          Coba lagi
        </Button>
        <Link href="/news" className="font-bold text-accent underline underline-offset-2">Kembali ke Berita &amp; Artikel</Link>
      </div>
    </main>
  );
}
