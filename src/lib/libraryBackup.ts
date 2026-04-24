import { get, set, keys } from "idb-keyval";
import type { Book } from "@/hooks/useBooks";

const KEY_PREFIX = "book:";

export async function exportLibrary(): Promise<void> {
  const allKeys = await keys();
  const bookKeys = allKeys.filter(
    (k) => typeof k === "string" && (k as string).startsWith(KEY_PREFIX),
  );
  const books = (await Promise.all(bookKeys.map((k) => get<Book>(k as string))))
    .filter((b): b is Book => !!b);

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    books,
  };
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `readify-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importLibrary(
  file: File,
  mode: "merge" | "replace" = "merge",
): Promise<{ imported: number; skipped: number }> {
  const text = await file.text();
  const payload = JSON.parse(text);
  if (!payload || !Array.isArray(payload.books)) {
    throw new Error("Ongeldig back-upbestand");
  }

  const existingKeys = (await keys()).filter(
    (k) => typeof k === "string" && (k as string).startsWith(KEY_PREFIX),
  ) as string[];
  const existingIds = new Set(existingKeys.map((k) => k.slice(KEY_PREFIX.length)));

  let imported = 0;
  let skipped = 0;
  for (const book of payload.books as Book[]) {
    if (!book?.id || !book?.data) continue;
    if (mode === "merge" && existingIds.has(book.id)) {
      skipped++;
      continue;
    }
    await set(KEY_PREFIX + book.id, book);
    imported++;
  }
  return { imported, skipped };
}
