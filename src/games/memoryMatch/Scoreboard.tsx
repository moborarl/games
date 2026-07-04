import { useEffect, useState } from 'react';
import type { MemoryMatchMode, ScoreRecord, ScoreboardResponse } from '@shared/types';
import { MODE_CONFIGS, MODE_ORDER } from './config';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor(ms % 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

export function Scoreboard({
  activeMode,
  refreshToken,
}: {
  activeMode?: MemoryMatchMode;
  refreshToken?: number;
}) {
  const [mode, setMode] = useState<MemoryMatchMode>(activeMode ?? 'easy');
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeMode) setMode(activeMode);
  }, [activeMode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/scores?game=memory-match&mode=${mode}&limit=10`)
      .then((res) => res.json() as Promise<ScoreboardResponse>)
      .then((data) => {
        if (!cancelled) setScores(data.scores);
      })
      .catch(() => {
        if (!cancelled) setScores([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, refreshToken]);

  return (
    <div className="scoreboard">
      <div className="scoreboard-tabs">
        {MODE_ORDER.map((m) => (
          <button
            key={m}
            className={`tab-btn ${mode === m ? 'active' : ''}`}
            onClick={() => setMode(m)}
          >
            {MODE_CONFIGS[m].emoji} {MODE_CONFIGS[m].label}
          </button>
        ))}
      </div>
      <div className="scoreboard-body">
        {loading ? (
          <p className="muted">กำลังโหลด...</p>
        ) : scores.length === 0 ? (
          <p className="muted">ยังไม่มีใครทำคะแนนไว้ เป็นคนแรกเลย!</p>
        ) : (
          <table className="score-table">
            <thead>
              <tr>
                <th>อันดับ</th>
                <th>ชื่อ</th>
                <th>เวลา</th>
                <th>จำนวนครั้ง</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={s.id} className={i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}>
                  <td>{i + 1}</td>
                  <td>{s.playerName}</td>
                  <td>{formatTime(s.timeMs)}</td>
                  <td>{s.moves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export { formatTime };
