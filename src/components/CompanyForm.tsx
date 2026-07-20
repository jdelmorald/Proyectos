"use client";

import { useActionState } from "react";
import { createCompany } from "@/lib/actions/admin";

const initialState = null;

export function CompanyForm() {
  const [state, formAction, pending] = useActionState(createCompany, initialState);

  return (
    <form action={formAction} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            Nueva empresa
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="Nombre de la empresa"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Creando..." : "Agregar"}
        </button>
      </div>
      {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
