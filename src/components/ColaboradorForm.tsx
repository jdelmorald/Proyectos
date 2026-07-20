"use client";

import { useActionState } from "react";
import { createColaborador } from "@/lib/actions/admin";

const initialState = null;

export function ColaboradorForm({ companies }: { companies: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createColaborador, initialState);

  return (
    <form action={formAction} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <h2 className="text-sm font-semibold text-slate-900">Invitar colaborador</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Contraseña temporal
          </label>
          <input
            id="password"
            name="password"
            type="text"
            required
            minLength={8}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label htmlFor="companyId" className="block text-sm font-medium text-slate-700 mb-1">
            Empresa
          </label>
          <select
            id="companyId"
            name="companyId"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Creando..." : "Crear cuenta"}
      </button>
    </form>
  );
}
