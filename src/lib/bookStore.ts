export interface Book {
  id: string;
  name: string;
  type: 'pdf' | 'epub';
  size: number;
  data: string; // base64
  addedAt: number;
  currentPage?: number;
  totalPages?: number;
  coverGradient: [string, string];
}

const GRADS: [string, string][] = [
  ['#C2500A', '#F97316'],
  ['#7C3AED', '#A78BFA'],
  ['#059669', '#34D399'],
  ['#DC2626', '#F87171'],
  ['#2563EB', '#60A5FA'],
  ['#D97706', '#FBBF24'],
  ['#7C3AED', '#F472B6'],
  ['#0891B2', '#22D3EE'],
];

function randomGrad(): [string, string] {
  return GRADS[Math.floor(Math.random() * GRADS.length)];
}

const STORAGE_KEY = 'readify_books';

export function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBooks(books: Book[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export function addBook(file: File): Promise<Book> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const ext = file.name.split('.').pop()?.toLowerCase();
      const type = ext === 'epub' ? 'epub' : 'pdf';
      const book: Book = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.(pdf|epub)$/i, ''),
        type,
        size: file.size,
        data: base64,
        addedAt: Date.now(),
        currentPage: 1,
        totalPages: undefined,
        coverGradient: randomGrad(),
      };
      resolve(book);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getTotalSize(books: Book[]): string {
  const total = books.reduce((s, b) => s + b.size, 0);
  return formatSize(total);
}
