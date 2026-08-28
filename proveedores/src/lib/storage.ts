import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.UPLOADS_DIR ?? "./uploads"
);
const PHOTOS_DIR = path.join(UPLOADS_DIR, "photos");

export const ALLOWED_PHOTO_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB — fotos tomadas con el celular

export function isAllowedPhoto(mimeType: string, size: number) {
  return ALLOWED_PHOTO_MIME_TYPES.has(mimeType) && size > 0 && size <= MAX_PHOTO_SIZE_BYTES;
}

async function ensurePhotosDir() {
  await mkdir(PHOTOS_DIR, { recursive: true });
}

export async function saveSupplierPhoto(file: File): Promise<{ storedName: string }> {
  await ensurePhotosDir();

  const ext = path.extname(file.name).slice(0, 10) || ".jpg";
  const storedName = `${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(PHOTOS_DIR, storedName), buffer);

  return { storedName };
}

export async function readSupplierPhoto(storedName: string): Promise<Buffer> {
  const safeName = path.basename(storedName);
  return readFile(path.join(PHOTOS_DIR, safeName));
}

export async function deleteSupplierPhoto(storedName: string): Promise<void> {
  const safeName = path.basename(storedName);
  try {
    await unlink(path.join(PHOTOS_DIR, safeName));
  } catch {
    // el archivo ya no existe; se ignora
  }
}
