"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireDirector } from "@/lib/session";

type ActionResult = { error: string } | { success: true };

export async function createCompany(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireDirector();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre de la empresa es obligatorio." };

  const exists = await prisma.company.findFirst({ where: { name } });
  if (exists) return { error: "Ya existe una empresa con ese nombre." };

  await prisma.company.create({ data: { name } });
  revalidatePath("/admin/empresas");
  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function createColaborador(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireDirector();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const companyId = String(formData.get("companyId") ?? "");

  if (!name || !email || !password || !companyId) {
    return { error: "Todos los campos son obligatorios." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return { error: "Ya existe un usuario con ese correo." };

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { error: "Empresa inválida." };

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "COLABORADOR",
      companyId,
    },
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function toggleUserActive(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const director = await requireDirector();

  const userId = String(formData.get("userId") ?? "");
  if (userId === director.id) {
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
