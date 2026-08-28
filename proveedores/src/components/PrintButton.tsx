"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";

/** navigator.standalone es específico de iOS Safari; no está en el tipo estándar. */
type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export function PrintButton() {
  // Empieza en false (igual que en el servidor) para no romper la hidratación;
  // se corrige justo después de montar, cuando ya podemos leer el display-mode real.
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as NavigatorWithStandalone).standalone === true;
    if (isStandalone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- detección de display-mode: solo puede leerse en el cliente, tras montar.
      setStandalone(true);
    }
  }, []);

  if (standalone) {
    // Dentro de la app instalada no hay diálogo de impresión del sistema disponible.
    return (
      <p className="no-print text-xs text-ink-soft max-w-[220px] text-right">
        Para imprimir desde la app instalada, usa &quot;Descargar PDF&quot; y luego imprime ese archivo.
      </p>
    );
  }

  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 rounded-[13px] bg-accent text-white text-sm font-bold px-4 py-2 shadow-[0_10px_20px_-8px_rgba(214,41,58,0.5)] hover:-translate-y-0.5 transition-all"
    >
      <Printer size={14} /> Imprimir / Guardar como PDF
    </button>
  );
}
