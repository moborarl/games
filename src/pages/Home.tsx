import { Link } from 'react-router-dom';

const GAMES = [
  {
    to: '/games/memory-match',
    emoji: '🃏',
    title: 'เกมส์ไพ่จับคู่',
    subtitle: 'จับคู่ไพ่ให้ครบ ยิ่งเร็วยิ่งเก่ง!',
    ready: true,
  },
  {
    to: '/games/amaze-arrow',
    emoji: '🏹',
    title: 'Amaze Arrow',
    subtitle: 'กดลูกศรให้วิ่งออกจากกระดานให้หมด!',
    ready: true,
  },
  {
    to: '/games/quick-math',
    emoji: '🔢',
    title: 'เกมคิดเลขเร็ว',
    subtitle: 'ตอบเลขให้ถูกให้ไว ยิ่งเร็วยิ่งเก่ง!',
    ready: true,
  },
  {
    to: '/scores',
    emoji: '🏆',
    title: 'กระดานคะแนนรวม',
    subtitle: 'ดูคะแนนทุกเกม ทุกระดับ',
    ready: true,
  },
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
            <span className="game-tile-cta">{g.ready ? 'เล่นเลย →' : 'เร็วๆ นี้'}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
