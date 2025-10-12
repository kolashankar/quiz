import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#667eea',
        'primary-dark': '#5a67d8',
        secondary: '#48bb78',
        'secondary-dark': '#38a169',
        danger: '#f56565',
        'danger-dark': '#e53e3e',
        warning: '#ed8936',
        info: '#4299e1',
        success: '#48bb78',
        
        background: '#f7fafc',
        surface: '#ffffff',
        
        easy: '#48bb78',
        medium: '#ed8936',
        hard: '#f56565',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
export default config
