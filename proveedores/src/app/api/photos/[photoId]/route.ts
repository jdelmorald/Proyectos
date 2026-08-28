import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readSupplierPhoto } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { photoId } = await params;

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) {
    return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
  }

  const buffer = await readSupplierPhoto(photo.storedName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Length": String(photo.fileSize),
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
