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
    },
  },
  plugins: [],
}
