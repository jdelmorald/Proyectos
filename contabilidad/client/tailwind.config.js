/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azul marino profundo — identidad neutral de la Dirección Financiera (Sumivensa, Indelderca, Salud San Marcos).
        brand: {
          50: '#f4f6fb',
          100: '#e6eaf3',
          200: '#ccd4e6',
          300: '#9fadc7',
          400: '#6b7da3',
          500: '#445775',
          600: '#334463',
          700: '#28354f',
          800: '#1c283d',
          900: '#101a2b',
        },
        // Verde esmeralda — acentos y estados positivos (saldos, cuadres, utilidad).
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Dorado — detalle decorativo en pantallas de bienvenida.
        gold: {
          300: '#e8d5a3',
          400: '#d9bd76',
          500: '#d4af5a',
          600: '#b8923e',
        },
        // Paletas de marca de cada empresa, para la pantalla de selección de empresa.
        sumivensa: {
          brand: { 500: '#6b6e78', 700: '#3f4147', 900: '#1a1b1e' },
          accent: { 500: '#d6293a', 600: '#b91c2c' },
        },
        indelderca: {
          brand: { 500: '#3a78c2', 700: '#1a4a8c', 900: '#0b1f3f' },
          accent: { 500: '#ce2b37', 600: '#b32029' },
          italia: '#009246',
        },
        saludsanmarcos: {
          brand: { 500: '#3f5aeb', 700: '#1c33b8', 900: '#0d1b6b' },
          accent: { 500: '#1fb3b3', 600: '#189191' },
        },
        uomo: {
          brand: { 500: '#7c5568', 700: '#4a1830', 900: '#2c0e1c' },
          accent: { 500: '#e2833c', 600: '#c96f2d' },
        },
      },
    },
  },
  plugins: [],
};
