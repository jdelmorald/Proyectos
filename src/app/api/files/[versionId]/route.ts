import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/storage";
import { canViewSubmission } from "@/lib/roles";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { versionId } = await params;

  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId },
    include: { submission: true },
  });

  if (!version) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  if (!canViewSubmission(session.user, version.submission)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const buffer = await readStoredFile(version.storedName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": version.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(version.originalName)}"`,
      "Content-Length": String(version.fileSize),
    },
  });
}
