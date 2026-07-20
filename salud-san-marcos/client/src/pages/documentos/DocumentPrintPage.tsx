import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { getDocumentType } from '../../config/documentTypes';
import ComercialTemplate from '../../components/print/ComercialTemplate';
import ActaTemplate from '../../components/print/ActaTemplate';
import ComprobanteTemplate from '../../components/print/ComprobanteTemplate';

export default function DocumentPrintPage() {
  const { tipo, id } = useParams<{ tipo: string; id: string }>();
  const config = tipo ? getDocumentType(tipo) : undefined;
  const [doc, setDoc] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.get(`/documentos/${id}`), api.get('/empresa')]).then(([d, e]) => {
      setDoc(d);
      setEmpresa(e);
    });
  }, [id]);

  if (!config) return <div className="p-6 text-red-600">Tipo de documento no encontrado.</div>;
  if (!doc || !empresa) return <div className="p-6 text-slate-500">Cargando...</div>;

  const Plantilla =
    config.familia === 'comercial' ? ComercialTemplate : config.familia === 'acta' ? ActaTemplate : ComprobanteTemplate;

  return (
    <div className="min-h-screen bg-slate-200 py-8 print:bg-white print:py-0">
      <div className="no-print max-w-3xl mx-auto mb-4 flex justify-end">
        <button
          onClick={() => window.print()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow"
        >
          Imprimir / Guardar PDF
        </button>
      </div>
      <div id="print-area" className="max-w-3xl mx-auto bg-white shadow-lg print:shadow-none p-10">
        <Plantilla empresa={empresa} config={config} doc={doc} />
      </div>
    </div>
  );
}
