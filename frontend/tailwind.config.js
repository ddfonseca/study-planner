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
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'toast-progress': {
          '0%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        // Smooth 60fps slide animations
        'slide-in-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        // Scale animations for interactive elements
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        // Bounce effect for attention
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        // Achievement badge entrance animation
        'achievement-enter': {
          '0%': {
            transform: 'scale(0)',
            opacity: '0'
          },
          '50%': {
            transform: 'scale(1.2)',
            opacity: '1'
          },
          '70%': {
            transform: 'scale(0.9)'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          },
        },
        // Achievement badge glow pulse
        'achievement-glow': {
          '0%': {
            transform: 'scale(1)',
            opacity: '0.6',
            filter: 'blur(0px)'
          },
          '50%': {
            transform: 'scale(1.5)',
            opacity: '0.3',
            filter: 'blur(8px)'
          },
          '100%': {
            transform: 'scale(2)',
            opacity: '0',
            filter: 'blur(12px)'
          },
        },
      },
      animation: {
        'pulse-once': 'pulse-once 1s ease-in-out 2',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'toast-progress': 'toast-progress linear forwards',
        'fade-in': 'fade-in 300ms ease-out forwards',
        'fade-out': 'fade-out 200ms ease-in forwards',
        // Smooth 60fps animations using cubic-bezier(0.4, 0, 0.2, 1)
        'slide-in-up': 'slide-in-up 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-down': 'slide-in-down 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-left': 'slide-in-left 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'scale-in': 'scale-in 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'scale-out': 'scale-out 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'bounce-soft': 'bounce-soft 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        'achievement-enter': 'achievement-enter 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'achievement-glow': 'achievement-glow 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
      // Custom transition timing functions for 60fps smoothness
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
}
