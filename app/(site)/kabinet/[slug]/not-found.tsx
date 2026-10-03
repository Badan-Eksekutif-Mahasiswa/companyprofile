import Link from "next/link";
import { Users } from "lucide-react";
import { EmptyState, buttonVariants } from "@/components/ui";

export default function DivisiNotFound() {
  return (
    <main id="konten" className="grid min-h-[100svh] place-items-center px-5">
      <EmptyState
        icon={<Users />}
        title="Divisi tidak ditemukan"
        description="Divisi yang kamu cari tidak ada di struktur Kabinet TerusTerang."
        action={
          <Link href="/kabinet" className={buttonVariants({ variant: "navy" })}>
            Lihat Semua Divisi
          </Link>
        }
      />
    </main>
  );
}
