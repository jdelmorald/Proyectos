export type AppRole = "ADMINISTRADOR" | "DIRECTOR" | "GERENTE" | "COLABORADOR";

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMINISTRADOR: "Administrador de la plataforma",
  DIRECTOR: "Director general",
  GERENTE: "Gerente",
  COLABORADOR: "Colaborador",
};

export function isAdminRole(role: AppRole) {
  return role === "ADMINISTRADOR" || role === "DIRECTOR";
}

export function canReviewSubmissions(role: AppRole) {
  return role === "DIRECTOR" || role === "GERENTE";
}

type SessionUser = { id: string; role: AppRole; companyId: string | null };
type SubmissionScope = { authorId: string; companyId: string };

/** Whether a user may view a given submission (read access only). */
export function canViewSubmission(user: SessionUser, submission: SubmissionScope) {
  if (submission.authorId === user.id) return true;
  if (isAdminRole(user.role)) return true;
  if (user.role === "GERENTE") return submission.companyId === user.companyId;
  return false;
}
