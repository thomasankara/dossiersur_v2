const MAGIC_BYTES: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
};

// WebP requires both RIFF header (bytes 0-3) AND "WEBP" marker (bytes 8-11)
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];

export function verifyMimeType(buffer: ArrayBuffer, declaredType: string): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 12));

  if (declaredType === "image/webp") {
    const isRiff = WEBP_RIFF.every((b, i) => bytes[i] === b);
    const isWebp = WEBP_MARKER.every((b, i) => bytes[8 + i] === b);
    return isRiff && isWebp;
  }

  const signatures = MAGIC_BYTES[declaredType];
  if (!signatures) return false;
  return signatures.some((sig) =>
    sig.every((byte, i) => bytes[i] === byte),
  );
}
