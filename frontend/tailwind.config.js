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
        // CSS variable-based colors (support dark mode)
        background: "var(--background)",
        foreground: "var(--foreground)",
        container: "var(--container)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          light: '#7ab3ed',
          dark: '#2f6cb5',
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },

        // Static colors
        success: '#22c55e',
        warning: '#eab308',
        danger: '#ef4444',
        calendar: {
          green: 'var(--calendar-green)',
          blue: 'var(--calendar-blue)',
          today: 'var(--calendar-today)',
        },
        text: {
          DEFAULT: 'var(--foreground)',
          light: 'var(--muted-foreground)',
          lighter: 'var(--muted-foreground)',
        },
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 25px rgba(0, 0, 0, 0.2), 0 4px 10px rgba(0, 0, 0, 0.1)',
        'dark-sm': '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.05)',
        'dark-md': '0 4px 6px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.05)',
        'dark-lg': '0 10px 25px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.05)',
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
