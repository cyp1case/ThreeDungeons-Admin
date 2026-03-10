import flowbite from "flowbite/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "node_modules/flowbite-react/lib/esm/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        "royal-blue": { DEFAULT: "#1D3B8E", light: "#2A4FAD", dark: "#15306F" },
        "roof-red": { DEFAULT: "#D32F23", light: "#E8453A" },
        "fantasy-green": { DEFAULT: "#5CA136", light: "#6DB847" },
        "flag-yellow": { DEFAULT: "#F4C430" },
        "earthy-tan": { DEFAULT: "#C18F5B" },
        "surface-page": "#242830",
        "surface-card": "#2C3038",
        "surface-inner": "#343842",
        "surface-sidebar": "#1A1D24",
        "border-dark": "#3A3F4A",
        "border-accent": "#4A5060",
        "text-bright": "#FFFFFF",
        "text-primary": "#E0DDD5",
        "text-muted": "#9098A8",
        // Keep primary alias for Flowbite compatibility
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          300: "#93c5fd",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1D3B8E",
          800: "#15306F",
          900: "#0E1230",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "cursive"],
        sans: ['"Chakra Petch"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [flowbite],
};
