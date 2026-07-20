import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusBadge } from "@/components/StatusBadge";
import { CompanyLogo } from "@/components/CompanyLogo";
import { DOCUMENT_TYPE_LABELS } from "@/lib/validation";
import { canReviewSubmissions } from "@/lib/roles";
import type { Prisma } from "@/generated/prisma";

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "ENVIADO", label: "Pendientes" },
  { value: "EN_REVISION_DIRECCION", label: "En Dirección" },
  { value: "OBJETADO", label: "Objetados" },
  { value: "APROBADO", label: "Aprobados" },
  { value: "RECHAZADO", label: "Rechazados" },
] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const { status } = await searchParams;

  const statusFilter = status ? { status: status as never } : {};
  const showCompanyColumn = user.role === "ADMINISTRADOR" || user.role === "DIRECTOR";
  const showAuthorColumn = user.role !== "COLABORADOR";

  let where: Prisma.SubmissionWhereInput = statusFilter;
  if (user.role === "GERENTE") {
    where = { companyId: user.companyId ?? "__none__", ...statusFilter };
  } else if (user.role === "COLABORADOR") {
    where = { authorId: user.id, ...statusFilter };
  }

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { company: true, author: true },
  });

  let pendingCount = 0;
  if (user.role === "DIRECTOR") {
    pendingCount = await prisma.submission.count({
      where: { status: { in: ["ENVIADO", "EN_REVISION_DIRECCION"] } },
    });
  } else if (user.role === "GERENTE") {
    pendingCount = await prisma.submission.count({
      where: { companyId: user.companyId ?? "__none__", status: "ENVIADO" },
    });
  } else if (user.role === "COLABORADOR") {
    pendingCount = await prisma.submission.count({
      where: { authorId: user.id, status: "OBJETADO" },
    });
  }

  const title =
    user.role === "ADMINISTRADOR"
      ? "Todos los documentos"
      : user.role === "DIRECTOR"
        ? "Documentos por revisar"
        : user.role === "GERENTE"
          ? "Documentos de mi empresa"
          : "Mis documentos";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-ink">{title}</h1>
          {pendingCount > 0 && canReviewSubmissions(user.role) && (
            <p className="text-sm text-amber-800 mt-1.5">
              {pendingCount} documento(s) esperando tu revisión
            </p>
          )}
          {pendingCount > 0 && user.role === "COLABORADOR" && (
            <p className="text-sm text-amber-800 mt-1.5">
              {pendingCount} documento(s) objetados esperan corrección
            </p>
          )}
        </div>
        {user.role === "COLABORADOR" && (
          <Link
            href="/submissions/new"
            className="rounded-lg bg-ink text-white text-sm font-medium px-4 py-2.5 hover:bg-ink/90 transition-colors"
          >
            + Nuevo documento
          </Link>
        )}
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/dashboard?status=${f.value}` : "/dashboard"}
            className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-full border transition-colors ${
              (status ?? "") === f.value
                ? "bg-ink text-white border-ink"
                : "bg-surface text-ink-soft border-line hover:border-ink/30"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        {submissions.length === 0 ? (
          <p className="text-sm text-ink-soft p-10 text-center">No hay documentos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-ink-soft text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-5 py-3">Título</th>
                <th className="text-left font-medium px-5 py-3">Tipo</th>
                {showCompanyColumn && <th className="text-left font-medium px-5 py-3">Empresa</th>}
                {showAuthorColumn && <th className="text-left font-medium px-5 py-3">Emisor</th>}
                <th className="text-left font-medium px-5 py-3">Estado</th>
                <th className="text-left font-medium px-5 py-3">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-t border-line hover:bg-paper/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/submissions/${s.id}`} className="font-medium text-ink hover:text-accent transition-colors">
                      {s.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{DOCUMENT_TYPE_LABELS[s.type]}</td>
                  {showCompanyColumn && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <CompanyLogo name={s.company.name} logoPath={s.company.logoPath} size={20} />
                        <span className="text-ink-soft">{s.company.name}</span>
                      </div>
                    </td>
                  )}
                  {showAuthorColumn && (
                    <td className="px-5 py-3.5 text-ink-soft">{s.author.name}</td>
                  )}
                  <td className="px-5 py-3.5">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">
                    {s.updatedAt.toLocaleDateString("es", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
