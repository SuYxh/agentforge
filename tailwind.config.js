/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          border: 'hsl(var(--sidebar-border))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backdropBlur: {
        glass: '16px',
        'glass-strong': '24px',
        'glass-subtle': '20px',
        'glass-overlay': '40px',
      },
      backdropSaturate: {
        glass: '1.8',
        'glass-strong': '2',
        'glass-subtle': '1.5',
      },
      boxShadow: {
        'glass-sm': '0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.6)',
        'glass': '0 8px 32px rgba(31, 38, 135, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.6)',
        'glass-lg': '0 16px 48px rgba(31, 38, 135, 0.12), inset 0 1px 3px rgba(255, 255, 255, 0.7)',
        'glass-hover': '0 12px 40px rgba(31, 38, 135, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.7)',
      },
      transitionTimingFunction: {
        liquid: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'liquid-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'liquid-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
