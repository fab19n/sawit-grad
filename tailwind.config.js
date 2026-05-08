/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark:    '#2B2200',
        mid:     '#4A3A00',
        lite:    '#6B5200',
        accent:  '#C49A0A',
        gold:    '#F0D96A',
        surface: '#FFFEF8',
        warm:    '#FBF7EC',
        border:  '#E8D48A',
        muted:   '#6B5C2E',
      },
    },
  },
  plugins: [],
};