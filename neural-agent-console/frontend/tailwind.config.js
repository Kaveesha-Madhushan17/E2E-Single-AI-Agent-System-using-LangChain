/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#05070D",
        surface: "#0B0F1A",
        "surface-2": "#121829",
        "surface-3": "#1A2238",
        line: "#232C47",
        core: "#5EEAD4",
        "core-dim": "#2DD4BF",
        pulse: "#8B7CF6",
        amber: "#F0B93B",
        ink: "#E7ECF5",
        muted: "#7E8AA3",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(94, 234, 212, 0.45)",
        "glow-violet": "0 0 40px -8px rgba(139, 124, 246, 0.45)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        drift: "drift 4s ease-in-out infinite",
        scanline: "scanline 3s linear infinite",
      },
    },
  },
  plugins: [],
}
