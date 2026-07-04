import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MemoryMatchGame } from '../games/memoryMatch/MemoryMatchGame';
import { loadMutedPreference, setMuted } from '../games/memoryMatch/sound';

export function MemoryMatchPage() {
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
        <h1>🃏 เกมส์ไพ่จับคู่</h1>
        <button className="mute-btn" onClick={toggleMuted} aria-label="เปิด/ปิดเสียง">
          {muted ? '🔇' : '🔊'}
        </button>
      </header>
      <MemoryMatchGame />
    </div>
  );
}
