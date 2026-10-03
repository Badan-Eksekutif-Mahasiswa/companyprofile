import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="mb-3 text-4xl">Kabinet Terus Terang</h1>
        <p className="mb-6 text-secondary">Website BEM UI 2026 — dalam pengerjaan.</p>
        <Link href="/design-system" className="font-bold text-accent hover:text-accent-hover">
          Lihat Design System →
        </Link>
      </div>
    </main>
  );
}
