import { Link } from 'react-router-dom';
import { Scoreboard } from '../components/Scoreboard';

const GAME_LIST = [
  { slug: 'memory-match', emoji: '🃏', title: 'เกมส์ไพ่จับคู่' },
  { slug: 'amaze-arrow', emoji: '🏹', title: 'Amaze Arrow' },
];

export function ScoresPage() {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <Link to="/" className="link-btn">
          ← กลับหน้าแรก
        </Link>
        <h1>🏆 กระดานคะแนนรวม</h1>
      </header>
      <div className="dashboard-grid">
        {GAME_LIST.map((g) => (
          <section key={g.slug} className="dashboard-card">
            <h2>
              {g.emoji} {g.title}
            </h2>
            <Scoreboard game={g.slug} />
          </section>
        ))}
      </div>
    </div>
  );
}
