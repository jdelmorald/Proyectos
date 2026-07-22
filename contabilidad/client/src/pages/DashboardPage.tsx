import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Wallet, Landmark, PiggyBank, TrendingUp, NotebookPen, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { api } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import { formatearMonto } from '../utils/formato';

interface SerieMes {
  mes: string;
  ingresos: number;
  costos: number;
  gastos: number;
  utilidad: number;
}
interface GastoCuenta {
  id: number;
  codigo: string;
  nombre: string;
  saldo: number;
}
interface AsientoReciente {
  id: number;
  numero: string;
  fecha: string;
  descripcion: string | null;
  monto: number;
}
interface DashboardData {
  totalActivo: number;
  totalPasivo: number;
  totalPatrimonio: number;
  utilidadNeta: number;
  totalIngresos: number;
  totalGastos: number;
  ebitda: number;
  depreciacionYAmortizacion: number;
  gastosFinancieros: number;
  serieMensual: SerieMes[];
  gastosPorCuenta: GastoCuenta[];
  asientosRecientes: AsientoReciente[];
}

const DONUT_COLORS = ['#ea580c', '#0e7490', '#6d28d9', '#b8923e', '#059669', '#be123c', '#64748b'];
const MES_LABEL: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

const fmt = formatearMonto;

function StatCard({
  icon,
  label,
  value,
  moneda,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  moneda: string;
  tone: 'blue' | 'red' | 'purple' | 'green' | 'amber';
}) {
  const tones = {
    blue: 'bg-sky-50 text-sky-600',
    red: 'bg-rose-50 text-rose-600',
    purple: 'bg-violet-50 text-violet-600',
    green: 'bg-accent-50 text-accent-700',
    amber: 'bg-amber-50 text-amber-600',
  }[tone];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tones}`}>{icon}</div>
      </div>
      <div className="text-xs font-medium text-slate-400">{label}</div>
      <div className="text-2xl font-display font-semibold text-brand-900 mt-0.5">
        {moneda} {fmt(value)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { empresa, empresaId } = useEmpresa();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    api.get<DashboardData>(`/reportes/dashboard?empresaId=${empresaId}`).then(setData);
  }, [empresaId]);

  const moneda = empresa?.moneda ?? 'Bs.';
  const serie = (data?.serieMensual ?? []).map((s) => ({
    ...s,
    label: MES_LABEL[s.mes.slice(5, 7)] ?? s.mes,
  }));
  const gastos = data?.gastosPorCuenta ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-semibold text-brand-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">{empresa ? `Panel financiero de ${empresa.nombre}, año en curso.` : ''}</p>
      </div>

      {!data ? (
        <div className="text-slate-400">Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard icon={<Landmark size={19} />} label="Total Activo" value={data.totalActivo} moneda={moneda} tone="blue" />
            <StatCard icon={<Wallet size={19} />} label="Total Pasivo" value={data.totalPasivo} moneda={moneda} tone="red" />
            <StatCard icon={<PiggyBank size={19} />} label="Patrimonio" value={data.totalPatrimonio} moneda={moneda} tone="purple" />
            <StatCard icon={<TrendingUp size={19} />} label="Utilidad Neta (año)" value={data.utilidadNeta} moneda={moneda} tone="green" />
            <StatCard icon={<Activity size={19} />} label="EBITDA (año)" value={data.ebitda} moneda={moneda} tone="amber" />
          </div>
          <p className="text-xs text-slate-400 -mt-3 mb-6">
            EBITDA = Utilidad Neta + Depreciación/Amortización ({moneda} {fmt(data.depreciacionYAmortizacion)}) + Gastos Financieros ({moneda} {fmt(data.gastosFinancieros)}). Se identifican por el nombre de la cuenta de gasto — si renombras esas cuentas, revisa que el cálculo las siga reconociendo.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold text-brand-900">Ingresos vs. Gastos</div>
                  <div className="text-xs text-slate-400">Por mes — año en curso</div>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500"><span className="h-2 w-2 rounded-full bg-accent-500" /> Ingresos</span>
                  <span className="flex items-center gap-1.5 text-slate-500"><span className="h-2 w-2 rounded-full bg-rose-400" /> Gastos</span>
                </div>
              </div>
              {serie.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-300 text-sm">Aún no hay movimientos este año</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={serie} margin={{ left: -18, right: 8 }}>
                    <defs>
                      <linearGradient id="ingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f6" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={54} />
                    <Tooltip
                      formatter={(v) => `${moneda} ${fmt(Number(v))}`}
                      contentStyle={{ borderRadius: 12, border: '1px solid #eef1f6', fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="ingresos" stroke="#059669" strokeWidth={2.5} fill="url(#ingGrad)" />
                    <Area type="monotone" dataKey="gastos" stroke="#e11d48" strokeWidth={2.5} fill="url(#gasGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="font-semibold text-brand-900 mb-1">Distribución de Gastos</div>
              <div className="text-xs text-slate-400 mb-2">Año en curso</div>
              {gastos.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-slate-300 text-sm">Sin gastos registrados</div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={gastos} dataKey="saldo" nameKey="nombre" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {gastos.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${moneda} ${fmt(Number(v))}`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="space-y-1.5 mt-2">
                {gastos.slice(0, 5).map((g, i) => (
                  <div key={g.id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 truncate">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="truncate">{g.nombre}</span>
                    </span>
                    <span className="text-slate-400 shrink-0 ml-2">{fmt(g.saldo)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-brand-900">Asientos Recientes</div>
                <Link to="/asientos" className="text-xs text-accent-700 hover:underline">Ver todos</Link>
              </div>
              <div className="divide-y divide-slate-50">
                {data.asientosRecientes.length === 0 && (
                  <div className="text-sm text-slate-400 py-4">Aún no hay asientos registrados</div>
                )}
                {data.asientosRecientes.map((a) => (
                  <Link key={a.id} to={`/asientos/${a.id}`} className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                        <NotebookPen size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-brand-900 truncate">{a.descripcion || a.numero}</div>
                        <div className="text-xs text-slate-400">{a.numero} · {a.fecha}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700 shrink-0 ml-3">{moneda} {fmt(a.monto)}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="font-semibold text-brand-900 mb-3">Accesos Rápidos</div>
              <div className="space-y-2">
                <Link to="/asientos/nuevo" className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 text-sm text-slate-700 hover:border-accent-300 hover:bg-accent-50/40 transition">
                  Registrar Asiento <ArrowUpRight size={15} className="text-slate-300" />
                </Link>
                <Link to="/libro-compras" className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 text-sm text-slate-700 hover:border-accent-300 hover:bg-accent-50/40 transition">
                  Registrar Compra <ArrowDownRight size={15} className="text-slate-300" />
                </Link>
                <Link to="/libro-ventas" className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 text-sm text-slate-700 hover:border-accent-300 hover:bg-accent-50/40 transition">
                  Registrar Venta <ArrowUpRight size={15} className="text-slate-300" />
                </Link>
                <Link to="/reportes/balance-general" className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 text-sm text-slate-700 hover:border-accent-300 hover:bg-accent-50/40 transition">
                  Ver Balance General <ArrowUpRight size={15} className="text-slate-300" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
