import { useEffect, useRef, useState } from "react";
import ePub from "epubjs";
import type { Book as BookType } from "@/lib/bookStore";

interface EpubViewerProps {
  book: BookType;
  onClose: () => void;
}

export default function EpubViewer({ book, onClose }: EpubViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const [title, setTitle] = useState(book.name);
  const [loading, setLoading] = useState(true);

  const isDark = document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (!containerRef.current) return;
    const arrayBuffer = Uint8Array.from(atob(book.data.split(',')[1]), c => c.charCodeAt(0)).buffer;
    const epubBook = ePub(arrayBuffer as ArrayBuffer);

    epubBook.ready.then(() => {
      const rendition = epubBook.renderTo(containerRef.current!, {
        width: '100%',
        height: '100%',
        spread: 'none',
      });
      renditionRef.current = rendition;

      // Apply theme colors for dark mode
      if (isDark) {
        rendition.themes.default({
          body: { color: '#f0ebe3 !important', background: 'transparent !important' },
          'p, span, div, h1, h2, h3, h4, h5, h6, li, a, em, strong, td, th': {
            color: '#f0ebe3 !important',
          },
        });
      }

      rendition.display();
      setLoading(false);

      epubBook.loaded.metadata.then((meta: any) => {
        if (meta.title) setTitle(meta.title);
      });
    });

    return () => { epubBook.destroy(); };
  }, [book.data, isDark]);

  const prev = () => renditionRef.current?.prev();
  const next = () => renditionRef.current?.next();

  // Arrow key navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = book.data;
    a.download = book.name + '.epub';
    a.click();
  };

  return (
    <div className="absolute inset-0 bg-background/[0.98] z-10 flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2.5 bg-background/95 flex-wrap">
        <button onClick={onClose} className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 hover:text-foreground transition-all">
          ← Terug
        </button>
        <div className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{title}</div>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/15 text-primary">EPUB</span>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 transition-all">‹ Vorige</button>
          <button onClick={next} className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 transition-all">Volgende ›</button>
        </div>
        <button onClick={handleDownload} className="text-[11px] px-2 py-1 border border-primary/30 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-or-dark transition-all">
          Downloaden
        </button>
      </div>
      <div className="flex-1 overflow-auto flex justify-center p-4">
        {loading && <div className="text-tx2 text-[13px] p-8 text-center">EPUB laden…</div>}
        <div ref={containerRef} className="max-w-[640px] w-full bg-card border border-border rounded-xl p-8 text-foreground leading-relaxed" style={{ minHeight: 400 }} />
      </div>
    </div>
  );
}
