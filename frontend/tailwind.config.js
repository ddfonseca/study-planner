/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4a90e2',
          light: '#7ab3ed',
          dark: '#2f6cb5',
        },
        success: '#7ed321',
        warning: '#f8e71c',
        danger: '#d0021b',
        calendar: {
          green: '#e4f7d5',
          blue: '#ddebf7',
          today: '#fffacd',
        },
        background: '#f7f9fa',
        container: '#ffffff',
        border: '#e0e5e9',
        text: {
          DEFAULT: '#333333',
          light: '#555555',
          lighter: '#999999',
        },
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 10px rgba(0, 0, 0, 0.08)',
        'lg': '0 10px 30px rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
