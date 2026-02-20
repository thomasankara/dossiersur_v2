export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s.\-]/g, "_")
    .replace(/\.{2,}/g, "_")
    .slice(0, 200);
}
