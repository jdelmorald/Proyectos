import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAdmin, requireAuth } from '../middleware/auth';

export const empresaRouter = Router();
empresaRouter.use(requireAuth);

empresaRouter.get('/', (_req, res) => {
  const empresa = db.prepare('SELECT * FROM empresa WHERE id = 1').get();
  res.json(empresa);
});

const empresaSchema = z.object({
  nombre: z.string().min(1),
  razonSocial: z.string().optional().nullable(),
  rif: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  logoBase64: z.string().optional().nullable(),
  moneda: z.string().min(1),
  ivaPorcentajeDefault: z.number().min(0).max(100),
  piePagina: z.string().optional().nullable(),
});

empresaRouter.put('/', requireAdmin, (req, res) => {
  const parsed = empresaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  db.prepare(
    `UPDATE empresa SET nombre=?, razon_social=?, rif=?, direccion=?, telefono=?, email=?, logo_base64=?, moneda=?, iva_porcentaje_default=?, pie_pagina=? WHERE id = 1`
  ).run(
    d.nombre,
    d.razonSocial ?? null,
    d.rif ?? null,
    d.direccion ?? null,
    d.telefono ?? null,
    d.email ?? null,
    d.logoBase64 ?? null,
    d.moneda,
    d.ivaPorcentajeDefault,
    d.piePagina ?? null
  );
  res.json({ ok: true });
});
