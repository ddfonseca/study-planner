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
        terracotta: '#c17a5c',
        success: '#22c55e',
        warning: '#eab308',
        danger: '#ef4444',
        calendar: {
          green: 'var(--calendar-green)',
          warm: 'var(--calendar-warm)',
          today: 'var(--calendar-today)',
        },
        text: {
          DEFAULT: 'var(--foreground)',
          light: 'var(--muted-foreground)',
          lighter: 'var(--muted-foreground)',
        },
      },
      boxShadow: {
        'sm': 'none',
        'md': 'none',
        'lg': 'none',
        'dark-sm': 'none',
        'dark-md': 'none',
        'dark-lg': 'none',
        'none': 'none',
      },
      fontFamily: {
        sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease-in-out',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        'pulse-once': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'pulse-once': 'pulse-once 1s ease-in-out 2',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
}
