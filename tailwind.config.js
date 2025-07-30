/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['0.6rem', { lineHeight: '0.8rem' }],        // 80% of 0.75rem
        'sm': ['0.7rem', { lineHeight: '1rem' }],          // 80% of 0.875rem
        'base': ['0.8rem', { lineHeight: '1.2rem' }],      // 80% of 1rem
        'lg': ['0.9rem', { lineHeight: '1.4rem' }],        // 80% of 1.125rem
        'xl': ['1rem', { lineHeight: '1.4rem' }],          // 80% of 1.25rem
        '2xl': ['1.2rem', { lineHeight: '1.6rem' }],       // 80% of 1.5rem
        '3xl': ['1.5rem', { lineHeight: '1.8rem' }],       // 80% of 1.875rem
        '4xl': ['1.8rem', { lineHeight: '2rem' }],         // 80% of 2.25rem
        '5xl': ['2.4rem', { lineHeight: '1' }],            // 80% of 3rem
        '6xl': ['3rem', { lineHeight: '1' }],              // 80% of 3.75rem
      },
      spacing: {
        '0.5': '0.1rem',    // 80% of 0.125rem
        '1': '0.2rem',      // 80% of 0.25rem
        '1.5': '0.3rem',    // 80% of 0.375rem
        '2': '0.4rem',      // 80% of 0.5rem
        '2.5': '0.5rem',    // 80% of 0.625rem
        '3': '0.6rem',      // 80% of 0.75rem
        '3.5': '0.7rem',    // 80% of 0.875rem
        '4': '0.8rem',      // 80% of 1rem
        '5': '1rem',        // 80% of 1.25rem
        '6': '1.2rem',      // 80% of 1.5rem
        '7': '1.4rem',      // 80% of 1.75rem
        '8': '1.6rem',      // 80% of 2rem
        '9': '1.8rem',      // 80% of 2.25rem
        '10': '2rem',       // 80% of 2.5rem
        '11': '2.2rem',     // 80% of 2.75rem
        '12': '2.4rem',     // 80% of 3rem
        '14': '2.8rem',     // 80% of 3.5rem
        '16': '3.2rem',     // 80% of 4rem
        '20': '4rem',       // 80% of 5rem
        '24': '4.8rem',     // 80% of 6rem
        '28': '5.6rem',     // 80% of 7rem
        '32': '6.4rem',     // 80% of 8rem
        '36': '7.2rem',     // 80% of 9rem
        '40': '8rem',       // 80% of 10rem
        '44': '8.8rem',     // 80% of 11rem
        '48': '9.6rem',     // 80% of 12rem
        '52': '10.4rem',    // 80% of 13rem
        '56': '11.2rem',    // 80% of 14rem
        '60': '12rem',      // 80% of 15rem
        '64': '12.8rem',    // 80% of 16rem
        '72': '14.4rem',    // 80% of 18rem
        '80': '16rem',      // 80% of 20rem
        '96': '19.2rem',    // 80% of 24rem
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s infinite',
        'float': 'float 6s ease-in-out infinite',
        'typing': 'typing 3.5s steps(40, end), blink-caret 0.75s step-end infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        typing: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        'blink-caret': {
          'from, to': { 'border-color': 'transparent' },
          '50%': { 'border-color': 'orange' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
