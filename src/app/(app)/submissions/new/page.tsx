"use client";

import { useActionState } from "react";
import { createSubmission } from "@/lib/actions/submissions";
import { DOCUMENT_TYPE_LABELS } from "@/lib/validation";

const initialState = null;

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent";
const labelClass = "block text-xs uppercase tracking-wide text-ink-soft mb-1.5";

export default function NewSubmissionPage() {
  const [state, formAction, pending] = useActionState(createSubmission, initialState);

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl text-ink mb-1">Nuevo documento</h1>
      <p className="text-sm text-ink-soft mb-8">
        Sube el archivo para revisión de tu gerente y Dirección General.
      </p>

      <form
        action={formAction}
        className="bg-surface border border-line rounded-2xl p-6 space-y-5"
      >
        <div>
          <label htmlFor="title" className={labelClass}>
            Título
          </label>
          <input
            id="title"
            name="title"
            required
            className={inputClass}
            placeholder="Presupuesto de mercadeo Q3"
          />
        </div>

        <div>
          <label htmlFor="type" className={labelClass}>
            Tipo de documento
          </label>
          <select id="type" name="type" defaultValue="PRESUPUESTO" className={inputClass}>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Descripción / notas para el revisor
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className={inputClass}
            placeholder="Contexto breve del documento"
          />
        </div>

        <div>
          <label htmlFor="file" className={labelClass}>
            Archivo (Word, Excel, PowerPoint, PDF, imagen — máx. 25 MB)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            required
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
            className="w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:text-accent file:px-3.5 file:py-2 file:text-sm file:font-medium hover:file:bg-accent-soft/70"
          />
        </div>

        {state && "error" in state && <p className="text-sm text-red-700">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-ink text-white text-sm font-medium py-2.5 hover:bg-ink/90 disabled:opacity-50 transition-colors"
        >
          {pending ? "Enviando..." : "Enviar para revisión"}
        </button>
      </form>
    </div>
  );
}
