import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const COMPANIES = [
  { id: "seed-empresa-a", name: "Constructora Andina" },
  { id: "seed-empresa-b", name: "Logística del Valle" },
  { id: "seed-empresa-c", name: "Agroindustrial del Norte" },
  { id: "seed-empresa-d", name: "Textiles del Pacífico" },
  { id: "seed-empresa-e", name: "Inversiones Río Grande" },
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
      prisma.company.upsert({ where: { id: c.id }, update: {}, create: c })
    )
  );

  const gerentes = [
    { name: "Ana Beltrán", email: "gerente.andina@grupo.com" },
    { name: "Jorge Salcedo", email: "gerente.valle@grupo.com" },
    { name: "Patricia Núñez", email: "gerente.norte@grupo.com" },
    { name: "Rodrigo Espinoza", email: "gerente.pacifico@grupo.com" },
    { name: "Valentina Rojas", email: "gerente.riogrande@grupo.com" },
  ];

  for (let i = 0; i < companies.length; i++) {
    await prisma.user.upsert({
      where: { email: gerentes[i].email },
      update: {},
      create: {
        name: gerentes[i].name,
        email: gerentes[i].email,
        passwordHash: gerentePassword,
        role: "GERENTE",
        companyId: companies[i].id,
      },
    });
  }

  await prisma.user.upsert({
    where: { email: "colaborador@grupo.com" },
    update: {},
    create: {
      name: "María Fernández",
      email: "colaborador@grupo.com",
      passwordHash: colaboradorPassword,
      role: "COLABORADOR",
      companyId: companies[0].id,
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
      companyId: companies[1].id,
    },
  });

  console.log("Datos de ejemplo creados:");
  console.log("  Administrador: admin@grupo.com / Administrador123!");
  console.log("  Director:      director@grupo.com / Director123!");
  console.log("  Gerentes (una por empresa, contraseña Gerente123!):");
  gerentes.forEach((g, i) => console.log(`    ${g.email} (${COMPANIES[i].name})`));
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
