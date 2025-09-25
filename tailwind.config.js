/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/**/*.{js,ts,jsx,tsx,html}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TradingView inspired color palette
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2962FF', // TradingView blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        background: {
          DEFAULT: '#1E222D', // Main background
          card: '#2A2E39',     // Card background
          muted: '#131722',    // Darker sections
        },
        foreground: {
          DEFAULT: '#D1D4DC', // Primary text
          muted: '#9598A1',    // Secondary text
          subtle: '#6B7280',   // Tertiary text
        },
        success: {
          DEFAULT: '#4CAF50',
          dark: '#388E3C',
        },
        error: {
          DEFAULT: '#F44336',
          dark: '#D32F2F',
        },
        warning: {
          DEFAULT: '#FF9800',
          dark: '#F57C00',
        },
        border: {
          DEFAULT: '#363A45',
          light: '#434651',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
        xs: '4px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'popup': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}