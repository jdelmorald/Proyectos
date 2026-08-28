import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Solo administradores: gestionan las cuentas del equipo. */
export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/suppliers");
  return user;
}

/** Administradores siempre pueden editar; el resto solo si se les otorgó el permiso. */
export function canEditSuppliers(user: { isAdmin: boolean; canEditSuppliers: boolean }) {
  return user.isAdmin || user.canEditSuppliers;
}

/** Administradores siempre pueden eliminar; el resto solo si se les otorgó el permiso. */
export function canDeleteSuppliers(user: { isAdmin: boolean; canDeleteSuppliers: boolean }) {
  return user.isAdmin || user.canDeleteSuppliers;
}
