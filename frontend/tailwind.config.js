/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#040711',
          900: '#070c1e',
          850: '#0b132e',
          800: '#111d42',
          700: '#1d2f65',
          border: '#1b2a59',
          cyan: '#00f3ff',
          neonBlue: '#1f6feb',
          emerald: '#00ff9d',
          amber: '#ffb800',
          crimson: '#ff0055',
          purple: '#bd00ff'
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(0, 243, 255, 0.45)',
        'glow-amber': '0 0 20px -3px rgba(255, 184, 0, 0.45)',
        'glow-crimson': '0 0 20px -3px rgba(255, 0, 85, 0.55)',
        'glow-emerald': '0 0 20px -3px rgba(0, 255, 157, 0.45)',
        'cyber-card': '0 8px 32px 0 rgba(0, 0, 0, 0.65)'
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'Menlo', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scan 6s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      }
    },
  },
  plugins: [],
}
