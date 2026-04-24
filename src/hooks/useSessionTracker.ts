import { useEffect, useRef } from "react";
import { addSession, todayKey, type ReadingSession } from "@/lib/readingStats";
import type { Book } from "@/hooks/useBooks";

/**
 * Tracks a reading session for the given book. A session starts when the viewer
 * mounts and ends on unmount (or tab hide). Unique pages seen are counted.
 */
export function useSessionTracker(book: Book | null, currentPage: number | null) {
  const startedAtRef = useRef<number>(Date.now());
  const pagesSeenRef = useRef<Set<number>>(new Set());
  const lastActiveRef = useRef<number>(Date.now());
  const savedRef = useRef(false);

  // Track activity so idle time doesn't inflate sessions.
  useEffect(() => {
    const bump = () => { lastActiveRef.current = Date.now(); };
    window.addEventListener("keydown", bump);
    window.addEventListener("mousemove", bump);
    window.addEventListener("click", bump);
    return () => {
      window.removeEventListener("keydown", bump);
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("click", bump);
    };
  }, []);

  // Reset when book changes
  useEffect(() => {
    startedAtRef.current = Date.now();
    pagesSeenRef.current = new Set();
    lastActiveRef.current = Date.now();
    savedRef.current = false;
  }, [book?.id]);

  // Track current page
  useEffect(() => {
    if (typeof currentPage === "number") {
      pagesSeenRef.current.add(currentPage);
    }
  }, [currentPage]);

  // Persist session on unmount
  useEffect(() => {
    if (!book) return;
    return () => {
      if (savedRef.current) return;
      savedRef.current = true;
      const endedAt = Math.min(Date.now(), lastActiveRef.current + 60_000); // cap idle tail at 1min
      const duration = endedAt - startedAtRef.current;
      // require at least 5 seconds and 1 page to count
      if (duration < 5000 || pagesSeenRef.current.size === 0) return;
      const session: ReadingSession = {
        bookId: book.id,
        date: todayKey(),
        startedAt: startedAtRef.current,
        endedAt,
        pagesRead: pagesSeenRef.current.size,
        genre: book.genre,
      };
      addSession(session).catch(() => {});
    };
  }, [book]);
}
