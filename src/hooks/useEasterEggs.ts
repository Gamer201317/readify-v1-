import { useEffect, useState, useCallback, useRef } from "react";

export function useEasterEggs() {
  const [effect, setEffect] = useState<string | null>(null);
  const konamiRef = useRef<string[]>([]);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<number>(0);

  const clearEffect = useCallback(() => {
    setTimeout(() => setEffect(null), 3000);
  }, []);

  // Konami code: ↑↑↓↓←→←→BA
  useEffect(() => {
    const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
    const handler = (e: KeyboardEvent) => {
      konamiRef.current.push(e.code);
      if (konamiRef.current.length > 10) konamiRef.current.shift();
      if (konamiRef.current.join(',') === KONAMI.join(',')) {
        setEffect('konami');
        clearEffect();
        konamiRef.current = [];
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clearEffect]);

  // Logo click: 5 rapid clicks
  const handleLogoClick = useCallback(() => {
    clickCountRef.current++;
    clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 5) {
      setEffect('logo');
      clearEffect();
      clickCountRef.current = 0;
    } else {
      clickTimerRef.current = window.setTimeout(() => { clickCountRef.current = 0; }, 1000);
    }
  }, [clearEffect]);

  // Secret search commands
  const checkSearchCommand = useCallback((query: string) => {
    const q = query.toLowerCase().trim();
    if (q === 'party' || q === 'feest') { setEffect('party'); clearEffect(); return true; }
    if (q === 'matrix') { setEffect('matrix'); clearEffect(); return true; }
    if (q === 'rainbow' || q === 'regenboog') { setEffect('rainbow'); clearEffect(); return true; }
    return false;
  }, [clearEffect]);

  return { effect, handleLogoClick, checkSearchCommand };
}
