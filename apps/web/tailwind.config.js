/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          canvas: '#F5F5F7',
          surface: '#FFFFFF',
          border: '#E5E5EA',
          blue: '#0071E3',
          'blue-hover': '#0077ED',
          gray: {
            50: '#FBFBFD',
            100: '#F5F5F7',
            200: '#E5E5EA',
            300: '#D1D1D6',
            400: '#AEAEC2',
            500: '#8E8E93',
            600: '#636366',
            700: '#48484A',
            800: '#2C2C2E',
            900: '#1C1C1E',
          },
        },
        darkroom: {
          canvas: '#0D0E12',
          surface: '#161820',
          elevated: '#1D202B',
          border: '#2A2E3D',
          hover: '#34394C',
        },
        cinema: {
          gold: '#E5A93C',
          purple: '#AF52DE',
          cyan: '#00C7BE',
          green: '#34C759',
          red: '#FF3B30',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'Inter',
          'sans-serif',
        ],
        mono: ['"SF Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'apple-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'apple-card': '0 4px 16px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'apple-hover': '0 10px 30px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'glow-blue': '0 0 24px -4px rgba(0, 113, 227, 0.35)',
        'glow-gold': '0 0 24px -4px rgba(229, 169, 60, 0.35)',
      },
    },
  },
  plugins: [],
};
