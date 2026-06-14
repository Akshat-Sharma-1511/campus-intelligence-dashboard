/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        library: "var(--accent-library)",
        cafeteria: "var(--accent-cafeteria)",
        events: "var(--accent-events)",
        handbook: "var(--accent-handbook)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        border: "var(--border)",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        "card-in": "card-in 0.2s ease-out forwards",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        "card-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
    },
  },
  plugins: [],
};
