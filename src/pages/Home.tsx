import { Link } from 'react-router-dom';

const GAMES = [
  {
    to: '/games/memory-match',
    emoji: '🃏',
    title: 'เกมส์ไพ่จับคู่',
    subtitle: 'จับคู่ไพ่ให้ครบ ยิ่งเร็วยิ่งเก่ง!',
    ready: true,
  },
  { to: '#', emoji: '🧩', title: 'ต่อจิ๊กซอว์', subtitle: 'เร็วๆ นี้', ready: false },
  { to: '#', emoji: '🔢', title: 'เกมส์เลข', subtitle: 'เร็วๆ นี้', ready: false },
];

export function Home() {
  return (
    <div className="home">
      <header className="home-header">
        <h1>🎪 สนามเด็กเล่น เกมส์</h1>
        <p>เลือกเกมที่อยากเล่นได้เลย!</p>
      </header>
      <div className="game-tiles">
        {GAMES.map((g) => (
          <Link
            key={g.title}
            to={g.to}
            className={`game-tile ${g.ready ? '' : 'disabled'}`}
            onClick={(e) => !g.ready && e.preventDefault()}
          >
            <span className="game-tile-emoji">{g.emoji}</span>
            <span className="game-tile-title">{g.title}</span>
            <span className="game-tile-subtitle">{g.subtitle}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
