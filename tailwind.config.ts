import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#105090',
          dark: '#0d3d6f',
        },
        accent: '#1976d2',
        background: '#ffffff',
        card: '#ffffff',
        'card-foreground': '#1f2937',
      },
      fontFamily: {
        sans: ['var(--font-khmer)', 'Noto Sans Khmer', 'Khmer OS', 'Hanuman', 'sans-serif'],
        khmer: ['var(--font-khmer)', 'Noto Sans Khmer', 'Khmer OS', 'Hanuman', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

