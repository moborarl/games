import { useEffect, useMemo, useRef, useState } from 'react';
import type { MemoryMatchMode, SubmitScoreResponse } from '@shared/types';
import { CARD_SYMBOLS, MODE_CONFIGS, MODE_ORDER } from './config';
import { Scoreboard, formatTime } from './Scoreboard';

interface Card {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

function buildDeck(pairs: number): Card[] {
  const symbols = CARD_SYMBOLS.slice(0, pairs);
  const deck = [...symbols, ...symbols].map((symbol, i) => ({
    id: i,
    symbol,
    flipped: false,
    matched: false,
  }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

type Phase = 'select-mode' | 'playing' | 'won';

export function MemoryMatchGame() {
  const [phase, setPhase] = useState<Phase>('select-mode');
  const [mode, setMode] = useState<MemoryMatchMode>('easy');
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalTimeMs, setFinalTimeMs] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [rank, setRank] = useState<number | null>(null);
  const [scoreboardRefreshToken, setScoreboardRefreshToken] = useState(0);
  const tickRef = useRef<number | null>(null);

  const config = MODE_CONFIGS[mode];
  const allMatched = useMemo(() => cards.length > 0 && cards.every((c) => c.matched), [cards]);

  function startGame(selectedMode: MemoryMatchMode) {
    setMode(selectedMode);
    setCards(buildDeck(MODE_CONFIGS[selectedMode].pairs));
    setSelected([]);
    setMoves(0);
    setLocked(false);
    setStartedAt(null);
    setElapsedMs(0);
    setPlayerName('');
    setSubmitState('idle');
    setRank(null);
    setPhase('playing');
  }

  useEffect(() => {
    if (phase !== 'playing' || startedAt === null) return;
    tickRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 30);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [phase, startedAt]);

  useEffect(() => {
    if (allMatched && phase === 'playing' && startedAt !== null) {
      setFinalTimeMs(Date.now() - startedAt);
      setPhase('won');
      if (tickRef.current) window.clearInterval(tickRef.current);
    }
  }, [allMatched, phase, startedAt]);

  function handleFlip(cardIndex: number) {
    if (locked) return;
    const card = cards[cardIndex];
    if (card.flipped || card.matched) return;
    if (selected.includes(cardIndex)) return;

    if (startedAt === null) setStartedAt(Date.now());

    const nextCards = cards.map((c, i) => (i === cardIndex ? { ...c, flipped: true } : c));
    const nextSelected = [...selected, cardIndex];
    setCards(nextCards);
    setSelected(nextSelected);

    if (nextSelected.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextSelected;
      if (nextCards[a].symbol === nextCards[b].symbol) {
        setLocked(true);
        window.setTimeout(() => {
          setCards((cur) => cur.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
          setSelected([]);
          setLocked(false);
        }, 300);
      } else {
        setLocked(true);
        window.setTimeout(() => {
          setCards((cur) => cur.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)));
          setSelected([]);
          setLocked(false);
        }, 800);
      }
    }
  }

  async function submitScore() {
    const name = playerName.trim();
    if (!name) return;
    setSubmitState('saving');
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'memory-match',
          mode,
          playerName: name,
          timeMs: finalTimeMs,
          moves,
        }),
      });
      if (!res.ok) throw new Error('save_failed');
      const data = (await res.json()) as SubmitScoreResponse;
      setRank(data.rank);
      setSubmitState('saved');
      setScoreboardRefreshToken((t) => t + 1);
    } catch {
      setSubmitState('idle');
    }
  }

  if (phase === 'select-mode') {
    return (
      <div className="mode-select">
        <h2>เลือกระดับความยาก</h2>
        <div className="mode-cards">
          {MODE_ORDER.map((m) => {
            const cfg = MODE_CONFIGS[m];
            return (
              <button key={m} className={`mode-card mode-${m}`} onClick={() => startGame(m)}>
                <span className="mode-emoji">{cfg.emoji}</span>
                <span className="mode-label">{cfg.label}</span>
                <span className="mode-subtitle">{cfg.subtitle}</span>
                <span className="mode-pairs">{cfg.pairs} คู่</span>
              </button>
            );
          })}
        </div>
        <div className="scoreboard-section">
          <h3>🏆 กระดานคะแนน</h3>
          <Scoreboard />
        </div>
      </div>
    );
  }

  return (
    <div className="game-screen">
      <div className="game-hud">
        <button className="link-btn" onClick={() => setPhase('select-mode')}>
          ← เลือกโหมดใหม่
        </button>
        <div className="hud-stat">⏱ {formatTime(elapsedMs)}</div>
        <div className="hud-stat">🔁 {moves} ครั้ง</div>
      </div>

      <div
        className={`card-grid mode-${mode}`}
        style={{ gridTemplateColumns: `repeat(${config.columns}, 1fr)` }}
      >
        {cards.map((card, i) => (
          <button
            key={card.id}
            className={`memory-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => handleFlip(i)}
            disabled={card.matched}
          >
            <span className="card-face card-front">❓</span>
            <span className="card-face card-back">{card.symbol}</span>
          </button>
        ))}
      </div>

      {phase === 'won' && (
        <div className="win-modal-backdrop">
          <div className="win-modal">
            <h2>🎉 เก่งมาก! จับคู่ครบแล้ว</h2>
            <p>
              โหมด: <strong>{config.label}</strong>
            </p>
            <p>
              เวลาที่ใช้: <strong>{formatTime(finalTimeMs)}</strong>
            </p>
            <p>
              จำนวนครั้งที่พลิกไพ่: <strong>{moves}</strong>
            </p>

            {submitState !== 'saved' ? (
              <div className="save-score-form">
                <input
                  type="text"
                  placeholder="ใส่ชื่อของเธอ"
                  value={playerName}
                  maxLength={20}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
                <button
                  className="primary-btn"
                  disabled={!playerName.trim() || submitState === 'saving'}
                  onClick={submitScore}
                >
                  {submitState === 'saving' ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}
                </button>
              </div>
            ) : (
              <p className="save-success">บันทึกแล้ว! อันดับของเธอคือ #{rank}</p>
            )}

            <div className="scoreboard-section">
              <Scoreboard activeMode={mode} refreshToken={scoreboardRefreshToken} />
            </div>

            <div className="win-actions">
              <button className="primary-btn" onClick={() => startGame(mode)}>
                เล่นอีกครั้ง
              </button>
              <button className="link-btn" onClick={() => setPhase('select-mode')}>
                เลือกโหมดใหม่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
