import type { Config } from 'tailwindcss'

const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium ERP Color Palette
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6', // Primary Action Color
          600: '#2563eb',
          900: '#1e3a8a',
        },
        surface: {
          light: '#ffffff',
          DEFAULT: '#f8fafc',
          dark: '#0f172a',
        },
        border: {
          light: '#e2e8f0',
          DEFAULT: '#cbd5e1',
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
};

export default config;