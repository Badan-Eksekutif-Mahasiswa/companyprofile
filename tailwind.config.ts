import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    // Skala radius mengikuti design system (rounded-2xl = 28px).
    borderRadius: {
      none: "0",
      sm: "var(--r-sm)",
      md: "var(--r-md)",
      lg: "var(--r-lg)",
      xl: "var(--r-xl)",
      "2xl": "var(--r-2xl)",
      full: "var(--r-full)",
    },
    extend: {
      // Warna dasar memakai hex literal (sinkron dengan globals.css) supaya modifier opacity
      // Tailwind (text-white/65, from-navy/85, dst.) bisa dibuat. Warna lain tetap lewat CSS var.
      colors: {
        white: "#FFFFFF",
        "off-white": "var(--off-white)",
        navy: {
          DEFAULT: "#0B102D",
          80: "var(--navy-80)",
          70: "var(--navy-70)",
          50: "var(--navy-50)",
          30: "var(--navy-30)",
          10: "var(--navy-10)",
          5: "var(--navy-05)",
        },
        blue: {
          DEFAULT: "#475CA3",
          hover: "var(--blue-hover)",
          soft: "#9CB3D3",
          pale: "var(--blue-pale)",
        },
        maroon: { DEFAULT: "#5E121C", pale: "var(--maroon-pale)" },
        red: { DEFAULT: "#82181A", hover: "var(--red-hover)", pale: "var(--red-pale)" },
        pink: { DEFAULT: "#D64C6F", light: "#FFCED8", pale: "var(--pink-pale)" },
        accent: {
          DEFAULT: "#D64C6F",
          hover: "var(--accent-hover)",
          pale: "var(--accent-pale)",
        },
        success: { DEFAULT: "var(--success)", pale: "var(--success-pale)" },
        warning: { DEFAULT: "var(--warning)", pale: "var(--warning-pale)" },
        border: "var(--border)",
        "border-soft": "var(--border-soft)",
        divider: "var(--divider)",
        glass: {
          DEFAULT: "var(--glass-bg)",
          strong: "var(--glass-bg-strong)",
          soft: "var(--glass-bg-soft)",
          border: "var(--glass-border)",
        },
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        faint: "var(--text-faint)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        glass: "var(--glass-shadow)",
        "glass-soft": "var(--glass-shadow-soft)",
      },
      backdropBlur: {
        glass: "20px",
        "glass-lg": "24px",
        "glass-md": "12px",
      },
      transitionTimingFunction: { "out-expo": "var(--ease-out)" },
      transitionDuration: {
        fast: "var(--dur-fast)",
        base: "var(--dur-base)",
        slow: "var(--dur-slow)",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "-apple-system", "sans-serif"],
      },
      maxWidth: { wrap: "1180px" },
    },
  },
  plugins: [
    ({ addVariant }: { addVariant: (n: string, v: string) => void }) =>
      addVariant("pointer-fine", "@media (pointer: fine)"),
  ],
};

export default config;
