// Las fotos se guardan como bytes directamente en la base de datos (ver
// modelo Photo en prisma/schema.prisma) — no se usa disco local, para que
// funcionen igual en un hosting serverless (sin almacenamiento persistente).

export const ALLOWED_PHOTO_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB — fotos tomadas con el celular

export function isAllowedPhoto(mimeType: string, size: number) {
  return ALLOWED_PHOTO_MIME_TYPES.has(mimeType) && size > 0 && size <= MAX_PHOTO_SIZE_BYTES;
}
