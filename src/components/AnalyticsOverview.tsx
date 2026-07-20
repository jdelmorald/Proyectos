import { CompanyLogo } from "@/components/CompanyLogo";
import { STATUS_KEYS, type CompanyBreakdown, type StatusCounts } from "@/lib/analytics";
import { STATUS_HEX, STATUS_SHORT_LABELS } from "@/lib/validation";

function StatTile({ label, value, hex }: { label: string; value: number; hex?: string }) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-4">
      <div className="flex items-center gap-1.5 mb-2">
        {hex && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hex }} />}
        <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      </div>
      <p className="font-display text-3xl text-ink">{value}</p>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5">
      {STATUS_KEYS.map((key) => (
        <span key={key} className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_HEX[key] }} />
          {STATUS_SHORT_LABELS[key]}
        </span>
      ))}
    </div>
  );
}

function CompanyStackedBar({
  company,
  maxTotal,
}: {
  company: CompanyBreakdown;
  maxTotal: number;
}) {
  const widthPct = company.total === 0 ? 0 : Math.max((company.total / maxTotal) * 100, 6);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-52 shrink-0">
        <CompanyLogo name={company.companyName} logoPath={company.logoPath} size={18} />
        <span className="text-sm text-ink truncate">{company.companyName}</span>
      </div>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-3 rounded-full bg-paper overflow-hidden flex gap-[2px]" style={{ width: `${widthPct}%` }}>
          {STATUS_KEYS.filter((key) => company.counts[key] > 0).map((key) => (
            <div
              key={key}
              style={{ flexGrow: company.counts[key], backgroundColor: STATUS_HEX[key] }}
              title={`${STATUS_SHORT_LABELS[key]}: ${company.counts[key]}`}
            />
          ))}
        </div>
        <span className="text-xs text-ink-soft w-6 text-right shrink-0">{company.total}</span>
      </div>
    </div>
  );
}

function ObjectionsBar({
  company,
  maxObjections,
}: {
  company: CompanyBreakdown;
  maxObjections: number;
}) {
  const widthPct =
    company.objections === 0 || maxObjections === 0
      ? 0
      : Math.max((company.objections / maxObjections) * 100, 4);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-52 shrink-0">
        <CompanyLogo name={company.companyName} logoPath={company.logoPath} size={18} />
        <span className="text-sm text-ink truncate">{company.companyName}</span>
      </div>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-2.5 rounded-full bg-paper overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${widthPct}%`, backgroundColor: STATUS_HEX.OBJETADO }}
            title={`${company.objections} objeción(es)`}
          />
        </div>
        <span className="text-xs text-ink-soft w-6 text-right shrink-0">{company.objections}</span>
      </div>
    </div>
  );
}

export function AnalyticsOverview({
  statusOverview,
  companyBreakdown,
}: {
  statusOverview: StatusCounts;
  companyBreakdown: CompanyBreakdown[];
}) {
  const total = STATUS_KEYS.reduce((sum, key) => sum + statusOverview[key], 0);
  const maxTotal = Math.max(1, ...companyBreakdown.map((c) => c.total));
  const maxObjections = Math.max(0, ...companyBreakdown.map((c) => c.objections));
  const hasData = total > 0;

  return (
    <div className="space-y-8 mb-10">
      <div>
        <h2 className="text-xs uppercase tracking-wide text-ink-soft mb-3">Panorama general</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatTile label="Total" value={total} />
          {STATUS_KEYS.map((key) => (
            <StatTile
              key={key}
              label={STATUS_SHORT_LABELS[key]}
              value={statusOverview[key]}
              hex={STATUS_HEX[key]}
            />
          ))}
        </div>
      </div>

      {hasData ? (
        <>
          <div className="bg-surface border border-line rounded-2xl p-5">
            <h2 className="text-xs uppercase tracking-wide text-ink-soft mb-1">
              Documentos por empresa
            </h2>
            <p className="text-xs text-ink-soft/70 mb-4">
              Largo de la barra = volumen total enviado por la empresa.
            </p>
            <Legend />
            <div className="space-y-3.5">
              {companyBreakdown.map((c) => (
                <CompanyStackedBar key={c.companyId} company={c} maxTotal={maxTotal} />
              ))}
            </div>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-5">
            <h2 className="text-xs uppercase tracking-wide text-ink-soft mb-1">
              Objeciones por empresa
            </h2>
            <p className="text-xs text-ink-soft/70 mb-4">
              Cantidad de veces que un documento de esa empresa fue objetado.
            </p>
            <div className="space-y-3.5">
              {companyBreakdown.map((c) => (
                <ObjectionsBar key={c.companyId} company={c} maxObjections={maxObjections} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-soft bg-surface border border-line rounded-2xl p-6 text-center">
          Aún no hay documentos para mostrar estadísticas.
        </p>
      )}
    </div>
  );
}
