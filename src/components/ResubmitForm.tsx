"use client";

import { useActionState } from "react";
import { resubmitVersion } from "@/lib/actions/submissions";

const initialState = null;

export function ResubmitForm({ submissionId }: { submissionId: string }) {
  const [state, formAction, pending] = useActionState(resubmitVersion, initialState);

  return (
    <div className="bg-surface border border-amber-200 rounded-2xl p-5 space-y-3">
      <h2 className="text-xs uppercase tracking-wide text-amber-800">
        Corrige y reenvía una nueva versión
      </h2>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="submissionId" value={submissionId} />
        <div>
          <label htmlFor="note" className="block text-xs uppercase tracking-wide text-ink-soft mb-1.5">
            Comentario (opcional)
          </label>
          <textarea
            id="note"
            name="note"
            rows={2}
            className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder="Se corrigieron las observaciones indicadas..."
          />
        </div>
        <div>
          <label htmlFor="file" className="block text-xs uppercase tracking-wide text-ink-soft mb-1.5">
            Nueva versión del archivo
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
          className="rounded-lg bg-ink text-white text-sm font-medium px-4 py-2.5 hover:bg-ink/90 disabled:opacity-50 transition-colors"
        >
          {pending ? "Reenviando..." : "Reenviar para revisión"}
        </button>
      </form>
    </div>
  );
}
