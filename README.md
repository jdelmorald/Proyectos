# Revisor — Plataforma de revisión y aprobación de documentos

Plataforma interna para que los colaboradores de un grupo de empresas suban
presupuestos, proyectos, reportes y otros documentos (Word, Excel, PowerPoint,
PDF), y el director general los revise, apruebe, objete o rechace, con
historial completo de cada intercambio hasta la aprobación final.

## Cómo funciona

- **Roles**: `DIRECTOR` (el jefe, revisa todo el grupo) y `COLABORADOR`
  (sube documentos de su propia empresa).
- **Flujo de un documento**:
  1. El colaborador sube un archivo → estado `ENVIADO`.
  2. El director lo revisa desde su panel y puede:
     - **Aprobar** → estado `APROBADO` (cierra el ciclo).
     - **Objetar** (con comentario obligatorio) → estado `OBJETADO`, vuelve
       al colaborador.
     - **Rechazar** definitivamente (con comentario) → estado `RECHAZADO`
       (cierra el ciclo, sin reenvío).
  3. Si fue objetado, el colaborador corrige y **reenvía una nueva versión**
     del archivo → vuelve a `ENVIADO`, y el ciclo se repite.
  4. Cada acción (enviar, objetar, reenviar, aprobar, rechazar) queda
     registrada en un **historial cronológico** visible para ambas partes,
     junto con todas las versiones del archivo.
- El director también administra las **empresas del grupo** y crea las
  **cuentas de los colaboradores** (cada uno ve solo sus propios documentos;
  el director ve los de todas las empresas).

## Stack técnico

- [Next.js 16](https://nextjs.org) (App Router, Server Actions) + TypeScript
- [Prisma](https://www.prisma.io) + SQLite (fácil de migrar a PostgreSQL)
- [NextAuth](https://next-auth.js.org) (credenciales + sesión JWT)
- Tailwind CSS
- Almacenamiento de archivos en disco local (carpeta `uploads/`)

## Primeros pasos (desarrollo)

```bash
npm install
cp .env.example .env          # y genera un NEXTAUTH_SECRET propio
npx prisma migrate dev         # crea la base de datos SQLite
npx prisma db seed             # crea datos de ejemplo (ver abajo)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Cuentas de ejemplo (creadas por el seed)

| Rol | Correo | Contraseña |
|---|---|---|
| Director general | `director@grupo.com` | `Director123!` |
| Colaborador (Constructora Andina) | `colaborador@grupo.com` | `Colaborador123!` |
| Colaborador (Logística del Valle) | `colaborador2@grupo.com` | `Colaborador123!` |

**Cambia estas contraseñas antes de usar la plataforma en producción.** El
director es quien crea el resto de las cuentas de colaboradores desde
`/admin/usuarios` (no hay registro público).

## Generar un `NEXTAUTH_SECRET`

```bash
openssl rand -base64 32
```

## Limitaciones actuales y siguientes pasos sugeridos

- **Archivos**: se guardan en disco local (`uploads/`). Para producción con
  varias instancias o despliegue en la nube, conviene migrar a un bucket
  (S3, R2, Google Cloud Storage) — el punto de cambio es `src/lib/storage.ts`.
- **Base de datos**: SQLite es suficiente para validar el producto; para
  producción con más de un usuario concurrente conviene migrar a PostgreSQL
  (solo cambia `DATABASE_URL` y el `provider` en `prisma/schema.prisma`).
- **Notificaciones**: hoy el seguimiento es dentro de la plataforma
  (contadores de pendientes en el panel). Se puede añadir correo o
  notificaciones push cuando un documento se objeta, reenvía o aprueba.
- **Rechazo definitivo**: existe como acción separada de "objetar" para los
  casos en que el director no quiere dar oportunidad de corrección.
- **Auditoría**: cada evento del historial queda con autor, fecha y
  comentario — es un registro de solo lectura pensado como bitácora.

## Estructura relevante

```
prisma/schema.prisma          Modelo de datos (empresas, usuarios, documentos, versiones, historial)
src/lib/auth.ts               Configuración de NextAuth (credenciales)
src/lib/actions/submissions.ts  Lógica del flujo de revisión (server actions)
src/lib/actions/admin.ts        Gestión de empresas y colaboradores (solo director)
src/lib/storage.ts             Guardado/lectura de archivos subidos
src/app/(app)/dashboard         Panel principal (distinto por rol)
src/app/(app)/submissions/[id]  Detalle de un documento: versión, acciones, historial
src/app/(app)/admin             Gestión de empresas y usuarios (solo director)
```
