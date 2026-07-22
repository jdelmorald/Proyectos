import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import BotonesExportar from '../components/BotonesExportar';

interface Cuenta {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto' | 'costo';
  naturaleza: 'deudora' | 'acreedora';
  cuenta_padre_id: number | null;
  nivel: number;
  permite_movimiento: number;
  es_efectivo: number;
  actividad_flujo: 'operacion' | 'inversion' | 'financiamiento' | null;
  subledger: 'cxc' | 'cxp' | null;
}

const TIPO_LABEL: Record<string, string> = {
  activo: 'Activo', pasivo: 'Pasivo', patrimonio: 'Patrimonio', ingreso: 'Ingreso', gasto: 'Gasto', costo: 'Costo',
};

const VACIO = {
  codigo: '', nombre: '', tipo: 'activo' as Cuenta['tipo'], naturaleza: 'deudora' as Cuenta['naturaleza'],
  cuentaPadreId: '' as string | number, nivel: 1, permiteMovimiento: true, esEfectivo: false,
  actividadFlujo: '' as '' | 'operacion' | 'inversion' | 'financiamiento',
  subledger: '' as '' | 'cxc' | 'cxp',
};

export default function PlanCuentasPage() {
  const { empresaId, empresa } = useEmpresa();
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!empresaId) return;
    setCuentas(await api.get<Cuenta[]>(`/plan-cuentas?empresaId=${empresaId}`));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!empresaId) return;
    try {
      await api.post('/plan-cuentas', {
        empresaId,
        codigo: form.codigo,
        nombre: form.nombre,
        tipo: form.tipo,
        naturaleza: form.naturaleza,
        cuentaPadreId: form.cuentaPadreId ? Number(form.cuentaPadreId) : null,
        nivel: form.nivel,
        permiteMovimiento: form.permiteMovimiento,
        esEfectivo: form.esEfectivo,
        actividadFlujo: form.actividadFlujo || null,
        subledger: form.subledger || null,
      });
      setForm(VACIO);
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar esta cuenta?')) return;
    try {
      await api.delete(`/plan-cuentas/${id}`);
      cargar();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-display font-semibold text-slate-800">Plan de Cuentas</h1>
        <div className="flex items-center gap-3">
          <BotonesExportar
            empresa={empresa}
            titulo="Plan de Cuentas"
            nombreArchivo="plan-de-cuentas"
            columnas={[
              { header: 'Código', key: 'codigo' },
              { header: 'Nombre', key: 'nombre' },
              { header: 'Tipo', key: 'tipo' },
              { header: 'Naturaleza', key: 'naturaleza' },
              { header: 'Detalle', key: 'detalle' },
            ]}
            filas={cuentas.map((c) => ({
              codigo: c.codigo,
              nombre: c.nombre,
              tipo: TIPO_LABEL[c.tipo],
              naturaleza: c.naturaleza,
              detalle: c.permite_movimiento ? 'Movimiento' : 'Agrupación',
            }))}
          />
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {mostrarForm ? 'Cancelar' : '+ Nueva cuenta'}
          </button>
        </div>
      </div>

      {mostrarForm && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            required
            placeholder="Código (ej. 1.1.07)"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            required
            placeholder="Nombre de la cuenta"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
          />
          <select
            value={form.cuentaPadreId}
            onChange={(e) => setForm({ ...form, cuentaPadreId: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">-- Sin cuenta padre --</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
            ))}
          </select>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as Cuenta['tipo'] })}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select
            value={form.naturaleza}
            onChange={(e) => setForm({ ...form, naturaleza: e.target.value as Cuenta['naturaleza'] })}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="deudora">Deudora</option>
            <option value="acreedora">Acreedora</option>
          </select>
          <input
            type="number"
            min={1}
            value={form.nivel}
            onChange={(e) => setForm({ ...form, nivel: Number(e.target.value) })}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="Nivel"
          />
          <select
            value={form.actividadFlujo}
            onChange={(e) => setForm({ ...form, actividadFlujo: e.target.value as typeof form.actividadFlujo })}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Actividad flujo de efectivo (opcional)</option>
            <option value="operacion">Operación</option>
            <option value="inversion">Inversión</option>
            <option value="financiamiento">Financiamiento</option>
          </select>
          <select
            value={form.subledger}
            onChange={(e) => setForm({ ...form, subledger: e.target.value as typeof form.subledger })}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Subcuenta CxC/CxP (opcional)</option>
            <option value="cxc">Cuentas por Cobrar</option>
            <option value="cxp">Cuentas por Pagar</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.permiteMovimiento} onChange={(e) => setForm({ ...form, permiteMovimiento: e.target.checked })} />
            Permite movimientos (cuenta de detalle)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.esEfectivo} onChange={(e) => setForm({ ...form, esEfectivo: e.target.checked })} />
            Es cuenta de efectivo (caja/banco)
          </label>
          {error && <div className="text-sm text-red-600 md:col-span-4">{error}</div>}
          <div className="md:col-span-4">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Guardar cuenta
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Naturaleza</th>
              <th className="px-4 py-2">Detalle</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs">{c.codigo}</td>
                <td className="px-4 py-2" style={{ paddingLeft: `${1 + (c.nivel - 1) * 1.25}rem` }}>
                  <span className={c.permite_movimiento ? '' : 'font-bold text-slate-800'}>{c.nombre}</span>
                  {c.es_efectivo ? <span className="ml-2 text-xs text-accent-700">💵</span> : null}
                  {c.subledger ? (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                      {c.subledger === 'cxc' ? 'CxC' : 'CxP'}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2 text-xs text-slate-500">{TIPO_LABEL[c.tipo]}</td>
                <td className="px-4 py-2 text-xs text-slate-500">{c.naturaleza}</td>
                <td className="px-4 py-2 text-xs text-slate-500">{c.permite_movimiento ? 'Movimiento' : 'Agrupación'}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => eliminar(c.id)} className="text-red-600 hover:underline text-xs">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {cuentas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">Sin cuentas registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
