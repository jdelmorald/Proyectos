# Proveedores — Sistema de registro y calificación de proveedores

Sistema aparte (no depende de ningún otro proyecto de este repositorio),
pensado para levantar información de proveedores en campo — visitas a
ciudades — desde el celular, y revisarla después desde la PC.

## Qué hace

- **Registro rápido**: un formulario donde solo la razón social y la
  ciudad son obligatorias, para capturar en segundos durante una visita y
  completar el resto (contacto, clasificación, calificación) después.
- **Fotos**: cada proveedor puede tener varias fotos — del local/fachada,
  de sus productos, de la tarjeta de presentación, de documentos, etc. Se
  suben directamente desde el formulario (varias a la vez) y se ven en
  una galería en la ficha del proveedor.
- **Ficha completa por proveedor**: identificación (razón social, nombre
  comercial, RIF), ubicación (ciudad, estado, país, dirección), contacto
  (persona, cargo, teléfono, WhatsApp, correo, web), clasificación (tipo
  de proveedor, rubro, productos/servicios que ofrece), y calificación
  (estado de evaluación, calidad/precio/entrega/atención del 1 al 5,
  condiciones de pago, pedido mínimo, certificaciones, si factura
  fiscalmente, notas libres).
- **Listado con búsqueda y filtros** por nombre, ciudad, rubro o estado.
- **Panel** con totales, desglose por estado, ciudades con más
  proveedores y los últimos registrados (con su foto de portada).
- **Usuarios**: acceso solo por invitación (sin registro público). Un
  administrador crea las cuentas del equipo desde `/admin/usuarios`.
  Cualquier cuenta puede registrar, editar y calificar proveedores.

## Stack técnico

- [Next.js 16](https://nextjs.org) (App Router, Server Actions) + TypeScript
- [Prisma](https://www.prisma.io) + SQLite (fácil de migrar a PostgreSQL)
- [NextAuth](https://next-auth.js.org) (credenciales + sesión JWT)
- Tailwind CSS
- Fotos guardadas en disco local (carpeta `uploads/photos`), servidas por
  una ruta protegida (`/api/photos/[photoId]`) que exige sesión iniciada

## Primeros pasos (desarrollo)

```bash
cd proveedores
npm install
cp .env.example .env          # y genera un NEXTAUTH_SECRET propio
npx prisma migrate dev         # crea la base de datos SQLite y los datos de ejemplo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Cuenta de ejemplo (creada por el seed)

| Correo | Contraseña |
|---|---|
| `admin@proveedores.com` | `Administrador123!` |

**Cambia esta contraseña antes de usar el sistema en producción.** Desde
esa cuenta se crean las demás desde `/admin/usuarios`.

## Generar un `NEXTAUTH_SECRET`

```bash
openssl rand -base64 32
```

## Limitaciones actuales y siguientes pasos sugeridos

- **Fotos y base de datos**: se guardan en disco local (`uploads/` y
  `dev.db`). Para producción con varias instancias o despliegue en la
  nube, conviene migrar las fotos a un bucket (S3, R2, Google Cloud
  Storage) — el punto de cambio es `src/lib/storage.ts` — y la base de
  datos a PostgreSQL (solo cambia `DATABASE_URL` y el `provider` en
  `prisma/schema.prisma`).
- **Permisos**: hoy es un solo nivel (colaborador / administrador). Si
  hace falta separar por equipo o ciudad, se puede agregar sobre el mismo
  modelo `User`.
- **Duplicados**: no hay detección automática de proveedores repetidos
  (por RIF o nombre). Se puede añadir con una validación en
  `src/lib/actions/suppliers.ts` antes de crear el registro.

## Estructura relevante

```
prisma/schema.prisma            Modelo de datos (usuarios, proveedores, fotos)
src/lib/auth.ts                  Configuración de NextAuth (credenciales)
src/lib/actions/suppliers.ts     Alta, edición y fotos de proveedores (server actions)
src/lib/actions/admin.ts         Gestión de usuarios (administrador)
src/lib/suppliers.ts             Etiquetas, colores y cálculo de calificación
src/lib/storage.ts               Guardado/lectura de fotos subidas
src/app/(app)/dashboard          Panel con totales y últimos registrados
src/app/(app)/suppliers          Listado, alta y ficha de proveedores
src/app/(app)/admin/usuarios     Gestión de cuentas (administrador)
src/app/api/photos/[photoId]     Sirve una foto subida, solo con sesión iniciada
```
