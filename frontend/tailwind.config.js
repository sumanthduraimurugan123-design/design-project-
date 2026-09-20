/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'Consolas', 'monospace'],
        serif: ['"Noto Serif"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      },
      colors: {
        wire: {
          base:    '#0F0E0C',
          surface: '#161513',
          raised:  '#1E1C19',
          border:  '#2C2A26',
          muted:   '#403D38',
          fg:      '#D4CFCB',
          subtle:  '#8C8580',
          amber:   '#C9A24A',
          red:     '#B83030',
          green:   '#4A8A5C',
          blue:    '#3A6FA8',
        }
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
