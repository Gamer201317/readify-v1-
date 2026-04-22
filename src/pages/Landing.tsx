import { Link } from "react-router-dom";
import { BookOpen, Download, Smartphone, Lock, Monitor, Apple, Share, Plus } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useState } from "react";

export default function Landing() {
  const { canInstall, isInstalled, platform, promptInstall } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  const handleInstall = async () => {
    if (canInstall) {
      await promptInstall();
    } else {
      setShowInstructions(true);
    }
  };

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

      <main className="flex-1 flex flex-col items-center px-6 py-12">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-6 font-medium">
            <Lock size={11} /> 100% lokaal · Geen account nodig
          </div>

          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-4 tracking-tight">
            Je persoonlijke <span className="text-primary">e-bibliotheek</span>
          </h1>
          <p className="text-base text-tx2 mb-8 max-w-lg mx-auto leading-relaxed">
            Upload PDF en EPUB boeken. Lees ze overal. Alles wordt lokaal op jouw apparaat opgeslagen — niemand anders heeft toegang.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-[15px] hover:bg-or-dark transition-all shadow-lg shadow-primary/20"
            >
              <BookOpen size={18} /> Start de app
            </Link>
            {!isInstalled && (
              <button
                onClick={handleInstall}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground font-medium text-[15px] hover:bg-primary/10 hover:border-primary/40 transition-all"
              >
                <Download size={18} /> Installeer app
              </button>
            )}
            {isInstalled && (
              <span className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-tx2 text-[14px]">
                ✓ App is geïnstalleerd
              </span>
            )}
          </div>

          {showInstructions && !canInstall && !isInstalled && (
            <div className="bg-card border border-border rounded-xl p-4 mb-8 text-left text-[13px] text-tx2 max-w-md mx-auto">
              {platform === "ios" && (
                <>
                  <div className="font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <Apple size={14} /> Op iPhone / iPad
                  </div>
                  <p>
                    Tik op <Share size={12} className="inline" /> <strong>Deel</strong> in Safari, scroll omlaag en kies <strong>"Zet op beginscherm"</strong>.
                  </p>
                </>
              )}
              {platform === "android" && (
                <>
                  <div className="font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <Smartphone size={14} /> Op Android
                  </div>
                  <p>
                    Open het <strong>browser-menu</strong> (⋮) en kies <strong>"App installeren"</strong> of <strong>"Toevoegen aan startscherm"</strong>.
                  </p>
                </>
              )}
              {platform === "desktop" && (
                <>
                  <div className="font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <Monitor size={14} /> Op desktop
                  </div>
                  <p>
                    Klik op het <Plus size={12} className="inline" /> <strong>installeer-icoon</strong> rechts in de adresbalk (Chrome, Edge of Brave).
                  </p>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12 text-left">
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
              <div className="text-[12px] text-tx3 leading-relaxed">Werkt in de browser én installeerbaar als app op alle platforms.</div>
            </div>
          </div>

          {/* Download / install per platform */}
          <div className="text-left">
            <h2 className="text-xl font-medium text-foreground mb-1">Installeer Readify</h2>
            <p className="text-[13px] text-tx3 mb-4">Kies jouw platform — overal werkt het hetzelfde.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor size={16} className="text-primary" />
                  <span className="text-[13px] font-medium text-foreground">Windows / Mac / Linux</span>
                </div>
                <p className="text-[12px] text-tx3 leading-relaxed mb-3">
                  Open in Chrome, Edge of Brave en klik op <strong>Installeer app</strong>. Verschijnt als gewone desktop-app.
                </p>
                <button
                  onClick={handleInstall}
                  className="text-[12px] px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                >
                  Installeren →
                </button>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone size={16} className="text-primary" />
                  <span className="text-[13px] font-medium text-foreground">Android</span>
                </div>
                <p className="text-[12px] text-tx3 leading-relaxed">
                  Open in Chrome → menu (⋮) → <strong>App installeren</strong>. Voor een echte APK kun je het project lokaal builden via Android Studio (zie README).
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Apple size={16} className="text-primary" />
                  <span className="text-[13px] font-medium text-foreground">iPhone / iPad</span>
                </div>
                <p className="text-[12px] text-tx3 leading-relaxed">
                  Open in Safari → <Share size={11} className="inline" /> Deel → <strong>Zet op beginscherm</strong>. App opent zonder browserbalk.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor size={16} className="text-primary" />
                  <span className="text-[13px] font-medium text-foreground">Microsoft Store</span>
                </div>
                <p className="text-[12px] text-tx3 leading-relaxed">
                  Genereer een MSIX-pakket via{" "}
                  <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    PWABuilder
                  </a>{" "}
                  en upload dat naar Partner Center. Stappen staan in de README.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-border text-[11px] text-tx3 text-center">
        Readify · Lokale e-reader · Werkt offline na installatie
      </footer>
    </div>
  );
}
