import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'pulse-red-green': 'pulse-red-green 1s infinite alternate',
      },
      keyframes: {
        'pulse-red-green': {
          '0%': { backgroundColor: '#ffffff' },
          '100%': { backgroundColor: '#220af7fa' },
          '50%': { backgroundColor: '#ffffff' },
        }
      }
    },
  },
  plugins: [],
}

export default config