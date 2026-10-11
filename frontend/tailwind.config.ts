import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Heritage Forest & American Enterprise Palette
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46', // Primary Heritage Forest Green
          900: '#064e3b',
          950: '#022c22',
          DEFAULT: '#065f46',
          hover: '#044e39',
          light: '#ecfdf5',
        },
        surface: {
          canvas: '#f8f9fa',
          card: '#ffffff',
          muted: '#f1f5f9',
          dark: '#0f172a',
          DEFAULT: '#f8f9fa',
        },
        border: {
          hairline: '#e5e7eb',
          subtle: '#e2e8f0',
          DEFAULT: '#e5e7eb',
        },
        // Semantic Silicon Valley / Stripe Badge System
        badge: {
          success: {
            bg: '#ecfdf5',
            text: '#065f46',
            border: '#a7f3d0',
          },
          warning: {
            bg: '#fffbeb',
            text: '#92400e',
            border: '#fde68a',
          },
          danger: {
            bg: '#fef2f2',
            text: '#991b1b',
            border: '#fecaca',
          },
          purple: {
            bg: '#faf5ff',
            text: '#6b21a8',
            border: '#e9d5ff',
          },
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
};

export default config;