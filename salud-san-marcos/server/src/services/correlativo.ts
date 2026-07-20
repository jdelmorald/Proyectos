import { db, runInTransaction } from '../db';

export interface NumeroGenerado {
  numero: string;
  numeroControl: string | null;
}

/**
 * Genera de forma atómica el siguiente número (y número de control fiscal si aplica)
 * para un tipo de documento. Los correlativos nunca se reutilizan ni se decrementan,
 * incluso si el documento luego se anula (requisito de trazabilidad fiscal).
 */
export function generarSiguienteNumero(tipo: string, necesitaControl: boolean): NumeroGenerado {
  return runInTransaction((): NumeroGenerado => {
    const fila = db.prepare('SELECT * FROM correlativos WHERE tipo = ?').get(tipo) as
      | {
          tipo: string;
          prefijo: string;
          siguiente_numero: number;
          digitos: number;
          reinicio_anual: number;
          anio_actual: number | null;
          prefijo_control: string;
          siguiente_control: number;
          digitos_control: number;
        }
      | undefined;

    if (!fila) {
      throw new Error(`No existe configuración de correlativo para el tipo de documento "${tipo}"`);
    }

    const anioActual = new Date().getFullYear();
    let siguienteNumero = fila.siguiente_numero;
    let anioBase = fila.anio_actual ?? anioActual;

    if (fila.reinicio_anual && fila.anio_actual !== anioActual) {
      siguienteNumero = 1;
      anioBase = anioActual;
    }

    const numeroFormateado = `${fila.prefijo}-${anioBase}-${String(siguienteNumero).padStart(fila.digitos, '0')}`;

    let numeroControl: string | null = null;
    let siguienteControl = fila.siguiente_control;
    if (necesitaControl) {
      numeroControl = `${fila.prefijo_control}-${String(siguienteControl).padStart(fila.digitos_control, '0')}`;
      siguienteControl += 1;
    }

    db.prepare(
      `UPDATE correlativos SET siguiente_numero = ?, anio_actual = ?, siguiente_control = ? WHERE tipo = ?`
    ).run(siguienteNumero + 1, anioBase, siguienteControl, tipo);

    return { numero: numeroFormateado, numeroControl };
  });
}
