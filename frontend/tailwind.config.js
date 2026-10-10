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
        primary: {
          50: '#EAF3FF',
          100: '#D6E7FF',
          200: '#ADCFFF',
          300: '#85B6FF',
          400: '#5C9EFF',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1740B0',
          800: '#123B6D',
          900: '#0F2F57',
          950: '#0A1E38',
        },
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          700: '#20487B',
          800: '#183861',
          900: '#123B6D',
          950: '#0C2749',
        },
        brand: {
          50: '#EAF3FF',
          100: '#D6E7FF',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#123B6D',
          800: '#0F2F57',
        },
        surface: {
          page: '#F5F7FB',
          card: '#FFFFFF',
          border: '#E2E8F0',
          subtle: '#F8FAFC',
        },
        text: {
          main: '#172B4D',
          secondary: '#64748B',
          muted: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
