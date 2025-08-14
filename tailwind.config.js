/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        'soft': '0 10px 30px -10px rgba(0,0,0,0.3)'
      },
      backdropBlur: {
        xs: '2px'
      }
    },
  },
  plugins: [],
}
