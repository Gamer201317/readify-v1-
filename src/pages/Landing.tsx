import { Link } from "react-router-dom";
import { BookOpen, Download, Smartphone, Lock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="7" height="10" rx="1" fill="black" opacity="0.9" />
              <rect x="4" y="3" width="7" height="10" rx="1" fill="black" opacity="0.45" />
            </svg>
          </div>
          <span className="text-lg font-medium text-foreground">Readify</span>
        </div>
        <Link
          to="/app"
          className="text-[12px] px-3 py-1.5 rounded-lg border border-border text-tx2 hover:text-foreground hover:bg-primary/10 transition-all"
        >
          Open app
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-6 font-medium">
            <Lock size={11} /> 100% lokaal · Geen account nodig
          </div>

          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-4 tracking-tight">
            Je persoonlijke <span className="text-primary">e-bibliotheek</span>
          </h1>
          <p className="text-base text-tx2 mb-8 max-w-lg mx-auto leading-relaxed">
            Upload PDF en EPUB boeken. Lees ze overal. Alles wordt lokaal op jouw apparaat opgeslagen — niemand anders heeft toegang.
          </p>

          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-[15px] hover:bg-or-dark transition-all shadow-lg shadow-primary/20"
          >
            <BookOpen size={18} /> Start de app
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-12 text-left">
            <div className="bg-card border border-border rounded-xl p-4">
              <Lock size={18} className="text-primary mb-2" />
              <div className="text-[13px] font-medium text-foreground mb-1">Privé & lokaal</div>
              <div className="text-[12px] text-tx3 leading-relaxed">Boeken worden in IndexedDB op jouw apparaat opgeslagen. Geen cloud, geen account.</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <BookOpen size={18} className="text-primary mb-2" />
              <div className="text-[13px] font-medium text-foreground mb-1">PDF & EPUB</div>
              <div className="text-[12px] text-tx3 leading-relaxed">Lees beide formaten met bladwijzers, voortgang en pijltjesnavigatie.</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <Smartphone size={18} className="text-primary mb-2" />
              <div className="text-[13px] font-medium text-foreground mb-1">Web & mobiel</div>
              <div className="text-[12px] text-tx3 leading-relaxed">Werkt in de browser én als native iOS/Android app via Capacitor.</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-border text-[11px] text-tx3 text-center">
        Readify · Lokale e-reader
      </footer>
    </div>
  );
}
