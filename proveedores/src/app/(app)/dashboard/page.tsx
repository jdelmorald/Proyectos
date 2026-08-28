import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SupplierStatusBadge } from "@/components/SupplierStatusBadge";
import {
  SUPPLIER_STATUS_LABELS,
  SUPPLIER_TYPE_LABELS,
  overallRating,
  formatRating,
} from "@/lib/suppliers";

export default async function DashboardPage() {
  const user = await requireUser();

  const [total, byStatus, byCity, recent, photoCount] = await Promise.all([
    prisma.supplier.count(),
    prisma.supplier.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.supplier.groupBy({
      by: ["city"],
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 6,
    }),
    prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { registeredBy: true, photos: { take: 1 } },
    }),
    prisma.photo.count(),
  ]);

  const statusCounts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));

  return (
    <div>
      <p className="text-sm text-ink-soft mb-1">Hola, {(user.name ?? "").split(" ")[0]}</p>
      <h1 className="font-display text-2xl text-ink mb-8">Panel de proveedores</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
        <div className="bg-surface border border-line rounded-2xl p-4">
          <p className="text-2xl font-display text-ink">{total}</p>
          <p className="text-xs text-ink-soft mt-1">Proveedores registrados</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4">
          <p className="text-2xl font-display text-ink">{statusCounts.ACTIVO ?? 0}</p>
          <p className="text-xs text-ink-soft mt-1">Activos</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4">
          <p className="text-2xl font-display text-ink">
            {(statusCounts.POTENCIAL ?? 0) + (statusCounts.EN_EVALUACION ?? 0)}
          </p>
          <p className="text-xs text-ink-soft mt-1">Por evaluar</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4">
          <p className="text-2xl font-display text-ink">{photoCount}</p>
          <p className="text-xs text-ink-soft mt-1">Fotos cargadas</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5 mb-8">
        <div className="bg-surface border border-line rounded-2xl p-5">
          <h2 className="text-xs uppercase tracking-wide text-ink-soft mb-3">Por estado</h2>
          <ul className="space-y-2">
            {Object.keys(SUPPLIER_STATUS_LABELS).map((status) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <SupplierStatusBadge status={status} />
                <span className="text-ink-soft">{statusCounts[status] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-5">
          <h2 className="text-xs uppercase tracking-wide text-ink-soft mb-3">Ciudades con más proveedores</h2>
          {byCity.length === 0 ? (
            <p className="text-sm text-ink-soft">Aún no hay proveedores registrados.</p>
          ) : (
            <ul className="space-y-2">
              {byCity.map((c) => (
                <li key={c.city} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/suppliers?q=${encodeURIComponent(c.city)}`}
                    className="text-ink hover:text-accent transition-colors"
                  >
                    {c.city}
                  </Link>
                  <span className="text-ink-soft">{c._count._all}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-xs uppercase tracking-wide text-ink-soft">Últimos registrados</h2>
        <Link href="/suppliers" className="text-sm text-accent hover:underline">
          Ver todos
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-10 text-center">
          <p className="text-sm text-ink-soft mb-3">Todavía no hay proveedores registrados.</p>
          <Link
            href="/suppliers/new"
            className="inline-block rounded-lg bg-ink text-white text-sm font-medium px-4 py-2.5 hover:bg-ink/90 transition-colors"
          >
            + Registrar el primero
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {recent.map((s) => {
            const rating = overallRating(s);
            const cover = s.photos[0];
            return (
              <Link
                key={s.id}
                href={`/suppliers/${s.id}`}
                className="bg-surface border border-line rounded-2xl overflow-hidden hover:border-accent/50 transition-colors flex flex-col"
              >
                <div className="aspect-video bg-paper flex items-center justify-center overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/photos/${cover.id}`}
                      alt={s.legalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-ink-soft/60">Sin foto</span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1.5">
                  <p className="font-medium text-ink truncate">{s.legalName}</p>
                  <p className="text-xs text-ink-soft">
                    {s.city} · {SUPPLIER_TYPE_LABELS[s.type]}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <SupplierStatusBadge status={s.status} />
                    <span className={`text-xs ${rating != null ? "text-accent font-medium" : "text-ink-soft"}`}>
                      {formatRating(rating)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
