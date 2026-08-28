import { requireUser } from "@/lib/session";
import { SupplierForm } from "@/components/SupplierForm";

export default async function NewSupplierPage() {
  await requireUser();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-ink mb-1">Nuevo proveedor</h1>
      <p className="text-sm text-ink-soft mb-6">
        Solo la razón social y la ciudad son obligatorias — completa lo demás
        y las fotos en el momento o después, desde la ficha del proveedor.
      </p>
      <SupplierForm />
    </div>
  );
}
