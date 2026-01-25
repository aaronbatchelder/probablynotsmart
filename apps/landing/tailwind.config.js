/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm cream + bold accents (Option A from design brief)
        bg: {
          primary: '#FEFDFB',
          secondary: '#F7F5F2',
          card: '#FFFFFF',
          dark: '#1A1A1A',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#6B6B6B',
          muted: '#9A9A9A',
        },
        accent: {
          primary: '#FF5C35',
          secondary: '#7C3AED',
        },
      },
      fontFamily: {
        display: ['var(--font-cal-sans)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      fontSize: {
        hero: 'clamp(3rem, 6vw, 5rem)',
        display: 'clamp(2rem, 4vw, 3rem)',
      },
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '2rem',
        lg: '4rem',
        xl: '8rem',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.75rem',
        lg: '1rem',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 12px 24px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
