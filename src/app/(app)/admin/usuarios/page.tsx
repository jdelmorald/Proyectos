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
      <h1 className="text-xl font-semibold text-slate-900">Usuarios</h1>

      {companies.length === 0 ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
          Primero crea una empresa en la sección Empresas antes de invitar colaboradores o gerentes.
        </p>
      ) : (
        <CreateUserForm companies={companies.map((c) => ({ id: c.id, name: c.name }))} />
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2">Nombre</th>
              <th className="text-left font-medium px-4 py-2">Correo</th>
              <th className="text-left font-medium px-4 py-2">Rol</th>
              <th className="text-left font-medium px-4 py-2">Empresa</th>
              <th className="text-left font-medium px-4 py-2">Estado</th>
              <th className="text-left font-medium px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-600">{ROLE_LABELS[u.role]}</td>
                <td className="px-4 py-3 text-slate-600">{u.company?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      u.active
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
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
