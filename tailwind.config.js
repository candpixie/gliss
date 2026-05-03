/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#04060c',
          surface: 'rgba(255,255,255,0.04)',
          surfaceHover: 'rgba(255,255,255,0.08)',
        },
        accent: {
          glacier: '#8eb8c9',
          tide: '#5db5b9',
          aurora: '#c8d9b4',
        },
        text: {
          primary: '#e8eef5',
          muted: '#8a99ab',
          dim: '#5a6878',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
        },
      },
      ringColor: {
        focus: 'rgba(142,184,201,0.4)',
      },
      boxShadow: {
        'frost': '0 8px 32px rgba(0,0,0,0.45)',
        'frost-glow': '0 0 24px rgba(142,184,201,0.18)',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
