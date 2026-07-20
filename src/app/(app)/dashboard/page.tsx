import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusBadge } from "@/components/StatusBadge";
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {pendingCount > 0 && canReviewSubmissions(user.role) && (
            <p className="text-sm text-amber-700 mt-1">
              {pendingCount} documento(s) esperando tu revisión
            </p>
          )}
          {pendingCount > 0 && user.role === "COLABORADOR" && (
            <p className="text-sm text-amber-700 mt-1">
              {pendingCount} documento(s) objetados esperan corrección
            </p>
          )}
        </div>
        {user.role === "COLABORADOR" && (
          <Link
            href="/submissions/new"
            className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
          >
            + Nuevo documento
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/dashboard?status=${f.value}` : "/dashboard"}
            className={`text-sm px-3 py-1.5 rounded-md border ${
              (status ?? "") === f.value
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {submissions.length === 0 ? (
          <p className="text-sm text-slate-500 p-8 text-center">No hay documentos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left font-medium px-4 py-2">Título</th>
                <th className="text-left font-medium px-4 py-2">Tipo</th>
                {showCompanyColumn && <th className="text-left font-medium px-4 py-2">Empresa</th>}
                {showAuthorColumn && <th className="text-left font-medium px-4 py-2">Emisor</th>}
                <th className="text-left font-medium px-4 py-2">Estado</th>
                <th className="text-left font-medium px-4 py-2">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/submissions/${s.id}`} className="font-medium text-slate-900 hover:underline">
                      {s.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{DOCUMENT_TYPE_LABELS[s.type]}</td>
                  {showCompanyColumn && (
                    <td className="px-4 py-3 text-slate-600">{s.company.name}</td>
                  )}
                  {showAuthorColumn && (
                    <td className="px-4 py-3 text-slate-600">{s.author.name}</td>
                  )}
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
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
