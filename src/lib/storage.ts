import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.UPLOADS_DIR ?? "./uploads"
);

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
]);

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function isAllowedFile(mimeType: string, size: number) {
  return ALLOWED_MIME_TYPES.has(mimeType) && size > 0 && size <= MAX_FILE_SIZE_BYTES;
}

async function ensureUploadsDir() {
  await mkdir(UPLOADS_DIR, { recursive: true });
}

export async function saveUploadedFile(file: File): Promise<{ storedName: string }> {
  await ensureUploadsDir();

  const ext = path.extname(file.name).slice(0, 20);
  const storedName = `${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(UPLOADS_DIR, storedName), buffer);

  return { storedName };
}

export async function readStoredFile(storedName: string): Promise<Buffer> {
  const safeName = path.basename(storedName);
  return readFile(path.join(UPLOADS_DIR, safeName));
}

export async function deleteStoredFile(storedName: string): Promise<void> {
  const safeName = path.basename(storedName);
  try {
    await unlink(path.join(UPLOADS_DIR, safeName));
  } catch {
    // file already gone; ignore
  }
}

const LOGOS_DIR = path.resolve(/* turbopackIgnore: true */ process.cwd(), "public/logos");

export const ALLOWED_LOGO_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
export const MAX_LOGO_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

export function isAllowedLogo(mimeType: string, size: number) {
  return ALLOWED_LOGO_MIME_TYPES.has(mimeType) && size > 0 && size <= MAX_LOGO_SIZE_BYTES;
}

/** Saves a company logo to public/logos and returns the public path to store on the Company record. */
export async function saveCompanyLogo(companyId: string, file: File): Promise<string> {
  await mkdir(LOGOS_DIR, { recursive: true });

  const ext = path.extname(file.name).slice(0, 10) || ".png";
  const fileName = `${companyId}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(LOGOS_DIR, fileName), buffer);

  return `/logos/${fileName}`;
}
