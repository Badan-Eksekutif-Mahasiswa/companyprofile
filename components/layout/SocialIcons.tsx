// Ikon brand sederhana (lucide-react v1 tidak lagi menyediakan logo brand).
type P = { className?: string };
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function InstagramIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function YoutubeIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="4" />
      <path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" />
    </svg>
  );
}

export function XIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 4l16 16M20 4 4 20" />
    </svg>
  );
}
