"use client";

import { useActionState } from "react";
import { toggleUserActive } from "@/lib/actions/admin";

const initialState = null;

export function ToggleUserButton({ userId, active }: { userId: string; active: boolean }) {
  const [, formAction, pending] = useActionState(toggleUserActive, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-ink-soft hover:text-ink underline disabled:opacity-50"
      >
        {active ? "Desactivar" : "Activar"}
      </button>
    </form>
  );
}
