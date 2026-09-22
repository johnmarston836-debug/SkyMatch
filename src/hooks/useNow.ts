import { useEffect, useState } from 'react';

/**
 * The current time, refreshed every `intervalMs`, for screens that show
 * something that changes on its own as time passes - "away · 3 min ago" -
 * without anything in the stores changing.
 */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
