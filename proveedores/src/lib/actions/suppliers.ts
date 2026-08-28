"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, canEditSuppliers, canDeleteSuppliers } from "@/lib/session";
import { isAllowedPhoto } from "@/lib/storage";
import { CURRENCY_OPTIONS, PAYMENT_METHOD_OPTIONS, type AdditionalContact } from "@/lib/suppliers";

type ActionResult = { error: string } | { success: true };

const SUPPLIER_TYPES = [
  "FABRICANTE",
  "DISTRIBUIDOR",
  "MAYORISTA",
  "MINORISTA",
  "SERVICIOS",
  "IMPORTADOR",
  "OTRO",
] as const;

const SUPPLIER_STATUSES = [
  "POTENCIAL",
  "EN_EVALUACION",
  "APROBADO",
  "ACTIVO",
  "RECHAZADO",
  "INACTIVO",
] as const;

const PHOTO_CATEGORIES = ["LOCAL", "PRODUCTO", "TARJETA", "DOCUMENTO", "OTRO"] as const;

type SupplierData = {
  legalName: string;
  tradeName: string | null;
  taxId: string | null;
  city: string;
  state: string | null;
  country: string;
  address: string | null;
  contactName: string | null;
  contactRole: string | null;
  phone: string | null;
  phoneExt: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  additionalContacts: AdditionalContact[];
  type: (typeof SUPPLIER_TYPES)[number];
  category: string | null;
  products: string | null;
  isBrandRepresentative: boolean;
  representedBrand: string | null;
  status: (typeof SUPPLIER_STATUSES)[number];
  qualityRating: number | null;
  priceRating: number | null;
  deliveryRating: number | null;
  serviceRating: number | null;
  currencies: string[];
  currencyOther: string | null;
  paymentMethods: string[];
  paymentMethodOther: string | null;
  paymentTerms: string | null;
  minOrder: string | null;
  hasInvoice: boolean;
  certifications: string | null;
  notes: string | null;
  visitDate: Date | null;
};

type ParseResult = { error: string } | { data: SupplierData };

function optionalText(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value : null;
}

function ratingValue(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

function multiSelect(formData: FormData, key: string, allowed: readonly string[]): string[] {
  return formData
    .getAll(key)
    .map((v) => String(v))
    .filter((v) => allowed.includes(v));
}

function parseAdditionalContacts(formData: FormData): AdditionalContact[] {
  const raw = String(formData.get("additionalContactsJson") ?? "[]");
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((c) => ({
        name: String(c?.name ?? "").trim(),
        role: String(c?.role ?? "").trim(),
        phone: String(c?.phone ?? "").trim(),
      }))
      .filter((c) => c.name || c.role || c.phone);
  } catch {
    return [];
  }
}

function parseSupplierInput(formData: FormData): ParseResult {
  const legalName = String(formData.get("legalName") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const type = String(formData.get("type") ?? "OTRO");
  const status = String(formData.get("status") ?? "POTENCIAL");

  if (!legalName) return { error: "La razón social / nombre del proveedor es obligatorio." };
  if (!city) return { error: "La ciudad es obligatoria." };
  if (!SUPPLIER_TYPES.includes(type as (typeof SUPPLIER_TYPES)[number])) {
    return { error: "Tipo de proveedor inválido." };
  }
  if (!SUPPLIER_STATUSES.includes(status as (typeof SUPPLIER_STATUSES)[number])) {
    return { error: "Estado inválido." };
  }

  const visitDateRaw = String(formData.get("visitDate") ?? "").trim();
  const visitDate = visitDateRaw ? new Date(visitDateRaw) : null;
  if (visitDate && Number.isNaN(visitDate.getTime())) {
    return { error: "Fecha de visita inválida." };
  }

  return {
    data: {
      legalName,
      tradeName: optionalText(formData, "tradeName"),
      taxId: optionalText(formData, "taxId"),
      city,
      state: optionalText(formData, "state"),
      country: optionalText(formData, "country") ?? "Venezuela",
      address: optionalText(formData, "address"),
      contactName: optionalText(formData, "contactName"),
      contactRole: optionalText(formData, "contactRole"),
      phone: optionalText(formData, "phone"),
      phoneExt: optionalText(formData, "phoneExt"),
      whatsapp: optionalText(formData, "whatsapp"),
      email: optionalText(formData, "email"),
      website: optionalText(formData, "website"),
      additionalContacts: parseAdditionalContacts(formData),
      type: type as (typeof SUPPLIER_TYPES)[number],
      category: optionalText(formData, "category"),
      products: optionalText(formData, "products"),
      isBrandRepresentative: formData.get("isBrandRepresentative") === "on",
      representedBrand: optionalText(formData, "representedBrand"),
      status: status as (typeof SUPPLIER_STATUSES)[number],
      qualityRating: ratingValue(formData, "qualityRating"),
      priceRating: ratingValue(formData, "priceRating"),
      deliveryRating: ratingValue(formData, "deliveryRating"),
      serviceRating: ratingValue(formData, "serviceRating"),
      currencies: multiSelect(formData, "currencies", CURRENCY_OPTIONS),
      currencyOther: optionalText(formData, "currencyOther"),
      paymentMethods: multiSelect(formData, "paymentMethods", PAYMENT_METHOD_OPTIONS),
      paymentMethodOther: optionalText(formData, "paymentMethodOther"),
      paymentTerms: optionalText(formData, "paymentTerms"),
      minOrder: optionalText(formData, "minOrder"),
      hasInvoice: formData.get("hasInvoice") === "on",
      certifications: optionalText(formData, "certifications"),
      notes: optionalText(formData, "notes"),
      visitDate,
    },
  };
}

/** Guarda las fotos adjuntas en el formulario (si las hay) para un proveedor ya creado.
 *  Cada foto puede traer su propia categoría (fachada, producto, tarjeta...), en el
 *  mismo orden en que aparecen en el DOM. */
async function attachPhotos(formData: FormData, supplierId: string, uploadedById: string) {
  const fileEntries = formData.getAll("photos");
  const categoryEntries = formData.getAll("photoCategories").map((v) => String(v));

  const items = fileEntries
    .map((file, i) => ({ file, category: categoryEntries[i] ?? "OTRO" }))
    .filter((item): item is { file: File; category: string } => item.file instanceof File && item.file.size > 0);

  if (items.length === 0) return null;

  for (const { file } of items) {
    if (!isAllowedPhoto(file.type, file.size)) {
      return "Una o más fotos no son válidas. Usa PNG, JPG o WEBP, máximo 8 MB cada una.";
    }
  }

  for (const { file, category: categoryRaw } of items) {
    const category = PHOTO_CATEGORIES.includes(categoryRaw as (typeof PHOTO_CATEGORIES)[number])
      ? (categoryRaw as (typeof PHOTO_CATEGORIES)[number])
      : "OTRO";
    const data = Buffer.from(await file.arrayBuffer());
    await prisma.photo.create({
      data: {
        data,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        category,
        supplierId,
        uploadedById,
      },
    });
  }

  return null;
}

export async function createSupplier(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = parseSupplierInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supplier = await prisma.supplier.create({
    data: { ...parsed.data, registeredById: user.id },
  });

  const photoError = await attachPhotos(formData, supplier.id, user.id);
  if (photoError) return { error: photoError };

  revalidatePath("/suppliers");
  redirect(`/suppliers/${supplier.id}`);
}

export async function updateSupplier(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  if (!canEditSuppliers(user)) {
    return { error: "No tienes permiso para editar proveedores. Pídele acceso a un administrador." };
  }

  const id = String(formData.get("id") ?? "");
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) return { error: "Proveedor no encontrado." };

  const parsed = parseSupplierInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.supplier.update({
    where: { id },
    data: { ...parsed.data, updatedById: user.id },
  });

  const photoError = await attachPhotos(formData, id, user.id);
  if (photoError) return { error: photoError };

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}`);
  return { success: true };
}

/** Usada directamente como `action` de un <form>, sin useActionState. */
export async function deletePhoto(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canEditSuppliers(user)) return;

  const photoId = String(formData.get("photoId") ?? "");
  const photo = await prisma.photo.delete({ where: { id: photoId } }).catch(() => null);
  if (!photo) return;

  revalidatePath(`/suppliers/${photo.supplierId}`);
}

/** Borra el proveedor y sus fotos. Requiere el permiso de eliminación. Acción irreversible. */
export async function deleteSupplier(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canDeleteSuppliers(user)) return;

  const id = String(formData.get("id") ?? "");
  await prisma.supplier.delete({ where: { id } }).catch(() => null);

  revalidatePath("/suppliers");
  redirect("/suppliers");
}
