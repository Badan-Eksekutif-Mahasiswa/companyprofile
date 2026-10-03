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
  /** Berapa kali orbit berputar penuh (lewat scroll) sebelum halaman lanjut ke section berikutnya. */
  maxRotations: 2,
  /** Jarak scroll (dalam tinggi viewport) untuk satu putaran penuh. */
  viewportsPerRotation: 1.25,
  /** Jumlah cincin & kartu per cincin pada mode "Rings". */
  rings: 3,
  cardsPerRing: 10,
  /** Putaran otomatis (derajat/detik). 0 = diam. */
  autoSpeed: 6,
  /** Latar scene WebGL = --navy di globals.css. */
  bgColor: "#0b102d",
} as const;

/** ID video company profile YouTube. Diatur lewat env agar tidak hardcoded. */
export const YOUTUBE_VIDEO_ID = process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID ?? "";
