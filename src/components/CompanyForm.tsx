"use client";

import { useActionState } from "react";
import { createCompany } from "@/lib/actions/admin";

const initialState = null;

export function CompanyForm() {
  const [state, formAction, pending] = useActionState(createCompany, initialState);

  return (
    <form action={formAction} className="bg-surface border border-line rounded-2xl p-5 space-y-3">
      <h2 className="text-xs uppercase tracking-wide text-ink-soft">Nueva empresa</h2>
      <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder="Nombre de la empresa"
          />
        </div>
        <div>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="text-xs text-ink-soft file:mr-2 file:rounded-lg file:border-0 file:bg-accent-soft file:text-accent file:px-3 file:py-2 file:text-xs file:font-medium hover:file:bg-accent-soft/70"
          />
        </div>
      </div>
      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ink text-white text-sm font-medium px-4 py-2 hover:bg-ink/90 disabled:opacity-50 transition-colors"
        >
          {pending ? "Creando..." : "Agregar empresa"}
        </button>
      </div>
      {state && "error" in state && <p className="text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
