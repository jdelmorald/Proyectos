import { STATUS_LABELS, STATUS_DOT_CLASSES, STATUS_TEXT_CLASSES } from "@/lib/validation";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        STATUS_TEXT_CLASSES[status] ?? "text-ink-soft"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_CLASSES[status] ?? "bg-ink-soft"}`}
      />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
