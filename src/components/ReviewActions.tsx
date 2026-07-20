"use client";

import { useActionState, useState } from "react";
import { approveSubmission, objectSubmission, rejectSubmission } from "@/lib/actions/submissions";

const initialState = null;

export function ReviewActions({ submissionId }: { submissionId: string }) {
  const [mode, setMode] = useState<"none" | "object" | "reject">("none");

  const [approveState, approveAction, approvePending] = useActionState(approveSubmission, initialState);
  const [objectState, objectAction, objectPending] = useActionState(objectSubmission, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectSubmission, initialState);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">Tu decisión</h2>

      {mode === "none" && (
        <div className="flex flex-wrap gap-2">
          <form action={approveAction}>
            <input type="hidden" name="submissionId" value={submissionId} />
            <button
              type="submit"
              disabled={approvePending}
              className="rounded-md bg-green-700 text-white text-sm font-medium px-4 py-2 hover:bg-green-800 disabled:opacity-50"
            >
              {approvePending ? "Aprobando..." : "Aprobar"}
            </button>
          </form>
          <button
            onClick={() => setMode("object")}
            className="rounded-md border border-amber-300 text-amber-800 text-sm font-medium px-4 py-2 hover:bg-amber-50"
          >
            Objetar
          </button>
          <button
            onClick={() => setMode("reject")}
            className="rounded-md border border-red-300 text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-50"
          >
            Rechazar
          </button>
        </div>
      )}

      {mode === "object" && (
        <form action={objectAction} className="space-y-2">
          <input type="hidden" name="submissionId" value={submissionId} />
          <label className="block text-sm font-medium text-slate-700">
            Motivo de la objeción (obligatorio)
          </label>
          <textarea
            name="comment"
            required
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            placeholder="Indica qué debe corregirse antes de aprobar..."
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={objectPending}
              className="rounded-md bg-amber-700 text-white text-sm font-medium px-4 py-2 hover:bg-amber-800 disabled:opacity-50"
            >
              {objectPending ? "Enviando..." : "Enviar objeción"}
            </button>
            <button
              type="button"
              onClick={() => setMode("none")}
              className="text-sm text-slate-500 px-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {mode === "reject" && (
        <form action={rejectAction} className="space-y-2">
          <input type="hidden" name="submissionId" value={submissionId} />
          <label className="block text-sm font-medium text-slate-700">
            Motivo del rechazo definitivo (obligatorio)
          </label>
          <textarea
            name="comment"
            required
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
            placeholder="Este documento quedará cerrado, sin posibilidad de reenvío..."
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={rejectPending}
              className="rounded-md bg-red-700 text-white text-sm font-medium px-4 py-2 hover:bg-red-800 disabled:opacity-50"
            >
              {rejectPending ? "Enviando..." : "Rechazar definitivamente"}
            </button>
            <button
              type="button"
              onClick={() => setMode("none")}
              className="text-sm text-slate-500 px-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {approveState && "error" in approveState && (
        <p className="text-sm text-red-600">{approveState.error}</p>
      )}
      {objectState && "error" in objectState && (
        <p className="text-sm text-red-600">{objectState.error}</p>
      )}
      {rejectState && "error" in rejectState && (
        <p className="text-sm text-red-600">{rejectState.error}</p>
      )}
    </div>
  );
}
