import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusBadge } from "@/components/StatusBadge";
import { CompanyLogo } from "@/components/CompanyLogo";
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
          <div className="flex items-start gap-3">
            <CompanyLogo name={submission.company.name} logoPath={submission.company.logoPath} size={40} />
            <div>
              <h1 className="font-display text-2xl text-ink leading-tight">{submission.title}</h1>
              <p className="text-sm text-ink-soft mt-1">
                {DOCUMENT_TYPE_LABELS[submission.type]} · {submission.company.name} · Enviado por{" "}
                {submission.author.name}
              </p>
            </div>
          </div>
          <StatusBadge status={submission.status} />
        </div>
        {submission.description && (
          <p className="text-sm text-ink-soft mt-4 bg-surface border border-line rounded-xl p-3.5">
            {submission.description}
          </p>
        )}
      </div>

      <div className="bg-surface border border-line rounded-2xl p-5">
        <h2 className="text-xs uppercase tracking-wide text-ink-soft mb-3">
          Versión actual · v{latestVersion.versionNumber}
        </h2>
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-ink font-medium">{latestVersion.originalName}</p>
            <p className="text-ink-soft mt-0.5">
              {formatSize(latestVersion.fileSize)} · subido el {formatDate(latestVersion.createdAt)}
            </p>
          </div>
          <a
            href={`/api/files/${latestVersion.id}`}
            className="rounded-lg border border-line text-ink text-sm font-medium px-3.5 py-2 hover:bg-paper transition-colors"
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

      <div className="bg-surface border border-line rounded-2xl p-5">
        <h2 className="text-xs uppercase tracking-wide text-ink-soft mb-5">Historial</h2>
        <ol className="relative">
          {submission.history.map((event, i) => (
            <li key={event.id} className="relative pl-6 pb-6 last:pb-0">
              {i < submission.history.length - 1 && (
                <span className="absolute left-[5px] top-3 bottom-0 w-px bg-line" />
              )}
              <span className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-ink" />
              <p className="text-sm text-ink">
                <span className="font-medium">{event.actor.name}</span>{" "}
                <span className="text-ink-soft">{ACTION_LABELS[event.action] ?? event.action}</span>
                {event.version && (
                  <span className="text-ink-soft"> (v{event.version.versionNumber})</span>
                )}
              </p>
              {event.comment && (
                <p className="text-sm text-ink-soft mt-1.5 bg-paper border border-line rounded-lg p-2.5">
                  {event.comment}
                </p>
              )}
              <p className="text-xs text-ink-soft/60 mt-1.5">{formatDate(event.createdAt)}</p>
            </li>
          ))}
        </ol>
      </div>

      {submission.versions.length > 1 && (
        <div className="bg-surface border border-line rounded-2xl p-5">
          <h2 className="text-xs uppercase tracking-wide text-ink-soft mb-3">Versiones anteriores</h2>
          <ul className="space-y-2">
            {submission.versions.slice(1).map((v) => (
              <li key={v.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">
                  v{v.versionNumber} · {v.originalName} · {formatDate(v.createdAt)}
                </span>
                <a href={`/api/files/${v.id}`} className="text-ink-soft hover:text-accent underline">
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
