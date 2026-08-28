"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteSupplier } from "@/lib/actions/suppliers";

export function DeleteSupplierButton({ supplierId, legalName }: { supplierId: string; legalName: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-800 transition-colors"
      >
        <Trash2 size={14} /> Eliminar proveedor
      </button>
    );
  }

  return (
    <div className="glass-card rounded-[16px] p-4 border-red-200 space-y-3">
      <p className="text-sm text-ink">
        ¿Seguro que quieres eliminar <strong>{legalName}</strong>? Esta acción borra también sus fotos
        y no se puede deshacer.
      </p>
      <div className="flex items-center gap-3">
        <form action={deleteSupplier}>
          <input type="hidden" name="id" value={supplierId} />
          <button
            type="submit"
            className="rounded-[11px] bg-red-700 text-white text-sm font-bold px-4 py-2 hover:bg-red-800 transition-colors"
          >
            Sí, eliminar definitivamente
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sm font-medium text-ink-soft hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
