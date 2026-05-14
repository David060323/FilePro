/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F46E5', light: '#818CF8', dark: '#3730A3' },
        surface: { light: '#FFFFFF', dark: '#1E1E2E' },
        card: { light: '#F8FAFC', dark: '#2D2D3F' }
      }
    }
  },
  plugins: []
}
