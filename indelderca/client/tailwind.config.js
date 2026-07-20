/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azul marino — color de identidad principal de Indelderca.
        brand: {
          50: '#f2f7fc',
          100: '#e2eef9',
          200: '#c6dcf1',
          300: '#9dbfe6',
          400: '#6b9bd6',
          500: '#3a78c2',
          600: '#2360ab',
          700: '#1a4a8c',
          800: '#123566',
          900: '#0b1f3f',
        },
        // Rojo de la bandera italiana — solo para detalles/acentos sutiles.
        accent: {
          50: '#fdf2f3',
          100: '#fce4e6',
          200: '#f9c8cc',
          300: '#f29aa1',
          400: '#e8636f',
          500: '#ce2b37',
          600: '#b32029',
          700: '#8f1922',
          800: '#75151d',
          900: '#601219',
        },
        // Verde de la bandera italiana — usado junto al rojo en el detalle tricolor.
        italia: '#009246',
      },
    },
  },
  plugins: [],
};
