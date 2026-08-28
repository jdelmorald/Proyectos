import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import ExcelJS from "exceljs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SUPPLIER_TYPE_LABELS,
  SUPPLIER_STATUS_LABELS,
  CURRENCY_LABELS,
  PAYMENT_METHOD_LABELS,
  overallRating,
} from "@/lib/suppliers";

const COLUMNS: { header: string; width: number }[] = [
  { header: "Razón social", width: 30 },
  { header: "Nombre comercial", width: 22 },
  { header: "RIF", width: 16 },
  { header: "Tipo", width: 16 },
  { header: "Rubro", width: 18 },
  { header: "Representa marca", width: 18 },
  { header: "Ciudad", width: 16 },
  { header: "Estado", width: 14 },
  { header: "País", width: 12 },
  { header: "Dirección", width: 30 },
  { header: "Persona de contacto", width: 20 },
  { header: "Cargo", width: 16 },
  { header: "Teléfono", width: 14 },
  { header: "Ext.", width: 8 },
  { header: "WhatsApp", width: 14 },
  { header: "Correo", width: 24 },
  { header: "Web", width: 20 },
  { header: "Estado del proveedor", width: 16 },
  { header: "Calidad", width: 9 },
  { header: "Precio", width: 9 },
  { header: "Entrega", width: 9 },
  { header: "Calidad de atención", width: 12 },
  { header: "Calificación general", width: 12 },
  { header: "Monedas de cobro", width: 20 },
  { header: "Métodos de pago", width: 24 },
  { header: "Condiciones de pago", width: 20 },
  { header: "Pedido mínimo", width: 16 },
  { header: "Factura fiscal", width: 12 },
  { header: "Certificaciones", width: 22 },
  { header: "Productos/servicios", width: 30 },
  { header: "Notas", width: 30 },
  { header: "Fecha de visita", width: 14 },
  { header: "Registrado por", width: 18 },
  { header: "Fecha de registro", width: 18 },
  { header: "Última edición por", width: 18 },
  { header: "Última edición", width: 18 },
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "Solo un administrador puede exportar los datos." }, { status: 403 });
  }

  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: "asc" },
    include: { registeredBy: true, updatedBy: true },
  });

  const currency = (s: (typeof suppliers)[number]) =>
    [
      ...s.currencies.filter((c) => c !== "OTRO").map((c) => CURRENCY_LABELS[c] ?? c),
      ...(s.currencies.includes("OTRO") && s.currencyOther ? [s.currencyOther] : []),
    ].join(" / ");

  const payment = (s: (typeof suppliers)[number]) =>
    [
      ...s.paymentMethods.filter((m) => m !== "OTRO").map((m) => PAYMENT_METHOD_LABELS[m] ?? m),
      ...(s.paymentMethods.includes("OTRO") && s.paymentMethodOther ? [s.paymentMethodOther] : []),
    ].join(" / ");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sumivensa";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Proveedores", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = COLUMNS.map((c) => ({ header: c.header, width: c.width }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD6293A" } };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  });

  for (const s of suppliers) {
    const row = sheet.addRow([
      s.legalName,
      s.tradeName ?? "",
      s.taxId ?? "",
      SUPPLIER_TYPE_LABELS[s.type],
      s.category ?? "",
      s.isBrandRepresentative ? s.representedBrand ?? "Sí" : "",
      s.city,
      s.state ?? "",
      s.country,
      s.address ?? "",
      s.contactName ?? "",
      s.contactRole ?? "",
      s.phone ?? "",
      s.phoneExt ?? "",
      s.whatsapp ?? "",
      s.email ?? "",
      s.website ?? "",
      SUPPLIER_STATUS_LABELS[s.status],
      s.qualityRating ?? "",
      s.priceRating ?? "",
      s.deliveryRating ?? "",
      s.serviceRating ?? "",
      overallRating(s)?.toFixed(1) ?? "",
      currency(s),
      payment(s),
      s.paymentTerms ?? "",
      s.minOrder ?? "",
      s.hasInvoice ? "Sí" : "No",
      s.certifications ?? "",
      s.products ?? "",
      s.notes ?? "",
      s.visitDate ? s.visitDate.toISOString().slice(0, 10) : "",
      s.registeredBy.name,
      s.createdAt.toISOString().slice(0, 16).replace("T", " "),
      s.updatedBy?.name ?? "",
      s.updatedBy ? s.updatedAt.toISOString().slice(0, 16).replace("T", " ") : "",
    ]);
    row.alignment = { vertical: "top", wrapText: false };
  }

  // Franjas alternas para que las filas no se confundan al leer horizontalmente.
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (rowNumber % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFBF7F3" } };
      });
    }
  });

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="proveedores-sumivensa-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
