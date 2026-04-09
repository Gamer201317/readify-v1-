import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { Book } from "@/lib/bookStore";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PdfViewerProps {
  book: Book;
  onClose: () => void;
  onProgress: (page: number, total: number) => void;
}

export default function PdfViewer({ book, onClose, onProgress }: PdfViewerProps) {
  const [page, setPage] = useState(book.currentPage || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

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
        {totalPages > 0 && (
          <div className="flex items-center gap-3 text-tx2 text-[13px]">
            <button onClick={() => go(-1)} disabled={page <= 1} className="text-[11px] px-2 py-1 border border-border rounded-lg hover:bg-primary/10 disabled:opacity-30 transition-all">‹</button>
            <span className="min-w-[70px] text-center">{page} / {totalPages}</span>
            <button onClick={() => go(1)} disabled={page >= totalPages} className="text-[11px] px-2 py-1 border border-border rounded-lg hover:bg-primary/10 disabled:opacity-30 transition-all">›</button>
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
