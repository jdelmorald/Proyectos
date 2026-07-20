import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/session";
import { CompanyForm } from "@/components/CompanyForm";
import { CompanyLogo } from "@/components/CompanyLogo";

export default async function EmpresasPage() {
  await requireAdminAccess();

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, submissions: true } } },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-2xl text-ink">Empresas del grupo</h1>

      <CompanyForm />

      <div className="grid sm:grid-cols-2 gap-3">
        {companies.map((c) => (
          <div
            key={c.id}
            className="bg-surface border border-line rounded-2xl p-4 flex items-center gap-3"
          >
            <CompanyLogo name={c.name} logoPath={c.logoPath} size={44} />
            <div className="min-w-0">
              <p className="font-medium text-ink truncate">{c.name}</p>
              <p className="text-xs text-ink-soft mt-0.5">
                {c._count.users} usuario(s) · {c._count.submissions} documento(s)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
