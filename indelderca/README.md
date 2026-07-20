# Sistema de Documentos Operativos — Indelderca

Sistema web para generar y controlar todos los documentos operativos de Indelderca,
con numeración correlativa automática, fecha y formato estandarizado para cada tipo.

## Documentos incluidos

**Comercial**
Orden de Compra · Cotización · Factura (fiscal, con N° de Control) · Nota de Entrega ·
Nota de Crédito (fiscal) · Nota de Débito (fiscal) · Recibo de Pago · Orden de Servicio

**Almacén y Logística**
Guía de Despacho · Acta de Recepción de Mercancía · Acta de Entrega · Acta de Almacén ·
Vale de Salida de Almacén · Vale de Entrada de Almacén · Acta de Inventario

**Administrativo**
Comprobante de Pago · Comprobante de Retención de IVA (fiscal) · Requisición de Compra ·
Acta de Reunión

Cada tipo de documento tiene su propio correlativo independiente (prefijo + año + número),
y los documentos fiscales (Factura, Nota de Crédito, Nota de Débito) llevan además un
Número de Control separado, tal como exige la normativa venezolana. Los documentos fiscales
nunca se modifican ni se eliminan una vez emitidos: para corregirlos se emite una Nota de
Crédito/Débito que los referencia, y cualquier documento puede anularse (quedando el registro
y el número reservado, nunca reutilizado).

## Arquitectura

- **server/**: API REST en Node.js + Express + TypeScript, base de datos SQLite
  (archivo único, sin necesidad de instalar un motor de BD aparte).
- **client/**: aplicación web en React + Vite + TypeScript + Tailwind CSS.
- **shared/documentTypes.ts**: catálogo maestro de los 19 tipos de documento (se mantiene
  una copia en `server/src/documentTypes.ts` y otra en `client/src/config/documentTypes.ts`).

La impresión/PDF de cada documento se genera como una página HTML optimizada para
impresión (`Ctrl+P` → Guardar como PDF), sin depender de ningún servicio externo.

## Requisitos

- Node.js 22 o superior (descárguelo de https://nodejs.org — instalador normal, "Siguiente, Siguiente, Finalizar").
  No se necesita ningún compilador, Visual Studio ni herramienta adicional: la base de
  datos usa el módulo SQLite incorporado en Node.js.

## Instalación permanente en Windows (recomendada)

Deja el sistema corriendo **en segundo plano, sin ninguna ventana visible**, y
arranca solo cada vez que se inicia sesión en esa PC. Se instala una sola vez y
**no requiere permisos de administrador** ni instalar nada adicional.

> **Use únicamente los archivos en la carpeta principal del proyecto**
> (`instalar.bat`, `actualizar.bat`, `desinstalar.bat`). Hay otra carpeta llamada
> `avanzado-modo-manual` con un método distinto para casos especiales — no la use
> a menos que se le indique explícitamente, para no confundir los dos métodos.

1. Instale **Node.js** (ver "Requisitos" arriba) si no lo tiene.
2. Descargue este proyecto completo y descomprímalo (por ejemplo, en el Escritorio).
3. Haga doble clic en **`instalar.bat`** (el que está directamente en la carpeta
   principal del proyecto, no dentro de ninguna subcarpeta).
4. La primera vez tardará varios minutos. Al terminar, se crea automáticamente un
   acceso directo llamado **"Indelderca"** en el Escritorio, y el sistema queda
   corriendo de inmediato.
5. De ahí en adelante, para usar el sistema: doble clic en el acceso directo
   **"Indelderca"** del Escritorio (abre el navegador en `http://localhost:4001`).
   No hace falta abrir nada más ni dejar ninguna ventana abierta.
6. Inicie sesión con el usuario administrador por defecto: `admin@indelderca.com` /
   `CambiarClave123!` — **cámbiela de inmediato** desde el sistema.

Para que otras computadoras de la misma red (oficina) también puedan usarlo, en vez
de `http://localhost:4001` deben entrar a `http://<IP-de-esa-PC>:4001` (la IP se ve
con `ipconfig` en la PC donde está instalado).

**Si más adelante reciben una versión actualizada del sistema:** reemplacen los
archivos del proyecto por los nuevos y ejecuten **`actualizar.bat`** (reconstruye
todo y reinicia el sistema automáticamente, sin perder los datos guardados).

**Para desinstalar** (dejar de correr y de arrancar automáticamente): ejecute
**`desinstalar.bat`**. Esto no borra el proyecto ni los datos.

## Alternativa: modo manual con ventana abierta (Windows/Mac/Linux)

Solo para pruebas rápidas o para Mac/Linux (el instalador de arriba es específico de
Windows). Los archivos de este modo están dentro de la carpeta
**`avanzado-modo-manual/`**, separados a propósito del método recomendado para
evitar confundirlos. A diferencia del método anterior, el sistema **deja de
funcionar si se cierra la ventana**.

1. Instale **Node.js** (ver "Requisitos" arriba) si no lo tiene.
2. Descargue este proyecto completo y descomprímalo.
3. Entre a la carpeta `avanzado-modo-manual`. **Windows:** haga doble clic en
   `iniciar.bat`. **Mac/Linux:** abra la Terminal en esa carpeta y ejecute
   `bash iniciar.sh`.
4. La primera vez tardará varios minutos. Cuando termine, deje esa ventana abierta y
   abra su navegador en: **http://localhost:4001**

Para volver a usar el sistema otro día, repita el paso 3 y deje la ventana abierta
mientras lo use.

## Instalación y arranque (desarrollo)

```bash
# 1) Backend
cd server
cp .env.example .env      # ajustar JWT_SECRET y credenciales del admin si se desea
npm install
npm run seed               # crea la base de datos, correlativos y usuario admin
npm run dev                 # http://localhost:4001

# 2) Frontend (en otra terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

El usuario administrador inicial se define en `server/.env` (`SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`, por defecto `admin@indelderca.com` / `CambiarClave123!`).
**Cambie esta contraseña inmediatamente después del primer ingreso** desde la opción
correspondiente, o cree un nuevo usuario administrador y desactive el inicial.

## Primeros pasos dentro del sistema

1. Inicie sesión con el usuario administrador.
2. Vaya a **Configuración → Datos de la empresa** y complete RIF, dirección, logo, etc.
   Esta información aparece en el encabezado de todo documento impreso.
3. Cargue sus **Clientes**, **Proveedores** y **Productos/Servicios** (opcional, pero
   agiliza la generación de documentos).
4. Revise **Configuración → Correlativos** si necesita ajustar el prefijo o el número
   inicial de algún tipo de documento (solo administradores).
5. Desde el **Panel principal** o el menú lateral, genere cualquier documento: se le
   asignará automáticamente el siguiente número correlativo (y N° de Control si aplica).

## Producción manual (sin los scripts iniciar.bat/iniciar.sh)

El backend, una vez compilado, sirve automáticamente el frontend compilado desde el
mismo puerto (no hace falta un servidor de estáticos ni proxy aparte):

```bash
# 1) Compilar frontend
cd client
npm install
npm run build          # genera client/dist

# 2) Compilar y arrancar backend (sirve la API y también client/dist)
cd ../server
npm install
npm run build
npm start               # todo disponible en http://localhost:4001 (o el PORT configurado)
```

Si en cambio prefiere desplegar el frontend por separado (otro dominio/servidor), configure
`CORS_ORIGIN` en `server/.env` con esa URL y ajuste el cliente para apuntar su `/api` al
backend correspondiente.

## Modelo de permisos

- **Administrador**: además de generar documentos, puede editar los datos de la empresa,
  reconfigurar correlativos y crear/gestionar usuarios.
- **Operador**: puede generar, consultar, imprimir y anular documentos, y mantener los
  catálogos de clientes/proveedores/productos.
