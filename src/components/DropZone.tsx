import { useState, useCallback, useRef } from "react";
import { Upload } from "lucide-react";

interface DropZoneProps {
  onFiles: (files: FileList) => void;
}

export default function DropZone({ onFiles }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  }, [onFiles]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.epub"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-[1.5px] border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-6 ${
          dragging
            ? 'border-primary bg-primary/[0.08]'
            : 'border-border bg-primary/[0.03] hover:border-primary hover:bg-primary/[0.08]'
        }`}
      >
        <div className="w-11 h-11 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-2.5">
          <Upload size={20} className="text-primary" />
        </div>
        <div className="text-sm font-medium text-foreground mb-1">
          Sleep boeken hierheen of klik om te uploaden
        </div>
        <div className="text-xs text-tx3">PDF en EPUB ondersteund</div>
      </div>
    </>
  );
}
