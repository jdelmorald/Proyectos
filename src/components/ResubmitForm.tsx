"use client";

import { useActionState } from "react";
import { resubmitVersion } from "@/lib/actions/submissions";

const initialState = null;

export function ResubmitForm({ submissionId }: { submissionId: string }) {
  const [state, formAction, pending] = useActionState(resubmitVersion, initialState);

  return (
    <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-3">
      <h2 className="text-sm font-semibold text-slate-900">
        Corrige y reenvía una nueva versión
      </h2>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="submissionId" value={submissionId} />
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">
            Comentario para el director (opcional)
          </label>
          <textarea
            id="note"
            name="note"
            rows={2}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="Se corrigieron las observaciones indicadas..."
          />
        </div>
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-slate-700 mb-1">
            Nueva versión del archivo
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
        {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Reenviando..." : "Reenviar para revisión"}
        </button>
      </form>
    </div>
  );
}
