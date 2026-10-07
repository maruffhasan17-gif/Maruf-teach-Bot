/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: '#0F1A15', // Dark green/black background
          card: '#162A20', // Slightly lighter green for cards
          primary: '#10B981', // Emerald green for active elements
          secondary: '#34D399',
          accent: '#A7F3D0', // Light green for text
          border: 'rgba(16, 185, 129, 0.2)'
        }
      }
    },
  },
  plugins: [],
}
