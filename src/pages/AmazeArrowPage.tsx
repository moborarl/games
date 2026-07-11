import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AmazeArrowGame } from '../games/amazeArrow/AmazeArrowGame';
import { loadMutedPreference, setMuted } from '../lib/sound';

export function AmazeArrowPage() {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(loadMutedPreference());
  }, []);

  function toggleMuted() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  return (
    <div className="game-page">
      <header className="game-page-header">
        <Link to="/" className="link-btn">
          ← กลับหน้าแรก
        </Link>
        <h1>🏹 Amaze Arrow</h1>
        <button className="mute-btn" onClick={toggleMuted} aria-label="เปิด/ปิดเสียง">
          {muted ? '🔇' : '🔊'}
        </button>
      </header>
      <AmazeArrowGame />
    </div>
  );
}
