# Revisor — Plataforma de revisión y aprobación de documentos

Plataforma interna para que los colaboradores de un grupo de empresas suban
presupuestos, proyectos, reportes y otros documentos (Word, Excel, PowerPoint,
PDF), y el director general los revise, apruebe, objete o rechace, con
historial completo de cada intercambio hasta la aprobación final.

## Cómo funciona

- **Roles**:
  - `ADMINISTRADOR` — administra empresas y usuarios, y ve todos los
    documentos del grupo, pero no participa en las aprobaciones.
  - `DIRECTOR` — el director general. Ve y puede aprobar, objetar o
    rechazar cualquier documento de cualquier empresa, en cualquier etapa.
    Es quien da la aprobación final.
  - `GERENTE` — un gerente por empresa. Ve y puede aprobar, objetar o
    rechazar únicamente los documentos de los colaboradores de **su propia
    empresa**. Su aprobación no es definitiva: reenvía el documento a
    Dirección General para la decisión final.
  - `COLABORADOR` — sube documentos y solo ve los suyos.
- **Flujo de un documento** (dos etapas: gerente → director):
  1. El colaborador sube un archivo → estado `ENVIADO`.
  2. El gerente de su empresa lo revisa y puede:
     - **Aprobar y enviar a Dirección General** → estado
       `EN_REVISION_DIRECCION`.
     - **Objetar** (comentario obligatorio) → estado `OBJETADO`, vuelve al
       colaborador.
     - **Rechazar** definitivamente → estado `RECHAZADO` (cierra el ciclo).
  3. El director general puede actuar en cualquier momento — ya sea sobre un
     documento recién `ENVIADO` (si aún no lo vio el gerente, o si la
     empresa no tiene gerente asignado) o uno que ya está
     `EN_REVISION_DIRECCION` — y decide igual: **Aprobar** (estado final
     `APROBADO`), **Objetar** o **Rechazar**.
  4. Si fue objetado (por el gerente o por el director), el colaborador
     corrige y **reenvía una nueva versión** → vuelve a `ENVIADO`, y el
     ciclo empieza de nuevo desde el gerente.
  5. Cada acción queda registrada en un **historial cronológico** con
     autor, fecha y comentario, visible para todos los que tienen acceso a
     ese documento.
- El administrador (o el director) crean las **empresas** y las
  **cuentas de usuario** (colaborador, gerente, director o administrador)
  desde `/admin`.

## Proveedores

Módulo aparte, pensado para levantar información en campo (visitas a
ciudades) desde el celular y también desde la PC:

- **`/suppliers`** — listado de proveedores con búsqueda (nombre, ciudad,
  rubro) y filtro rápido por estado.
- **`/suppliers/new`** — formulario de registro. Solo la razón social y la
  ciudad son obligatorias, para poder capturar rápido en una visita y
  completar el resto después.
- **`/suppliers/[id]`** — ficha del proveedor: el mismo formulario, ya con
  los datos guardados, para completarlo o corregirlo en cualquier momento.

El formulario cubre los datos típicos para identificar, contactar,
clasificar y calificar a un proveedor: razón social/nombre comercial, RIF,
ubicación (ciudad, estado, país, dirección), contacto (persona, cargo,
teléfono, WhatsApp, correo, web), tipo de proveedor y rubro, productos o
servicios que ofrece, estado de evaluación (potencial → en evaluación →
aprobado/activo/rechazado), calificación por calidad/precio/entrega/
atención, condiciones de pago, pedido mínimo, certificaciones, si emite
factura fiscal, y notas libres de la visita.

Cualquier usuario autenticado puede registrar y editar proveedores — no
depende del flujo de aprobación de documentos ni de una empresa del grupo
en particular.

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
npx prisma migrate dev         # crea la base de datos SQLite y los datos de ejemplo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### En Windows, sin usar la terminal

Para alguien sin experiencia técnica, el repositorio incluye tres archivos en
la raíz pensados para usarse con doble clic, sin abrir ninguna consola:

- **`Instalar (solo la primera vez).bat`** — instala todo y prepara la base de
  datos. Se usa una sola vez (o de nuevo si algo se corrompe).
- **`Iniciar Revisor.vbs`** — enciende la plataforma sin mostrar ninguna
  ventana y abre el navegador solo. Úsalo cada vez que quieras usar la
  plataforma.
- **`Detener Revisor.bat`** — apaga la plataforma cuando termines.

Requiere tener [Node.js](https://nodejs.org) (versión LTS) instalado primero.

### Cuentas de ejemplo (creadas por el seed)

El seed crea 5 empresas de ejemplo, cada una con su propio gerente:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador de plataforma | `admin@grupo.com` | `Administrador123!` |
| Director general | `director@grupo.com` | `Director123!` |
| Gerente — Constructora Andina | `gerente.andina@grupo.com` | `Gerente123!` |
| Gerente — Logística del Valle | `gerente.valle@grupo.com` | `Gerente123!` |
| Gerente — Agroindustrial del Norte | `gerente.norte@grupo.com` | `Gerente123!` |
| Gerente — Textiles del Pacífico | `gerente.pacifico@grupo.com` | `Gerente123!` |
| Gerente — Inversiones Río Grande | `gerente.riogrande@grupo.com` | `Gerente123!` |
| Colaborador (Constructora Andina) | `colaborador@grupo.com` | `Colaborador123!` |
| Colaborador (Logística del Valle) | `colaborador2@grupo.com` | `Colaborador123!` |

**Cambia estas contraseñas antes de usar la plataforma en producción.** El
administrador o el director crean el resto de las cuentas desde
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
prisma/schema.prisma          Modelo de datos (empresas, usuarios, documentos, versiones, historial, proveedores)
src/lib/roles.ts               Roles, etiquetas y reglas de visibilidad compartidas
src/lib/auth.ts                Configuración de NextAuth (credenciales)
src/lib/actions/submissions.ts  Lógica del flujo de revisión en dos etapas (server actions)
src/lib/actions/admin.ts        Gestión de empresas y usuarios (administrador/director)
src/lib/actions/suppliers.ts    Alta y edición de proveedores (server actions)
src/lib/suppliers.ts            Etiquetas, colores y cálculo de calificación de proveedores
src/lib/storage.ts             Guardado/lectura de archivos subidos
src/app/(app)/dashboard         Panel principal (alcance distinto por rol)
src/app/(app)/submissions/[id]  Detalle de un documento: versión, acciones, historial
src/app/(app)/suppliers         Listado, alta y ficha de proveedores
src/app/(app)/admin             Gestión de empresas y usuarios (administrador/director)
```
