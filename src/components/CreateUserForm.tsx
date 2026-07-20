"use client";

import { useActionState, useState } from "react";
import { createUser } from "@/lib/actions/admin";
import { ROLE_LABELS } from "@/lib/roles";

const initialState = null;

const ASSIGNABLE_ROLES = ["COLABORADOR", "GERENTE", "DIRECTOR", "ADMINISTRADOR"] as const;
const ROLES_REQUIRING_COMPANY = new Set(["COLABORADOR", "GERENTE"]);

export function CreateUserForm({ companies }: { companies: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createUser, initialState);
  const [role, setRole] = useState<string>("COLABORADOR");
  const needsCompany = ROLES_REQUIRING_COMPANY.has(role);

  return (
    <form action={formAction} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <h2 className="text-sm font-semibold text-slate-900">Crear cuenta</h2>
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
          <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
            Rol
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        {needsCompany && (
          <div className="col-span-2">
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
        )}
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
