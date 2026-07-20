import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAdmin, requireAuth } from '../middleware/auth';

export const correlativosRouter = Router();
correlativosRouter.use(requireAuth);

correlativosRouter.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM correlativos ORDER BY tipo').all());
});

const actualizarSchema = z.object({
  prefijo: z.string().min(1).optional(),
  siguienteNumero: z.number().int().min(1).optional(),
  digitos: z.number().int().min(1).max(10).optional(),
  reinicioAnual: z.boolean().optional(),
  prefijoControl: z.string().optional(),
  siguienteControl: z.number().int().min(1).optional(),
  digitosControl: z.number().int().min(1).max(10).optional(),
});

// Solo un admin puede reconfigurar correlativos (riesgo de duplicar/saltar numeración fiscal).
correlativosRouter.put('/:tipo', requireAdmin, (req, res) => {
  const parsed = actualizarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const tipo = req.params.tipo;
  const existente = db.prepare('SELECT * FROM correlativos WHERE tipo = ?').get(tipo) as any;
  if (!existente) return res.status(404).json({ error: 'Tipo de documento no configurado' });

  const d = parsed.data;
  db.prepare(
    `UPDATE correlativos SET prefijo=?, siguiente_numero=?, digitos=?, reinicio_anual=?, prefijo_control=?, siguiente_control=?, digitos_control=? WHERE tipo=?`
  ).run(
    d.prefijo ?? existente.prefijo,
    d.siguienteNumero ?? existente.siguiente_numero,
    d.digitos ?? existente.digitos,
    d.reinicioAnual !== undefined ? (d.reinicioAnual ? 1 : 0) : existente.reinicio_anual,
    d.prefijoControl ?? existente.prefijo_control,
    d.siguienteControl ?? existente.siguiente_control,
    d.digitosControl ?? existente.digitos_control,
    tipo
  );
  res.json({ ok: true });
});
