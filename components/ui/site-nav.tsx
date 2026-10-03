import { Button } from "./button";
import { Navbar } from "./navbar";

const LINKS = [
  { label: "Beranda", href: "/" },
  { label: "Kabinet", href: "/kabinet" },
  { label: "News", href: "/news" },
];

/** Navbar situs: melebar di paling atas halaman, memendek jadi pill saat discroll. */
export function SiteNav() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 pt-4">
      <Navbar links={LINKS} actions={<Button size="sm">Gabung Divisi</Button>} />
    </div>
  );
}
