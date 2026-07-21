import { Request, Response, NextFunction } from 'express';
import { db } from '../db';

export function usuarioTieneAcceso(usuarioId: number, empresaId: number): boolean {
  const fila = db.prepare('SELECT 1 FROM usuario_empresas WHERE usuario_id = ? AND empresa_id = ?').get(usuarioId, empresaId);
  return !!fila;
}

/** Para rutas GET donde la empresa viene en ?empresaId=. Si la ruta no trae empresaId, deja pasar (la ruta misma decide si lo exige). */
export function requireAccesoEmpresaQuery(req: Request, res: Response, next: NextFunction) {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return next();
  if (!usuarioTieneAcceso(req.user!.id, empresaId)) {
    return res.status(403).json({ error: 'No tiene acceso a esta empresa' });
  }
  next();
}

/** Para rutas POST/PUT donde la empresa viene en el body como empresaId. */
export function requireAccesoEmpresaBody(req: Request, res: Response, next: NextFunction) {
  const empresaId = Number(req.body?.empresaId);
  if (!empresaId) return next();
  if (!usuarioTieneAcceso(req.user!.id, empresaId)) {
    return res.status(403).json({ error: 'No tiene acceso a esta empresa' });
  }
  next();
}

/**
 * Para rutas /:id sobre un recurso que no trae empresaId directo (p.ej. anular un
 * asiento, borrar una cuenta). Busca a qué empresa pertenece el recurso en `tabla`
 * y verifica el acceso contra eso. 404 si el recurso no existe, 403 si no hay acceso.
 */
export function requireAccesoRecurso(
  tabla: string,
  opciones?: { columnaId?: string; columnaEmpresa?: string; nombreParam?: string }
) {
  const columnaId = opciones?.columnaId ?? 'id';
  const columnaEmpresa = opciones?.columnaEmpresa ?? 'empresa_id';
  const nombreParam = opciones?.nombreParam ?? 'id';
  return (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params[nombreParam]);
    const fila = db.prepare(`SELECT ${columnaEmpresa} AS empresaId FROM ${tabla} WHERE ${columnaId} = ?`).get(id) as
      | { empresaId: number }
      | undefined;
    if (!fila) return res.status(404).json({ error: 'No encontrado' });
    if (!usuarioTieneAcceso(req.user!.id, fila.empresaId)) {
      return res.status(403).json({ error: 'No tiene acceso a esta empresa' });
    }
    next();
  };
}
