"use client";

import { useActionState, useState } from "react";
import { createUser } from "@/lib/actions/admin";
import { ROLE_LABELS } from "@/lib/roles";

const initialState = null;

const ASSIGNABLE_ROLES = ["COLABORADOR", "GERENTE", "DIRECTOR", "ADMINISTRADOR"] as const;
const ROLES_REQUIRING_COMPANY = new Set(["COLABORADOR", "GERENTE"]);

const inputClass =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent";
const labelClass = "block text-xs uppercase tracking-wide text-ink-soft mb-1.5";

export function CreateUserForm({ companies }: { companies: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createUser, initialState);
  const [role, setRole] = useState<string>("COLABORADOR");
  const needsCompany = ROLES_REQUIRING_COMPANY.has(role);

  return (
    <form action={formAction} className="bg-surface border border-line rounded-2xl p-5 space-y-3">
      <h2 className="text-xs uppercase tracking-wide text-ink-soft">Crear cuenta</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="name" className={labelClass}>
            Nombre
          </label>
          <input id="name" name="name" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Correo
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>
            Contraseña temporal
          </label>
          <input
            id="password"
            name="password"
            type="text"
            required
            minLength={8}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="role" className={labelClass}>
            Rol
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
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
            <label htmlFor="companyId" className={labelClass}>
              Empresa
            </label>
            <select id="companyId" name="companyId" required className={inputClass}>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {state && "error" in state && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-ink text-white text-sm font-medium px-4 py-2 hover:bg-ink/90 disabled:opacity-50 transition-colors"
      >
        {pending ? "Creando..." : "Crear cuenta"}
      </button>
    </form>
  );
}
