import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import BotonesExportar from '../components/BotonesExportar';
import { formatearMonto } from '../utils/formato';

interface Cuenta {
  id: number;
  codigo: string;
  nombre: string;
  permite_movimiento: number;
  subledger: 'cxc' | 'cxp' | null;
}
interface CentroCosto { id: number; codigo: string; nombre: string }
interface Tercero { id: number; tipo: 'cliente' | 'proveedor'; nombre: string }

type Moneda = 'VES' | 'USD' | 'COP' | 'EUR';

interface LineaForm {
  cuentaId: number | '';
  descripcion: string;
  debe: string;
  haber: string;
  centroCostoId: number | '';
  terceroId: number | '';
  fechaVencimiento: string;
  moneda: Moneda;
  montoOriginal: string;
  tasaCambio: string;
}

interface AsientoDetalle {
  id: number;
  numero: string;
  fecha: string;
  tipo: string;
  descripcion: string | null;
  estado: 'registrado' | 'anulado';
  motivoAnulacion: string | null;
  creadoPorNombre: string | null;
  createdAt: string;
  lineas: {
    cuentaId: number; cuentaCodigo: string; cuentaNombre: string; descripcion: string | null; debe: number; haber: number;
    centroCostoNombre: string | null; terceroNombre: string | null; fechaVencimiento: string | null; moneda: string; montoOriginal: number | null; tasaCambio: number | null;
  }[];
}

const hoy = () => new Date().toISOString().slice(0, 10);
const LINEA_VACIA: LineaForm = {
  cuentaId: '', descripcion: '', debe: '', haber: '', centroCostoId: '', terceroId: '', fechaVencimiento: '',
  moneda: 'VES', montoOriginal: '', tasaCambio: '',
};

export default function AsientoFormPage() {
  const { id } = useParams<{ id?: string }>();
  const esNuevo = !id;
  const { empresaId, empresa } = useEmpresa();
  const navigate = useNavigate();

  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [fecha, setFecha] = useState(hoy());
  const [descripcion, setDescripcion] = useState('');
  const [lineas, setLineas] = useState<LineaForm[]>([{ ...LINEA_VACIA }, { ...LINEA_VACIA }]);
  const [asiento, setAsiento] = useState<AsientoDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!empresaId) return;
    api.get<Cuenta[]>(`/plan-cuentas?empresaId=${empresaId}`).then((c) => setCuentas(c.filter((x) => x.permite_movimiento)));
    api.get<CentroCosto[]>(`/centros-costo?empresaId=${empresaId}`).then(setCentrosCosto);
    api.get<Tercero[]>(`/terceros?empresaId=${empresaId}`).then(setTerceros);
  }, [empresaId]);

  useEffect(() => {
    if (esNuevo || !id) return;
    api.get<AsientoDetalle>(`/asientos/${id}`).then(setAsiento);
  }, [id, esNuevo]);

  function actualizarLinea(i: number, cambios: Partial<LineaForm>) {
    setLineas(lineas.map((l, idx) => (idx === i ? { ...l, ...cambios } : l)));
  }
  function agregarLinea() {
    setLineas([...lineas, { ...LINEA_VACIA }]);
  }
  function quitarLinea(i: number) {
    if (lineas.length <= 2) return;
    setLineas(lineas.filter((_, idx) => idx !== i));
  }

  function cuentaDe(l: LineaForm): Cuenta | undefined {
    return cuentas.find((c) => c.id === l.cuentaId);
  }

  function onCambiaMonedaExtranjera(i: number, montoOriginal: string, tasaCambio: string) {
    const monto = Number(montoOriginal) || 0;
    const tasa = Number(tasaCambio) || 0;
    const equivalente = (monto * tasa).toFixed(2);
    const l = lineas[i];
    actualizarLinea(i, {
      montoOriginal,
      tasaCambio,
      debe: l.debe && !l.haber ? equivalente : l.debe,
      haber: l.haber && !l.debe ? equivalente : l.haber,
    });
  }

  const totalDebe = lineas.reduce((s, l) => s + (Number(l.debe) || 0), 0);
  const totalHaber = lineas.reduce((s, l) => s + (Number(l.haber) || 0), 0);
  const cuadra = Math.round(totalDebe * 100) === Math.round(totalHaber * 100) && totalDebe > 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!empresaId) return;
    if (!cuadra) {
      setError('El asiento debe cuadrar: la suma del Debe debe ser igual a la suma del Haber, y mayor a cero.');
      return;
    }
    for (const l of lineas) {
      if (l.cuentaId === '') continue;
      const cuenta = cuentaDe(l);
      if (cuenta?.subledger && l.terceroId === '') {
        setError(`Debe seleccionar el ${cuenta.subledger === 'cxc' ? 'cliente' : 'proveedor'} en la línea de "${cuenta.nombre}"`);
        return;
      }
    }
    setGuardando(true);
    try {
      const creado = await api.post<AsientoDetalle>('/asientos', {
        empresaId,
        fecha,
        tipo: 'manual',
        descripcion: descripcion || null,
        lineas: lineas
          .filter((l) => l.cuentaId !== '')
          .map((l) => ({
            cuentaId: Number(l.cuentaId),
            descripcion: l.descripcion || undefined,
            debe: Number(l.debe) || 0,
            haber: Number(l.haber) || 0,
            centroCostoId: l.centroCostoId ? Number(l.centroCostoId) : null,
            terceroId: l.terceroId ? Number(l.terceroId) : null,
            fechaVencimiento: l.fechaVencimiento || null,
            moneda: l.moneda,
            montoOriginal: l.moneda !== 'VES' ? Number(l.montoOriginal) || null : null,
            tasaCambio: l.moneda !== 'VES' ? Number(l.tasaCambio) || null : null,
          })),
      });
      navigate(`/asientos/${creado.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrar el asiento');
    } finally {
      setGuardando(false);
    }
  }

  async function onAnular() {
    const motivo = prompt('Indique el motivo de anulación:');
    if (!motivo || motivo.trim().length < 3) return;
    try {
      await api.post(`/asientos/${id}/anular`, { motivo });
      const actualizado = await api.get<AsientoDetalle>(`/asientos/${id}`);
      setAsiento(actualizado);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al anular');
    }
  }

  if (!esNuevo) {
    if (!asiento) return <div className="p-6 text-slate-500">Cargando...</div>;
    const totDebe = asiento.lineas.reduce((s, l) => s + l.debe, 0);
    const totHaber = asiento.lineas.reduce((s, l) => s + l.haber, 0);
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Asiento {asiento.numero}</h1>
            <div className="text-sm text-slate-500">{asiento.fecha} · {asiento.descripcion}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Registrado por {asiento.creadoPorNombre || 'usuario eliminado'}
              {asiento.createdAt ? ` · ${new Date(asiento.createdAt.replace(' ', 'T') + 'Z').toLocaleString('es-VE')}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BotonesExportar
              empresa={empresa}
              titulo={`Comprobante de Asiento ${asiento.numero}`}
              subtitulo={`Fecha: ${asiento.fecha}${asiento.descripcion ? ' · ' + asiento.descripcion : ''}${asiento.estado === 'anulado' ? ' · ANULADO' : ''}`}
              nombreArchivo={`asiento-${asiento.numero}`}
              columnas={[
                { header: 'Cuenta', key: 'cuenta' },
                { header: 'Tercero / C. Costo', key: 'detalle' },
                { header: 'Descripción', key: 'descripcion' },
                { header: 'Debe', key: 'debe', align: 'right' },
                { header: 'Haber', key: 'haber', align: 'right' },
              ]}
              filas={asiento.lineas.map((l) => ({
                cuenta: `${l.cuentaCodigo} — ${l.cuentaNombre}`,
                detalle: [l.terceroNombre, l.centroCostoNombre].filter(Boolean).join(' · '),
                descripcion: l.descripcion || '',
                debe: l.debe,
                haber: l.haber,
              }))}
              filaTotales={{ cuenta: '', detalle: '', descripcion: 'Totales', debe: totDebe, haber: totHaber }}
            />
            <Link to="/asientos" className="text-sm text-slate-500 hover:underline">← Volver al listado</Link>
            {asiento.estado === 'registrado' && (
              <button onClick={onAnular} className="text-red-600 hover:underline text-sm">Anular asiento</button>
            )}
          </div>
        </div>

        {asiento.estado === 'anulado' && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            Asiento anulado. Motivo: {asiento.motivoAnulacion}
          </div>
        )}
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2">Cuenta</th>
                <th className="px-4 py-2">Tercero / C. Costo</th>
                <th className="px-4 py-2">Descripción</th>
                <th className="px-4 py-2 text-right">Debe</th>
                <th className="px-4 py-2 text-right">Haber</th>
              </tr>
            </thead>
            <tbody>
              {asiento.lineas.map((l, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-2">{l.cuentaCodigo} — {l.cuentaNombre}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {l.terceroNombre || ''}{l.terceroNombre && l.centroCostoNombre ? ' · ' : ''}{l.centroCostoNombre || ''}
                    {l.moneda !== 'VES' && (
                      <div className="text-slate-400">{l.moneda} {formatearMonto(l.montoOriginal)} @ {formatearMonto(l.tasaCambio, 4)}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{l.descripcion}</td>
                  <td className="px-4 py-2 text-right">{l.debe > 0 ? formatearMonto(l.debe) : ''}</td>
                  <td className="px-4 py-2 text-right">{l.haber > 0 ? formatearMonto(l.haber) : ''}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-800 font-bold">
                <td className="px-4 py-2" colSpan={3}>Totales</td>
                <td className="px-4 py-2 text-right">{formatearMonto(totDebe)}</td>
                <td className="px-4 py-2 text-right">{formatearMonto(totHaber)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Registrar Asiento</h1>
        <Link to="/asientos" className="text-sm text-slate-500 hover:underline">← Volver al listado</Link>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción / Concepto</label>
            <input placeholder="Ej: Aporte de capital inicial" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Líneas del asiento</label>
          <div className="space-y-3">
            {lineas.map((l, i) => {
              const cuenta = cuentaDe(l);
              const tercerosFiltrados = cuenta?.subledger === 'cxc' ? terceros.filter((t) => t.tipo === 'cliente')
                : cuenta?.subledger === 'cxp' ? terceros.filter((t) => t.tipo === 'proveedor') : terceros;
              return (
                <div key={i} className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                    <select
                      value={l.cuentaId}
                      onChange={(e) => actualizarLinea(i, { cuentaId: e.target.value ? Number(e.target.value) : '' })}
                      className="md:col-span-4 rounded-md border border-slate-300 px-2 py-2 text-sm"
                    >
                      <option value="">-- Cuenta --</option>
                      {cuentas.map((c) => (
                        <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                      ))}
                    </select>
                    <input
                      placeholder="Descripción (opcional)"
                      value={l.descripcion}
                      onChange={(e) => actualizarLinea(i, { descripcion: e.target.value })}
                      className="md:col-span-3 rounded-md border border-slate-300 px-2 py-2 text-sm"
                    />
                    <input
                      type="number" step="0.01" placeholder="Debe"
                      value={l.debe}
                      onChange={(e) => actualizarLinea(i, { debe: e.target.value, haber: e.target.value ? '' : l.haber })}
                      className="md:col-span-2 rounded-md border border-slate-300 px-2 py-2 text-sm text-right"
                    />
                    <input
                      type="number" step="0.01" placeholder="Haber"
                      value={l.haber}
                      onChange={(e) => actualizarLinea(i, { haber: e.target.value, debe: e.target.value ? '' : l.debe })}
                      className="md:col-span-2 rounded-md border border-slate-300 px-2 py-2 text-sm text-right"
                    />
                    <button type="button" onClick={() => quitarLinea(i)} className="md:col-span-1 text-red-500 hover:text-red-700 text-xs text-left">
                      Quitar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                    <select
                      value={l.moneda}
                      onChange={(e) => actualizarLinea(i, { moneda: e.target.value as Moneda, montoOriginal: '', tasaCambio: '' })}
                      className="md:col-span-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs"
                    >
                      <option value="VES">Bs. (VES)</option>
                      <option value="USD">USD</option>
                      <option value="COP">COP</option>
                      <option value="EUR">EUR</option>
                    </select>
                    {l.moneda !== 'VES' && (
                      <>
                        <input
                          type="number" step="0.01" placeholder={`Monto en ${l.moneda}`}
                          value={l.montoOriginal}
                          onChange={(e) => onCambiaMonedaExtranjera(i, e.target.value, l.tasaCambio)}
                          className="md:col-span-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="number" step="0.0001" placeholder="Tasa de cambio"
                          value={l.tasaCambio}
                          onChange={(e) => onCambiaMonedaExtranjera(i, l.montoOriginal, e.target.value)}
                          className="md:col-span-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs"
                        />
                      </>
                    )}
                    <select
                      value={l.centroCostoId}
                      onChange={(e) => actualizarLinea(i, { centroCostoId: e.target.value ? Number(e.target.value) : '' })}
                      className="md:col-span-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs"
                    >
                      <option value="">Centro de costo</option>
                      {centrosCosto.map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
                    </select>
                    {cuenta?.subledger && (
                      <>
                        <select
                          required
                          value={l.terceroId}
                          onChange={(e) => actualizarLinea(i, { terceroId: e.target.value ? Number(e.target.value) : '' })}
                          className="md:col-span-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs"
                        >
                          <option value="">{cuenta.subledger === 'cxc' ? '-- Cliente --' : '-- Proveedor --'}</option>
                          {tercerosFiltrados.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                        <input
                          type="date" placeholder="Vencimiento"
                          value={l.fechaVencimiento}
                          onChange={(e) => actualizarLinea(i, { fechaVencimiento: e.target.value })}
                          className="md:col-span-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs"
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={agregarLinea} className="mt-2 text-sm text-brand-700 hover:underline font-medium">
            + Agregar línea
          </button>
        </div>

        <div className={`rounded-md border px-4 py-3 flex justify-between text-sm font-medium ${cuadra ? 'border-accent-300 bg-accent-50 text-accent-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
          <span>Debe: {formatearMonto(totalDebe)}</span>
          <span>Haber: {formatearMonto(totalHaber)}</span>
          <span>{cuadra ? '✓ Cuadrado' : 'No cuadra'}</span>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={guardando || !cuadra}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-5 py-2 rounded-md text-sm font-medium"
        >
          {guardando ? 'Guardando...' : 'Registrar Asiento'}
        </button>
      </form>
    </div>
  );
}
