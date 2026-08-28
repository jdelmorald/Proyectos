-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "additionalContacts" JSONB,
ADD COLUMN     "currencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "currencyOther" TEXT,
ADD COLUMN     "isBrandRepresentative" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethodOther" TEXT,
ADD COLUMN     "paymentMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "phoneExt" TEXT,
ADD COLUMN     "representedBrand" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canEditSuppliers" BOOLEAN NOT NULL DEFAULT false;
