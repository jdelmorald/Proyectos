import Link from "next/link";
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

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireUser();
  const { q, status } = await searchParams;

  const where: Prisma.SupplierWhereInput = {
    ...(status ? { status: status as never } : {}),
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

  const suppliers = await prisma.supplier.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { photos: { take: 1 } },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink">Proveedores</h1>
          <p className="text-sm text-ink-soft mt-1">
            {suppliers.length} proveedor(es) registrado(s)
          </p>
        </div>
        <Link
          href="/suppliers/new"
          className="rounded-lg bg-ink text-white text-sm font-medium px-4 py-2.5 hover:bg-ink/90 transition-colors text-center"
        >
          + Nuevo proveedor
        </Link>
      </div>

      <form method="get" className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre, ciudad o rubro..."
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-base sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      <div className="flex gap-1.5 mb-5 overflow-x-auto">
        {STATUS_FILTERS.map((f) => {
          const params = new URLSearchParams();
          if (f.value) params.set("status", f.value);
          if (q) params.set("q", q);
          const href = params.toString() ? `/suppliers?${params.toString()}` : "/suppliers";
          return (
            <Link
              key={f.value}
              href={href}
              className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-full border transition-colors ${
                (status ?? "") === f.value
                  ? "bg-ink text-white border-ink"
                  : "bg-surface text-ink-soft border-line hover:border-ink/30"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-10 text-center">
          <p className="text-sm text-ink-soft">No hay proveedores registrados todavía.</p>
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
                  <p className="text-sm text-ink-soft">
                    {s.city}
                    {s.state ? `, ${s.state}` : ""} · {SUPPLIER_TYPE_LABELS[s.type]}
                  </p>
                  <div className="flex items-center justify-between text-xs text-ink-soft mt-1">
                    <span>{s.phone || s.whatsapp || s.contactName || "Sin contacto registrado"}</span>
                    <span className={rating != null ? "text-accent font-medium" : ""}>
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
