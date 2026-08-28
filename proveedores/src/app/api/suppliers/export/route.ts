import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SUPPLIER_TYPE_LABELS,
  SUPPLIER_STATUS_LABELS,
  CURRENCY_LABELS,
  PAYMENT_METHOD_LABELS,
  overallRating,
} from "@/lib/suppliers";

function csvCell(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

const HEADERS = [
  "Razón social",
  "Nombre comercial",
  "RIF",
  "Tipo",
  "Rubro",
  "Representa marca",
  "Ciudad",
  "Estado",
  "País",
  "Dirección",
  "Persona de contacto",
  "Cargo",
  "Teléfono",
  "Ext.",
  "WhatsApp",
  "Correo",
  "Web",
  "Estado del proveedor",
  "Calidad",
  "Precio",
  "Entrega",
  "Otros",
  "Calificación general",
  "Monedas de cobro",
  "Métodos de pago",
  "Condiciones de pago",
  "Pedido mínimo",
  "Factura fiscal",
  "Certificaciones",
  "Productos/servicios",
  "Notas",
  "Fecha de visita",
  "Registrado por",
  "Fecha de registro",
  "Última edición por",
  "Última edición",
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

  const rows = suppliers.map((s) =>
    [
      s.legalName,
      s.tradeName,
      s.taxId,
      SUPPLIER_TYPE_LABELS[s.type],
      s.category,
      s.isBrandRepresentative ? s.representedBrand ?? "Sí" : "",
      s.city,
      s.state,
      s.country,
      s.address,
      s.contactName,
      s.contactRole,
      s.phone,
      s.phoneExt,
      s.whatsapp,
      s.email,
      s.website,
      SUPPLIER_STATUS_LABELS[s.status],
      s.qualityRating,
      s.priceRating,
      s.deliveryRating,
      s.serviceRating,
      overallRating(s)?.toFixed(1) ?? "",
      currency(s),
      payment(s),
      s.paymentTerms,
      s.minOrder,
      s.hasInvoice ? "Sí" : "No",
      s.certifications,
      s.products,
      s.notes,
      s.visitDate ? s.visitDate.toISOString().slice(0, 10) : "",
      s.registeredBy.name,
      s.createdAt.toISOString(),
      s.updatedBy?.name ?? "",
      s.updatedBy ? s.updatedAt.toISOString() : "",
    ]
      .map(csvCell)
      .join(",")
  );

  const csv = [HEADERS.map(csvCell).join(","), ...rows].join("\n");
  const bom = "﻿"; // para que Excel abra los acentos correctamente

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="proveedores-sumivensa-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
