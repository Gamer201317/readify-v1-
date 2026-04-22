import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import DropZone from "@/components/DropZone";
import BookCard from "@/components/BookCard";
import PdfViewer from "@/components/PdfViewer";
import EpubViewer from "@/components/EpubViewer";
import UploadDialog from "@/components/UploadDialog";
import EasterEggOverlay from "@/components/EasterEggOverlay";
import { useBooks, type Book } from "@/hooks/useBooks";
import { useEasterEggs } from "@/hooks/useEasterEggs";
import { fileToBase64, getTheme, setTheme as saveThemeToStorage } from "@/lib/bookStore";
import { Search, Home } from "lucide-react";

const GRADS: [string, string][] = [
  ['#C2500A', '#F97316'], ['#7C3AED', '#A78BFA'], ['#059669', '#34D399'],
  ['#DC2626', '#F87171'], ['#2563EB', '#60A5FA'], ['#D97706', '#FBBF24'],
  ['#7C3AED', '#F472B6'], ['#0891B2', '#22D3EE'],
];

function randomGrad(): [string, string] {
  return GRADS[Math.floor(Math.random() * GRADS.length)];
}

export default function Index() {
  const { books, loading: booksLoading, addBook, deleteBook, updateBook } = useBooks();
  const { effect, handleLogoClick, checkSearchCommand } = useEasterEggs();

  const [page, setPage] = useState<'home' | 'reading' | 'catalog'>('home');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Book | null>(null);
  const [toast, setToast] = useState('');
  const [theme, setThemeState] = useState<'dark' | 'light'>(getTheme);
  const [uploadQueue, setUploadQueue] = useState<{ file: File; base64: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleThemeChange = (t: 'dark' | 'light') => { setThemeState(t); saveThemeToStorage(t); };
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleFiles = async (files: FileList) => {
    const queue: { file: File; base64: string }[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'epub') continue;
      try { queue.push({ file, base64: await fileToBase64(file) }); } catch {}
    }
    if (queue.length) setUploadQueue(queue);
  };

  const handleUploadConfirm = async (metadata: { name: string; year?: number; genre?: string; author?: string }, coverImage?: string) => {
    const current = uploadQueue[0];
    if (!current) return;
    const ext = current.file.name.split('.').pop()?.toLowerCase();
    await addBook({
      name: metadata.name,
      type: (ext === 'epub' ? 'epub' : 'pdf') as 'pdf' | 'epub',
      size: current.file.size,
      data: current.base64,
      coverGradient: randomGrad(),
      coverImage,
      bookmarks: [],
      year: metadata.year,
      genre: metadata.genre,
      author: metadata.author,
      currentPage: 1,
    });
    const remaining = uploadQueue.slice(1);
    setUploadQueue(remaining);
    if (!remaining.length) showToast('Boek toegevoegd!');
  };

  const handleUploadCancel = () => setUploadQueue(prev => prev.slice(1));

  const handleDelete = async (id: string) => { await deleteBook(id); showToast('Boek verwijderd'); };

  const handleProgress = async (currentPage: number, totalPages: number) => {
    if (!viewing) return;
    const updated = await updateBook(viewing.id, { currentPage, totalPages });
    if (updated) setViewing(updated);
  };

  const handleBookmark = async (pg: number) => {
    if (!viewing) return;
    const newBm = { id: crypto.randomUUID(), page: pg, label: `Pagina ${pg}`, createdAt: Date.now() };
    const updated = await updateBook(viewing.id, { bookmarks: [...(viewing.bookmarks || []), newBm] });
    if (updated) setViewing(updated);
    showToast('Bladwijzer toegevoegd');
  };

  const handleRemoveBookmark = async (bmId: string) => {
    if (!viewing) return;
    const updated = await updateBook(viewing.id, { bookmarks: (viewing.bookmarks || []).filter(bm => bm.id !== bmId) });
    if (updated) setViewing(updated);
    showToast('Bladwijzer verwijderd');
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    checkSearchCommand(val);
  };

  const filtered = books.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  const readingBooks = books.filter(b => b.currentPage && b.currentPage > 1);
  const catalogByYear = [...filtered].sort((a, b) => (b.year || 0) - (a.year || 0));
  const years = Array.from(new Set(catalogByYear.map(b => b.year || 0)));
  const totalSize = books.reduce((s, b) => s + b.size, 0);
  const sizeStr = totalSize < 1024 ? totalSize + ' B' : totalSize < 1024 * 1024 ? (totalSize / 1024).toFixed(1) + ' KB' : (totalSize / (1024 * 1024)).toFixed(1) + ' MB';

  return (
    <div className="flex min-h-screen bg-background font-sans relative overflow-hidden">
      <EasterEggOverlay effect={effect} />
      <Sidebar page={page} onPageChange={setPage} storageSize={sizeStr} theme={theme} onThemeChange={handleThemeChange} onLogoClick={handleLogoClick} />

      <div className="flex-1 flex flex-col overflow-hidden relative z-[2]">
        <div className="px-5 py-4 bg-background/75 border-b border-border flex items-center gap-2.5">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx3" />
            <input
              className="w-full border border-border rounded-lg py-[7px] pl-9 pr-3 text-[13px] bg-foreground/[0.04] text-foreground placeholder:text-tx3 focus:outline-none focus:border-primary transition-colors"
              placeholder="Zoek boeken… (probeer 'party' 😉)"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
          <button onClick={() => fileRef.current?.click()} className="text-[11px] px-3 py-[7px] rounded-lg bg-primary text-primary-foreground font-medium hover:bg-or-dark transition-all">+ Boek toevoegen</button>
          <Link to="/" className="text-[11px] px-2 py-[7px] text-tx2 hover:text-foreground transition-colors flex items-center" title="Naar startpagina"><Home size={14} /></Link>
          <input ref={fileRef} type="file" accept=".pdf,.epub" multiple className="hidden" onChange={e => { if (e.target.files) { handleFiles(e.target.files); e.target.value = ''; } }} />
        </div>

        <div className="flex-1 p-5 overflow-y-auto">
          {booksLoading ? (
            <div className="text-center p-8 text-tx3 text-sm">Boeken laden…</div>
          ) : page === 'home' ? (
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
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5">
                  {filtered.map(book => <BookCard key={book.id} book={book} onOpen={setViewing} onDelete={handleDelete} />)}
                </div>
              )}
            </>
          ) : page === 'reading' ? (
            <>
              <div className="text-[15px] font-medium text-foreground mb-3">Aan het lezen</div>
              {readingBooks.length === 0 ? (
                <div className="text-[13px] text-tx3 text-center p-8">Geen boeken in voortgang</div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5">
                  {readingBooks.map(book => <BookCard key={book.id} book={book} onOpen={setViewing} onDelete={handleDelete} />)}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-[15px] font-medium text-foreground mb-3">Catalogus</div>
              {filtered.length === 0 ? (
                <div className="text-[13px] text-tx3 text-center p-8">Geen boeken gevonden</div>
              ) : years.map(year => {
                const yearBooks = catalogByYear.filter(b => (b.year || 0) === year);
                return (
                  <div key={year} className="mb-6">
                    <div className="text-[13px] font-medium text-tx2 mb-2 flex items-center gap-2">
                      <span className="text-primary">{year || 'Onbekend jaar'}</span>
                      <span className="text-tx3">— {yearBooks.length} boek{yearBooks.length !== 1 ? 'en' : ''}</span>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5">
                      {yearBooks.map(book => <BookCard key={book.id} book={book} onOpen={setViewing} onDelete={handleDelete} />)}
                    </div>
                  </div>
                );
              })}
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
      {uploadQueue.length > 0 && (
        <UploadDialog file={uploadQueue[0].file} base64={uploadQueue[0].base64} onConfirm={handleUploadConfirm} onCancel={handleUploadCancel} />
      )}
      <div className={`absolute bottom-4 right-4 bg-primary text-primary-foreground px-3.5 py-2 rounded-lg text-[13px] font-medium z-30 transition-opacity ${toast ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>{toast}</div>
    </div>
  );
}
