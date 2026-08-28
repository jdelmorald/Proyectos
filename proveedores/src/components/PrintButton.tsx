"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 rounded-[13px] bg-accent text-white text-sm font-bold px-4 py-2 shadow-[0_10px_20px_-8px_rgba(214,41,58,0.5)] hover:-translate-y-0.5 transition-all"
    >
      <Printer size={14} /> Imprimir / Guardar como PDF
    </button>
  );
}
