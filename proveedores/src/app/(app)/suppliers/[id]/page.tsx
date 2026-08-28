import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, canEditSuppliers, canDeleteSuppliers } from "@/lib/session";
import { SupplierDetailClient } from "@/components/SupplierDetailClient";
import { SupplierStatusBadge } from "@/components/SupplierStatusBadge";
import { PhotoGallery } from "@/components/PhotoGallery";
import { BackButton } from "@/components/BackButton";
import { DeleteSupplierButton } from "@/components/DeleteSupplierButton";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import {
  SUPPLIER_TYPE_LABELS,
  overallRating,
  formatRating,
  formatDateTime,
} from "@/lib/suppliers";
import type { AdditionalContact } from "@/lib/suppliers";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      registeredBy: true,
      updatedBy: true,
      photos: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!supplier) notFound();

  const rating = overallRating(supplier);
  const canEdit = canEditSuppliers(user);
  const canDelete = canDeleteSuppliers(user);

  return (
    <div className="max-w-2xl space-y-6">
      <BackButton />

      <div className="flex items-center justify-end gap-4">
        <DownloadPdfButton
          targetId="supplier-detail-capture"
          filename={`${supplier.legalName.replace(/[^\w\- ]/g, "")}.pdf`}
        />
        <Link
          href={`/suppliers/${supplier.id}/print`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-accent transition-colors"
        >
          <Printer size={14} /> Imprimir
        </Link>
      </div>

      <div id="supplier-detail-capture" className="space-y-6" style={{ background: "var(--color-paper)" }}>
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-ink leading-tight">{supplier.legalName}</h1>
            <p className="text-sm text-ink-soft mt-1">
              {SUPPLIER_TYPE_LABELS[supplier.type]} · {supplier.city}
              {supplier.state ? `, ${supplier.state}` : ""}
            </p>
            <p className="text-xs text-ink-soft/70 mt-1">
              Registrado por {supplier.registeredBy.name} el {formatDateTime(supplier.createdAt)}
              {supplier.updatedBy && (
                <>
                  {" "}
                  · Última edición por {supplier.updatedBy.name} el {formatDateTime(supplier.updatedAt)}
                </>
              )}
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
        <PhotoGallery photos={supplier.photos} canEdit={canEdit} />
      </div>

      <SupplierDetailClient
        canEdit={canEdit}
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
          phoneExt: supplier.phoneExt,
          whatsapp: supplier.whatsapp,
          email: supplier.email,
          website: supplier.website,
          additionalContacts: Array.isArray(supplier.additionalContacts)
            ? (supplier.additionalContacts as unknown as AdditionalContact[])
            : [],
          type: supplier.type,
          category: supplier.category,
          products: supplier.products,
          isBrandRepresentative: supplier.isBrandRepresentative,
          representedBrand: supplier.representedBrand,
          status: supplier.status,
          qualityRating: supplier.qualityRating,
          priceRating: supplier.priceRating,
          deliveryRating: supplier.deliveryRating,
          serviceRating: supplier.serviceRating,
          currencies: supplier.currencies,
          currencyOther: supplier.currencyOther,
          paymentMethods: supplier.paymentMethods,
          paymentMethodOther: supplier.paymentMethodOther,
          paymentTerms: supplier.paymentTerms,
          minOrder: supplier.minOrder,
          hasInvoice: supplier.hasInvoice,
          certifications: supplier.certifications,
          notes: supplier.notes,
          visitDate: supplier.visitDate,
        }}
      />
      </div>

      {canDelete && (
        <div className="flex justify-end">
          <DeleteSupplierButton supplierId={supplier.id} legalName={supplier.legalName} />
        </div>
      )}
    </div>
  );
}
