import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { Book, Bookmark, Highlight } from "@/hooks/useBooks";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import {
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  Search,
  X,
  Highlighter,
  StickyNote,
  Trash2,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PdfViewerProps {
  book: Book;
  onClose: () => void;
  onProgress: (page: number, total: number) => void;
  onBookmark: (page: number) => void;
  onRemoveBookmark: (id: string) => void;
  onHighlightsChange: (highlights: Highlight[]) => void;
}

interface SearchHit {
  page: number;
  index: number;
}

const HL_COLORS: Record<Highlight["color"], string> = {
  yellow: "rgba(250, 204, 21, 0.45)",
  orange: "rgba(249, 115, 22, 0.45)",
  green: "rgba(34, 197, 94, 0.4)",
  blue: "rgba(59, 130, 246, 0.4)",
};

export default function PdfViewer({
  book,
  onClose,
  onProgress,
  onBookmark,
  onRemoveBookmark,
  onHighlightsChange,
}: PdfViewerProps) {
  const [page, setPage] = useState(book.currentPage || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searchIdx, setSearchIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const highlights = book.highlights || [];
  const currentBookmark = book.bookmarks?.find((b) => b.page === page);
  const progress = totalPages > 0 ? Math.round((page / totalPages) * 100) : 0;

  useEffect(() => {
    const load = async () => {
      const data = atob(book.data.split(",")[1]);
      const arr = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) arr[i] = data.charCodeAt(i);
      const pdf = await pdfjsLib.getDocument({ data: arr }).promise;
      pdfRef.current = pdf;
      setTotalPages(pdf.numPages);
      setLoading(false);
    };
    load();
  }, [book.data]);

  const renderPage = useCallback(
    async (num: number) => {
      const pdf = pdfRef.current;
      const canvas = canvasRef.current;
      const textLayer = textLayerRef.current;
      if (!pdf || !canvas || !textLayer) return;
      const pg = await pdf.getPage(num);
      const vp = pg.getViewport({ scale: 1.5 });
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext("2d")!;
      await pg.render({ canvasContext: ctx, viewport: vp }).promise;

      // Text layer for selection + search
      textLayer.innerHTML = "";
      textLayer.style.width = vp.width + "px";
      textLayer.style.height = vp.height + "px";
      const textContent = await pg.getTextContent();
      const q = searchQuery.trim().toLowerCase();
      textContent.items.forEach((item: any) => {
        const tx = pdfjsLib.Util.transform(vp.transform, item.transform);
        const span = document.createElement("span");
        span.textContent = item.str;
        span.style.position = "absolute";
        span.style.left = tx[4] + "px";
        span.style.top = tx[5] - item.height * vp.scale + "px";
        span.style.fontSize = item.height * vp.scale + "px";
        span.style.fontFamily = "sans-serif";
        span.style.whiteSpace = "pre";
        span.style.color = "transparent";
        span.style.cursor = "text";
        if (q && item.str.toLowerCase().includes(q)) {
          span.style.background = "rgba(249, 115, 22, 0.4)";
        }
        textLayer.appendChild(span);
      });

      onProgress(num, pdf.numPages);
    },
    [onProgress, searchQuery],
  );

  useEffect(() => {
    if (!loading && totalPages > 0) renderPage(page);
  }, [page, loading, totalPages, renderPage]);

  const go = (delta: number) => {
    setPage((p) => Math.max(1, Math.min(totalPages, p + delta)));
  };

  // Arrow key navigation + Ctrl/Cmd+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
        return;
      }
      if (e.key === "Escape") {
        setShowSearch(false);
      }
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalPages]);

  const runSearch = async () => {
    const pdf = pdfRef.current;
    const q = searchQuery.trim().toLowerCase();
    if (!pdf || !q) {
      setSearchHits([]);
      return;
    }
    setSearching(true);
    const hits: SearchHit[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i);
      const tc = await pg.getTextContent();
      const str = tc.items.map((it: any) => it.str).join(" ").toLowerCase();
      let idx = 0;
      while ((idx = str.indexOf(q, idx)) !== -1) {
        hits.push({ page: i, index: idx });
        idx += q.length;
      }
    }
    setSearchHits(hits);
    setSearchIdx(0);
    setSearching(false);
    if (hits.length > 0) setPage(hits[0].page);
  };

  const gotoHit = (delta: number) => {
    if (searchHits.length === 0) return;
    const next = (searchIdx + delta + searchHits.length) % searchHits.length;
    setSearchIdx(next);
    setPage(searchHits[next].page);
  };

  const addHighlight = (color: Highlight["color"]) => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) return;
    const hl: Highlight = {
      id: crypto.randomUUID(),
      page,
      text,
      color,
      createdAt: Date.now(),
    };
    onHighlightsChange([...highlights, hl]);
    sel?.removeAllRanges();
  };

  const removeHighlight = (id: string) => {
    onHighlightsChange(highlights.filter((h) => h.id !== id));
  };

  const saveNote = (id: string) => {
    onHighlightsChange(
      highlights.map((h) => (h.id === id ? { ...h, note: noteDraft } : h)),
    );
    setNoteFor(null);
    setNoteDraft("");
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = book.data;
    a.download = book.name + ".pdf";
    a.click();
  };

  const pageHighlights = highlights.filter((h) => h.page === page);

  return (
    <div className="absolute inset-0 bg-background/[0.98] z-10 flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2.5 bg-background/95 flex-wrap">
        <button
          onClick={onClose}
          className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 hover:text-foreground transition-all"
        >
          ← Terug
        </button>
        <div className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{book.name}</div>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/15 text-primary">PDF</span>

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

        {/* Search */}
        <button
          onClick={() => setShowSearch((v) => !v)}
          className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 transition-all"
          title="Zoeken (Ctrl+F)"
        >
          <Search size={13} />
        </button>

        {/* Bookmark */}
        <button
          onClick={() => (currentBookmark ? onRemoveBookmark(currentBookmark.id) : onBookmark(page))}
          className={`text-[11px] px-2 py-1 border rounded-lg transition-all ${currentBookmark ? "border-primary/50 text-primary bg-primary/10" : "border-border text-tx2 hover:bg-primary/10"}`}
          title={currentBookmark ? "Bladwijzer verwijderen" : "Bladwijzer toevoegen"}
        >
          {currentBookmark ? <BookmarkCheck size={13} /> : <BookmarkIcon size={13} />}
        </button>

        {book.bookmarks && book.bookmarks.length > 0 && (
          <div className="relative">
            <button onClick={() => setShowBookmarks(!showBookmarks)} className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 transition-all">
              📑 {book.bookmarks.length}
            </button>
            {showBookmarks && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[160px] py-1">
                {book.bookmarks.map((bm) => (
                  <button key={bm.id} onClick={() => { setPage(bm.page); setShowBookmarks(false); }} className="w-full text-left px-3 py-1.5 text-[12px] text-foreground hover:bg-primary/10 transition-colors">
                    Pagina {bm.page}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Highlights list */}
        <button
          onClick={() => setShowHighlights((v) => !v)}
          className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 transition-all"
          title="Markeringen"
        >
          <Highlighter size={13} />
          {highlights.length > 0 && <span className="ml-1">{highlights.length}</span>}
        </button>

        <button onClick={handleDownload} className="text-[11px] px-2 py-1 border border-primary/30 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-or-dark transition-all">
          Downloaden
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-border bg-background/95 flex items-center gap-2">
          <Search size={13} className="text-tx3" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            placeholder="Zoek in boek…"
            className="flex-1 bg-transparent border border-border rounded-lg px-2 py-1 text-[12px] text-foreground focus:outline-none focus:border-primary"
          />
          <button onClick={runSearch} disabled={searching} className="text-[11px] px-2 py-1 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
            {searching ? "…" : "Zoek"}
          </button>
          {searchHits.length > 0 && (
            <>
              <span className="text-[11px] text-tx3">{searchIdx + 1} / {searchHits.length}</span>
              <button onClick={() => gotoHit(-1)} className="text-[11px] px-2 py-1 border border-border rounded-lg hover:bg-primary/10">‹</button>
              <button onClick={() => gotoHit(1)} className="text-[11px] px-2 py-1 border border-border rounded-lg hover:bg-primary/10">›</button>
            </>
          )}
          {searchQuery && searchHits.length === 0 && !searching && (
            <span className="text-[11px] text-tx3">Geen resultaten</span>
          )}
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchHits([]); }} className="text-tx2 hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto flex">
        <div className="flex-1 flex flex-col items-center p-4 gap-2.5">
          {loading ? (
            <div className="text-tx2 text-[13px] p-8 text-center">PDF laden…</div>
          ) : (
            <>
              <div className="relative">
                <canvas ref={canvasRef} className="border border-border rounded-lg max-w-full block" />
                <div
                  ref={textLayerRef}
                  className="absolute top-0 left-0 overflow-hidden opacity-100 leading-none"
                  style={{ lineHeight: 1 }}
                />
              </div>
              {/* Highlight toolbar */}
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
                <span className="text-[11px] text-tx3">Selecteer tekst en markeer:</span>
                {(["yellow", "orange", "green", "blue"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => addHighlight(c)}
                    className="w-5 h-5 rounded-full border border-border hover:scale-110 transition-transform"
                    style={{ background: HL_COLORS[c] }}
                    title={`Markeer ${c}`}
                  />
                ))}
              </div>
              {pageHighlights.length > 0 && (
                <div className="w-full max-w-[800px] space-y-1.5">
                  {pageHighlights.map((h) => (
                    <div key={h.id} className="flex items-start gap-2 bg-card border border-border rounded-lg p-2 text-[12px]">
                      <div className="w-1.5 self-stretch rounded" style={{ background: HL_COLORS[h.color] }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground">{h.text}</div>
                        {h.note && <div className="text-tx2 text-[11px] mt-1 italic">💭 {h.note}</div>}
                        {noteFor === h.id && (
                          <div className="mt-1.5 flex gap-1">
                            <input
                              autoFocus
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="Notitie…"
                              className="flex-1 bg-background border border-border rounded px-2 py-1 text-[11px] text-foreground"
                              onKeyDown={(e) => { if (e.key === "Enter") saveNote(h.id); }}
                            />
                            <button onClick={() => saveNote(h.id)} className="text-[11px] px-2 rounded bg-primary text-primary-foreground">Ok</button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => { setNoteFor(h.id); setNoteDraft(h.note || ""); }}
                        className="text-tx2 hover:text-primary p-1"
                        title="Notitie"
                      >
                        <StickyNote size={13} />
                      </button>
                      <button onClick={() => removeHighlight(h.id)} className="text-tx2 hover:text-destructive p-1" title="Verwijderen">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {showHighlights && (
          <div className="w-72 border-l border-border bg-card/50 overflow-y-auto p-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[13px] font-medium text-foreground">Markeringen ({highlights.length})</div>
              <button onClick={() => setShowHighlights(false)} className="text-tx2 hover:text-foreground"><X size={14} /></button>
            </div>
            {highlights.length === 0 ? (
              <div className="text-[11px] text-tx3">Nog geen markeringen.</div>
            ) : (
              <div className="space-y-2">
                {highlights.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => { if (h.page) setPage(h.page); }}
                    className="w-full text-left bg-card border border-border rounded-lg p-2 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: HL_COLORS[h.color] }} />
                      <span className="text-[10px] text-tx3">Pagina {h.page}</span>
                    </div>
                    <div className="text-[11px] text-foreground line-clamp-3">{h.text}</div>
                    {h.note && <div className="text-[10px] text-tx2 italic mt-1">💭 {h.note}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
