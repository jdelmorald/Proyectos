import { ItemLinea } from '../types';

export interface Totales {
  subtotal: number;
  baseImponible: number;
  montoExento: number;
  ivaPorcentaje: number;
  ivaMonto: number;
  total: number;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

export function calcularTotales(items: ItemLinea[], ivaPorcentaje: number): Totales {
  let baseImponible = 0;
  let montoExento = 0;

  for (const item of items) {
    const cantidad = Number(item.cantidad) || 0;
    const precio = Number(item.precioUnitario) || 0;
    const subtotalLinea = cantidad * precio;
    if (item.exento) {
      montoExento += subtotalLinea;
    } else {
      baseImponible += subtotalLinea;
    }
  }

  const ivaMonto = baseImponible * (ivaPorcentaje / 100);
  const subtotal = baseImponible + montoExento;
  const total = subtotal + ivaMonto;

  return {
    subtotal: redondear(subtotal),
    baseImponible: redondear(baseImponible),
    montoExento: redondear(montoExento),
    ivaPorcentaje,
    ivaMonto: redondear(ivaMonto),
    total: redondear(total),
  };
}
