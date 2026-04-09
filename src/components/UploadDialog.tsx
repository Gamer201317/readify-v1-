import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { generatePdfCover } from "@/lib/bookStore";

interface UploadDialogProps {
  file: File;
  base64: string;
  onConfirm: (metadata: { name: string; year?: number; genre?: string; author?: string }, coverImage?: string) => void;
  onCancel: () => void;
}

const GENRES = [
  'Fictie', 'Non-fictie', 'Wetenschap', 'Geschiedenis', 'Biografie',
  'Fantasy', 'Thriller', 'Romantiek', 'Zakelijk', 'Technologie',
  'Filosofie', 'Poëzie', 'Kinderen', 'Educatief', 'Anders'
];

export default function UploadDialog({ file, base64, onConfirm, onCancel }: UploadDialogProps) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const defaultName = file.name.replace(/\.(pdf|epub)$/i, '');
  const [name, setName] = useState(defaultName);
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [author, setAuthor] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ext === 'pdf') {
      setLoading(true);
      generatePdfCover(base64)
        .then(cover => setCoverPreview(cover))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [base64, ext]);

  const handleSubmit = () => {
    onConfirm(
      {
        name: name.trim() || defaultName,
        year: year ? parseInt(year) : undefined,
        genre: genre || undefined,
        author: author.trim() || undefined,
      },
      coverPreview
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Boek toevoegen</h3>
          <button onClick={onCancel} className="text-tx3 hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Cover preview */}
          <div className="flex gap-4">
            <div className="w-20 h-28 rounded-lg overflow-hidden border border-border shrink-0 bg-muted flex items-center justify-center">
              {loading ? (
                <div className="text-[10px] text-tx3">Laden…</div>
              ) : coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="text-[10px] text-tx3 text-center px-1">
                  {ext?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <label className="text-[11px] text-tx3 block mb-1">Titel</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-border rounded-lg py-1.5 px-2.5 text-[13px] bg-background text-foreground placeholder:text-tx3 focus:outline-none focus:border-primary transition-colors"
                  placeholder="Boektitel"
                />
              </div>
              <div>
                <label className="text-[11px] text-tx3 block mb-1">Auteur</label>
                <input
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className="w-full border border-border rounded-lg py-1.5 px-2.5 text-[13px] bg-background text-foreground placeholder:text-tx3 focus:outline-none focus:border-primary transition-colors"
                  placeholder="Naam van de auteur"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-tx3 block mb-1">Jaar</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full border border-border rounded-lg py-1.5 px-2.5 text-[13px] bg-background text-foreground placeholder:text-tx3 focus:outline-none focus:border-primary transition-colors"
                placeholder="bv. 2024"
                min="1000"
                max="2099"
              />
            </div>
            <div>
              <label className="text-[11px] text-tx3 block mb-1">Genre</label>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value)}
                className="w-full border border-border rounded-lg py-1.5 px-2.5 text-[13px] bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Kies genre…</option>
                {GENRES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={onCancel}
            className="text-[12px] px-3 py-1.5 border border-border rounded-lg text-tx2 hover:bg-primary/10 transition-all"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            className="text-[12px] px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-or-dark transition-all"
          >
            Toevoegen
          </button>
        </div>
      </div>
    </div>
  );
}
