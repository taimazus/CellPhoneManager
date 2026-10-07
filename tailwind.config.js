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
        // Imperial Charcoal Dark Grays (Overriding slate & gray to dark obsidian/charcoal)
        slate: {
          50: '#fafbff',
          100: '#f3f5fa',
          200: '#e2e6f2',
          300: '#c8cde0',
          400: '#9ca1ba',
          500: '#6b7086',
          600: '#363949',
          700: '#242632',
          750: '#1d1e28',
          800: '#171820',
          850: '#111217',
          900: '#0c0d11',
          950: '#07080a'
        },
        gray: {
          50: '#fafbff',
          100: '#f3f5fa',
          200: '#e2e6f2',
          300: '#c8cde0',
          400: '#9ca1ba',
          500: '#6b7086',
          600: '#363949',
          700: '#242632',
          800: '#171820',
          900: '#0c0d11',
          950: '#07080a'
        },
        zinc: {
          50: '#fafbff',
          100: '#f3f5fa',
          200: '#e2e6f2',
          300: '#c8cde0',
          400: '#9ca1ba',
          500: '#6b7086',
          600: '#363949',
          700: '#242632',
          800: '#171820',
          900: '#0c0d11',
          950: '#07080a'
        },
        charcoal: {
          50: '#fafbff',
          100: '#f0f2f8',
          200: '#d8dbe9',
          300: '#b0b5cf',
          400: '#7e839e',
          500: '#4e5267',
          600: '#363949',
          700: '#242632',
          750: '#1d1e28',
          800: '#171820',
          850: '#111217',
          900: '#0c0d11',
          950: '#07080a'
        },
        studio: {
          50: '#fafbff',
          100: '#f0f2f8',
          200: '#d8dbe9',
          300: '#b0b5cf',
          400: '#7e839e',
          500: '#4e5267',
          600: '#363949',
          700: '#242632',
          750: '#1d1e28',
          800: '#171820',
          850: '#111217',
          900: '#0c0d11',
          950: '#07080a'
        },

        // Royal 24k Gold & Imperial Radiant Amber (Replacing all blue, cyan, indigo, sky)
        blue: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#d4af37',
          700: '#b8860b',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03'
        },
        cyan: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#d4af37',
          700: '#b8860b',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03'
        },
        sky: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#d4af37',
          700: '#b8860b',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03'
        },
        indigo: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#d4af37',
          700: '#b8860b',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03'
        },
        gold: {
          50: '#fdfcf5',
          100: '#faf5e4',
          200: '#f3e6bd',
          300: '#ebd18c',
          400: '#e1b957',
          500: '#d4a028',
          600: '#bc831e',
          700: '#96611a',
          800: '#7a4e1b',
          900: '#66411b',
          950: '#3c230b'
        },
        royal: {
          gold: '#d4af37',
          bright: '#f5cc59',
          light: '#fde68a',
          dark: '#996515',
          bronze: '#b8860b',
          bg: '#0c0d11',
          surface: '#14151b',
          card: '#1a1b22',
          border: 'rgba(212, 175, 55, 0.2)',
          borderActive: 'rgba(212, 175, 55, 0.6)'
        },
        brand: {
          900: '#66411b',
          800: '#7a4e1b',
          700: '#96611a',
          600: '#bc831e',
          500: '#d4a028',
          400: '#e1b957',
          300: '#ebd18c'
        },
        cyber: {
          900: '#0c0d11',
          850: '#111217',
          800: '#171820',
          700: '#242632',
          600: '#363949',
          500: '#d4a028',
          400: '#e1b957',
          neon: '#f5cc59',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          purple: '#d4af37'
        }
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Outfit', 'Segoe UI', 'Tahoma', 'system-ui', '-apple-system', 'sans-serif'],
        vazir: ['Vazirmatn', 'Outfit', 'Segoe UI', 'Tahoma', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Cascadia Code', 'Consolas', 'monospace']
      },
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      }
    },
  },
  plugins: [],
}
