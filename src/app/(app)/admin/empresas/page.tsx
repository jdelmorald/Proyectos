import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/session";
import { CompanyForm } from "@/components/CompanyForm";

export default async function EmpresasPage() {
  await requireAdminAccess();

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, submissions: true } } },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Empresas del grupo</h1>

      <CompanyForm />

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2">Empresa</th>
              <th className="text-left font-medium px-4 py-2">Usuarios</th>
              <th className="text-left font-medium px-4 py-2">Documentos</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-600">{c._count.users}</td>
                <td className="px-4 py-3 text-slate-600">{c._count.submissions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
