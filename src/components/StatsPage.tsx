import { useEffect, useState } from "react";
import { loadSessions, computeStats, type Stats } from "@/lib/readingStats";
import { BookOpen, Flame, Clock, Sparkles } from "lucide-react";

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadSessions().then((s) => setStats(computeStats(s)));
  }, []);

  if (!stats) {
    return <div className="text-[13px] text-tx3 text-center p-8">Statistieken laden…</div>;
  }

  if (stats.totalSessions === 0) {
    return (
      <div className="text-center p-12 text-tx3">
        <Sparkles className="mx-auto mb-3 text-primary" size={32} />
        <div className="text-sm font-medium text-tx2 mb-1">Nog geen leesstatistieken</div>
        <div className="text-[13px]">Open een boek en begin met lezen — je voortgang verschijnt hier.</div>
      </div>
    );
  }

  const maxBar = Math.max(...stats.last7Days.map((d) => d.minutes), 1);
  const maxGenrePages = Math.max(...stats.genreBreakdown.map((g) => g.pages), 1);
  const weekdays = ["zo", "ma", "di", "wo", "do", "vr", "za"];

  return (
    <div className="space-y-6">
      <div className="text-[15px] font-medium text-foreground">Leesstatistieken</div>

      {/* Top cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <StatCard icon={<BookOpen size={15} />} label="Gelezen pagina's" value={stats.totalPages.toLocaleString("nl-NL")} />
        <StatCard icon={<Flame size={15} />} label="Leesstreak" value={`${stats.streak} ${stats.streak === 1 ? "dag" : "dagen"}`} sub={stats.longestStreak > stats.streak ? `Record: ${stats.longestStreak}` : undefined} />
        <StatCard icon={<Clock size={15} />} label="Gem. sessie" value={`${stats.avgSessionMinutes} min`} sub={`${stats.totalMinutes} min totaal`} />
        <StatCard icon={<Sparkles size={15} />} label="Top genre" value={stats.topGenre || "—"} />
      </div>

      {/* Last 7 days */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="text-[13px] font-medium text-foreground mb-3">Afgelopen 7 dagen</div>
        <div className="flex items-end justify-between gap-1.5 h-32">
          {stats.last7Days.map((d) => {
            const h = (d.minutes / maxBar) * 100;
            const date = new Date(d.date);
            const isToday = d.date === new Date().toISOString().slice(0, 10);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="text-[10px] text-tx3">{d.minutes > 0 ? `${d.minutes}m` : ""}</div>
                <div
                  className={`w-full rounded-t min-h-[2px] transition-all ${isToday ? "bg-primary" : "bg-primary/40"}`}
                  style={{ height: `${Math.max(h, d.minutes > 0 ? 6 : 2)}%` }}
                  title={`${d.date}: ${d.minutes} min, ${d.pages} pagina's`}
                />
                <div className="text-[10px] text-tx3">{weekdays[date.getDay()]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Genre breakdown */}
      {stats.genreBreakdown.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[13px] font-medium text-foreground mb-3">Per genre</div>
          <div className="space-y-2">
            {stats.genreBreakdown.slice(0, 8).map((g) => (
              <div key={g.genre}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-tx2">{g.genre}</span>
                  <span className="text-tx3">{g.pages} pagina's</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(g.pages / maxGenrePages) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[11px] text-tx3">Totaal {stats.totalSessions} leessessies geregistreerd. Alleen lokaal opgeslagen op dit apparaat.</div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-primary/[0.07] border border-border rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-tx3 mb-1.5">
        <span className="text-primary">{icon}</span>
        <span className="text-[11px]">{label}</span>
      </div>
      <div className="text-[20px] font-medium text-foreground leading-tight truncate">{value}</div>
      {sub && <div className="text-[10px] text-tx3 mt-0.5">{sub}</div>}
    </div>
  );
}
