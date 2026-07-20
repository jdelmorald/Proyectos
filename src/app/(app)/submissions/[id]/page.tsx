import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusBadge } from "@/components/StatusBadge";
import { ReviewActions } from "@/components/ReviewActions";
import { ResubmitForm } from "@/components/ResubmitForm";
import { DOCUMENT_TYPE_LABELS, ACTION_LABELS } from "@/lib/validation";
import { canViewSubmission } from "@/lib/roles";

function formatDate(date: Date) {
  return date.toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      company: true,
      author: true,
      versions: { orderBy: { versionNumber: "desc" } },
      history: {
        orderBy: { createdAt: "asc" },
        include: { actor: true, version: true },
      },
    },
  });

  if (!submission) notFound();
  if (!canViewSubmission(user, submission)) notFound();

  const isOwner = submission.authorId === user.id;
  const isDirectorReview =
    user.role === "DIRECTOR" &&
    (submission.status === "ENVIADO" || submission.status === "EN_REVISION_DIRECCION");
  const isGerenteReview =
    user.role === "GERENTE" &&
    submission.status === "ENVIADO" &&
    submission.companyId === user.companyId;

  const latestVersion = submission.versions[0];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{submission.title}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {DOCUMENT_TYPE_LABELS[submission.type]} · {submission.company.name} · Enviado por{" "}
              {submission.author.name}
            </p>
          </div>
          <StatusBadge status={submission.status} />
        </div>
        {submission.description && (
          <p className="text-sm text-slate-600 mt-3 bg-slate-100 rounded-md p-3">
            {submission.description}
          </p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Versión actual (v{latestVersion.versionNumber})
        </h2>
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-slate-900">{latestVersion.originalName}</p>
            <p className="text-slate-500">
              {formatSize(latestVersion.fileSize)} · subido el {formatDate(latestVersion.createdAt)}
            </p>
          </div>
          <a
            href={`/api/files/${latestVersion.id}`}
            className="rounded-md border border-slate-300 text-slate-700 text-sm font-medium px-3 py-1.5 hover:bg-slate-50"
          >
            Descargar
          </a>
        </div>
      </div>

      {isDirectorReview && <ReviewActions submissionId={submission.id} mode="director" />}
      {isGerenteReview && <ReviewActions submissionId={submission.id} mode="gerente" />}

      {isOwner && submission.status === "OBJETADO" && (
        <ResubmitForm submissionId={submission.id} />
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Historial</h2>
        <ol className="space-y-4">
          {submission.history.map((event) => (
            <li key={event.id} className="flex gap-3">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-400 shrink-0" />
              <div>
                <p className="text-sm text-slate-900">
                  <span className="font-medium">{event.actor.name}</span>{" "}
                  {ACTION_LABELS[event.action] ?? event.action}
                  {event.version && ` (v${event.version.versionNumber})`}
                </p>
                {event.comment && (
                  <p className="text-sm text-slate-600 mt-1 bg-slate-50 border border-slate-100 rounded-md p-2">
                    {event.comment}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">{formatDate(event.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {submission.versions.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Versiones anteriores</h2>
          <ul className="space-y-2">
            {submission.versions.slice(1).map((v) => (
              <li key={v.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  v{v.versionNumber} · {v.originalName} · {formatDate(v.createdAt)}
                </span>
                <a
                  href={`/api/files/${v.id}`}
                  className="text-slate-500 hover:text-slate-900 underline"
                >
                  Descargar
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
