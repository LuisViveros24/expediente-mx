/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Azul oscuro de marca → reemplaza toda la paleta sky-*
        sky: {
          300: "#6DB3E8",
          400: "#4A9EDF",
          500: "#1a5ba8",
          600: "#0A2540",
          700: "#081e33",
          800: "#051526",
          900: "#030e1a",
        },
        // Verde médico de marca → reemplaza toda la paleta emerald-*
        emerald: {
          300: "#4DBF9A",
          400: "#2EAF85",
          500: "#0d8a60",
          600: "#0d8a60",
          700: "#0B6E4F",
          800: "#08503a",
          900: "#053325",
        },
      },
    },
  },
  plugins: [],
}
