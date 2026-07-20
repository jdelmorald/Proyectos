import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { db } from './db';
import { authRouter } from './routes/auth';
import { usuariosRouter } from './routes/usuarios';
import { empresasRouter } from './routes/empresas';
import { planCuentasRouter } from './routes/planCuentas';
import { asientosRouter } from './routes/asientos';
import { reportesRouter } from './routes/reportes';
import { libroComprasRouter } from './routes/libroCompras';
import { libroVentasRouter } from './routes/libroVentas';
import { flujoProyectadoRouter } from './routes/flujoProyectado';
import { tasasCambioRouter } from './routes/tasasCambio';
import { centrosCostoRouter } from './routes/centrosCosto';
import { tercerosRouter } from './routes/terceros';
import { cuentasPendientesRouter } from './routes/cuentasPendientes';
import { fiscalRouter } from './routes/fiscal';

void db; // fuerza la inicialización del esquema al arrancar

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/empresas', empresasRouter);
app.use('/api/plan-cuentas', planCuentasRouter);
app.use('/api/asientos', asientosRouter);
app.use('/api/reportes', reportesRouter);
app.use('/api/libro-compras', libroComprasRouter);
app.use('/api/libro-ventas', libroVentasRouter);
app.use('/api/flujo-proyectado', flujoProyectadoRouter);
app.use('/api/tasas-cambio', tasasCambioRouter);
app.use('/api/centros-costo', centrosCostoRouter);
app.use('/api/terceros', tercerosRouter);
app.use('/api/cuentas-pendientes', cuentasPendientesRouter);
app.use('/api/fiscal', fiscalRouter);

// Si existe el build del frontend (client/dist), lo sirve desde este mismo servidor
// para que toda la aplicación corra en un único puerto (instalación en una sola PC).
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 4004;
app.listen(PORT, () => {
  console.log(`Sistema Contable disponible en http://localhost:${PORT}`);
});
