import { DocumentTypeConfig } from '../../config/documentTypes';
import PrintHeader from './PrintHeader';

function calcularEdad(fechaNacimiento: string | null | undefined): string {
  if (!fechaNacimiento) return '—';
  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return '—';
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return `${edad} años`;
}

const CONSENTIMIENTO_LEGAL =
  'Yo, el paciente identificado en este documento (o mi representante legal), declaro que he sido informado(a) de manera ' +
  'clara y suficiente por el médico responsable acerca del procedimiento propuesto, sus riesgos, beneficios y alternativas ' +
  'disponibles. He tenido la oportunidad de formular preguntas y estas han sido respondidas a mi satisfacción. En pleno uso ' +
  'de mis facultades, otorgo libre y voluntariamente mi consentimiento para la realización del procedimiento descrito a ' +
  'continuación, entendiendo que puedo revocar este consentimiento en cualquier momento antes de su ejecución.';

export default function MedicoTemplate({ empresa, config, doc }: { empresa: any; config: DocumentTypeConfig; doc: any }) {
  return (
    <div className="text-slate-900 text-sm">
      <PrintHeader empresa={empresa} titulo={config.tituloImpresion} numero={doc.numero} fecha={doc.fecha} />

      <div className="mb-4 border border-slate-300 rounded-md p-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm bg-slate-50">
        <div>
          <div className="text-xs uppercase text-slate-400 font-semibold">Paciente</div>
          <div className="font-medium">{doc.contactoNombre ?? '—'}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-400 font-semibold">Cédula</div>
          <div className="font-medium">{doc.contactoRif ?? '—'}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-400 font-semibold">Edad</div>
          <div className="font-medium">{calcularEdad(doc.pacienteFechaNacimiento)}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-400 font-semibold">Sexo</div>
          <div className="font-medium">{doc.pacienteSexo ?? '—'}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-400 font-semibold">Tipo de sangre</div>
          <div className="font-medium">{doc.pacienteTipoSangre ?? '—'}</div>
        </div>
        <div className="col-span-2 md:col-span-2">
          <div className="text-xs uppercase text-slate-400 font-semibold">Alergias</div>
          <div className="font-medium">{doc.pacienteAlergias ?? 'Ninguna reportada'}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-400 font-semibold">N° de historia</div>
          <div className="font-medium">{doc.pacienteNumeroHistoria ?? '—'}</div>
        </div>
      </div>

      {doc.referenciaNumero && (
        <p className="mb-4 text-xs text-slate-500">
          En referencia al documento <strong>{doc.referenciaNumero}</strong>.
        </p>
      )}

      {config.key === 'consentimiento_informado' && (
        <p className="mb-4 leading-relaxed text-justify text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-3">
          {CONSENTIMIENTO_LEGAL}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {config.camposExtra.map((c) =>
          doc.datos[c.name] !== undefined && doc.datos[c.name] !== '' ? (
            <div key={c.name} className={c.type === 'textarea' ? 'col-span-2' : ''}>
              <div className="text-xs uppercase text-slate-400 font-semibold">{c.label}</div>
              <div className="font-medium whitespace-pre-line">{String(doc.datos[c.name])}</div>
            </div>
          ) : null
        )}
      </div>

      {doc.observaciones && (
        <div className="mb-4">
          <div className="text-xs uppercase text-slate-400 font-semibold">Observaciones</div>
          <div className="whitespace-pre-line">{doc.observaciones}</div>
        </div>
      )}

      {doc.firmantes.length > 0 && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 mt-10">
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
