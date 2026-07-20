import { useEffect, useState } from 'react';
import { api } from '../api/client';

export interface ItemLinea {
  codigo?: string;
  descripcion: string;
  cantidad: number;
  unidad?: string;
  precioUnitario?: number;
  exento?: boolean;
}

interface Producto {
  id: number;
  codigo: string | null;
  descripcion: string;
  unidad: string;
  precio_unitario: number;
  exento_iva: number;
}

const LINEA_VACIA: ItemLinea = { descripcion: '', cantidad: 1, unidad: 'Unidad', precioUnitario: 0, exento: false };

export default function ItemsEditor({
  items,
  onChange,
  conPrecio,
  disabled,
}: {
  items: ItemLinea[];
  onChange: (items: ItemLinea[]) => void;
  conPrecio: boolean;
  disabled?: boolean;
}) {
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    api.get<Producto[]>('/productos').then(setProductos);
  }, []);

  function actualizar(i: number, cambios: Partial<ItemLinea>) {
    const nuevos = items.map((it, idx) => (idx === i ? { ...it, ...cambios } : it));
    onChange(nuevos);
  }

  function agregar() {
    onChange([...items, { ...LINEA_VACIA }]);
  }

  function eliminar(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function seleccionarProducto(i: number, productoId: number) {
    const p = productos.find((p) => p.id === productoId);
    if (!p) return;
    actualizar(i, {
      codigo: p.codigo ?? '',
      descripcion: p.descripcion,
      unidad: p.unidad,
      precioUnitario: p.precio_unitario,
      exento: !!p.exento_iva,
    });
  }

  const total = conPrecio
    ? items.reduce((acc, it) => acc + (Number(it.cantidad) || 0) * (Number(it.precioUnitario) || 0), 0)
    : 0;

  return (
    <div>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              {!disabled && <th className="px-2 py-2 w-48">Producto/servicio</th>}
              <th className="px-2 py-2">Descripción</th>
              <th className="px-2 py-2 w-24">Cant.</th>
              <th className="px-2 py-2 w-28">Unidad</th>
              {conPrecio && <th className="px-2 py-2 w-32">Precio Unit.</th>}
              {conPrecio && <th className="px-2 py-2 w-20">Exento</th>}
              {conPrecio && <th className="px-2 py-2 w-32">Subtotal</th>}
              {!disabled && <th className="px-2 py-2 w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t border-slate-100">
                {!disabled && (
                  <td className="px-2 py-1">
                    <select
                      onChange={(e) => e.target.value && seleccionarProducto(i, Number(e.target.value))}
                      className="w-full rounded border border-slate-300 px-1 py-1 text-xs"
                      value=""
                    >
                      <option value="">Elegir del catálogo...</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.descripcion}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
                <td className="px-2 py-1">
                  <input
                    disabled={disabled}
                    value={it.descripcion}
                    onChange={(e) => actualizar(i, { descripcion: e.target.value })}
                    className="w-full rounded border border-slate-300 px-2 py-1 disabled:bg-slate-50"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    disabled={disabled}
                    type="number"
                    value={it.cantidad}
                    onChange={(e) => actualizar(i, { cantidad: Number(e.target.value) })}
                    className="w-full rounded border border-slate-300 px-2 py-1 disabled:bg-slate-50"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    disabled={disabled}
                    value={it.unidad ?? ''}
                    onChange={(e) => actualizar(i, { unidad: e.target.value })}
                    className="w-full rounded border border-slate-300 px-2 py-1 disabled:bg-slate-50"
                  />
                </td>
                {conPrecio && (
                  <td className="px-2 py-1">
                    <input
                      disabled={disabled}
                      type="number"
                      step="0.01"
                      value={it.precioUnitario ?? 0}
                      onChange={(e) => actualizar(i, { precioUnitario: Number(e.target.value) })}
                      className="w-full rounded border border-slate-300 px-2 py-1 disabled:bg-slate-50"
                    />
                  </td>
                )}
                {conPrecio && (
                  <td className="px-2 py-1 text-center">
                    <input
                      disabled={disabled}
                      type="checkbox"
                      checked={!!it.exento}
                      onChange={(e) => actualizar(i, { exento: e.target.checked })}
                    />
                  </td>
                )}
                {conPrecio && (
                  <td className="px-2 py-1 text-right">
                    {((Number(it.cantidad) || 0) * (Number(it.precioUnitario) || 0)).toFixed(2)}
                  </td>
                )}
                {!disabled && (
                  <td className="px-2 py-1 text-center">
                    <button type="button" onClick={() => eliminar(i)} className="text-red-500 hover:text-red-700">
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-4 text-center text-slate-400">
                  Sin renglones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={agregar}
          className="mt-2 text-sm text-brand-700 hover:underline font-medium"
        >
          + Agregar renglón
        </button>
      )}
      {conPrecio && (
        <div className="text-right text-sm text-slate-600 mt-2">
          Suma de renglones: <span className="font-semibold">{total.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
