import type { Book } from "@/lib/bookStore";

interface BookCardProps {
  book: Book;
  onOpen: (book: Book) => void;
  onDelete: (id: string) => void;
}

export default function BookCard({ book, onOpen, onDelete }: BookCardProps) {
  const progress = book.totalPages && book.currentPage
    ? Math.round((book.currentPage / book.totalPages) * 100)
    : 0;

  return (
    <div
      className="bg-foreground/[0.03] border border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary/50 hover:-translate-y-0.5"
      onClick={() => onOpen(book)}
    >
      <div
        className="h-[140px] flex items-center justify-center text-[11px] font-medium p-2 text-center"
        style={{
          background: `linear-gradient(135deg, ${book.coverGradient[0]}, ${book.coverGradient[1]})`,
        }}
      >
        <span className="text-foreground/90 drop-shadow-sm line-clamp-3 px-1">
          {book.name}
        </span>
      </div>
      <div className="p-2 px-2.5 pb-2.5">
        <div className="text-xs font-medium text-foreground truncate">{book.name}</div>
        <div className="text-[11px] text-tx3 mt-0.5 uppercase">{book.type}</div>
        {progress > 0 && (
          <div className="h-[3px] bg-foreground/[0.08] rounded-sm mt-1.5">
            <div
              className="h-full bg-primary rounded-sm transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(book); }}
            className="text-[11px] px-2 py-1 border border-primary/30 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-or-dark transition-all"
          >
            Lezen
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}
            className="text-[11px] px-2 py-1 border border-border rounded-lg text-tx2 hover:bg-primary/10 hover:text-foreground transition-all"
          >
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  );
}
