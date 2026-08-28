"use client";

import { useCallback, useState } from "react";
import { PHOTO_CATEGORY_LABELS } from "@/lib/suppliers";

type StagedPhoto = { id: string; file: File; category: string; previewUrl: string };

const labelClass = "block text-[.64rem] font-bold uppercase tracking-[.1em] text-ink-soft mb-2";

/**
 * Deja agregar varias fotos a la vez e identificar qué es cada una
 * (fachada, producto, tarjeta...) individualmente, en vez de aplicar
 * una sola categoría a todo el lote.
 */
export function PhotoUploadField() {
  const [staged, setStaged] = useState<StagedPhoto[]>([]);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setStaged((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        category: "LOCAL",
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    e.target.value = "";
  }

  function setCategory(id: string, category: string) {
    setStaged((prev) => prev.map((p) => (p.id === id ? { ...p, category } : p)));
  }

  function remove(id: string) {
    setStaged((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="photos-picker" className={labelClass}>
          Agregar fotos
        </label>
        <input
          id="photos-picker"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={handleFilesSelected}
          className="w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:text-accent file:px-3.5 file:py-2.5 file:text-sm file:font-medium hover:file:bg-accent-soft/70"
        />
        <p className="text-xs text-ink-soft/70 mt-1.5">
          Puedes seleccionar varias fotos a la vez y elegir qué es cada una: fachada, producto, tarjeta, etc.
        </p>
      </div>

      {staged.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {staged.map((p) => (
            <div key={p.id} className="rounded-xl overflow-hidden border border-line bg-paper">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt={p.file.name} className="w-full aspect-square object-cover" />
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  title="Quitar"
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink/70 text-white text-xs leading-none hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  ×
                </button>
                <HiddenFileInput file={p.file} />
                <input type="hidden" name="photoCategories" value={p.category} />
              </div>
              <select
                value={p.category}
                onChange={(e) => setCategory(p.id, e.target.value)}
                data-testid="photo-category-select"
                className="w-full text-xs px-2 py-1.5 bg-transparent border-t border-line focus:outline-none"
              >
                {Object.entries(PHOTO_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Vuelca un File ya elegido en un input[type=file] oculto para que viaje con el <form>. */
function HiddenFileInput({ file }: { file: File }) {
  const ref = useCallback(
    (el: HTMLInputElement | null) => {
      if (!el) return;
      const dt = new DataTransfer();
      dt.items.add(file);
      el.files = dt.files;
    },
    [file]
  );
  return <input ref={ref} type="file" name="photos" className="hidden" readOnly />;
}
