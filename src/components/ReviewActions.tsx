"use client";

import { useActionState, useState } from "react";
import {
  approveSubmission,
  gerenteApproveSubmission,
  objectSubmission,
  rejectSubmission,
} from "@/lib/actions/submissions";

const initialState = null;

type ReviewMode = "director" | "gerente";

const textareaClass =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2";

export function ReviewActions({
  submissionId,
  mode,
}: {
  submissionId: string;
  mode: ReviewMode;
}) {
  const [panel, setPanel] = useState<"none" | "object" | "reject">("none");

  const approveFn = mode === "gerente" ? gerenteApproveSubmission : approveSubmission;
  const approveLabel =
    mode === "gerente" ? "Aprobar y enviar a Dirección General" : "Aprobar";
  const approvingLabel = mode === "gerente" ? "Enviando..." : "Aprobando...";

  const [approveState, approveAction, approvePending] = useActionState(approveFn, initialState);
  const [objectState, objectAction, objectPending] = useActionState(objectSubmission, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectSubmission, initialState);

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
      <h2 className="text-xs uppercase tracking-wide text-ink-soft">Tu decisión</h2>

      {panel === "none" && (
        <div className="flex flex-wrap gap-2">
          <form action={approveAction}>
            <input type="hidden" name="submissionId" value={submissionId} />
            <button
              type="submit"
              disabled={approvePending}
              className="rounded-lg bg-emerald-700 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              {approvePending ? approvingLabel : approveLabel}
            </button>
          </form>
          <button
            onClick={() => setPanel("object")}
            className="rounded-lg border border-amber-300 text-amber-800 text-sm font-medium px-4 py-2 hover:bg-amber-50 transition-colors"
          >
            Objetar
          </button>
          <button
            onClick={() => setPanel("reject")}
            className="rounded-lg border border-red-300 text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-50 transition-colors"
          >
            Rechazar
          </button>
        </div>
      )}

      {panel === "object" && (
        <form action={objectAction} className="space-y-2.5">
          <input type="hidden" name="submissionId" value={submissionId} />
          <label className="block text-xs uppercase tracking-wide text-ink-soft">
            Motivo de la objeción (obligatorio)
          </label>
          <textarea
            name="comment"
            required
            rows={3}
            className={`${textareaClass} focus:ring-amber-400/40 focus:border-amber-400`}
            placeholder="Indica qué debe corregirse antes de aprobar..."
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={objectPending}
              className="rounded-lg bg-amber-700 text-white text-sm font-medium px-4 py-2 hover:bg-amber-800 disabled:opacity-50 transition-colors"
            >
              {objectPending ? "Enviando..." : "Enviar objeción"}
            </button>
            <button
              type="button"
              onClick={() => setPanel("none")}
              className="text-sm text-ink-soft px-2 hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {panel === "reject" && (
        <form action={rejectAction} className="space-y-2.5">
          <input type="hidden" name="submissionId" value={submissionId} />
          <label className="block text-xs uppercase tracking-wide text-ink-soft">
            Motivo del rechazo definitivo (obligatorio)
          </label>
          <textarea
            name="comment"
            required
            rows={3}
            className={`${textareaClass} focus:ring-red-400/40 focus:border-red-400`}
            placeholder="Este documento quedará cerrado, sin posibilidad de reenvío..."
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={rejectPending}
              className="rounded-lg bg-red-700 text-white text-sm font-medium px-4 py-2 hover:bg-red-800 disabled:opacity-50 transition-colors"
            >
              {rejectPending ? "Enviando..." : "Rechazar definitivamente"}
            </button>
            <button
              type="button"
              onClick={() => setPanel("none")}
              className="text-sm text-ink-soft px-2 hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {approveState && "error" in approveState && (
        <p className="text-sm text-red-700">{approveState.error}</p>
      )}
      {objectState && "error" in objectState && (
        <p className="text-sm text-red-700">{objectState.error}</p>
      )}
      {rejectState && "error" in rejectState && (
        <p className="text-sm text-red-700">{rejectState.error}</p>
      )}
    </div>
  );
}
