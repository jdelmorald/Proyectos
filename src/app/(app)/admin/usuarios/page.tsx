import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/session";
import { CreateUserForm } from "@/components/CreateUserForm";
import { ToggleUserButton } from "@/components/ToggleUserButton";
import { ROLE_LABELS } from "@/lib/roles";

export default async function UsuariosPage() {
  const currentUser = await requireAdminAccess();

  const [users, companies] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" }, include: { company: true } }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-2xl text-ink">Usuarios</h1>

      {companies.length === 0 ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
          Primero crea una empresa en la sección Empresas antes de invitar colaboradores o gerentes.
        </p>
      ) : (
        <CreateUserForm companies={companies.map((c) => ({ id: c.id, name: c.name }))} />
      )}

      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-ink-soft text-[11px] uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium px-5 py-3">Nombre</th>
              <th className="text-left font-medium px-5 py-3">Correo</th>
              <th className="text-left font-medium px-5 py-3">Rol</th>
              <th className="text-left font-medium px-5 py-3">Empresa</th>
              <th className="text-left font-medium px-5 py-3">Estado</th>
              <th className="text-left font-medium px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-5 py-3.5 font-medium text-ink">{u.name}</td>
                <td className="px-5 py-3.5 text-ink-soft">{u.email}</td>
                <td className="px-5 py-3.5 text-ink-soft">{ROLE_LABELS[u.role]}</td>
                <td className="px-5 py-3.5 text-ink-soft">{u.company?.name ?? "—"}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      u.active ? "text-emerald-800" : "text-ink-soft"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${u.active ? "bg-emerald-600" : "bg-ink-soft"}`}
                    />
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {u.id !== currentUser.id && <ToggleUserButton userId={u.id} active={u.active} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
