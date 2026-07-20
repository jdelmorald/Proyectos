import { db, runInTransaction } from '../db';

export function generarSiguienteNumeroAsiento(empresaId: number): string {
  return runInTransaction((): string => {
    let fila = db
      .prepare(`SELECT * FROM correlativos_contables WHERE empresa_id = ? AND tipo = 'asiento'`)
      .get(empresaId) as
      | { prefijo: string; siguiente_numero: number; digitos: number; reinicio_anual: number; anio_actual: number | null }
      | undefined;

    if (!fila) {
      db.prepare(
        `INSERT INTO correlativos_contables (empresa_id, tipo, prefijo, siguiente_numero, digitos, reinicio_anual, anio_actual)
         VALUES (?, 'asiento', 'AS', 1, 6, 1, ?)`
      ).run(empresaId, new Date().getFullYear());
      fila = { prefijo: 'AS', siguiente_numero: 1, digitos: 6, reinicio_anual: 1, anio_actual: new Date().getFullYear() };
    }

    const anioActual = new Date().getFullYear();
    let siguienteNumero = fila.siguiente_numero;
    let anioBase = fila.anio_actual ?? anioActual;

    if (fila.reinicio_anual && fila.anio_actual !== anioActual) {
      siguienteNumero = 1;
      anioBase = anioActual;
    }

    const numeroFormateado = `${fila.prefijo}-${anioBase}-${String(siguienteNumero).padStart(fila.digitos, '0')}`;

    db.prepare(
      `UPDATE correlativos_contables SET siguiente_numero = ?, anio_actual = ? WHERE empresa_id = ? AND tipo = 'asiento'`
    ).run(siguienteNumero + 1, anioBase, empresaId);

    return numeroFormateado;
  });
}
