import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SupplierForm } from "@/components/SupplierForm";
import { SupplierStatusBadge } from "@/components/SupplierStatusBadge";
import { PhotoGallery } from "@/components/PhotoGallery";
import { SUPPLIER_TYPE_LABELS, overallRating, formatRating } from "@/lib/suppliers";

function formatDate(date: Date) {
  return date.toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { registeredBy: true, photos: { orderBy: { createdAt: "desc" } } },
  });

  if (!supplier) notFound();

  const rating = overallRating(supplier);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-ink leading-tight">{supplier.legalName}</h1>
            <p className="text-sm text-ink-soft mt-1">
              {SUPPLIER_TYPE_LABELS[supplier.type]} · {supplier.city}
              {supplier.state ? `, ${supplier.state}` : ""} · Registrado por{" "}
              {supplier.registeredBy.name} el {formatDate(supplier.createdAt)}
            </p>
          </div>
          <SupplierStatusBadge status={supplier.status} />
        </div>
        <p className="text-sm text-ink-soft mt-2">
          Calificación general:{" "}
          <span className={rating != null ? "text-accent font-medium" : ""}>
            {formatRating(rating)}
          </span>
        </p>
      </div>

      <div className="glass-card rounded-[20px] p-5 sm:p-6 space-y-3.5">
        <h2 className="text-[.64rem] font-bold uppercase tracking-[.1em] text-accent">Fotos</h2>
        <PhotoGallery photos={supplier.photos} />
      </div>

      <SupplierForm
        supplier={{
          id: supplier.id,
          legalName: supplier.legalName,
          tradeName: supplier.tradeName,
          taxId: supplier.taxId,
          city: supplier.city,
          state: supplier.state,
          country: supplier.country,
          address: supplier.address,
          contactName: supplier.contactName,
          contactRole: supplier.contactRole,
          phone: supplier.phone,
          whatsapp: supplier.whatsapp,
          email: supplier.email,
          website: supplier.website,
          type: supplier.type,
          category: supplier.category,
          products: supplier.products,
          status: supplier.status,
          qualityRating: supplier.qualityRating,
          priceRating: supplier.priceRating,
          deliveryRating: supplier.deliveryRating,
          serviceRating: supplier.serviceRating,
          paymentTerms: supplier.paymentTerms,
          minOrder: supplier.minOrder,
          hasInvoice: supplier.hasInvoice,
          certifications: supplier.certifications,
          notes: supplier.notes,
          visitDate: supplier.visitDate,
        }}
      />
    </div>
  );
}
