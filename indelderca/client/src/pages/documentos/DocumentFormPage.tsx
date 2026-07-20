import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import { getDocumentType } from '../../config/documentTypes';
import ContactoSelect from '../../components/ContactoSelect';
import ItemsEditor, { ItemLinea } from '../../components/ItemsEditor';
import FirmantesEditor, { Firmante } from '../../components/FirmantesEditor';
import ReferenciaSelect from '../../components/ReferenciaSelect';

const FISCALES_INMUTABLES = new Set(['factura', 'nota_credito', 'nota_debito', 'retencion_iva']);

interface Documento {
  id: number;
  tipo: string;
  numero: string;
  numeroControl: string | null;
  fecha: string;
  contactoId: number | null;
  referenciaDocumentoId: number | null;
  estado: 'emitido' | 'anulado';
  motivoAnulacion: string | null;
  datos: Record<string, any>;
  items: ItemLinea[];
  firmantes: Firmante[];
  subtotal: number;
  baseImponible: number;
  montoExento: number;
  ivaPorcentaje: number;
  ivaMonto: number;
  total: number;
  observaciones: string | null;
  contactoNombre: string | null;
  referenciaNumero: string | null;
}

const hoy = () => new Date().toISOString().slice(0, 10);

export default function DocumentFormPage() {
  const { tipo, id } = useParams<{ tipo: string; id?: string }>();
  const navigate = useNavigate();
  const config = tipo ? getDocumentType(tipo) : undefined;
  const esNuevo = !id;

  const [documento, setDocumento] = useState<Documento | null>(null);
  const [fecha, setFecha] = useState(hoy());
  const [contactoId, setContactoId] = useState<number | null>(null);
  const [referenciaDocumentoId, setReferenciaDocumentoId] = useState<number | null>(null);
  const [datos, setDatos] = useState<Record<string, any>>({});
  const [items, setItems] = useState<ItemLinea[]>([]);
  const [firmantes, setFirmantes] = useState<Firmante[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (esNuevo || !id) return;
    api.get<Documento>(`/documentos/${id}`).then((d) => {
      setDocumento(d);
      setFecha(d.fecha);
      setContactoId(d.contactoId);
      setReferenciaDocumentoId(d.referenciaDocumentoId);
      setDatos(d.datos);
      setItems(d.items);
      setFirmantes(d.firmantes);
      setObservaciones(d.observaciones ?? '');
    });
  }, [id, esNuevo]);

  if (!config || !tipo) return <div className="p-6 text-red-600">Tipo de documento no encontrado.</div>;

  const esFiscalInmutable = FISCALES_INMUTABLES.has(tipo);
  const soloLectura = !esNuevo && (documento?.estado === 'anulado' || esFiscalInmutable);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      if (esNuevo) {
        const creado = await api.post<Documento>('/documentos', {
          tipo,
          fecha,
          contactoId,
          referenciaDocumentoId,
          datos,
          items,
          firmantes,
          observaciones: observaciones || null,
        });
        navigate(`/documentos/${tipo}/${creado.id}`);
      } else {
        await api.put<Documento>(`/documentos/${id}`, { datos, items, firmantes, observaciones: observaciones || null });
        const actualizado = await api.get<Documento>(`/documentos/${id}`);
        setDocumento(actualizado);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar el documento');
    } finally {
      setGuardando(false);
    }
  }

  async function onAnular() {
    const motivo = prompt('Indique el motivo de anulación:');
    if (!motivo || motivo.trim().length < 3) return;
    try {
      await api.post(`/documentos/${id}/anular`, { motivo });
      const actualizado = await api.get<Documento>(`/documentos/${id}`);
      setDocumento(actualizado);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al anular');
    }
  }

  function setCampoExtra(name: string, value: any) {
    setDatos({ ...datos, [name]: value });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {esNuevo ? `Generar ${config.label}` : `${config.label} ${documento?.numero ?? ''}`}
          </h1>
          {config.fiscal && <div className="text-xs text-amber-600 font-medium">Documento fiscal</div>}
        </div>
        <div className="flex gap-3 items-center">
          <Link to={`/documentos/${tipo}`} className="text-sm text-slate-500 hover:underline">
            ← Volver al listado
          </Link>
          {!esNuevo && (
            <Link
              to={`/documentos/${tipo}/${id}/imprimir`}
              target="_blank"
              className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium px-3 py-1.5 rounded-md"
            >
              Imprimir / PDF
            </Link>
          )}
        </div>
      </div>

      {!esNuevo && documento && (
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">N° {documento.numero}</span>
          {documento.numeroControl && (
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">Control {documento.numeroControl}</span>
          )}
          <span
            className={`px-2 py-1 rounded-full font-medium ${
              documento.estado === 'anulado' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {documento.estado}
          </span>
          {documento.estado === 'emitido' && (
            <button onClick={onAnular} className="text-red-600 hover:underline">
              Anular documento
            </button>
          )}
        </div>
      )}
      {documento?.motivoAnulacion && (
        <div className="mb-4 text-sm text-red-600">Motivo de anulación: {documento.motivoAnulacion}</div>
      )}
      {esFiscalInmutable && !esNuevo && (
        <div className="mb-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
          Este documento es fiscal: una vez emitido no puede modificarse. Para corregirlo emita una Nota de
          Crédito/Débito referenciándolo.
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input
              type="date"
              required
              disabled={!esNuevo}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50"
            />
          </div>

          {(config.contraparte === 'cliente' || config.contraparte === 'proveedor') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {config.contraparte === 'cliente' ? 'Cliente' : 'Proveedor'}
              </label>
              {esNuevo ? (
                <ContactoSelect tipo={config.contraparte} value={contactoId} onChange={setContactoId} />
              ) : (
                <input
                  disabled
                  value={documento?.contactoNombre ?? ''}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-50"
                />
              )}
            </div>
          )}

          {config.tieneReferencia && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Documento relacionado</label>
              {esNuevo ? (
                <ReferenciaSelect
                  tipos={config.referenciaTipos ?? []}
                  value={referenciaDocumentoId}
                  onChange={setReferenciaDocumentoId}
                />
              ) : (
                <input
                  disabled
                  value={documento?.referenciaNumero ?? '—'}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-50"
                />
              )}
            </div>
          )}

          {config.camposExtra.map((campo) => (
            <div key={campo.name} className={campo.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{campo.label}</label>
              {campo.type === 'textarea' ? (
                <textarea
                  disabled={soloLectura}
                  required={campo.required}
                  value={datos[campo.name] ?? ''}
                  onChange={(e) => setCampoExtra(campo.name, e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50"
                  rows={3}
                />
              ) : campo.type === 'select' ? (
                <select
                  disabled={soloLectura}
                  required={campo.required}
                  value={datos[campo.name] ?? ''}
                  onChange={(e) => setCampoExtra(campo.name, e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50"
                >
                  <option value="">-- Seleccionar --</option>
                  {campo.options?.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  disabled={soloLectura}
                  required={campo.required}
                  type={campo.type === 'number' ? 'number' : campo.type === 'date' ? 'date' : campo.type === 'time' ? 'time' : 'text'}
                  step={campo.type === 'number' ? '0.01' : undefined}
                  placeholder={campo.placeholder}
                  value={datos[campo.name] ?? ''}
                  onChange={(e) =>
                    setCampoExtra(campo.name, campo.type === 'number' ? Number(e.target.value) : e.target.value)
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50"
                />
              )}
            </div>
          ))}
        </div>

        {config.tieneItems && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Renglones</label>
            <ItemsEditor items={items} onChange={setItems} conPrecio={config.itemsConPrecio} disabled={soloLectura} />
          </div>
        )}

        {config.tieneFirmantes && (
          <FirmantesEditor firmantes={firmantes} onChange={setFirmantes} disabled={soloLectura} />
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
          <textarea
            disabled={soloLectura}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50"
            rows={2}
          />
        </div>

        {!esNuevo && documento && config.itemsConPrecio && (
          <div className="border-t border-slate-200 pt-4 text-sm ml-auto max-w-xs space-y-1">
            <div className="flex justify-between"><span>Base imponible</span><span>{documento.baseImponible.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Exento</span><span>{documento.montoExento.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>IVA ({documento.ivaPorcentaje}%)</span><span>{documento.ivaMonto.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-slate-800"><span>Total</span><span>{documento.total.toFixed(2)}</span></div>
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}

        {!soloLectura && (
          <button
            type="submit"
            disabled={guardando}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-5 py-2 rounded-md text-sm font-medium"
          >
            {guardando ? 'Guardando...' : esNuevo ? `Generar ${config.label}` : 'Guardar cambios'}
          </button>
        )}
      </form>
    </div>
  );
}
