/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        'primary-dark': "#2563EB",
        secondary: "#10B981",
        accent: "#F59E0B",
        background: "#F0FDF4",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.1)",
        button: "0 2px 8px rgba(0,0,0,0.15)",
      },
      transitionDuration: {
        400: "400ms",
        600: "600ms",
      },
    },
  },
  safelist: [
    'bg-background',
    'text-primary',
    'text-primary-dark',
    'bg-secondary',
    'bg-accent',
    'hover:bg-primary-dark',
    'hover:bg-secondary',
    'hover:bg-accent'
  ],
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography")
  ],
};
