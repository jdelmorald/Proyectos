import { Link } from 'react-router-dom';
import { DOCUMENT_TYPES } from '../config/documentTypes';

const GRUPOS = ['Comercial', 'Depósito y Logística', 'Administrativo'] as const;

const COLOR_FAMILIA: Record<string, string> = {
  comercial: 'border-accent-200 bg-accent-50',
  acta: 'border-amber-200 bg-amber-50',
  comprobante: 'border-emerald-200 bg-emerald-50',
};

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Panel principal</h1>
      <p className="text-slate-500 mb-6">
        Genera cualquier documento operativo de Salud San Marcos con numeración correlativa automática.
      </p>

      {GRUPOS.map((grupo) => (
        <div key={grupo} className="mb-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-3">{grupo}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DOCUMENT_TYPES.filter((t) => t.grupoMenu === grupo).map((t) => (
              <Link
                key={t.key}
                to={`/documentos/${t.key}/nuevo`}
                className={`rounded-lg border p-4 hover:shadow-md transition ${COLOR_FAMILIA[t.familia]}`}
              >
                <div className="font-semibold text-slate-800">{t.label}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {t.fiscal ? 'Documento fiscal · ' : ''}Prefijo {t.prefijo}
                </div>
                <div className="text-brand-700 text-sm mt-2 font-medium">+ Generar nuevo</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
