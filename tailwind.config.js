/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        apple: '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
      },
      colors: {
        surface: { light: '#ffffff', dark: '#1c1c1e' },
        panel: { light: '#f5f5f7', dark: '#2c2c2e' },
        border: { light: 'rgba(0,0,0,0.06)', dark: 'rgba(255,255,255,0.08)' },
      },
      backdropBlur: { glass: '20px' },
      boxShadow: {
        apple: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'apple-md': '0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06)',
        'apple-lg': '0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
