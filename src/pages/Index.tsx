import { useState, useCallback, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import DropZone from "@/components/DropZone";
import BookCard from "@/components/BookCard";
import PdfViewer from "@/components/PdfViewer";
import EpubViewer from "@/components/EpubViewer";
import { type Book, loadBooks, saveBooks, addBook, getTotalSize, getTheme, setTheme as saveThemeToStorage } from "@/lib/bookStore";
import { Search } from "lucide-react";

export default function Index() {
  const [books, setBooks] = useState<Book[]>(loadBooks);
  const [page, setPage] = useState<'home' | 'reading'>('home');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Book | null>(null);
  const [toast, setToast] = useState('');
  const [theme, setThemeState] = useState<'dark' | 'light'>(getTheme);
  const fileRef = useRef<HTMLInputElement>(null);

  // Apply theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleThemeChange = (t: 'dark' | 'light') => {
    setThemeState(t);
    saveThemeToStorage(t);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const newBooks: Book[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'epub') continue;
      try {
        const book = await addBook(file);
        newBooks.push(book);
      } catch (e) {
        console.error('Failed to load file:', e);
      }
    }
    if (newBooks.length) {
      const updated = [...books, ...newBooks];
      setBooks(updated);
      saveBooks(updated);
      showToast(`${newBooks.length} boek(en) toegevoegd!`);
    }
  }, [books]);

  const handleDelete = (id: string) => {
    const updated = books.filter(b => b.id !== id);
    setBooks(updated);
    saveBooks(updated);
    showToast('Boek verwijderd');
  };

  const handleProgress = useCallback((currentPage: number, totalPages: number) => {
    setBooks(prev => {
      const updated = prev.map(b =>
        b.id === viewing?.id ? { ...b, currentPage, totalPages } : b
      );
      saveBooks(updated);
      return updated;
    });
  }, [viewing?.id]);

  const handleBookmark = useCallback((page: number) => {
    if (!viewing) return;
    const bookmark = { id: crypto.randomUUID(), page, label: `Pagina ${page}`, createdAt: Date.now() };
    setBooks(prev => {
      const updated = prev.map(b =>
        b.id === viewing.id ? { ...b, bookmarks: [...(b.bookmarks || []), bookmark] } : b
      );
      saveBooks(updated);
      // Update viewing reference
      const updatedBook = updated.find(b => b.id === viewing.id);
      if (updatedBook) setViewing(updatedBook);
      return updated;
    });
    showToast('Bladwijzer toegevoegd');
  }, [viewing]);

  const handleRemoveBookmark = useCallback((bmId: string) => {
    if (!viewing) return;
    setBooks(prev => {
      const updated = prev.map(b =>
        b.id === viewing.id ? { ...b, bookmarks: (b.bookmarks || []).filter(bm => bm.id !== bmId) } : b
      );
      saveBooks(updated);
      const updatedBook = updated.find(b => b.id === viewing.id);
      if (updatedBook) setViewing(updatedBook);
      return updated;
    });
    showToast('Bladwijzer verwijderd');
  }, [viewing]);

  const filtered = books.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const readingBooks = books.filter(b => b.currentPage && b.currentPage > 1);

  return (
    <div className="flex min-h-screen bg-background font-sans relative overflow-hidden">
      <Sidebar page={page} onPageChange={setPage} storageSize={getTotalSize(books)} theme={theme} onThemeChange={handleThemeChange} />

      <div className="flex-1 flex flex-col overflow-hidden relative z-[2]">
        <div className="px-5 py-4 bg-background/75 border-b border-border flex items-center gap-2.5">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx3" />
            <input
              className="w-full border border-border rounded-lg py-[7px] pl-9 pr-3 text-[13px] bg-foreground/[0.04] text-foreground placeholder:text-tx3 focus:outline-none focus:border-primary transition-colors"
              placeholder="Zoek boeken…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-[11px] px-3 py-[7px] rounded-lg bg-primary text-primary-foreground font-medium hover:bg-or-dark transition-all"
          >
            + Boek toevoegen
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.epub"
            multiple
            className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        <div className="flex-1 p-5 overflow-y-auto">
          {page === 'home' ? (
            <>
              {books.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5 mb-6">
                  <div className="bg-primary/[0.07] border border-border rounded-lg p-3 text-center">
                    <div className="text-[22px] font-medium text-primary">{books.length}</div>
                    <div className="text-[11px] text-tx3 mt-0.5">Boeken</div>
                  </div>
                  <div className="bg-primary/[0.07] border border-border rounded-lg p-3 text-center">
                    <div className="text-[22px] font-medium text-primary">{books.filter(b => b.type === 'pdf').length}</div>
                    <div className="text-[11px] text-tx3 mt-0.5">PDF</div>
                  </div>
                  <div className="bg-primary/[0.07] border border-border rounded-lg p-3 text-center">
                    <div className="text-[22px] font-medium text-primary">{books.filter(b => b.type === 'epub').length}</div>
                    <div className="text-[11px] text-tx3 mt-0.5">EPUB</div>
                  </div>
                </div>
              )}

              <DropZone onFiles={handleFiles} />

              {filtered.length === 0 && books.length === 0 && (
                <div className="text-center p-8 text-tx3">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto mb-3">
                    <rect x="6" y="4" width="18" height="26" rx="2" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.4" />
                    <rect x="14" y="9" width="18" height="26" rx="2" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.7" />
                  </svg>
                  <div className="text-sm font-medium text-tx2 mb-1">Nog geen boeken</div>
                  <div className="text-[13px]">Upload je eerste PDF of EPUB hierboven</div>
                </div>
              )}

              {filtered.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3.5">
                  {filtered.map(book => (
                    <BookCard key={book.id} book={book} onOpen={setViewing} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-[15px] font-medium text-foreground mb-3">Aan het lezen</div>
              {readingBooks.length === 0 ? (
                <div className="text-[13px] text-tx3 text-center p-8">Geen boeken in voortgang</div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3.5">
                  {readingBooks.map(book => (
                    <BookCard key={book.id} book={book} onOpen={setViewing} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {viewing && viewing.type === 'pdf' && (
        <PdfViewer book={viewing} onClose={() => setViewing(null)} onProgress={handleProgress} onBookmark={handleBookmark} onRemoveBookmark={handleRemoveBookmark} />
      )}
      {viewing && viewing.type === 'epub' && (
        <EpubViewer book={viewing} onClose={() => setViewing(null)} />
      )}

      <div className={`absolute bottom-4 right-4 bg-primary text-primary-foreground px-3.5 py-2 rounded-lg text-[13px] font-medium z-30 transition-opacity ${toast ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {toast}
      </div>
    </div>
  );
}
