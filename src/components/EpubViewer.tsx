import { useEffect, useRef, useState } from "react";
import ePub from "epubjs";
import type { Book as BookType, Highlight, ReaderSettings } from "@/hooks/useBooks";
import { Search, X, Highlighter, StickyNote, Trash2, Settings2 } from "lucide-react";

interface EpubViewerProps {
  book: BookType;
  onClose: () => void;
  onHighlightsChange: (highlights: Highlight[]) => void;
  onSettingsChange: (s: ReaderSettings) => void;
}

interface SearchResult {
  cfi: string;
  excerpt: string;
}

const HL_COLORS: Record<Highlight["color"], string> = {
  yellow: "rgba(250, 204, 21, 0.45)",
  orange: "rgba(249, 115, 22, 0.45)",
  green: "rgba(34, 197, 94, 0.4)",
  blue: "rgba(59, 130, 246, 0.4)",
};

const THEMES: Record<NonNullable<ReaderSettings["theme"]>, { bg: string; color: string }> = {
  default: { bg: "hsl(var(--card))", color: "hsl(var(--foreground))" },
  sepia: { bg: "#f5ecd7", color: "#4b3621" },
  dark: { bg: "#1a1a1a", color: "#e5e5e5" },
};

export default function EpubViewer({ book, onClose, onHighlightsChange, onSettingsChange }: EpubViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const epubRef = useRef<any>(null);
  const [title, setTitle] = useState(book.name);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const settings: ReaderSettings = {
    fontSize: book.readerSettings?.fontSize ?? 100,
    lineHeight: book.readerSettings?.lineHeight ?? 1.6,
    theme: book.readerSettings?.theme ?? "default",
  };
  const highlights = book.highlights || [];

  const applyTheme = (rendition: any) => {
    const t = THEMES[settings.theme!];
    rendition.themes.override("color", t.color + " !important");
    rendition.themes.override("background", t.bg + " !important");
    rendition.themes.fontSize(settings.fontSize + "%");
    rendition.themes.override("line-height", String(settings.lineHeight));
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const arrayBuffer = Uint8Array.from(atob(book.data.split(",")[1]), (c) => c.charCodeAt(0)).buffer;
    const epubBook = ePub(arrayBuffer as ArrayBuffer);
    epubRef.current = epubBook;

    epubBook.ready.then(() => {
      const rendition = epubBook.renderTo(containerRef.current!, {
        width: "100%",
        height: "100%",
        spread: "none",
      });
      renditionRef.current = rendition;

      applyTheme(rendition);

      // Re-render highlights on each location change
      rendition.on("rendered", () => {
        highlights.forEach((h) => {
          if (!h.cfi) return;
          try {
            rendition.annotations.add(
              "highlight",
              h.cfi,
              { id: h.id },
              undefined,
              "hl-" + h.color,
              { fill: HL_COLORS[h.color], "fill-opacity": "0.5", "mix-blend-mode": "multiply" },
            );
          } catch {}
        });
      });

      rendition.display();
      setLoading(false);

      epubBook.loaded.metadata.then((meta: any) => {
        if (meta.title) setTitle(meta.title);
      });
    });

    return () => {
      epubBook.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.data]);

  // Re-apply settings when they change
  useEffect(() => {
    if (renditionRef.current) applyTheme(renditionRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.fontSize, settings.lineHeight, settings.theme]);

  const prev = () => renditionRef.current?.prev();
  const next = () => renditionRef.current?.next();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
        return;
      }
      if (e.key === "Escape") setShowSearch(false);
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const runSearch = async () => {
    const epubBook = epubRef.current;
    const q = searchQuery.trim();
    if (!epubBook || !q) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const spine = epubBook.spine;
      const results: SearchResult[] = [];
      // @ts-ignore
      const items = spine.spineItems || spine.items || [];
      for (const item of items) {
        await item.load(epubBook.load.bind(epubBook));
        const found = item.find ? item.find(q) : [];
        for (const r of found) {
          results.push({ cfi: r.cfi, excerpt: r.excerpt });
        }
        item.unload();
        if (results.length > 200) break;
      }
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    }
    setSearching(false);
  };

  const gotoResult = (cfi: string) => {
    renditionRef.current?.display(cfi);
  };

  const addHighlight = (color: Highlight["color"]) => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    const iframe: HTMLIFrameElement | undefined = rendition.getContents()[0]?.document?.defaultView?.frameElement;
    const contents = rendition.getContents()[0];
    const sel = contents?.window?.getSelection();
    const text = sel?.toString().trim();
    if (!text || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const cfi = contents.cfiFromRange(range);
    const hl: Highlight = {
      id: crypto.randomUUID(),
      cfi,
      text,
      color,
      createdAt: Date.now(),
    };
    onHighlightsChange([...highlights, hl]);
    try {
      rendition.annotations.add(
        "highlight",
        cfi,
        { id: hl.id },
        undefined,
        "hl-" + color,
        { fill: HL_COLORS[color], "fill-opacity": "0.5", "mix-blend-mode": "multiply" },
      );
    } catch {}
    sel.removeAllRanges();
  };

  const removeHighlight = (id: string) => {
    const h = highlights.find((x) => x.id === id);
    if (h?.cfi) {
      try { renditionRef.current?.annotations.remove(h.cfi, "highlight"); } catch {}
    }
    onHighlightsChange(highlights.filter((x) => x.id !== id));
  };

  const saveNote = (id: string) => {
    onHighlightsChange(highlights.map((h) => (h.id === id ? { ...h, note: noteDraft } : h)));
    setNoteFor(null);
    setNoteDraft("");
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = book.data;
    a.download = book.name + ".epub";
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
          <button onClick={prev} className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 transition-all">‹</button>
          <button onClick={next} className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 transition-all">›</button>
        </div>

        <button onClick={() => setShowSearch((v) => !v)} className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 transition-all" title="Zoeken (Ctrl+F)">
          <Search size={13} />
        </button>
        <button onClick={() => setShowSettings((v) => !v)} className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 transition-all" title="Leesmodus">
          <Settings2 size={13} />
        </button>
        <button onClick={() => setShowHighlights((v) => !v)} className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 transition-all" title="Markeringen">
          <Highlighter size={13} />
          {highlights.length > 0 && <span className="ml-1">{highlights.length}</span>}
        </button>

        <button onClick={handleDownload} className="text-[11px] px-2 py-1 border border-primary/30 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-or-dark transition-all">
          Downloaden
        </button>
      </div>

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
          {searchResults.length > 0 && <span className="text-[11px] text-tx3">{searchResults.length} resultaten</span>}
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }} className="text-tx2 hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      {showSettings && (
        <div className="px-4 py-3 border-b border-border bg-background/95 flex items-center gap-4 flex-wrap text-[12px]">
          <div className="flex items-center gap-2">
            <span className="text-tx3">Thema:</span>
            {(["default", "sepia", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => onSettingsChange({ ...settings, theme: t })}
                className={`px-2 py-1 rounded-lg border text-[11px] capitalize ${settings.theme === t ? "border-primary text-primary bg-primary/10" : "border-border text-tx2 hover:bg-primary/10"}`}
              >
                {t === "default" ? "Standaard" : t === "sepia" ? "Sepia" : "Donker"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-tx3">Grootte:</span>
            <button onClick={() => onSettingsChange({ ...settings, fontSize: Math.max(70, (settings.fontSize || 100) - 10) })} className="px-2 py-1 rounded-lg border border-border text-tx2 hover:bg-primary/10">A−</button>
            <span className="text-tx2 min-w-[40px] text-center">{settings.fontSize}%</span>
            <button onClick={() => onSettingsChange({ ...settings, fontSize: Math.min(200, (settings.fontSize || 100) + 10) })} className="px-2 py-1 rounded-lg border border-border text-tx2 hover:bg-primary/10">A+</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-tx3">Regelafstand:</span>
            <input
              type="range"
              min="1.2"
              max="2.4"
              step="0.1"
              value={settings.lineHeight}
              onChange={(e) => onSettingsChange({ ...settings, lineHeight: parseFloat(e.target.value) })}
            />
            <span className="text-tx2 min-w-[30px]">{settings.lineHeight?.toFixed(1)}</span>
          </div>
          <button onClick={() => setShowSettings(false)} className="ml-auto text-tx2 hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 flex flex-col overflow-auto p-4">
          {loading && <div className="text-tx2 text-[13px] p-8 text-center">EPUB laden…</div>}
          <div
            ref={containerRef}
            className="max-w-[640px] w-full mx-auto border border-border rounded-xl p-8 leading-relaxed"
            style={{
              minHeight: 500,
              flex: 1,
              background: THEMES[settings.theme!].bg,
              color: THEMES[settings.theme!].color,
            }}
          />
          <div className="max-w-[640px] w-full mx-auto mt-3 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
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
        </div>

        {(showHighlights || searchResults.length > 0) && (
          <div className="w-72 border-l border-border bg-card/50 overflow-y-auto p-3 shrink-0">
            {searchResults.length > 0 && (
              <>
                <div className="text-[13px] font-medium text-foreground mb-2">Zoekresultaten ({searchResults.length})</div>
                <div className="space-y-1.5 mb-4">
                  {searchResults.slice(0, 50).map((r, i) => (
                    <button key={i} onClick={() => gotoResult(r.cfi)} className="w-full text-left bg-card border border-border rounded-lg p-2 text-[11px] text-foreground hover:border-primary/50 transition-colors line-clamp-3">
                      {r.excerpt}
                    </button>
                  ))}
                </div>
              </>
            )}
            {showHighlights && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[13px] font-medium text-foreground">Markeringen ({highlights.length})</div>
                  <button onClick={() => setShowHighlights(false)} className="text-tx2 hover:text-foreground"><X size={14} /></button>
                </div>
                {highlights.length === 0 ? (
                  <div className="text-[11px] text-tx3">Nog geen markeringen.</div>
                ) : (
                  <div className="space-y-2">
                    {highlights.map((h) => (
                      <div key={h.id} className="bg-card border border-border rounded-lg p-2">
                        <button onClick={() => h.cfi && gotoResult(h.cfi)} className="w-full text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: HL_COLORS[h.color] }} />
                          </div>
                          <div className="text-[11px] text-foreground line-clamp-3">{h.text}</div>
                          {h.note && <div className="text-[10px] text-tx2 italic mt-1">💭 {h.note}</div>}
                        </button>
                        {noteFor === h.id ? (
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
                        ) : (
                          <div className="flex gap-1 mt-1">
                            <button onClick={() => { setNoteFor(h.id); setNoteDraft(h.note || ""); }} className="text-tx2 hover:text-primary p-1" title="Notitie">
                              <StickyNote size={12} />
                            </button>
                            <button onClick={() => removeHighlight(h.id)} className="text-tx2 hover:text-destructive p-1" title="Verwijderen">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
