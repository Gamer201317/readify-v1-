import { useEffect, useState } from "react";

interface EasterEggOverlayProps {
  effect: string | null;
}

function Particles({ emoji, count }: { emoji: string; count: number }) {
  const [particles] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      size: 16 + Math.random() * 20,
      duration: 2 + Math.random() * 3,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-bounce"
          style={{
            left: `${p.x}%`,
            top: '-40px',
            fontSize: p.size,
            animation: `fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}

export default function EasterEggOverlay({ effect }: EasterEggOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (effect) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [effect]);

  if (!visible || !effect) return null;

  if (effect === 'konami') {
    return (
      <>
        <Particles emoji="⭐" count={30} />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] text-center pointer-events-none">
          <div className="text-4xl font-bold text-primary animate-pulse">🎮 KONAMI CODE!</div>
          <div className="text-lg text-tx2 mt-2">Je hebt het gevonden!</div>
        </div>
      </>
    );
  }

  if (effect === 'logo') {
    return (
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-6xl animate-spin">📚</div>
          <div className="text-lg font-medium text-primary mt-4 animate-pulse">Readify v1.0 — Made with ❤️</div>
        </div>
      </div>
    );
  }

  if (effect === 'party') return <Particles emoji="🎉" count={40} />;
  if (effect === 'matrix') {
    return (
      <div className="fixed inset-0 pointer-events-none z-[100] bg-black/80 flex items-center justify-center">
        <div className="text-green-400 font-mono text-2xl animate-pulse">Wake up, Neo... 📖</div>
      </div>
    );
  }
  if (effect === 'rainbow') {
    return (
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 opacity-20 animate-pulse" />
        <Particles emoji="🌈" count={20} />
      </div>
    );
  }

  return null;
}
