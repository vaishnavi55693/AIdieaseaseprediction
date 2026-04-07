/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#081120",
        ocean: "#00bcd4",
        coral: "#ff7a59",
        mint: "#8ff7d2",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        glow: "0 20px 80px rgba(6, 182, 212, 0.18)",
      },
      backgroundImage: {
        "hero-mesh":
          "linear-gradient(180deg, #f8fbfd 0%, #eef4f7 100%)",
      },
    },
  },
  plugins: [],
};
