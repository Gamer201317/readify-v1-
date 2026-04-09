export interface Bookmark {
  id: string;
  page: number;
  label: string;
  createdAt: number;
}

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
  coverImage?: string; // base64 thumbnail of first page
  bookmarks?: Bookmark[];
  year?: number;
  genre?: string;
  author?: string;
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
const THEME_KEY = 'readify_theme';

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

export function getTheme(): 'dark' | 'light' {
  return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark';
}

export function setTheme(theme: 'dark' | 'light') {
  localStorage.setItem(THEME_KEY, theme);
}

export async function generatePdfCover(dataUrl: string): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

  const data = atob(dataUrl.split(',')[1]);
  const arr = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) arr[i] = data.charCodeAt(i);

  const pdf = await pdfjsLib.getDocument({ data: arr }).promise;
  const page = await pdf.getPage(1);
  const vp = page.getViewport({ scale: 0.5 });
  const canvas = document.createElement('canvas');
  canvas.width = vp.width;
  canvas.height = vp.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  const coverImage = canvas.toDataURL('image/jpeg', 0.7);
  pdf.destroy();
  return coverImage;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function createBook(
  file: File,
  base64: string,
  metadata: { name: string; year?: number; genre?: string; author?: string },
  coverImage?: string
): Book {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return {
    id: crypto.randomUUID(),
    name: metadata.name,
    type: ext === 'epub' ? 'epub' : 'pdf',
    size: file.size,
    data: base64,
    addedAt: Date.now(),
    currentPage: 1,
    totalPages: undefined,
    coverGradient: randomGrad(),
    coverImage,
    bookmarks: [],
    year: metadata.year,
    genre: metadata.genre,
    author: metadata.author,
  };
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
