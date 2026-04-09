import { LayoutGrid, Clock, Sun, Moon } from "lucide-react";

interface SidebarProps {
  page: 'home' | 'reading';
  onPageChange: (page: 'home' | 'reading') => void;
  storageSize: string;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

export default function Sidebar({ page, onPageChange, storageSize, theme, onThemeChange }: SidebarProps) {
  return (
    <div className="w-[200px] bg-background/90 border-r border-border p-4 flex flex-col gap-0.5 shrink-0 z-[2] relative">
      <div className="text-[17px] font-medium text-foreground mb-4 flex items-center gap-2">
        <div className="w-[26px] h-[26px] bg-primary rounded-md flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="7" height="10" rx="1" fill="black" opacity="0.9" />
            <rect x="4" y="3" width="7" height="10" rx="1" fill="black" opacity="0.45" />
          </svg>
        </div>
        Readify
      </div>

      <button
        onClick={() => onPageChange('home')}
        className={`flex items-center gap-[9px] py-[7px] px-[9px] rounded-lg text-[13px] transition-all cursor-pointer ${
          page === 'home'
            ? 'bg-primary/15 text-primary font-medium'
            : 'text-tx2 hover:bg-primary/10 hover:text-foreground'
        }`}
      >
        <LayoutGrid size={14} /> Bibliotheek
      </button>
      <button
        onClick={() => onPageChange('reading')}
        className={`flex items-center gap-[9px] py-[7px] px-[9px] rounded-lg text-[13px] transition-all cursor-pointer ${
          page === 'reading'
            ? 'bg-primary/15 text-primary font-medium'
            : 'text-tx2 hover:bg-primary/10 hover:text-foreground'
        }`}
      >
        <Clock size={14} /> Aan het lezen
      </button>

      <div className="mt-auto flex flex-col gap-2 px-[9px] py-2">
        <button
          onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-2 text-[11px] text-tx2 hover:text-foreground transition-colors py-1"
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          {theme === 'dark' ? 'Licht thema' : 'Donker thema'}
        </button>
        <div className="text-[11px] text-tx3">
          Opslag: <span className="text-tx2">{storageSize}</span>
        </div>
      </div>
    </div>
  );
}
