import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PrintButton } from "@/components/PrintButton";
import { BackButton } from "@/components/BackButton";
import {
  SUPPLIER_TYPE_LABELS,
  SUPPLIER_STATUS_LABELS,
  RATING_FIELDS,
  RATING_LABELS,
  CURRENCY_LABELS,
  PAYMENT_METHOD_LABELS,
  overallRating,
  formatRating,
  formatDateTime,
} from "@/lib/suppliers";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1 border-b border-[#eee] text-[13px]">
      <span className="w-44 shrink-0 font-semibold text-[#555]">{label}</span>
      <span className="text-[#111]">{value}</span>
    </div>
  );
}

export default async function SupplierPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { registeredBy: true, updatedBy: true, photos: { orderBy: { createdAt: "desc" }, take: 6 } },
  });

  if (!supplier) notFound();

  const rating = overallRating(supplier);
  const currencyList = [
    ...supplier.currencies.filter((c) => c !== "OTRO").map((c) => CURRENCY_LABELS[c] ?? c),
    ...(supplier.currencies.includes("OTRO") && supplier.currencyOther ? [supplier.currencyOther] : []),
  ];
  const paymentList = [
    ...supplier.paymentMethods.filter((m) => m !== "OTRO").map((m) => PAYMENT_METHOD_LABELS[m] ?? m),
    ...(supplier.paymentMethods.includes("OTRO") && supplier.paymentMethodOther
      ? [supplier.paymentMethodOther]
      : []),
  ];
  const additionalContacts = Array.isArray(supplier.additionalContacts)
    ? (supplier.additionalContacts as { name?: string; role?: string; phone?: string }[])
    : [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="no-print flex items-center justify-between mb-4">
        <BackButton />
        <PrintButton />
      </div>

      <div className="print-card bg-white rounded-2xl p-8 text-[#111]" style={{ fontFamily: "var(--font-plex)" }}>
        <div className="flex items-center justify-between border-b-2 border-[#111] pb-4 mb-5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Sumivensa" className="h-12 w-12 object-contain" />
            <div>
              <p className="font-display font-extrabold text-lg leading-none">SUMIVENSA</p>
              <p className="text-[10px] uppercase tracking-widest text-[#888] mt-1">
                Ficha de proveedor
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-[#888]">
            <p>Impreso el {formatDateTime(new Date())}</p>
          </div>
        </div>

        <h1 className="text-2xl font-display font-bold mb-1">{supplier.legalName}</h1>
        <p className="text-sm text-[#555] mb-5">
          {SUPPLIER_TYPE_LABELS[supplier.type]} · {supplier.city}
          {supplier.state ? `, ${supplier.state}` : ""} · {SUPPLIER_STATUS_LABELS[supplier.status]} ·
          Calificación general: {formatRating(rating)}
        </p>

        <div className="grid grid-cols-2 gap-x-8">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mt-3 mb-1.5">
              Identificación
            </h2>
            <Row label="Nombre comercial" value={supplier.tradeName} />
            <Row label="RIF" value={supplier.taxId} />
            <Row label="Rubro" value={supplier.category} />
            {supplier.isBrandRepresentative && (
              <Row label="Representa la marca" value={supplier.representedBrand ?? "Sí"} />
            )}

            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mt-4 mb-1.5">
              Ubicación
            </h2>
            <Row label="Dirección" value={supplier.address} />
            <Row label="País" value={supplier.country} />
            <Row label="Fecha de visita" value={supplier.visitDate?.toLocaleDateString("es")} />

            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mt-4 mb-1.5">
              Contacto
            </h2>
            <Row label="Persona" value={supplier.contactName} />
            <Row label="Cargo" value={supplier.contactRole} />
            <Row
              label="Teléfono"
              value={supplier.phone ? `${supplier.phone}${supplier.phoneExt ? ` ext. ${supplier.phoneExt}` : ""}` : null}
            />
            <Row label="WhatsApp" value={supplier.whatsapp} />
            <Row label="Correo" value={supplier.email} />
            <Row label="Web / redes" value={supplier.website} />
            {additionalContacts.map((c, i) => (
              <Row key={i} label="Otro contacto" value={[c.name, c.role, c.phone].filter(Boolean).join(" · ")} />
            ))}
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mt-3 mb-1.5">
              Calificación
            </h2>
            {RATING_FIELDS.map(({ field, label }) => (
              <Row
                key={field}
                label={label}
                value={supplier[field] != null ? RATING_LABELS[supplier[field] as number] : null}
              />
            ))}

            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mt-4 mb-1.5">
              Condiciones comerciales
            </h2>
            <Row label="Monedas de cobro" value={currencyList.join(", ")} />
            <Row label="Métodos de pago" value={paymentList.join(", ")} />
            <Row label="Condiciones de pago" value={supplier.paymentTerms} />
            <Row label="Pedido mínimo" value={supplier.minOrder} />
            <Row label="Certificaciones" value={supplier.certifications} />
            <Row label="Factura fiscal" value={supplier.hasInvoice ? "Sí" : null} />

            {supplier.products && (
              <>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mt-4 mb-1.5">
                  Productos / servicios
                </h2>
                <p className="text-[13px]">{supplier.products}</p>
              </>
            )}
          </div>
        </div>

        {supplier.notes && (
          <div className="mt-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mb-1.5">
              Notas de la visita
            </h2>
            <p className="text-[13px]">{supplier.notes}</p>
          </div>
        )}

        {supplier.photos.length > 0 && (
          <div className="mt-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mb-1.5">
              Fotos
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {supplier.photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={`/api/photos/${photo.id}`}
                  alt={photo.originalName}
                  className="w-full aspect-square object-cover rounded-lg border border-[#ddd]"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-3 border-t border-[#ddd] text-[11px] text-[#888] flex justify-between">
          <span>
            Registrado por {supplier.registeredBy.name} el {formatDateTime(supplier.createdAt)}
          </span>
          {supplier.updatedBy && (
            <span>
              Última edición por {supplier.updatedBy.name} el {formatDateTime(supplier.updatedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
