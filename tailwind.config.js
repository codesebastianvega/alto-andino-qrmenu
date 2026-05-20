/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'sans-serif'],
        heading: ['var(--font-heading)', 'Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: 'var(--color-brand-primary)',
          secondary: 'var(--color-brand-secondary)',
          bg: 'var(--color-brand-bg)',
          card: 'var(--color-brand-card)',
          text: 'var(--color-brand-text)',
          footer: 'var(--color-brand-footer)',
        },
        alto: {
          primary: "#4F46E5", /* Indigo 600 */
          primaryDark: "#3730A3", /* Indigo 800 */
          teal: "#4338CA", /* Indigo 700 */
          terracotta: "#818CF8", /* Indigo 400 */
          beige: "#F8FAFC", /* Slate 50 */
          greige: "#F1F5F9", /* Slate 100 */
          warmwhite: "#FFFFFF",
          text: "#0F172A", /* Slate 900 */
          text2: "#475569", /* Slate 600 */
          success: "#10B981", /* Emerald 500 */
          warn: "#F59E0B", /* Amber 500 */
          error: "#EF4444", /* Red 500 */
        },
      },
      boxShadow: { card: "0 6px 20px rgba(0,0,0,0.06)" },
    },
  },
  plugins: [],
};
