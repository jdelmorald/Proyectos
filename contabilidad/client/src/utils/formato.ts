/**
 * Formato numérico venezolano: punto para miles, coma para decimales
 * (ej. 5.981.240,75). Se usa en toda la pantalla y en los PDF/Excel
 * exportados, para que ambos coincidan siempre.
 */
export function formatearMonto(valor: number | null | undefined, decimales = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '';
  return valor.toLocaleString('es-VE', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}
