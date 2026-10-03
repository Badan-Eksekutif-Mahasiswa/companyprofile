export const SITE = {
  name: "BEM UI 2026",
  kabinet: "Kabinet TerusTerang",
  tagline: "#TerusTerang",
  description: "Website resmi Badan Eksekutif Mahasiswa Universitas Indonesia 2026, Kabinet TerusTerang.",
  nav: [
    { label: "Home", href: "/" },
    { label: "Kabinet", href: "/kabinet" },
    { label: "News", href: "/news" },
  ],
  social: {
    instagram: "https://www.instagram.com/bemui_official/",
    youtube: "https://www.youtube.com/@BEMUI",
    twitter: "https://x.com/BEM_UI",
  },
} as const;

export const HERO = {
  /** Putaran tambahan dari scroll selama hero ditahan, sebelum halaman lanjut ke bawah. */
  maxRotations: 1,
  /** Jarak scroll (dalam tinggi viewport) untuk satu putaran penuh. */
  viewportsPerRotation: 2.5,
  /** Jumlah baris & kartu per baris (4 × 5 = 20 kartu = jumlah proker unggulan). Baris berulang vertikal tanpa ujung; scroll menggerakkan kartu turun. */
  rings: 4,
  cardsPerRing: 5,
  /** Putaran otomatis (derajat/detik). 0 = diam. */
  autoSpeed: 3,
  /** Jumlah proker yang tampil di orbit. Sisanya tetap bisa dibuka dari detail divisi. */
  featured: 20,
} as const;

/** ID video company profile YouTube (https://www.youtube.com/watch?v=R5XbD1vjXlg). Bisa diganti lewat env. */
export const YOUTUBE_VIDEO_ID = process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID || "R5XbD1vjXlg";
