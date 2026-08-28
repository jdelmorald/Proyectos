"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function DownloadPdfButton({ targetId, filename }: { targetId: string; filename: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    const el = document.getElementById(targetId);
    if (!el) return;

    setLoading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(el, {
        backgroundColor: "#fbf7f3",
        scale: 1.5,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      // Una sola página del tamaño exacto del contenido, para que el PDF
      // sea idéntico a lo que se ve en pantalla (no una hoja recortada).
      const pdf = new jsPDF({
        unit: "px",
        format: [canvas.width, canvas.height],
        compress: true,
      });
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
      pdf.save(filename);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-accent transition-colors disabled:opacity-50"
    >
      <Download size={14} /> {loading ? "Generando PDF..." : "Descargar PDF"}
    </button>
  );
}
