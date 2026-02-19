/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7C9EF5',
        'primary-dark': '#5B7ED9',
        secondary: '#F5A67C',
        'secondary-dark': '#E08A5C',
        success: '#7CE0A3',
        warning: '#F5E07C',
        danger: '#F57C7C',
        cream: '#FFF9F0',
        'cream-dark': '#FFF3E0',
      },
      fontFamily: {
        sans: ['Paperlogy', '-apple-system', 'Apple SD Gothic Neo', 'sans-serif'],
        display: ['GmarketSans', 'Paperlogy', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0,0,0,0.08)',
        'medium': '0 6px 20px rgba(0,0,0,0.12)',
        'glow': '0 0 20px rgba(124, 158, 245, 0.4)',
      }
    }
  },
  plugins: [],
}
