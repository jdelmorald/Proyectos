-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "type" TEXT NOT NULL DEFAULT 'OTRO',
    "category" TEXT,
    "products" TEXT,
    "status" TEXT NOT NULL DEFAULT 'POTENCIAL',
    "qualityRating" INTEGER,
    "priceRating" INTEGER,
    "deliveryRating" INTEGER,
    "serviceRating" INTEGER,
    "paymentTerms" TEXT,
    "minOrder" TEXT,
    "hasInvoice" BOOLEAN NOT NULL DEFAULT false,
    "certifications" TEXT,
    "notes" TEXT,
    "visitDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "registeredById" TEXT NOT NULL,
    CONSTRAINT "Supplier_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Supplier_city_idx" ON "Supplier"("city");

-- CreateIndex
CREATE INDEX "Supplier_status_idx" ON "Supplier"("status");
