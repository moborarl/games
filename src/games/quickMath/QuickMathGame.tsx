import { useEffect, useRef, useState } from 'react';
import type { ScoreboardResponse, SubmitScoreResponse } from '@shared/types';
import { QUICK_MATH_CONFIGS, QUICK_MATH_ORDER, buildQuestions, type Question } from './config';
import { Scoreboard } from '../../components/Scoreboard';
import { TimerDisplay } from '../../components/TimerDisplay';
import { formatTime } from '../../lib/format';
import { MAX_RANKS, type GameMode } from '../../lib/modes';
import { loadSavedName, saveName } from '../../lib/playerName';
import { playFlip, playMatch, playMismatch, playWin } from '../../lib/sound';

const GAME_SLUG = 'quick-math';

type Phase = 'select-mode' | 'playing' | 'won';

export function QuickMathGame() {
  const [phase, setPhase] = useState<Phase>('select-mode');
  const [mode, setMode] = useState<GameMode>('easy');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [entry, setEntry] = useState('');
  const [shake, setShake] = useState(false);
  const [wrongChoice, setWrongChoice] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finalTimeMs, setFinalTimeMs] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [rank, setRank] = useState<number | null>(null);
  const [qualifies, setQualifies] = useState<boolean | null>(null);
  const [scoreboardRefreshToken, setScoreboardRefreshToken] = useState(0);
  const wonRef = useRef(false);

  const config = QUICK_MATH_CONFIGS[mode];
  const current = questions[index];

  function startGame(selectedMode: GameMode) {
    const cfg = QUICK_MATH_CONFIGS[selectedMode];
    setMode(selectedMode);
    setQuestions(buildQuestions(selectedMode, cfg.questions));
    setIndex(0);
    setMistakes(0);
    setEntry('');
    setShake(false);
    setWrongChoice(null);
    setStartedAt(null);
    setPlayerName(loadSavedName());
    setSubmitState('idle');
    setRank(null);
    setQualifies(null);
    wonRef.current = false;
    setPhase('playing');
  }

  function finishGame(timeMs: number) {
    setFinalTimeMs(timeMs);
    setPhase('won');
    playWin();
    fetch(`/api/scores?game=${GAME_SLUG}&mode=${mode}&limit=${MAX_RANKS}`)
      .then((res) => res.json() as Promise<ScoreboardResponse>)
      .then((data) => {
        const scores = data.scores ?? [];
        if (scores.length < MAX_RANKS) {
          setQualifies(true);
          return;
        }
        setQualifies(timeMs < scores[scores.length - 1].timeMs);
      })
      .catch(() => setQualifies(true));
  }

  function submitAnswer(value: number, fromChoice?: number) {
    if (!current || wonRef.current) return;
    let start = startedAt;
    if (start === null) {
      start = Date.now();
      setStartedAt(start);
    }

    if (value === current.answer) {
      playMatch();
      setEntry('');
      setWrongChoice(null);
      if (index + 1 >= questions.length) {
        wonRef.current = true;
        finishGame(Date.now() - start);
      } else {
        setIndex((i) => i + 1);
      }
    } else {
      playMismatch();
      setMistakes((m) => m + 1);
      setEntry('');
      if (fromChoice !== undefined) {
        setWrongChoice(fromChoice);
        window.setTimeout(() => setWrongChoice(null), 500);
      } else {
        setShake(true);
        window.setTimeout(() => setShake(false), 450);
      }
    }
  }

  function pressKey(k: string) {
    playFlip();
    if (k === 'C') {
      setEntry('');
    } else if (k === '⏎') {
      if (entry !== '') submitAnswer(Number(entry));
    } else if (entry.length < 5) {
      setEntry((e) => e + k);
    }
  }

  // รองรับคีย์บอร์ดจริง (เผื่อเล่นบนคอม)
  useEffect(() => {
    if (phase !== 'playing' || config.input !== 'keypad') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') pressKey(e.key);
      else if (e.key === 'Enter') pressKey('⏎');
      else if (e.key === 'Backspace') setEntry((s) => s.slice(0, -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function submitScore() {
    const name = playerName.trim();
    if (!name) return;
    setSubmitState('saving');
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: GAME_SLUG,
          mode,
          playerName: name,
          timeMs: finalTimeMs,
          moves: mistakes,
        }),
      });
      if (!res.ok) throw new Error('save_failed');
      const data = (await res.json()) as SubmitScoreResponse;
      saveName(name);
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
          {QUICK_MATH_ORDER.map((m) => {
            const cfg = QUICK_MATH_CONFIGS[m];
            return (
              <button key={m} className={`mode-card mode-${m}`} onClick={() => startGame(m)}>
                <span className="mode-emoji">{cfg.emoji}</span>
                <span className="mode-label">{cfg.label}</span>
                <span className="mode-subtitle">{cfg.subtitle}</span>
                <span className="mode-pairs">{cfg.questions} ข้อ</span>
              </button>
            );
          })}
        </div>
        <div className="scoreboard-section">
          <h3>🏆 กระดานคะแนน</h3>
          <Scoreboard game={GAME_SLUG} />
        </div>
      </div>
    );
  }

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '⏎'];

  return (
    <div className="game-screen">
      <div className="game-hud">
        <button className="link-btn" onClick={() => setPhase('select-mode')}>
          ← เลือกโหมดใหม่
        </button>
        <TimerDisplay startedAt={startedAt} running={phase === 'playing'} />
        <div className="hud-stat">
          ข้อ {Math.min(index + 1, questions.length)}/{questions.length}
        </div>
        <div className="hud-stat">❌ {mistakes}</div>
      </div>

      <div className="qm-play">
        <div className={`qm-question ${shake ? 'shake' : ''}`}>{current?.text} = ?</div>

        {config.input === 'choice' ? (
          <div className="qm-choices">
            {current?.choices?.map((choice, i) => (
              <button
                key={i}
                className={`qm-choice ${wrongChoice === choice ? 'wrong' : ''}`}
                onClick={() => submitAnswer(choice, choice)}
              >
                {choice}
              </button>
            ))}
          </div>
        ) : (
          <div className="qm-keypad-wrap">
            <div className="qm-entry">{entry || ' '}</div>
            <div className="qm-keypad">
              {keys.map((k) => (
                <button
                  key={k}
                  className={`qm-key ${k === '⏎' ? 'enter' : ''} ${k === 'C' ? 'clear' : ''}`}
                  onClick={() => pressKey(k)}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {phase === 'won' && (
        <div className="win-modal-backdrop">
          <div className="win-modal">
            <h2>🎉 เก่งมาก! ทำครบทุกข้อ</h2>

            <div className="win-stats">
              <div className="win-stat">
                <span className="win-stat-label">โหมด</span>
                <span className="win-stat-value">
                  {config.emoji} {config.label}
                </span>
              </div>
              <div className="win-stat">
                <span className="win-stat-label">เวลาที่ใช้</span>
                <span className="win-stat-value">{formatTime(finalTimeMs)}</span>
              </div>
              <div className="win-stat">
                <span className="win-stat-label">ตอบผิด</span>
                <span className="win-stat-value">{mistakes} ครั้ง</span>
              </div>
            </div>

            {submitState === 'saved' ? (
              <p className="save-success">บันทึกแล้ว! อันดับของเธอคือ #{rank}</p>
            ) : qualifies === true ? (
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
            ) : qualifies === false ? (
              <p className="muted">ยังไม่ติด 10 อันดับแรก — ลองอีกครั้งนะ! 💪</p>
            ) : null}

            <div className="scoreboard-section">
              <Scoreboard game={GAME_SLUG} activeMode={mode} refreshToken={scoreboardRefreshToken} />
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
