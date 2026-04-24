import { get, set } from "idb-keyval";

export interface ReadingSession {
  bookId: string;
  date: string;           // YYYY-MM-DD
  startedAt: number;
  endedAt: number;
  pagesRead: number;      // unique pages seen this session
  genre?: string;
}

const KEY = "reading-sessions";

export async function loadSessions(): Promise<ReadingSession[]> {
  return (await get<ReadingSession[]>(KEY)) || [];
}

export async function addSession(s: ReadingSession) {
  const all = await loadSessions();
  all.push(s);
  // keep last 2000
  if (all.length > 2000) all.splice(0, all.length - 2000);
  await set(KEY, all);
}

export interface Stats {
  totalPages: number;
  totalSessions: number;
  avgSessionMinutes: number;
  totalMinutes: number;
  streak: number;
  longestStreak: number;
  topGenre: string | null;
  genreBreakdown: { genre: string; pages: number }[];
  last7Days: { date: string; minutes: number; pages: number }[];
}

function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function computeStats(sessions: ReadingSession[]): Stats {
  const totalPages = sessions.reduce((s, x) => s + (x.pagesRead || 0), 0);
  const totalMs = sessions.reduce((s, x) => s + Math.max(0, x.endedAt - x.startedAt), 0);
  const totalMinutes = Math.round(totalMs / 60000);
  const avgSessionMinutes =
    sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0;

  // Streak: consecutive days up to today (or yesterday) with at least one session
  const dates = new Set(sessions.map((s) => s.date));
  let streak = 0;
  let cursor = new Date();
  // if no reading today, start from yesterday so streak doesn't reset mid-day
  if (!dates.has(todayStr(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(todayStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak
  const sortedDates = Array.from(dates).sort();
  let longestStreak = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of sortedDates) {
    const cur = new Date(d);
    if (prev && (cur.getTime() - prev.getTime()) / 86400000 === 1) {
      run++;
    } else {
      run = 1;
    }
    if (run > longestStreak) longestStreak = run;
    prev = cur;
  }

  // Genre breakdown (by pages read)
  const genreMap = new Map<string, number>();
  for (const s of sessions) {
    const g = (s.genre || "Onbekend").trim() || "Onbekend";
    genreMap.set(g, (genreMap.get(g) || 0) + (s.pagesRead || 0));
  }
  const genreBreakdown = Array.from(genreMap.entries())
    .map(([genre, pages]) => ({ genre, pages }))
    .sort((a, b) => b.pages - a.pages);
  const topGenre = genreBreakdown[0]?.genre || null;

  // Last 7 days
  const last7Days: Stats["last7Days"] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayStr(d);
    const daySessions = sessions.filter((s) => s.date === key);
    const minutes = Math.round(
      daySessions.reduce((sum, s) => sum + Math.max(0, s.endedAt - s.startedAt), 0) / 60000,
    );
    const pages = daySessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
    last7Days.push({ date: key, minutes, pages });
  }

  return {
    totalPages,
    totalSessions: sessions.length,
    avgSessionMinutes,
    totalMinutes,
    streak,
    longestStreak,
    topGenre,
    genreBreakdown,
    last7Days,
  };
}

export function todayKey(): string {
  return todayStr();
}
