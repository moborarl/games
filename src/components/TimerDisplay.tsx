import { useEffect, useState } from 'react';
import { formatTime } from '../lib/format';

// Self-ticking so the 30ms clock doesn't re-render the whole game board.
export function TimerDisplay({ startedAt, running }: { startedAt: number | null; running: boolean }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (startedAt === null) {
      setElapsedMs(0);
      return;
    }
    if (!running) return;
    const tick = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 30);
    return () => window.clearInterval(tick);
  }, [startedAt, running]);

  return <div className="hud-stat">⏱ {formatTime(elapsedMs)}</div>;
}
