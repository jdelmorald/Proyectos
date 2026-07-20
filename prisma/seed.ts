import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const directorPassword = await bcrypt.hash("Director123!", 10);
  const colaboradorPassword = await bcrypt.hash("Colaborador123!", 10);

  await prisma.user.upsert({
    where: { email: "director@grupo.com" },
    update: {},
    create: {
      name: "Director General",
      email: "director@grupo.com",
      passwordHash: directorPassword,
      role: "DIRECTOR",
    },
  });

  const empresaA = await prisma.company.upsert({
    where: { id: "seed-empresa-a" },
    update: {},
    create: { id: "seed-empresa-a", name: "Constructora Andina" },
  });

  const empresaB = await prisma.company.upsert({
    where: { id: "seed-empresa-b" },
    update: {},
    create: { id: "seed-empresa-b", name: "Logística del Valle" },
  });

  await prisma.user.upsert({
    where: { email: "colaborador@grupo.com" },
    update: {},
    create: {
      name: "María Fernández",
      email: "colaborador@grupo.com",
      passwordHash: colaboradorPassword,
      role: "COLABORADOR",
      companyId: empresaA.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "colaborador2@grupo.com" },
    update: {},
    create: {
      name: "Carlos Ramírez",
      email: "colaborador2@grupo.com",
      passwordHash: colaboradorPassword,
      role: "COLABORADOR",
      companyId: empresaB.id,
    },
  });

  console.log("Datos de ejemplo creados:");
  console.log("  Director:      director@grupo.com / Director123!");
  console.log("  Colaborador 1: colaborador@grupo.com / Colaborador123! (Constructora Andina)");
  console.log("  Colaborador 2: colaborador2@grupo.com / Colaborador123! (Logística del Valle)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
