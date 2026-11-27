/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        'card-bg': 'var(--card-bg)',
        'input-bg': 'var(--input-bg)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        'on-accent': 'var(--on-accent)',
        accent2: 'var(--accent2)',
        good: 'var(--good)',
        warn: 'var(--warn)',
        bad: 'var(--bad)',
        info: 'var(--info)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Syne', 'sans-serif'],
        body: ['var(--font-body)', 'Manrope', 'sans-serif'],
        data: ['var(--font-data)', 'Manrope', 'monospace'],
      },
      borderRadius: {
        tpl: 'var(--radius)',
      },
      spacing: {
        rail: 'var(--rail)',
        pad: 'var(--pad)',
        gap: 'var(--gap)',
      },
      boxShadow: {
        card: 'var(--card-shadow)',
      },
      backdropBlur: {
        glass: '18px',
      }
    },
  },
  plugins: [],
};
