import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['InterLocal', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#effcf9',
          100: '#c8f7ef',
          600: '#0f766e',
          700: '#0f5f5a',
          900: '#134e4a'
        }
      },
      boxShadow: {
        soft: '0 14px 45px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
} satisfies Config;
