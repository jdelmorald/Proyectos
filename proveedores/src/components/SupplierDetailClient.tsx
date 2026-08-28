"use client";

import { useState } from "react";
import { Pencil, CheckCircle2 } from "lucide-react";
import { SupplierDetailView } from "./SupplierDetailView";
import { SupplierForm, type SupplierFormValues } from "./SupplierForm";

export function SupplierDetailClient({
  supplier,
  canEdit,
}: {
  supplier: SupplierFormValues;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  if (editing) {
    return (
      <SupplierForm
        supplier={supplier}
        onSaved={() => {
          setEditing(false);
          setJustSaved(true);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {justSaved && (
        <div className="flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <CheckCircle2 size={16} /> Cambios guardados con éxito.
        </div>
      )}
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setJustSaved(false);
              setEditing(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-[13px] bg-accent text-white text-sm font-bold px-4 py-2 shadow-[0_10px_20px_-8px_rgba(214,41,58,0.5)] hover:-translate-y-0.5 transition-all"
          >
            <Pencil size={14} /> Editar datos
          </button>
        </div>
      )}
      <SupplierDetailView supplier={supplier} />
    </div>
  );
}
