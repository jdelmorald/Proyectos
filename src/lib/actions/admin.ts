"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/session";

type ActionResult = { error: string } | { success: true };

const ASSIGNABLE_ROLES = ["ADMINISTRADOR", "DIRECTOR", "GERENTE", "COLABORADOR"] as const;
const ROLES_REQUIRING_COMPANY = new Set(["GERENTE", "COLABORADOR"]);

export async function createCompany(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminAccess();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre de la empresa es obligatorio." };

  const exists = await prisma.company.findFirst({ where: { name } });
  if (exists) return { error: "Ya existe una empresa con ese nombre." };

  await prisma.company.create({ data: { name } });
  revalidatePath("/admin/empresas");
  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function createUser(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminAccess();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "COLABORADOR");
  const companyId = String(formData.get("companyId") ?? "");

  if (!name || !email || !password) {
    return { error: "Nombre, correo y contraseña son obligatorios." };
  }
  if (!ASSIGNABLE_ROLES.includes(role as (typeof ASSIGNABLE_ROLES)[number])) {
    return { error: "Rol inválido." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const needsCompany = ROLES_REQUIRING_COMPANY.has(role);
  if (needsCompany && !companyId) {
    return { error: "Este rol requiere asignar una empresa." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return { error: "Ya existe un usuario con ese correo." };

  if (needsCompany) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return { error: "Empresa inválida." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role as (typeof ASSIGNABLE_ROLES)[number],
      companyId: needsCompany ? companyId : null,
    },
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function toggleUserActive(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdminAccess();

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
