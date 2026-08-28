import Link from "next/link";
import { SUPPLIER_STATUS_LABELS, SUPPLIER_STATUS_DOT_CLASSES } from "@/lib/suppliers";

const STATUS_BAR_CLASSES: Record<string, string> = {
  POTENCIAL: "bg-[#f59e0b]",
  EN_EVALUACION: "bg-[#0284c7]",
  APROBADO: "bg-[#10b981]",
  ACTIVO: "bg-[#059669]",
  RECHAZADO: "bg-[#dc2626]",
  INACTIVO: "bg-ink-soft",
};

/** Barras horizontales por estado — mismos colores que la pastilla de estado en toda la app. */
export function StatusBarChart({ statusCounts }: { statusCounts: Record<string, number> }) {
  const statuses = Object.keys(SUPPLIER_STATUS_LABELS);
  const max = Math.max(1, ...statuses.map((s) => statusCounts[s] ?? 0));

  return (
    <div className="space-y-2.5">
      {statuses.map((status) => {
        const count = statusCounts[status] ?? 0;
        const pct = Math.round((count / max) * 100);
        return (
          <Link
            key={status}
            href={`/suppliers?status=${status}`}
            title={`${SUPPLIER_STATUS_LABELS[status]}: ${count}`}
            className="group block"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-ink-soft group-hover:text-ink transition-colors">
                <span className={`w-1.5 h-1.5 rounded-full ${SUPPLIER_STATUS_DOT_CLASSES[status]}`} />
                {SUPPLIER_STATUS_LABELS[status]}
              </span>
              <span className="font-bold text-ink">{count}</span>
            </div>
            <div className="h-2.5 rounded-full bg-paper overflow-hidden">
              <div
                className={`h-full rounded-full ${STATUS_BAR_CLASSES[status]} transition-all`}
                style={{ width: count > 0 ? `${Math.max(pct, 4)}%` : "0%" }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/** Barras horizontales por ciudad — una sola serie, magnitud por longitud. */
export function CityBarChart({ cities }: { cities: { city: string; count: number }[] }) {
  if (cities.length === 0) {
    return <p className="text-sm text-ink-soft">Aún no hay proveedores registrados.</p>;
  }
  const max = Math.max(1, ...cities.map((c) => c.count));

  return (
    <div className="space-y-2.5">
      {cities.map((c) => {
        const pct = Math.round((c.count / max) * 100);
        return (
          <Link
            key={c.city}
            href={`/suppliers?city=${encodeURIComponent(c.city)}`}
            title={`${c.city}: ${c.count}`}
            className="group block"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-ink-soft group-hover:text-ink transition-colors">{c.city}</span>
              <span className="font-bold text-ink">{c.count}</span>
            </div>
            <div className="h-2.5 rounded-full bg-paper overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * La métrica que más importa: cuántos proveedores ya tienen calificación y
 * cuántos faltan — la meta es que todos terminen calificados.
 */
export function RatingProgressCard({
  total,
  rated,
  positive,
}: {
  total: number;
  rated: number;
  positive: number;
}) {
  const unrated = total - rated;
  const ratedPct = total > 0 ? Math.round((rated / total) * 100) : 0;

  return (
    <div className="glass-card rounded-[20px] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[.62rem] font-bold uppercase tracking-[.1em] text-ink-soft">
          Progreso de calificación
        </h2>
        <span className="text-xs font-bold text-ink-soft">{ratedPct}% calificados</span>
      </div>

      <div className="h-3 rounded-full bg-[#fde8e8] overflow-hidden flex">
        <div
          className="h-full bg-emerald-600 transition-all"
          style={{ width: total > 0 ? `${(rated / total) * 100}%` : "0%" }}
          title={`Calificados: ${rated}`}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xl font-display font-bold text-ink">{total}</p>
          <p className="text-[11px] text-ink-soft">Total</p>
        </div>
        <div>
          <p className="text-xl font-display font-bold text-emerald-700">{positive}</p>
          <p className="text-[11px] text-ink-soft">Calificados 4★ o más</p>
        </div>
        <Link href="/suppliers?unrated=1" className="block group">
          <p className="text-xl font-display font-bold text-red-700 group-hover:underline">{unrated}</p>
          <p className="text-[11px] text-ink-soft">Sin calificar todavía</p>
        </Link>
      </div>
    </div>
  );
}
