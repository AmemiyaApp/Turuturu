module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        comic: ['"Comic Neue"', 'sans-serif'],
      },
      colors: {
        foreground: '#1a202c',
        'muted-foreground': '#4a5568',
        background: '#ffffff',
        primary: { DEFAULT: '#3b82f6', foreground: '#ffffff' },
        secondary: { DEFAULT: '#ed64a6', foreground: '#ffffff' },
        accent: '#9f7aea',
        success: '#48bb78',
        'gradient-primary': 'linear-gradient(to right, #3b82f6, #9f7aea)',
        'gradient-secondary': 'linear-gradient(to right, #ed64a6, #c7f9ff)',
        'gradient-hero': 'linear-gradient(to bottom right, #e6fffa, #f9e2af)',
        'gradient-soft': 'linear-gradient(to bottom, #e6fffa, #f9e2af)',
      },
      boxShadow: {
        soft: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        medium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        strong: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        colored: '0 0 15px rgba(59, 130, 246, 0.5)',
      },
      transitionProperty: {
        smooth: 'all 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
};