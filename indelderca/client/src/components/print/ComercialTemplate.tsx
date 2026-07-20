import { DocumentTypeConfig } from '../../config/documentTypes';
import PrintHeader from './PrintHeader';

export default function ComercialTemplate({ empresa, config, doc }: { empresa: any; config: DocumentTypeConfig; doc: any }) {
  const contraparteLabel = config.contraparte === 'cliente' ? 'Cliente' : config.contraparte === 'proveedor' ? 'Proveedor' : null;

  return (
    <div className="text-slate-900 text-sm">
      <PrintHeader empresa={empresa} titulo={config.tituloImpresion} numero={doc.numero} numeroControl={doc.numeroControl} fecha={doc.fecha} />

      <div className="grid grid-cols-2 gap-4 mb-4">
        {contraparteLabel && (
          <div>
            <div className="text-xs uppercase text-slate-400 font-semibold">{contraparteLabel}</div>
            <div className="font-medium">{doc.contactoNombre}</div>
            <div className="text-xs text-slate-500">{doc.contactoRif}</div>
          </div>
        )}
        {doc.referenciaNumero && (
          <div>
            <div className="text-xs uppercase text-slate-400 font-semibold">Documento relacionado</div>
            <div className="font-medium">{doc.referenciaNumero}</div>
          </div>
        )}
        {config.camposExtra.map((c) =>
          doc.datos[c.name] ? (
            <div key={c.name}>
              <div className="text-xs uppercase text-slate-400 font-semibold">{c.label}</div>
              <div className="font-medium whitespace-pre-line">{String(doc.datos[c.name])}</div>
            </div>
          ) : null
        )}
      </div>

      {config.tieneItems && (
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="border-b-2 border-slate-800 text-left">
              <th className="py-1.5 pr-2">Descripción</th>
              <th className="py-1.5 pr-2 w-16 text-right">Cant.</th>
              <th className="py-1.5 pr-2 w-20">Unidad</th>
              {config.itemsConPrecio && <th className="py-1.5 pr-2 w-24 text-right">P. Unit.</th>}
              {config.itemsConPrecio && <th className="py-1.5 w-28 text-right">Subtotal</th>}
            </tr>
          </thead>
          <tbody>
            {doc.items.map((it: any, i: number) => (
              <tr key={i} className="border-b border-slate-200">
                <td className="py-1.5 pr-2">{it.descripcion}</td>
                <td className="py-1.5 pr-2 text-right">{it.cantidad}</td>
                <td className="py-1.5 pr-2">{it.unidad}</td>
                {config.itemsConPrecio && <td className="py-1.5 pr-2 text-right">{Number(it.precioUnitario ?? 0).toFixed(2)}</td>}
                {config.itemsConPrecio && (
                  <td className="py-1.5 text-right">{(Number(it.cantidad) * Number(it.precioUnitario ?? 0)).toFixed(2)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {config.itemsConPrecio && (
        <div className="flex justify-end mb-4">
          <div className="w-64 text-sm space-y-1">
            <div className="flex justify-between"><span>Base imponible</span><span>{doc.baseImponible.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Exento</span><span>{doc.montoExento.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>IVA ({doc.ivaPorcentaje}%)</span><span>{doc.ivaMonto.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-slate-800 pt-1">
              <span>TOTAL</span>
              <span>{empresa.moneda} {doc.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {doc.observaciones && (
        <div className="mb-4">
          <div className="text-xs uppercase text-slate-400 font-semibold">Observaciones</div>
          <div className="whitespace-pre-line">{doc.observaciones}</div>
        </div>
      )}

      {config.tieneFirmantes && doc.firmantes.length > 0 && (
        <div className="grid grid-cols-2 gap-8 mt-10">
          {doc.firmantes.map((f: any, i: number) => (
            <div key={i} className="text-center">
              <div className="border-t border-slate-800 pt-1 mt-8">
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
