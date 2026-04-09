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
      <div className="h-[160px] overflow-hidden relative">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[11px] font-medium p-2 text-center"
            style={{
              background: `linear-gradient(135deg, ${book.coverGradient[0]}, ${book.coverGradient[1]})`,
            }}
          >
            <span className="text-foreground/90 drop-shadow-sm line-clamp-3 px-1">
              {book.name}
            </span>
          </div>
        )}
        <span className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded-md font-medium bg-black/50 text-white uppercase">
          {book.type}
        </span>
      </div>
      <div className="p-2 px-2.5 pb-2.5">
        <div className="text-xs font-medium text-foreground truncate">{book.name}</div>
        {book.author && <div className="text-[11px] text-tx3 truncate">{book.author}</div>}
        <div className="flex items-center gap-1.5 mt-0.5">
          {book.year && <span className="text-[10px] text-tx3">{book.year}</span>}
          {book.genre && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {book.genre}
            </span>
          )}
        </div>
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
