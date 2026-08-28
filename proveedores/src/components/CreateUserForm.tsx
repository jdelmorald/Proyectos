"use client";

import { useActionState } from "react";
import { createUser } from "@/lib/actions/admin";

const initialState = null;

const inputClass = "field-input w-full rounded-[13px] px-3.5 py-2.5 text-sm";
const labelClass = "block text-[.64rem] font-bold uppercase tracking-[.1em] text-ink-soft mb-2";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, initialState);

  return (
    <form action={formAction} className="glass-card rounded-[20px] p-5 space-y-3">
      <h2 className="text-[.64rem] font-bold uppercase tracking-[.1em] text-ink-soft">Crear cuenta</h2>
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
        <div className="col-span-2">
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
      </div>
      <label className="flex items-center gap-2.5 text-sm text-ink py-1">
        <input type="checkbox" name="isAdmin" className="w-4 h-4 rounded border-line accent-accent" />
        Puede administrar usuarios
      </label>
      <label className="flex items-center gap-2.5 text-sm text-ink py-1">
        <input
          type="checkbox"
          name="canEditSuppliers"
          className="w-4 h-4 rounded border-line accent-accent"
        />
        Puede editar fichas de proveedores ya registradas
      </label>
      <label className="flex items-center gap-2.5 text-sm text-ink py-1">
        <input
          type="checkbox"
          name="canDeleteSuppliers"
          className="w-4 h-4 rounded border-line accent-accent"
        />
        Puede eliminar proveedores
      </label>
      {state && "error" in state && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-[13px] bg-accent text-white text-sm font-bold px-4 py-2 shadow-[0_10px_20px_-8px_rgba(214,41,58,0.5)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all"
      >
        {pending ? "Creando..." : "Crear cuenta"}
      </button>
    </form>
  );
}
