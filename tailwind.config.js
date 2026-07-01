/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0d0d13",
        card: "#16161f",
        cardalt: "#1b1b26",
        accent: "#8b5cf6",
        accentlight: "#a78bfa",
        loss: "#4ade80",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
}
