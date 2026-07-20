import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const COMPANIES = [
  { id: "seed-veeme", name: "Veeme", logoPath: "/logos/veeme.png" },
  { id: "seed-labcenter", name: "Labcenter", logoPath: "/logos/labcenter.jpg" },
  { id: "seed-madre-maria", name: "Madre María de San José", logoPath: "/logos/madre-maria.jpg" },
  { id: "seed-totem", name: "Totem", logoPath: "/logos/totem.jpg" },
  { id: "seed-vemolca", name: "Vemolca", logoPath: "/logos/vemolca.jpg" },
  { id: "seed-kacrea", name: "Kacrea", logoPath: "/logos/kacrea.png" },
];

const GERENTES = [
  { name: "Ana Beltrán", email: "gerente.veeme@grupo.com" },
  { name: "Jorge Salcedo", email: "gerente.labcenter@grupo.com" },
  { name: "Patricia Núñez", email: "gerente.madremaria@grupo.com" },
  { name: "Rodrigo Espinoza", email: "gerente.totem@grupo.com" },
  { name: "Valentina Rojas", email: "gerente.vemolca@grupo.com" },
  { name: "Diego Castañeda", email: "gerente.kacrea@grupo.com" },
];

const COLABORADORES = [
  { name: "María Fernández", email: "colaborador.veeme@grupo.com" },
  { name: "Carlos Ramírez", email: "colaborador.labcenter@grupo.com" },
  { name: "Sofía Peralta", email: "colaborador.madremaria@grupo.com" },
  { name: "Andrés Molina", email: "colaborador.totem@grupo.com" },
  { name: "Camila Torres", email: "colaborador.vemolca@grupo.com" },
  { name: "Fernando Aguirre", email: "colaborador.kacrea@grupo.com" },
];

async function main() {
  const administradorPassword = await bcrypt.hash("Administrador123!", 10);
  const directorPassword = await bcrypt.hash("Director123!", 10);
  const gerentePassword = await bcrypt.hash("Gerente123!", 10);
  const colaboradorPassword = await bcrypt.hash("Colaborador123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@grupo.com" },
    update: {},
    create: {
      name: "Administrador de Plataforma",
      email: "admin@grupo.com",
      passwordHash: administradorPassword,
      role: "ADMINISTRADOR",
    },
  });

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

  const companies = await Promise.all(
    COMPANIES.map((c) =>
      prisma.company.upsert({
        where: { id: c.id },
        update: { logoPath: c.logoPath },
        create: c,
      })
    )
  );

  for (let i = 0; i < companies.length; i++) {
    await prisma.user.upsert({
      where: { email: GERENTES[i].email },
      update: {},
      create: {
        name: GERENTES[i].name,
        email: GERENTES[i].email,
        passwordHash: gerentePassword,
        role: "GERENTE",
        companyId: companies[i].id,
      },
    });

    await prisma.user.upsert({
      where: { email: COLABORADORES[i].email },
      update: {},
      create: {
        name: COLABORADORES[i].name,
        email: COLABORADORES[i].email,
        passwordHash: colaboradorPassword,
        role: "COLABORADOR",
        companyId: companies[i].id,
      },
    });
  }

  console.log("Datos de ejemplo creados:");
  console.log("  Administrador: admin@grupo.com / Administrador123!");
  console.log("  Director:      director@grupo.com / Director123!");
  console.log("  Por cada empresa (Gerente123! / Colaborador123!):");
  COMPANIES.forEach((c, i) => {
    console.log(`    ${c.name}: ${GERENTES[i].email} (gerente), ${COLABORADORES[i].email} (colaborador)`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
