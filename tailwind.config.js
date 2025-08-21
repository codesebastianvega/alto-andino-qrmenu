/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        alto: {
          primary: "#2E7D5B",
          primaryDark: "#1F6245",
          teal: "#0F766E",
          terracotta: "#C4533D",
          beige: "#F5EDE3",
          greige: "#EAE6DE",
          warmwhite: "#FFFCF8",
          text: "#1B1B1B",
          text2: "#585858",
          success: "#2E7D32",
          warn: "#B45309",
          error: "#B91C1C",
        },
      },
      boxShadow: { card: "0 6px 20px rgba(0,0,0,0.06)" },
    },
  },
  plugins: [],
};
