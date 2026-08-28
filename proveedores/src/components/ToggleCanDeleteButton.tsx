"use client";

import { useActionState } from "react";
import { toggleCanDeleteSuppliers } from "@/lib/actions/admin";

const initialState = null;

export function ToggleCanDeleteButton({
  userId,
  canDeleteSuppliers,
}: {
  userId: string;
  canDeleteSuppliers: boolean;
}) {
  const [, formAction, pending] = useActionState(toggleCanDeleteSuppliers, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-ink-soft hover:text-ink underline disabled:opacity-50"
      >
        {canDeleteSuppliers ? "Quitar eliminación" : "Dar permiso de eliminar"}
      </button>
    </form>
  );
}
