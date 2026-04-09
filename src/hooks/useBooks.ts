import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

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
  data: string;
  coverGradient: [string, string];
  coverImage?: string;
  bookmarks: Bookmark[];
  year?: number;
  genre?: string;
  author?: string;
  currentPage?: number;
  totalPages?: number;
  addedAt: string;
}

function rowToBook(row: any): Book {
  return {
    id: row.id,
    name: row.name,
    type: row.type as 'pdf' | 'epub',
    size: row.size,
    data: row.data,
    coverGradient: (row.cover_gradient || ['#C2500A', '#F97316']) as [string, string],
    coverImage: row.cover_image || undefined,
    bookmarks: (row.bookmarks as Bookmark[]) || [],
    year: row.year || undefined,
    genre: row.genre || undefined,
    author: row.author || undefined,
    currentPage: row.current_page || undefined,
    totalPages: row.total_pages || undefined,
    addedAt: row.created_at,
  };
}

export function useBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    if (!user) { setBooks([]); setLoading(false); return; }
    const { data } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });
    setBooks((data || []).map(rowToBook));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const addBook = async (book: Omit<Book, 'id' | 'addedAt'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('books').insert({
      user_id: user.id,
      name: book.name,
      type: book.type,
      size: book.size,
      data: book.data,
      cover_gradient: book.coverGradient,
      cover_image: book.coverImage || null,
      bookmarks: book.bookmarks as unknown as Json,
      year: book.year || null,
      genre: book.genre || null,
      author: book.author || null,
      current_page: book.currentPage || 1,
      total_pages: book.totalPages || null,
    }).select().single();
    if (data) setBooks(prev => [rowToBook(data), ...prev]);
    return { data, error };
  };

  const deleteBook = async (id: string) => {
    await supabase.from('books').delete().eq('id', id);
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  const updateBook = async (id: string, updates: Partial<{
    currentPage: number; totalPages: number; bookmarks: Bookmark[];
  }>) => {
    const dbUpdates: any = {};
    if (updates.currentPage !== undefined) dbUpdates.current_page = updates.currentPage;
    if (updates.totalPages !== undefined) dbUpdates.total_pages = updates.totalPages;
    if (updates.bookmarks !== undefined) dbUpdates.bookmarks = updates.bookmarks as unknown as Json;

    const { data } = await supabase.from('books').update(dbUpdates).eq('id', id).select().single();
    if (data) {
      const updated = rowToBook(data);
      setBooks(prev => prev.map(b => b.id === id ? updated : b));
      return updated;
    }
    return null;
  };

  return { books, loading, addBook, deleteBook, updateBook, refetch: fetchBooks };
}
