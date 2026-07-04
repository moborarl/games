import { Link } from 'react-router-dom';
import { MemoryMatchGame } from '../games/memoryMatch/MemoryMatchGame';

export function MemoryMatchPage() {
  return (
    <div className="game-page">
      <header className="game-page-header">
        <Link to="/" className="link-btn">
          ← กลับหน้าแรก
        </Link>
        <h1>🃏 เกมส์ไพ่จับคู่</h1>
      </header>
      <MemoryMatchGame />
    </div>
  );
}
