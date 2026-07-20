/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azul rey — color de identidad principal de Salud San Marcos.
        brand: {
          50: '#f4f6fe',
          100: '#e6eafd',
          200: '#cdd6fb',
          300: '#a3b5f7',
          400: '#7189f2',
          500: '#3f5aeb',
          600: '#2541d6',
          700: '#1c33b8',
          800: '#152694',
          900: '#0d1b6b',
        },
        // Turquesa — solo para detalles/acentos sutiles, nunca como color dominante.
        accent: {
          50: '#f2fcfc',
          100: '#e2f7f7',
          200: '#c4eeee',
          300: '#94e0e0',
          400: '#5cd1d1',
          500: '#1fb3b3',
          600: '#189191',
          700: '#137272',
          800: '#0f5757',
          900: '#0a3d3d',
        },
      },
    },
  },
  plugins: [],
};
