"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type ActionResult = { error: string } | { success: true };

export async function createUser(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const isAdmin = formData.get("isAdmin") === "on";
  const canEditSuppliers = formData.get("canEditSuppliers") === "on";
  const canDeleteSuppliers = formData.get("canDeleteSuppliers") === "on";

  if (!name || !email || !password) {
    return { error: "Nombre, correo y contraseña son obligatorios." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return { error: "Ya existe un usuario con ese correo." };

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, passwordHash, isAdmin, canEditSuppliers, canDeleteSuppliers },
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function toggleCanEditSuppliers(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuario no encontrado." };

  await prisma.user.update({
    where: { id: userId },
    data: { canEditSuppliers: !user.canEditSuppliers },
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function toggleCanDeleteSuppliers(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuario no encontrado." };

  await prisma.user.update({
    where: { id: userId },
    data: { canDeleteSuppliers: !user.canDeleteSuppliers },
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function toggleUserActive(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  if (userId === admin.id) {
    return { error: "No puedes desactivar tu propia cuenta." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuario no encontrado." };

  await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}
