import {
  SUPPLIER_TYPE_LABELS,
  RATING_FIELDS,
  RATING_LABELS,
  CURRENCY_LABELS,
  PAYMENT_METHOD_LABELS,
  type AdditionalContact,
} from "@/lib/suppliers";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[.62rem] font-bold uppercase tracking-[.1em] text-ink-soft mb-1">{label}</p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  );
}

function Pills({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="text-xs px-2.5 py-1 rounded-full border border-line text-ink-soft"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export type SupplierDetailData = {
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
  type: string;
  category: string | null;
  products: string | null;
  isBrandRepresentative: boolean;
  representedBrand: string | null;
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

function formatDateOnly(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}

export function SupplierDetailView({ supplier }: { supplier: SupplierDetailData }) {
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

  return (
    <div className="glass-card rounded-[20px] p-5 sm:p-6 space-y-7">
      {/* Identificación */}
      <div className="space-y-3.5">
        <h2 className="text-[.64rem] font-bold uppercase tracking-[.1em] text-accent">Identificación</h2>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <Field label="Razón social" value={supplier.legalName} />
          <Field label="Nombre comercial / marca" value={supplier.tradeName} />
          <Field label="RIF / registro fiscal" value={supplier.taxId} />
          <Field label="Tipo de proveedor" value={SUPPLIER_TYPE_LABELS[supplier.type]} />
          <Field label="Rubro / línea principal" value={supplier.category} />
          {supplier.isBrandRepresentative && (
            <Field
              label="Representante de marca"
              value={supplier.representedBrand ?? "Sí (marca sin especificar)"}
            />
          )}
        </div>
      </div>

      {/* Ubicación */}
      <div className="space-y-3.5 pt-2 border-t border-line">
        <h2 className="text-[.64rem] font-bold uppercase tracking-[.1em] text-accent">Ubicación</h2>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <Field label="Ciudad" value={supplier.city} />
          <Field label="Estado / región" value={supplier.state} />
          <Field label="País" value={supplier.country} />
          <Field label="Fecha de la visita" value={formatDateOnly(supplier.visitDate)} />
          <Field label="Dirección" value={supplier.address} />
        </div>
      </div>

      {/* Contacto */}
      <div className="space-y-3.5 pt-2 border-t border-line">
        <h2 className="text-[.64rem] font-bold uppercase tracking-[.1em] text-accent">Contacto</h2>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <Field label="Persona de contacto" value={supplier.contactName} />
          <Field label="Cargo" value={supplier.contactRole} />
          <Field
            label="Teléfono"
            value={supplier.phone ? `${supplier.phone}${supplier.phoneExt ? ` ext. ${supplier.phoneExt}` : ""}` : null}
          />
          <Field label="WhatsApp" value={supplier.whatsapp} />
          <Field label="Correo" value={supplier.email} />
          <Field label="Sitio web / redes" value={supplier.website} />
        </div>
        {supplier.additionalContacts.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <p className="text-[.62rem] font-bold uppercase tracking-[.1em] text-ink-soft">
              Otros contactos
            </p>
            <ul className="space-y-1">
              {supplier.additionalContacts.map((c, i) => (
                <li key={i} className="text-sm text-ink">
                  {[c.name, c.role, c.phone].filter(Boolean).join(" · ")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Productos */}
      {supplier.products && (
        <div className="space-y-3.5 pt-2 border-t border-line">
          <h2 className="text-[.64rem] font-bold uppercase tracking-[.1em] text-accent">
            Productos y servicios
          </h2>
          <p className="text-sm text-ink whitespace-pre-wrap">{supplier.products}</p>
        </div>
      )}

      {/* Calificación y condiciones */}
      <div className="space-y-3.5 pt-2 border-t border-line">
        <h2 className="text-[.64rem] font-bold uppercase tracking-[.1em] text-accent">
          Calificación y condiciones comerciales
        </h2>
        <div className="grid sm:grid-cols-2 gap-3.5">
          {RATING_FIELDS.map(({ field, label }) => (
            <Field
              key={field}
              label={label}
              value={supplier[field] != null ? RATING_LABELS[supplier[field] as number] : null}
            />
          ))}
        </div>
        {currencyList.length > 0 && (
          <div>
            <p className="text-[.62rem] font-bold uppercase tracking-[.1em] text-ink-soft mb-1.5">
              Moneda(s) de cobro
            </p>
            <Pills items={currencyList} />
          </div>
        )}
        {paymentList.length > 0 && (
          <div>
            <p className="text-[.62rem] font-bold uppercase tracking-[.1em] text-ink-soft mb-1.5">
              Métodos de pago
            </p>
            <Pills items={paymentList} />
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3.5">
          <Field label="Condiciones de pago" value={supplier.paymentTerms} />
          <Field label="Pedido / monto mínimo" value={supplier.minOrder} />
          <Field label="Certificaciones / permisos" value={supplier.certifications} />
          <Field label="Factura fiscal" value={supplier.hasInvoice ? "Sí, vende formalmente" : null} />
        </div>
      </div>

      {/* Notas */}
      {supplier.notes && (
        <div className="space-y-3.5 pt-2 border-t border-line">
          <h2 className="text-[.64rem] font-bold uppercase tracking-[.1em] text-accent">
            Notas de la visita
          </h2>
          <p className="text-sm text-ink whitespace-pre-wrap">{supplier.notes}</p>
        </div>
      )}
    </div>
  );
}
