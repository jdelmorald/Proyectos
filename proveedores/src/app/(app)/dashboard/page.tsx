import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SupplierStatusBadge } from "@/components/SupplierStatusBadge";
import { StatusBarChart, CityBarChart, RatingProgressCard } from "@/components/DashboardCharts";
import {
  SUPPLIER_TYPE_LABELS,
  overallRating,
  formatRating,
} from "@/lib/suppliers";

export default async function DashboardPage() {
  const user = await requireUser();

  const [total, byStatus, byCity, recent, photoCount, ratingRows] = await Promise.all([
    prisma.supplier.count(),
    prisma.supplier.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.supplier.groupBy({
      by: ["city"],
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 8,
    }),
    prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { registeredBy: true, photos: { take: 1 } },
    }),
    prisma.photo.count(),
    prisma.supplier.findMany({
      select: { qualityRating: true, priceRating: true, deliveryRating: true, serviceRating: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));
  const cities = byCity.map((c) => ({ city: c.city, count: c._count._all }));

  // La métrica que más importa: cuántos ya tienen calificación y cuántos faltan.
  const ratedCount = ratingRows.filter((r) => overallRating(r) != null).length;
  const positiveCount = ratingRows.filter((r) => (overallRating(r) ?? 0) >= 4).length;

  return (
    <div>
      <p className="text-sm text-ink-soft mb-1">Hola, {(user.name ?? "").split(" ")[0]}</p>
      <div className="flex items-baseline justify-between gap-3 mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Panel de proveedores</h1>
        <p className="text-xs text-ink-soft">{photoCount} foto(s) cargada(s)</p>
      </div>

      <div className="mb-6">
        <RatingProgressCard total={total} rated={ratedCount} positive={positiveCount} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5 mb-8">
        <div className="glass-card rounded-[20px] p-5">
          <h2 className="text-[.62rem] font-bold uppercase tracking-[.1em] text-ink-soft mb-4">Por estado</h2>
          <StatusBarChart statusCounts={statusCounts} />
        </div>
        <div className="glass-card rounded-[20px] p-5">
          <h2 className="text-[.62rem] font-bold uppercase tracking-[.1em] text-ink-soft mb-4">
            Ciudades con más proveedores
          </h2>
          <CityBarChart cities={cities} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-[.62rem] font-bold uppercase tracking-[.1em] text-ink-soft">Últimos registrados</h2>
        <Link href="/suppliers" className="text-sm text-accent hover:underline">
          Ver todos
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="glass-card rounded-[20px] p-10 text-center">
          <p className="text-sm text-ink-soft mb-3">Todavía no hay proveedores registrados.</p>
          <Link
            href="/suppliers/new"
            className="inline-block rounded-[13px] bg-accent text-white text-sm font-bold px-4 py-2.5 shadow-[0_10px_20px_-8px_rgba(214,41,58,0.5)] hover:-translate-y-0.5 transition-all"
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
                className="glass-card rounded-[20px] overflow-hidden hover:border-accent/50 transition-colors flex flex-col"
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
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-ink-soft truncate">{s.city}</p>
                    <span className={`shrink-0 text-xs ${rating != null ? "text-accent font-bold" : "text-ink-soft"}`}>
                      {formatRating(rating)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <SupplierStatusBadge status={s.status} />
                    <span className="text-xs text-ink-soft">{SUPPLIER_TYPE_LABELS[s.type]}</span>
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
