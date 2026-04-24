import { useState, useEffect, useCallback } from "react";
import { get, set, del, keys } from "idb-keyval";

export interface Bookmark {
  id: string;
  page: number;
  label: string;
  createdAt: number;
}

export interface Highlight {
  id: string;
  page?: number;      // pdf
  cfi?: string;       // epub
  text: string;
  color: 'yellow' | 'orange' | 'green' | 'blue';
  note?: string;
  createdAt: number;
}

export interface ReaderSettings {
  fontSize?: number;         // 80-160 (percentage)
  lineHeight?: number;       // 1.2-2.2
  theme?: 'default' | 'sepia' | 'dark';
}

export interface Book {
  id: string;
  name: string;
  type: 'pdf' | 'epub';
  size: number;
  data: string;
  coverGradient: [string, string];
  coverImage?: string;
  bookmarks: Bookmark[];
  highlights?: Highlight[];
  readerSettings?: ReaderSettings;
  year?: number;
  genre?: string;
  author?: string;
  currentPage?: number;
  totalPages?: number;
  addedAt: string;
}

const KEY_PREFIX = 'book:';

async function loadAll(): Promise<Book[]> {
  const allKeys = await keys();
  const bookKeys = allKeys.filter(k => typeof k === 'string' && (k as string).startsWith(KEY_PREFIX));
  const books = await Promise.all(bookKeys.map(k => get<Book>(k as string)));
  return books
    .filter((b): b is Book => !!b)
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    setBooks(await loadAll());
    setLoading(false);
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const addBook = async (book: Omit<Book, 'id' | 'addedAt'>) => {
    const newBook: Book = {
      ...book,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
      bookmarks: book.bookmarks || [],
      currentPage: book.currentPage || 1,
    };
    await set(KEY_PREFIX + newBook.id, newBook);
    setBooks(prev => [newBook, ...prev]);
    return { data: newBook, error: null };
  };

  const deleteBook = async (id: string) => {
    await del(KEY_PREFIX + id);
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  const updateBook = async (id: string, updates: Partial<{
    currentPage: number; totalPages: number; bookmarks: Bookmark[];
  }>) => {
    const existing = await get<Book>(KEY_PREFIX + id);
    if (!existing) return null;
    const updated: Book = { ...existing, ...updates };
    await set(KEY_PREFIX + id, updated);
    setBooks(prev => prev.map(b => b.id === id ? updated : b));
    return updated;
  };

  return { books, loading, addBook, deleteBook, updateBook, refetch: fetchBooks };
}
