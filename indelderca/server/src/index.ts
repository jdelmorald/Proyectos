import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { db } from './db';
import { authRouter } from './routes/auth';
import { usuariosRouter } from './routes/usuarios';
import { empresaRouter } from './routes/empresa';
import { contactosRouter } from './routes/contactos';
import { productosRouter } from './routes/productos';
import { documentosRouter } from './routes/documentos';
import { correlativosRouter } from './routes/correlativos';
import { requireAuth } from './middleware/auth';
import { DOCUMENT_TYPES } from './documentTypes';

void db; // fuerza la inicialización del esquema al arrancar

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/document-types', requireAuth, (_req, res) => {
  res.json(DOCUMENT_TYPES);
});

app.use('/api/auth', authRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/empresa', empresaRouter);
app.use('/api/contactos', contactosRouter);
app.use('/api/productos', productosRouter);
app.use('/api/documentos', documentosRouter);
app.use('/api/correlativos', correlativosRouter);

// Si existe el build del frontend (client/dist), lo sirve desde este mismo servidor
// para que toda la aplicación corra en un único puerto (instalación en una sola PC).
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 4001;
app.listen(PORT, () => {
  console.log(`Indelderca disponible en http://localhost:${PORT}`);
});
