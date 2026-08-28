"use client";

import { useActionState, useEffect, useState } from "react";
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers";
import { PhotoUploadField } from "@/components/PhotoUploadField";
import {
  SUPPLIER_TYPE_LABELS,
  SUPPLIER_STATUS_LABELS,
  RATING_FIELDS,
  RATING_LABELS,
  CURRENCY_OPTIONS,
  CURRENCY_LABELS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_LABELS,
  CATEGORY_SUGGESTIONS,
  type AdditionalContact,
} from "@/lib/suppliers";

const initialState = null;

const inputClass = "field-input w-full rounded-[13px] px-3.5 py-3 text-base sm:text-sm";
const labelClass = "block text-[.64rem] font-bold uppercase tracking-[.1em] text-ink-soft mb-2";
const sectionTitleClass = "text-[.64rem] font-bold uppercase tracking-[.1em] text-accent";
const pillLabelClass =
  "inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-line cursor-pointer has-[:checked]:bg-accent-soft has-[:checked]:border-accent has-[:checked]:text-accent-deep transition-colors";

export type SupplierFormValues = {
  id: string;
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
  status: string;
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

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function AdditionalContactsField({ initial }: { initial: AdditionalContact[] }) {
  const [contacts, setContacts] = useState<AdditionalContact[]>(initial);

  function update(i: number, field: keyof AdditionalContact, value: string) {
    setContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }

  return (
    <div className="space-y-2.5">
      <input type="hidden" name="additionalContactsJson" value={JSON.stringify(contacts)} />
      {contacts.map((c, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
          <input
            className={inputClass}
            placeholder="Nombre"
            value={c.name}
            onChange={(e) => update(i, "name", e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Cargo"
            value={c.role}
            onChange={(e) => update(i, "role", e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Teléfono"
            type="tel"
            inputMode="tel"
            value={c.phone}
            onChange={(e) => update(i, "phone", e.target.value)}
          />
          <button
            type="button"
            onClick={() => setContacts((prev) => prev.filter((_, idx) => idx !== i))}
            className="text-red-700 text-xs font-medium px-2 py-1 justify-self-start sm:justify-self-center"
          >
            Quitar
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setContacts((prev) => [...prev, { name: "", role: "", phone: "" }])}
        className="text-[.78rem] font-bold text-accent"
      >
        + Agregar otro contacto
      </button>
    </div>
  );
}

export function SupplierForm({
  supplier,
  onSaved,
  onCancel,
}: {
  supplier?: SupplierFormValues;
  /** Se llama cuando la edición se guardó con éxito (para volver a modo lectura). */
  onSaved?: () => void;
  /** Se llama al cancelar la edición sin guardar. */
  onCancel?: () => void;
}) {
  const isEdit = Boolean(supplier);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateSupplier : createSupplier,
    initialState
  );

  useEffect(() => {
    if (state && "success" in state) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="glass-card rounded-[20px] p-5 sm:p-6 space-y-7"
    >
      {isEdit && <input type="hidden" name="id" value={supplier!.id} />}

      {/* Identificación */}
      <div className="space-y-3.5">
        <h2 className={sectionTitleClass}>Identificación</h2>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label htmlFor="legalName" className={labelClass}>
              Razón social / nombre del proveedor *
            </label>
            <input
              id="legalName"
              name="legalName"
              required
              defaultValue={supplier?.legalName}
              className={inputClass}
              placeholder="Distribuidora El Puente, C.A."
            />
          </div>
          <div>
            <label htmlFor="tradeName" className={labelClass}>
              Nombre comercial / marca
            </label>
            <input
              id="tradeName"
              name="tradeName"
              defaultValue={supplier?.tradeName ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="taxId" className={labelClass}>
              RIF / registro fiscal
            </label>
            <input
              id="taxId"
              name="taxId"
              defaultValue={supplier?.taxId ?? ""}
              className={inputClass}
              placeholder="J-12345678-9"
            />
          </div>
          <div>
            <label htmlFor="type" className={labelClass}>
              Tipo de proveedor
            </label>
            <select
              id="type"
              name="type"
              defaultValue={supplier?.type ?? "OTRO"}
              className={inputClass}
            >
              {Object.entries(SUPPLIER_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className={labelClass}>
              Rubro / línea principal
            </label>
            <input
              id="category"
              name="category"
              list="category-suggestions"
              defaultValue={supplier?.category ?? ""}
              className={inputClass}
              placeholder="Transporte, IT, ferretería..."
            />
            <datalist id="category-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3.5 items-start pt-1">
          <label className="flex items-center gap-2.5 text-sm text-ink py-1">
            <input
              type="checkbox"
              name="isBrandRepresentative"
              defaultChecked={supplier?.isBrandRepresentative ?? false}
              className="w-4 h-4 rounded border-line accent-accent"
            />
            Es representante / distribuidor exclusivo de una marca
          </label>
          <div>
            <label htmlFor="representedBrand" className={labelClass}>
              ¿Cuál marca?
            </label>
            <input
              id="representedBrand"
              name="representedBrand"
              defaultValue={supplier?.representedBrand ?? ""}
              className={inputClass}
              placeholder="Ej. Canon, Bosch..."
            />
          </div>
        </div>
      </div>

      {/* Ubicación */}
      <div className="space-y-3.5 pt-2 border-t border-line">
        <h2 className={sectionTitleClass}>Ubicación</h2>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="city" className={labelClass}>
              Ciudad visitada *
            </label>
            <input id="city" name="city" required defaultValue={supplier?.city} className={inputClass} />
          </div>
          <div>
            <label htmlFor="state" className={labelClass}>
              Estado / región
            </label>
            <input id="state" name="state" defaultValue={supplier?.state ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="country" className={labelClass}>
              País
            </label>
            <input
              id="country"
              name="country"
              defaultValue={supplier?.country ?? "Venezuela"}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="visitDate" className={labelClass}>
              Fecha de la visita
            </label>
            <input
              id="visitDate"
              name="visitDate"
              type="date"
              defaultValue={toDateInputValue(supplier?.visitDate ?? new Date())}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className={labelClass}>
              Dirección
            </label>
            <input
              id="address"
              name="address"
              defaultValue={supplier?.address ?? ""}
              className={inputClass}
              placeholder="Calle, sector, referencia"
            />
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="space-y-3.5 pt-2 border-t border-line">
        <h2 className={sectionTitleClass}>Contacto</h2>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="contactName" className={labelClass}>
              Persona de contacto
            </label>
            <input
              id="contactName"
              name="contactName"
              defaultValue={supplier?.contactName ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contactRole" className={labelClass}>
              Cargo
            </label>
            <input
              id="contactRole"
              name="contactRole"
              defaultValue={supplier?.contactRole ?? ""}
              className={inputClass}
              placeholder="Dueño, ventas, gerente..."
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <label htmlFor="phone" className={labelClass}>
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                defaultValue={supplier?.phone ?? ""}
                className={inputClass}
              />
            </div>
            <div className="w-24">
              <label htmlFor="phoneExt" className={labelClass}>
                Ext.
              </label>
              <input
                id="phoneExt"
                name="phoneExt"
                inputMode="numeric"
                defaultValue={supplier?.phoneExt ?? ""}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="whatsapp" className={labelClass}>
              WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              defaultValue={supplier?.whatsapp ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={supplier?.email ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="website" className={labelClass}>
              Sitio web / redes sociales
            </label>
            <input
              id="website"
              name="website"
              defaultValue={supplier?.website ?? ""}
              className={inputClass}
              placeholder="instagram.com/..."
            />
          </div>
        </div>

        <div className="pt-1">
          <label className={labelClass}>Otros contactos (opcional)</label>
          <AdditionalContactsField initial={supplier?.additionalContacts ?? []} />
        </div>
      </div>

      {/* Fotos */}
      <div className="space-y-3.5 pt-2 border-t border-line">
        <h2 className={sectionTitleClass}>Fotos</h2>
        <PhotoUploadField />
      </div>

      {/* Productos y servicios */}
      <div className="space-y-3.5 pt-2 border-t border-line">
        <h2 className={sectionTitleClass}>Productos y servicios</h2>
        <div>
          <label htmlFor="products" className={labelClass}>
            Productos / servicios que ofrece
          </label>
          <textarea
            id="products"
            name="products"
            rows={2}
            defaultValue={supplier?.products ?? ""}
            className={inputClass}
            placeholder="Detalle lo que puede suministrar"
          />
        </div>
      </div>

      {/* Calificación y condiciones */}
      <div className="space-y-3.5 pt-2 border-t border-line">
        <h2 className={sectionTitleClass}>Calificación y condiciones comerciales</h2>
        <div>
          <label htmlFor="status" className={labelClass}>
            Estado del proveedor
          </label>
          <select id="status" name="status" defaultValue={supplier?.status ?? "POTENCIAL"} className={inputClass}>
            {Object.entries(SUPPLIER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-3.5">
          {RATING_FIELDS.map(({ field, label }) => (
            <div key={field}>
              <label htmlFor={field} className={labelClass}>
                {label}
              </label>
              <select
                id={field}
                name={field}
                defaultValue={supplier?.[field]?.toString() ?? ""}
                className={inputClass}
              >
                <option value="">Sin calificar</option>
                {Object.entries(RATING_LABELS).map(([value, ratingLabel]) => (
                  <option key={value} value={value}>
                    {ratingLabel}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div>
          <label className={labelClass}>Moneda(s) de cobro</label>
          <div className="flex flex-wrap gap-2">
            {CURRENCY_OPTIONS.map((opt) => (
              <label key={opt} className={pillLabelClass}>
                <input
                  type="checkbox"
                  name="currencies"
                  value={opt}
                  defaultChecked={supplier?.currencies?.includes(opt) ?? false}
                  className="accent-accent"
                />
                {CURRENCY_LABELS[opt]}
              </label>
            ))}
          </div>
          <input
            name="currencyOther"
            defaultValue={supplier?.currencyOther ?? ""}
            className={`${inputClass} mt-2`}
            placeholder="Si marcaste 'Otra', especifica cuál"
          />
        </div>

        <div>
          <label className={labelClass}>Métodos de pago</label>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHOD_OPTIONS.map((opt) => (
              <label key={opt} className={pillLabelClass}>
                <input
                  type="checkbox"
                  name="paymentMethods"
                  value={opt}
                  defaultChecked={supplier?.paymentMethods?.includes(opt) ?? false}
                  className="accent-accent"
                />
                {PAYMENT_METHOD_LABELS[opt]}
              </label>
            ))}
          </div>
          <input
            name="paymentMethodOther"
            defaultValue={supplier?.paymentMethodOther ?? ""}
            className={`${inputClass} mt-2`}
            placeholder="Si marcaste 'Otro', especifica cuál"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="paymentTerms" className={labelClass}>
              Condiciones de pago ofrecidas
            </label>
            <input
              id="paymentTerms"
              name="paymentTerms"
              defaultValue={supplier?.paymentTerms ?? ""}
              className={inputClass}
              placeholder="Contado, 30 días, crédito..."
            />
          </div>
          <div>
            <label htmlFor="minOrder" className={labelClass}>
              Pedido / monto mínimo
            </label>
            <input id="minOrder" name="minOrder" defaultValue={supplier?.minOrder ?? ""} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="certifications" className={labelClass}>
              Certificaciones / permisos
            </label>
            <input
              id="certifications"
              name="certifications"
              defaultValue={supplier?.certifications ?? ""}
              className={inputClass}
              placeholder="ISO, sanitario, permisos municipales..."
            />
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-sm text-ink py-1">
          <input
            type="checkbox"
            name="hasInvoice"
            defaultChecked={supplier?.hasInvoice ?? false}
            className="w-4 h-4 rounded border-line accent-accent"
          />
          Factura fiscal / vende formalmente
        </label>
      </div>

      {/* Notas */}
      <div className="space-y-3.5 pt-2 border-t border-line">
        <h2 className={sectionTitleClass}>Notas de la visita</h2>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={supplier?.notes ?? ""}
          className={inputClass}
          placeholder="Observaciones, impresión general, próximos pasos..."
        />
      </div>

      {state && "error" in state && <p className="text-sm text-red-700">{state.error}</p>}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={pending}
          className="w-full sm:w-auto rounded-[13px] bg-accent text-white text-sm font-bold px-6 py-3 shadow-[0_14px_28px_-10px_rgba(214,41,58,0.5)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 transition-all"
        >
          {pending
            ? isEdit
              ? "Guardando..."
              : "Registrando..."
            : isEdit
              ? "Guardar cambios"
              : "Registrar proveedor"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={() => onCancel?.()}
            className="text-sm font-medium text-ink-soft hover:text-ink"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
