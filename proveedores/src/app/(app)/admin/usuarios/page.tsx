import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { CreateUserForm } from "@/components/CreateUserForm";
import { ToggleUserButton } from "@/components/ToggleUserButton";
import { ToggleCanEditButton } from "@/components/ToggleCanEditButton";
import { ToggleCanDeleteButton } from "@/components/ToggleCanDeleteButton";

export default async function UsuariosPage() {
  const currentUser = await requireAdmin();

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display font-bold text-2xl text-ink">Usuarios</h1>

      <CreateUserForm />

      <div className="glass-card rounded-[20px] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-ink-soft text-[11px] uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium px-5 py-3">Nombre</th>
              <th className="text-left font-medium px-5 py-3">Correo</th>
              <th className="text-left font-medium px-5 py-3">Permisos</th>
              <th className="text-left font-medium px-5 py-3">Estado</th>
              <th className="text-left font-medium px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-5 py-3.5 font-medium text-ink">{u.name}</td>
                <td className="px-5 py-3.5 text-ink-soft">{u.email}</td>
                <td className="px-5 py-3.5 text-ink-soft">
                  <div>{u.isAdmin ? "Administrador" : "Colaborador"}</div>
                  {!u.isAdmin && (
                    <div className="text-xs mt-0.5 space-y-0.5">
                      <div>
                        {u.canEditSuppliers ? (
                          <span className="text-emerald-800">Puede editar proveedores</span>
                        ) : (
                          <span className="text-ink-soft/70">Solo lectura e impresión</span>
                        )}
                      </div>
                      {u.canDeleteSuppliers && (
                        <div className="text-red-700">Puede eliminar proveedores</div>
                      )}
                    </div>
                  )}
                </td>
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
                <td className="px-5 py-3.5 space-y-1.5">
                  {!u.isAdmin && (
                    <>
                      <ToggleCanEditButton userId={u.id} canEditSuppliers={u.canEditSuppliers} />
                      <ToggleCanDeleteButton userId={u.id} canDeleteSuppliers={u.canDeleteSuppliers} />
                    </>
                  )}
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
