import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SupplierStatusBadge } from "@/components/SupplierStatusBadge";
import { SUPPLIER_TYPE_LABELS, overallRating, formatRating } from "@/lib/suppliers";
import type { Prisma } from "@/generated/prisma";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "POTENCIAL", label: "Potenciales" },
  { value: "EN_EVALUACION", label: "En evaluación" },
  { value: "APROBADO", label: "Aprobados" },
  { value: "ACTIVO", label: "Activos" },
  { value: "RECHAZADO", label: "Rechazados" },
] as const;

const selectClass = "field-input w-full rounded-[13px] px-3.5 py-2.5 text-sm";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; city?: string; category?: string; minRating?: string }>;
}) {
  const user = await requireUser();
  const { q, status, city, category, minRating } = await searchParams;

  const where: Prisma.SupplierWhereInput = {
    ...(status ? { status: status as never } : {}),
    ...(city ? { city } : {}),
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { legalName: { contains: q } },
            { tradeName: { contains: q } },
            { city: { contains: q } },
            { category: { contains: q } },
          ],
        }
      : {}),
  };

  const [suppliersRaw, cityRows, categoryRows] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { photos: { take: 1 } },
    }),
    prisma.supplier.findMany({
      distinct: ["city"],
      select: { city: true },
      orderBy: { city: "asc" },
    }),
    prisma.supplier.findMany({
      distinct: ["category"],
      select: { category: true },
      where: { category: { not: null } },
      orderBy: { category: "asc" },
    }),
  ]);

  const minRatingNum = minRating ? Number(minRating) : null;
  const suppliers = minRatingNum
    ? suppliersRaw.filter((s) => (overallRating(s) ?? 0) >= minRatingNum)
    : suppliersRaw;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Proveedores</h1>
          <p className="text-sm text-ink-soft mt-1">
            {suppliers.length} proveedor(es) registrado(s)
          </p>
        </div>
        <div className="flex gap-2">
          {user.isAdmin && (
            <a
              href="/api/suppliers/export"
              className="inline-flex items-center gap-1.5 rounded-[13px] glass-card text-ink text-sm font-medium px-4 py-2.5 hover:border-accent/30 transition-colors"
            >
              <Download size={15} /> Exportar
            </a>
          )}
          <Link
            href="/suppliers/new"
            className="rounded-[13px] bg-accent text-white text-sm font-bold px-4 py-2.5 shadow-[0_10px_20px_-8px_rgba(214,41,58,0.5)] hover:-translate-y-0.5 transition-all text-center"
          >
            + Nuevo proveedor
          </Link>
        </div>
      </div>

      <form method="get" className="space-y-3 mb-5">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre, ciudad o rubro..."
          className="field-input w-full rounded-[13px] px-3.5 py-3 text-base sm:text-sm"
        />
        {status && <input type="hidden" name="status" value={status} />}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <select name="city" defaultValue={city ?? ""} className={selectClass}>
            <option value="">Todas las ciudades</option>
            {cityRows.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city}
              </option>
            ))}
          </select>
          <select name="category" defaultValue={category ?? ""} className={selectClass}>
            <option value="">Todos los rubros</option>
            {categoryRows.map((c) => (
              <option key={c.category} value={c.category ?? ""}>
                {c.category}
              </option>
            ))}
          </select>
          <select name="minRating" defaultValue={minRating ?? ""} className={selectClass}>
            <option value="">Cualquier calificación</option>
            <option value="4">★ 4 o más</option>
            <option value="3">★ 3 o más</option>
            <option value="2">★ 2 o más</option>
          </select>
        </div>
        <button
          type="submit"
          className="text-sm font-bold text-accent hover:underline"
        >
          Filtrar
        </button>
      </form>

      <div className="flex gap-1.5 mb-5 overflow-x-auto">
        {STATUS_FILTERS.map((f) => {
          const params = new URLSearchParams();
          if (f.value) params.set("status", f.value);
          if (q) params.set("q", q);
          if (city) params.set("city", city);
          if (category) params.set("category", category);
          if (minRating) params.set("minRating", minRating);
          const href = params.toString() ? `/suppliers?${params.toString()}` : "/suppliers";
          return (
            <Link
              key={f.value}
              href={href}
              className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-full border transition-colors ${
                (status ?? "") === f.value
                  ? "bg-accent text-white border-accent"
                  : "glass-card text-ink-soft hover:border-accent/30"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {suppliers.length === 0 ? (
        <div className="glass-card rounded-[20px] p-10 text-center">
          <p className="text-sm text-ink-soft">No hay proveedores que coincidan con estos filtros.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {suppliers.map((s) => {
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
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{s.legalName}</p>
                      {s.tradeName && <p className="text-xs text-ink-soft truncate">{s.tradeName}</p>}
                    </div>
                    <span className="shrink-0 whitespace-nowrap">
                      <SupplierStatusBadge status={s.status} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-ink-soft truncate">
                      {s.city}
                      {s.state ? `, ${s.state}` : ""}
                    </p>
                    <span
                      className={`shrink-0 text-sm ${rating != null ? "text-accent font-bold" : "text-ink-soft"}`}
                    >
                      {formatRating(rating)}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {SUPPLIER_TYPE_LABELS[s.type]}
                    {s.category ? ` · ${s.category}` : ""}
                  </p>
                  <p className="text-xs text-ink-soft/80 truncate">
                    {s.phone || s.whatsapp || s.contactName || "Sin contacto registrado"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
