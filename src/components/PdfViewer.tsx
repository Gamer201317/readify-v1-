import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { Book, Bookmark } from "@/lib/bookStore";
import { Bookmark as BookmarkIcon, BookmarkCheck } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PdfViewerProps {
  book: Book;
  onClose: () => void;
  onProgress: (page: number, total: number) => void;
  onBookmark: (page: number) => void;
  onRemoveBookmark: (id: string) => void;
}

export default function PdfViewer({ book, onClose, onProgress, onBookmark, onRemoveBookmark }: PdfViewerProps) {
  const [page, setPage] = useState(book.currentPage || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const currentBookmark = book.bookmarks?.find(b => b.page === page);
  const progress = totalPages > 0 ? Math.round((page / totalPages) * 100) : 0;

  useEffect(() => {
    const load = async () => {
      const data = atob(book.data.split(',')[1]);
      const arr = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) arr[i] = data.charCodeAt(i);
      const pdf = await pdfjsLib.getDocument({ data: arr }).promise;
      pdfRef.current = pdf;
      setTotalPages(pdf.numPages);
      setLoading(false);
    };
    load();
  }, [book.data]);

  const renderPage = useCallback(async (num: number) => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;
    const pg = await pdf.getPage(num);
    const vp = pg.getViewport({ scale: 1.5 });
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext('2d')!;
    await pg.render({ canvasContext: ctx, viewport: vp }).promise;
    onProgress(num, pdf.numPages);
  }, [onProgress]);

  useEffect(() => {
    if (!loading && totalPages > 0) renderPage(page);
  }, [page, loading, totalPages, renderPage]);

  const go = (delta: number) => {
    setPage(p => Math.max(1, Math.min(totalPages, p + delta)));
  };

  // Arrow key navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [totalPages]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = book.data;
    a.download = book.name + '.pdf';
    a.click();
  };

  return (
    <div className="absolute inset-0 bg-background/[0.98] z-10 flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2.5 bg-background/95 flex-wrap">
        <button onClick={onClose} className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 hover:text-foreground transition-all">
          ← Terug
        </button>
        <div className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{book.name}</div>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/15 text-primary">PDF</span>

        {/* Progress bar */}
        {totalPages > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] text-tx3">{progress}%</span>
          </div>
        )}

        {totalPages > 0 && (
          <div className="flex items-center gap-3 text-tx2 text-[13px]">
            <button onClick={() => go(-1)} disabled={page <= 1} className="text-[11px] px-2 py-1 border border-border rounded-lg hover:bg-primary/10 disabled:opacity-30 transition-all">‹</button>
            <span className="min-w-[70px] text-center">{page} / {totalPages}</span>
            <button onClick={() => go(1)} disabled={page >= totalPages} className="text-[11px] px-2 py-1 border border-border rounded-lg hover:bg-primary/10 disabled:opacity-30 transition-all">›</button>
          </div>
        )}

        {/* Bookmark button */}
        <button
          onClick={() => currentBookmark ? onRemoveBookmark(currentBookmark.id) : onBookmark(page)}
          className={`text-[11px] px-2 py-1 border rounded-lg transition-all ${currentBookmark ? 'border-primary/50 text-primary bg-primary/10' : 'border-border text-tx2 hover:bg-primary/10'}`}
          title={currentBookmark ? 'Bladwijzer verwijderen' : 'Bladwijzer toevoegen'}
        >
          {currentBookmark ? <BookmarkCheck size={13} /> : <BookmarkIcon size={13} />}
        </button>

        {/* Show bookmarks list */}
        {book.bookmarks && book.bookmarks.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 transition-all"
            >
              📑 {book.bookmarks.length}
            </button>
            {showBookmarks && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[160px] py-1">
                {book.bookmarks.map(bm => (
                  <button
                    key={bm.id}
                    onClick={() => { setPage(bm.page); setShowBookmarks(false); }}
                    className="w-full text-left px-3 py-1.5 text-[12px] text-foreground hover:bg-primary/10 transition-colors"
                  >
                    Pagina {bm.page}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button onClick={handleDownload} className="text-[11px] px-2 py-1 border border-primary/30 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-or-dark transition-all">
          Downloaden
        </button>
      </div>
      <div className="flex-1 overflow-auto flex flex-col items-center p-4 gap-2.5">
        {loading ? (
          <div className="text-tx2 text-[13px] p-8 text-center">PDF laden…</div>
        ) : (
          <canvas ref={canvasRef} className="border border-border rounded-lg max-w-full" />
        )}
      </div>
    </div>
  );
}
