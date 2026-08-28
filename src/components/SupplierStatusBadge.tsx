import {
  SUPPLIER_STATUS_LABELS,
  SUPPLIER_STATUS_DOT_CLASSES,
  SUPPLIER_STATUS_TEXT_CLASSES,
} from "@/lib/suppliers";

export function SupplierStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        SUPPLIER_STATUS_TEXT_CLASSES[status] ?? "text-ink-soft"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${SUPPLIER_STATUS_DOT_CLASSES[status] ?? "bg-ink-soft"}`}
      />
      {SUPPLIER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
