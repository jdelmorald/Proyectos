-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('FABRICANTE', 'DISTRIBUIDOR', 'MAYORISTA', 'MINORISTA', 'SERVICIOS', 'IMPORTADOR', 'OTRO');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('POTENCIAL', 'EN_EVALUACION', 'APROBADO', 'ACTIVO', 'RECHAZADO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('LOCAL', 'PRODUCTO', 'TARJETA', 'DOCUMENTO', 'OTRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "taxId" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Venezuela',
    "address" TEXT,
    "contactName" TEXT,
    "contactRole" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "type" "SupplierType" NOT NULL DEFAULT 'OTRO',
    "category" TEXT,
    "products" TEXT,
    "status" "SupplierStatus" NOT NULL DEFAULT 'POTENCIAL',
    "qualityRating" INTEGER,
    "priceRating" INTEGER,
    "deliveryRating" INTEGER,
    "serviceRating" INTEGER,
    "paymentTerms" TEXT,
    "minOrder" TEXT,
    "hasInvoice" BOOLEAN NOT NULL DEFAULT false,
    "certifications" TEXT,
    "notes" TEXT,
    "visitDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "registeredById" TEXT NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" "PhotoCategory" NOT NULL DEFAULT 'OTRO',
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Supplier_city_idx" ON "Supplier"("city");

-- CreateIndex
CREATE INDEX "Supplier_status_idx" ON "Supplier"("status");

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
