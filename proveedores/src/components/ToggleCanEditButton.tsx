"use client";

import { useActionState } from "react";
import { toggleCanEditSuppliers } from "@/lib/actions/admin";

const initialState = null;

export function ToggleCanEditButton({
  userId,
  canEditSuppliers,
}: {
  userId: string;
  canEditSuppliers: boolean;
}) {
  const [, formAction, pending] = useActionState(toggleCanEditSuppliers, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-ink-soft hover:text-ink underline disabled:opacity-50"
      >
        {canEditSuppliers ? "Quitar edición" : "Dar permiso de edición"}
      </button>
    </form>
  );
}
