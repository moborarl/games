import { useEffect, useState } from 'react';
import type { ScoreRecord, ScoreboardResponse } from '@shared/types';
import { MAX_RANKS, MODE_META, MODE_ORDER, type GameMode } from '../lib/modes';
import { formatTime } from '../lib/format';

export function Scoreboard({
  game,
  activeMode,
  refreshToken,
}: {
  game: string;
  activeMode?: GameMode;
  refreshToken?: number;
}) {
  const [mode, setMode] = useState<GameMode>(activeMode ?? 'easy');
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeMode) setMode(activeMode);
  }, [activeMode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/scores?game=${game}&mode=${mode}&limit=${MAX_RANKS}`)
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
  }, [game, mode, refreshToken]);

  return (
    <div className="scoreboard">
      <div className="scoreboard-tabs">
        {MODE_ORDER.map((m) => (
          <button
            key={m}
            className={`tab-btn ${mode === m ? 'active' : ''}`}
            onClick={() => setMode(m)}
          >
            {MODE_META[m].emoji} {MODE_META[m].label}
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
                  <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
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
