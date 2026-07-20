"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { saveUploadedFile, isAllowedFile } from "@/lib/storage";

type ActionResult = { error: string } | { success: true };

const DOCUMENT_TYPES = ["PRESUPUESTO", "PROYECTO", "REPORTE", "CONTRATO", "OTRO"] as const;

export async function createSubmission(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  if (user.role !== "COLABORADOR") {
    return { error: "Solo los colaboradores pueden crear documentos." };
  }
  if (!user.companyId) {
    return { error: "Tu cuenta no tiene una empresa asignada. Contacta al director." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "OTRO");
  const file = formData.get("file");

  if (!title) return { error: "El título es obligatorio." };
  if (!DOCUMENT_TYPES.includes(type as (typeof DOCUMENT_TYPES)[number])) {
    return { error: "Tipo de documento inválido." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Debes adjuntar un archivo." };
  }
  if (!isAllowedFile(file.type, file.size)) {
    return {
      error:
        "Archivo no permitido. Formatos aceptados: Word, Excel, PowerPoint, PDF, imágenes. Máximo 25 MB.",
    };
  }

  const { storedName } = await saveUploadedFile(file);

  const submission = await prisma.submission.create({
    data: {
      title,
      description: description || null,
      type: type as (typeof DOCUMENT_TYPES)[number],
      status: "ENVIADO",
      currentVersion: 1,
      companyId: user.companyId,
      authorId: user.id,
      versions: {
        create: {
          versionNumber: 1,
          originalName: file.name,
          storedName,
          mimeType: file.type,
          fileSize: file.size,
          note: description || null,
          uploadedById: user.id,
        },
      },
    },
    include: { versions: true },
  });

  await prisma.historyEvent.create({
    data: {
      submissionId: submission.id,
      versionId: submission.versions[0].id,
      actorId: user.id,
      action: "ENVIADO",
      comment: description || null,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/submissions/${submission.id}`);
}

/** Can this user object/approve-forward/reject the submission at its current status? */
function getReviewPermission(
  user: { role: string; companyId: string | null },
  submission: { status: string; companyId: string }
) {
  if (user.role === "DIRECTOR") {
    return submission.status === "ENVIADO" || submission.status === "EN_REVISION_DIRECCION";
  }
  if (user.role === "GERENTE") {
    return submission.status === "ENVIADO" && submission.companyId === user.companyId;
  }
  return false;
}

export async function gerenteApproveSubmission(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  if (user.role !== "GERENTE") return { error: "No autorizado." };

  const submissionId = String(formData.get("submissionId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return { error: "Documento no encontrado." };
  if (submission.companyId !== user.companyId) return { error: "No autorizado." };
  if (submission.status !== "ENVIADO") {
    return { error: "Solo se pueden aprobar documentos pendientes de revisión." };
  }

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submissionId },
      data: { status: "EN_REVISION_DIRECCION" },
    }),
    prisma.historyEvent.create({
      data: {
        submissionId,
        actorId: user.id,
        action: "APROBADO_GERENTE",
        comment: comment || null,
      },
    }),
  ]);

  revalidatePath(`/submissions/${submissionId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function objectSubmission(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  const submissionId = String(formData.get("submissionId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!comment) return { error: "Debes indicar el motivo de la objeción." };

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return { error: "Documento no encontrado." };
  if (!getReviewPermission(user, submission)) return { error: "No autorizado." };

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submissionId },
      data: { status: "OBJETADO" },
    }),
    prisma.historyEvent.create({
      data: {
        submissionId,
        actorId: user.id,
        action: "OBJETADO",
        comment,
      },
    }),
  ]);

  revalidatePath(`/submissions/${submissionId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function approveSubmission(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  if (user.role !== "DIRECTOR") return { error: "No autorizado." };

  const submissionId = String(formData.get("submissionId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return { error: "Documento no encontrado." };
  if (!getReviewPermission(user, submission)) {
    return { error: "Solo se pueden aprobar documentos pendientes de revisión." };
  }

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submissionId },
      data: { status: "APROBADO" },
    }),
    prisma.historyEvent.create({
      data: {
        submissionId,
        actorId: user.id,
        action: "APROBADO",
        comment: comment || null,
      },
    }),
  ]);

  revalidatePath(`/submissions/${submissionId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rejectSubmission(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  const submissionId = String(formData.get("submissionId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!comment) return { error: "Debes indicar el motivo del rechazo." };

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return { error: "Documento no encontrado." };
  if (!getReviewPermission(user, submission)) return { error: "No autorizado." };

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submissionId },
      data: { status: "RECHAZADO" },
    }),
    prisma.historyEvent.create({
      data: {
        submissionId,
        actorId: user.id,
        action: "RECHAZADO",
        comment,
      },
    }),
  ]);

  revalidatePath(`/submissions/${submissionId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function resubmitVersion(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  const submissionId = String(formData.get("submissionId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const file = formData.get("file");

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return { error: "Documento no encontrado." };
  if (submission.authorId !== user.id) return { error: "No autorizado." };
  if (submission.status !== "OBJETADO") {
    return { error: "Solo se pueden reenviar documentos objetados." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Debes adjuntar la nueva versión del archivo." };
  }
  if (!isAllowedFile(file.type, file.size)) {
    return {
      error:
        "Archivo no permitido. Formatos aceptados: Word, Excel, PowerPoint, PDF, imágenes. Máximo 25 MB.",
    };
  }

  const { storedName } = await saveUploadedFile(file);
  const nextVersion = submission.currentVersion + 1;

  const version = await prisma.documentVersion.create({
    data: {
      submissionId,
      versionNumber: nextVersion,
      originalName: file.name,
      storedName,
      mimeType: file.type,
      fileSize: file.size,
      note: note || null,
      uploadedById: user.id,
    },
  });

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submissionId },
      data: { status: "ENVIADO", currentVersion: nextVersion },
    }),
    prisma.historyEvent.create({
      data: {
        submissionId,
        versionId: version.id,
        actorId: user.id,
        action: "REENVIADO",
        comment: note || null,
      },
    }),
  ]);

  revalidatePath(`/submissions/${submissionId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
