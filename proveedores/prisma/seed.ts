import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Administrador123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@proveedores.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@proveedores.com",
      passwordHash: adminPassword,
      isAdmin: true,
    },
  });

  await prisma.supplier.upsert({
    where: { id: "seed-ejemplo" },
    update: {},
    create: {
      id: "seed-ejemplo",
      legalName: "Proveedor de Ejemplo, C.A.",
      tradeName: "Ejemplo",
      city: "Caracas",
      state: "Distrito Capital",
      type: "DISTRIBUIDOR",
      category: "Empaques",
      status: "POTENCIAL",
      notes: "Registro de ejemplo creado por el seed — puedes borrarlo.",
      registeredById: admin.id,
    },
  });

  console.log("Datos de ejemplo creados:");
  console.log("  Administrador: admin@proveedores.com / Administrador123!");
  console.log("  Cambia esta contraseña antes de usar el sistema en producción.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
