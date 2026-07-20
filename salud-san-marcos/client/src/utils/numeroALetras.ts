const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const DECENAS = [
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
];
const DECENAS_DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
];

function convertirGrupo(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  let resultado = '';
  const centena = Math.floor(n / 100);
  const resto = n % 100;

  if (centena > 0) resultado += CENTENAS[centena] + ' ';

  if (resto >= 10 && resto < 20) {
    resultado += DECENAS[resto - 10];
  } else {
    const decena = Math.floor(resto / 10);
    const unidad = resto % 10;
    if (decena >= 2) {
      resultado += DECENAS_DECENAS[decena];
      if (unidad > 0) resultado += ' Y ' + UNIDADES[unidad];
    } else if (unidad > 0) {
      resultado += UNIDADES[unidad];
    }
  }

  return resultado.trim();
}

function convertirEntero(n: number): string {
  if (n === 0) return 'CERO';
  if (n === 1) return 'UNO';

  let resto = n;
  const partes: string[] = [];

  const millones = Math.floor(resto / 1_000_000);
  resto %= 1_000_000;
  const miles = Math.floor(resto / 1000);
  resto %= 1000;
  const unidades = resto;

  if (millones > 0) {
    partes.push(millones === 1 ? 'UN MILLÓN' : `${convertirGrupo(millones)} MILLONES`);
  }
  if (miles > 0) {
    partes.push(miles === 1 ? 'MIL' : `${convertirGrupo(miles)} MIL`);
  }
  if (unidades > 0) {
    partes.push(convertirGrupo(unidades));
  }

  return partes.join(' ').trim();
}

/**
 * Convierte un monto numérico a su representación en letras, formato
 * usado habitualmente en recibos y comprobantes de pago venezolanos.
 * Ej: 1234.56 -> "UN MIL DOSCIENTOS TREINTA Y CUATRO CON 56/100"
 */
export function numeroALetras(monto: number, moneda = 'BOLÍVARES'): string {
  const negativo = monto < 0;
  const valorAbsoluto = Math.abs(monto);
  const entero = Math.floor(valorAbsoluto);
  const centavos = Math.round((valorAbsoluto - entero) * 100);

  const letrasEntero = convertirEntero(entero);
  const texto = `${negativo ? 'MENOS ' : ''}${letrasEntero} CON ${String(centavos).padStart(2, '0')}/100 ${moneda}`;
  return texto.trim();
}
