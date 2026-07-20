import { prisma } from "@/lib/prisma";

export const STATUS_KEYS = [
  "ENVIADO",
  "EN_REVISION_DIRECCION",
  "OBJETADO",
  "APROBADO",
  "RECHAZADO",
] as const;

export type StatusCounts = Record<(typeof STATUS_KEYS)[number], number>;

function emptyCounts(): StatusCounts {
  return { ENVIADO: 0, EN_REVISION_DIRECCION: 0, OBJETADO: 0, APROBADO: 0, RECHAZADO: 0 };
}

export async function getStatusOverview(): Promise<StatusCounts> {
  const rows = await prisma.submission.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = emptyCounts();
  for (const r of rows) counts[r.status] = r._count._all;
  return counts;
}

export type CompanyBreakdown = {
  companyId: string;
  companyName: string;
  logoPath: string | null;
  total: number;
  counts: StatusCounts;
  objections: number;
};

export async function getCompanyBreakdown(): Promise<CompanyBreakdown[]> {
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

  const rows = await Promise.all(
    companies.map(async (c) => {
      const [statusRows, objections] = await Promise.all([
        prisma.submission.groupBy({
          by: ["status"],
          where: { companyId: c.id },
          _count: { _all: true },
        }),
        prisma.historyEvent.count({
          where: { action: "OBJETADO", submission: { companyId: c.id } },
        }),
      ]);

      const counts = emptyCounts();
      let total = 0;
      for (const r of statusRows) {
        counts[r.status] = r._count._all;
        total += r._count._all;
      }

      return {
        companyId: c.id,
        companyName: c.name,
        logoPath: c.logoPath,
        total,
        counts,
        objections,
      };
    })
  );

  return rows.sort((a, b) => b.total - a.total);
}
