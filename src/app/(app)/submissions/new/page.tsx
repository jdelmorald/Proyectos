"use client";

import { useActionState } from "react";
import { createSubmission } from "@/lib/actions/submissions";
import { DOCUMENT_TYPE_LABELS } from "@/lib/validation";

const initialState = null;

export default function NewSubmissionPage() {
  const [state, formAction, pending] = useActionState(createSubmission, initialState);

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Nuevo documento</h1>
      <p className="text-sm text-slate-500 mb-6">
        Sube el archivo para revisión del director general.
      </p>

      <form action={formAction} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
            Título
          </label>
          <input
            id="title"
            name="title"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="Presupuesto de mercadeo Q3"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">
            Tipo de documento
          </label>
          <select
            id="type"
            name="type"
            defaultValue="PRESUPUESTO"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
            Descripción / notas para el revisor
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="Contexto breve del documento"
          />
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-slate-700 mb-1">
            Archivo (Word, Excel, PowerPoint, PDF, imagen — máx. 25 MB)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            required
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
            className="w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
          />
        </div>

        {state && "error" in state && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-slate-900 text-white text-sm font-medium py-2 hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Enviando..." : "Enviar para revisión"}
        </button>
      </form>
    </div>
  );
}
