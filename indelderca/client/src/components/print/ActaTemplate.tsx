import { DocumentTypeConfig } from '../../config/documentTypes';
import PrintHeader from './PrintHeader';

export default function ActaTemplate({ empresa, config, doc }: { empresa: any; config: DocumentTypeConfig; doc: any }) {
  const contraparteLabel = config.contraparte === 'cliente' ? 'Cliente' : config.contraparte === 'proveedor' ? 'Proveedor' : null;

  return (
    <div className="text-slate-900 text-sm">
      <PrintHeader empresa={empresa} titulo={config.tituloImpresion} numero={doc.numero} fecha={doc.fecha} />

      <p className="mb-4 leading-relaxed">
        En fecha <strong>{doc.fecha}</strong>
        {doc.datos.lugar ? (
          <>
            {' '}
            en <strong>{doc.datos.lugar}</strong>
          </>
        ) : null}
        {doc.datos.hora ? (
          <>
            {' '}
            siendo las <strong>{doc.datos.hora}</strong>
          </>
        ) : null}
        , se levanta la presente <strong>{config.tituloImpresion.toLowerCase()}</strong>
        {contraparteLabel && doc.contactoNombre ? (
          <>
            {' '}
            con relación a {contraparteLabel.toLowerCase()} <strong>{doc.contactoNombre}</strong>
            {doc.contactoRif ? ` (${doc.contactoRif})` : ''}
          </>
        ) : null}
        {doc.referenciaNumero ? (
          <>
            {' '}
            en referencia al documento <strong>{doc.referenciaNumero}</strong>
          </>
        ) : null}
        , conforme a lo siguiente:
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {config.camposExtra
          .filter((c) => c.name !== 'lugar' && c.name !== 'hora')
          .map((c) =>
            doc.datos[c.name] ? (
              <div key={c.name} className={c.type === 'textarea' ? 'col-span-2' : ''}>
                <div className="text-xs uppercase text-slate-400 font-semibold">{c.label}</div>
                <div className="font-medium whitespace-pre-line">{String(doc.datos[c.name])}</div>
              </div>
            ) : null
          )}
      </div>

      {config.tieneItems && doc.items.length > 0 && (
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="border-b-2 border-slate-800 text-left">
              <th className="py-1.5 pr-2">Descripción</th>
              <th className="py-1.5 pr-2 w-20 text-right">Cantidad</th>
              <th className="py-1.5 w-24">Unidad</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((it: any, i: number) => (
              <tr key={i} className="border-b border-slate-200">
                <td className="py-1.5 pr-2">{it.descripcion}</td>
                <td className="py-1.5 pr-2 text-right">{it.cantidad}</td>
                <td className="py-1.5">{it.unidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {doc.observaciones && (
        <div className="mb-4">
          <div className="text-xs uppercase text-slate-400 font-semibold">Observaciones</div>
          <div className="whitespace-pre-line">{doc.observaciones}</div>
        </div>
      )}

      <p className="mb-8">
        Se firma la presente acta en señal de conformidad por las partes que en ella intervienen.
      </p>

      {doc.firmantes.length > 0 && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 mt-6">
          {doc.firmantes.map((f: any, i: number) => (
            <div key={i} className="text-center">
              <div className="border-t border-slate-800 pt-1">
                {f.nombre}
                {f.cargo ? ` — ${f.cargo}` : ''}
                {f.cedula ? ` (C.I. ${f.cedula})` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {doc.estado === 'anulado' && (
        <div className="mt-6 text-center text-red-600 font-bold text-lg border-2 border-red-600 rounded-md py-2">
          DOCUMENTO ANULADO {doc.motivoAnulacion ? `— ${doc.motivoAnulacion}` : ''}
        </div>
      )}

      {empresa.pie_pagina && <div className="mt-8 text-xs text-slate-400 text-center">{empresa.pie_pagina}</div>}
    </div>
  );
}
