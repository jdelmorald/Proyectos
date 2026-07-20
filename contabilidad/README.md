# Sistema Contable — Dirección Financiera

Sistema contable compartido por Sumivensa, Indelderca y Salud San Marcos, ya que las
tres empresas están bajo la misma dirección financiera y la misma legislación
venezolana. Un solo acceso, un selector de empresa en el menú lateral — cada empresa
tiene su propio Plan de Cuentas y sus propios libros contables, nunca se mezclan los
números entre empresas.

## Qué incluye

- **Plan de Cuentas** jerárquico por empresa (activo, pasivo, patrimonio, ingreso,
  gasto, costo), con cuentas marcables como "efectivo" (caja/banco) y con una
  actividad de flujo (operación/inversión/financiamiento) para el reporte de flujo
  de efectivo.
- **Libro Diario**: asientos contables de partida doble (el Debe siempre debe
  igualar al Haber). Cada asiento tiene numeración correlativa propia por empresa
  y puede anularse (dejando el registro y el número reservado, nunca reutilizado).
- **Libro Mayor**: movimientos de una cuenta específica con saldo acumulado.
- **Balance de Comprobación**: saldos deudores/acreedores de todas las cuentas con
  movimiento en el periodo.
- **Balance General**: activo, pasivo y patrimonio (incluye la utilidad del
  ejercicio calculada automáticamente), con verificación de cuadre.
- **Estado de Resultados**: ingresos, costos y gastos del periodo, con utilidad
  bruta y utilidad neta.
- **Flujo de Efectivo**: calculado a partir de los movimientos en las cuentas
  marcadas como efectivo, clasificado por actividad según la contrapartida de
  cada asiento.
- **Libro de Compras y Libro de Ventas**: registro fiscal con los campos exigidos
  por el SENIAT (RIF, N° de factura, N° de control, base imponible, IVA,
  retenciones).
- **Flujo de Caja Proyectado**: planificación de ingresos y egresos por periodo
  (mes), con resumen acumulado.
- **Multimoneda**: cada línea de un asiento puede registrarse en Bolívares,
  Dólares, Pesos Colombianos o Euros. Se lleva un histórico de tasas de cambio
  y el sistema calcula automáticamente el equivalente en bolívares.
- **Centros de Costo**: cada línea de un asiento puede asociarse a un área,
  departamento o proyecto, para saber en qué se está gastando/ingresando.
- **Cuentas por Cobrar y por Pagar**: al registrar un asiento sobre una cuenta
  marcada como CxC o CxP (con su cliente/proveedor), el sistema crea
  automáticamente el registro pendiente con su saldo y vencimiento. Desde
  "CxC / CxP" en el menú se registran los cobros y pagos — el sistema genera
  solo el asiento contable de contrapartida (Banco/Caja) y actualiza el saldo.
- **Módulo Fiscal** (disciplina fiscal venezolana):
  - **IVA Declarable**: débito fiscal, crédito fiscal e IVA a pagar del
    periodo, calculado desde el Libro de Compras y Ventas.
  - **Retenciones de ISLR** aplicadas a proveedores.
  - **ISLR Estimado**: calculado según la Tarifa 2 (personas jurídicas) sobre
    la utilidad fiscal del periodo, en Unidades Tributarias — se registran los
    anticipos/retenciones ya pagados para obtener el saldo por pagar o a favor.
  - **IGTF** (Impuesto a las Grandes Transacciones Financieras): registro de
    operaciones sujetas y cálculo del impuesto (alícuota configurable, 3% por
    defecto).
  - **Impuesto Municipal** sobre Actividades Económicas: calculado sobre los
    ingresos brutos según la alícuota y el municipio configurados por empresa.

Configure el valor de la Unidad Tributaria y la alícuota municipal de cada
empresa en **Configuración → Empresas**.

Por ahora los asientos, el libro de compras/ventas y el flujo proyectado se
registran manualmente. Más adelante se evaluará conectar automáticamente las
facturas y pagos que ya emiten los sistemas operativos de cada empresa (Sumivensa,
Indelderca, Salud San Marcos) para que generen sus asientos contables solos.

## Arquitectura

- **server/**: API REST en Node.js + Express + TypeScript, base de datos SQLite
  (archivo único, usa el módulo SQLite incorporado en Node.js — no requiere
  compilar nada ni instalar Visual Studio Build Tools en Windows).
- **client/**: aplicación web en React + Vite + TypeScript + Tailwind CSS.

## Instalación permanente en Windows (recomendada)

Deja el sistema corriendo **en segundo plano, sin ninguna ventana visible**, y
arranca solo cada vez que se inicia sesión en esa PC. Se instala una sola vez y
**no requiere permisos de administrador** ni instalar nada adicional.

> **Use únicamente los archivos en la carpeta principal del proyecto**
> (`instalar.bat`, `actualizar.bat`, `desinstalar.bat`). Hay otra carpeta llamada
> `avanzado-modo-manual` con un método distinto para casos especiales — no la use
> a menos que se le indique explícitamente.

1. Instale **Node.js 22 o superior** (https://nodejs.org) si no lo tiene.
2. Descargue este proyecto completo y descomprímalo.
3. Haga doble clic en **`instalar.bat`**.
4. La primera vez tardará varios minutos. Al terminar, se crea automáticamente un
   acceso directo llamado **"Sistema Contable"** en el Escritorio, y el sistema
   queda corriendo de inmediato.
5. De ahí en adelante, para usar el sistema: doble clic en el acceso directo
   **"Sistema Contable"** del Escritorio (abre el navegador en
   `http://localhost:4004`).
6. Inicie sesión con el usuario administrador por defecto:
   `admin@contabilidad.com` / `CambiarClave123!` — **cámbiela de inmediato**.
7. Use el selector de empresa en el menú lateral para cambiar entre Sumivensa,
   Indelderca y Salud San Marcos — cada una llega precargada con un Plan de
   Cuentas estándar venezolano listo para usar.

**Si más adelante reciben una versión actualizada:** reemplacen los archivos del
proyecto por los nuevos y ejecuten **`actualizar.bat`** (nunca borren la carpeta
ni pierdan `server/data`, ahí vive toda la contabilidad).

**Para desinstalar**: ejecute **`desinstalar.bat`**. Esto no borra el proyecto ni
los datos.

## Modelo de permisos

- **Administrador**: además de registrar asientos y consultar reportes, puede
  crear/editar empresas y gestionar usuarios.
- **Operador**: puede registrar asientos, libros fiscales y flujo proyectado, y
  consultar todos los reportes.
