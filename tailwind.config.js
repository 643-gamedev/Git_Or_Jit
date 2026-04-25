/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: '#39ff14',
        neonSoft: '#00ff9f',
        dark: '#000000',
      },
      fontFamily: {
        mono: ['Cutive Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

