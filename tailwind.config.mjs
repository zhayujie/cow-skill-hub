/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4abe6e',
          light: '#5fcf7f',
          dark: '#3a9e5a',
        },
        surface: {
          DEFAULT: '#0a0a0a',
          secondary: '#111111',
          card: '#161616',
          'card-hover': '#1a1a1a',
        },
        border: {
          DEFAULT: '#222222',
          light: '#2a2a2a',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', 'monospace'],
      },
      maxWidth: {
        content: '1100px',
      },
    },
  },
  plugins: [],
};
