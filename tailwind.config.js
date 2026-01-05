/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        fuchsia: {
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(168,85,247,0.4), 0 0 40px rgba(168,85,247,0.2)',
        'glow-intense': '0 0 30px rgba(168,85,247,0.6), 0 0 60px rgba(168,85,247,0.3)',
        'glow-subtle': '0 0 40px rgba(168,85,247,0.15)',
      },
    },
  },
  plugins: [],
}

