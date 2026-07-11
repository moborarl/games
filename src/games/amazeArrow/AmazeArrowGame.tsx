import { useEffect, useRef, useState } from 'react';
import type { ScoreboardResponse, SubmitScoreResponse } from '@shared/types';
import { ARROW_MODE_CONFIGS, ARROW_MODE_ORDER, CELL, PIECE_COLORS, type ArrowModeConfig } from './config';
import { DIR_VECTORS, generateBoard, type Piece } from './generator';
import { Scoreboard } from '../../components/Scoreboard';
import { TimerDisplay } from '../../components/TimerDisplay';
import { formatTime } from '../../lib/format';
import { MAX_RANKS, type GameMode } from '../../lib/modes';
import { loadSavedName, saveName } from '../../lib/playerName';
import { playCrash, playLose, playSlide, playWin } from '../../lib/sound';

const GAME_SLUG = 'amaze-arrow';
const SLIDE_SPEED = 560; // หน่วย viewBox ต่อวินาที

interface Pt {
  x: number;
  y: number;
}

function centerOf(r: number, c: number): Pt {
  return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 };
}

// polyline ของชิ้น เรียงจากหาง → หัว (สำหรับวาดและเลื่อน)
function piecePoints(p: Piece): Pt[] {
  if (p.cells.length === 1) {
    const h = centerOf(p.cells[0].r, p.cells[0].c);
    const v = DIR_VECTORS[p.dir];
    return [
      { x: h.x - v.c * CELL * 0.22, y: h.y - v.r * CELL * 0.22 },
      { x: h.x + v.c * CELL * 0.18, y: h.y + v.r * CELL * 0.18 },
    ];
  }
  return [...p.cells].reverse().map((cc) => centerOf(cc.r, cc.c));
}

function totalLen(pts: Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
  }
  return len;
}

function pointAtLen(pts: Pt[], s: number): { p: Pt; angle: number } {
  let remaining = Math.max(0, s);
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const segLen = Math.abs(dx) + Math.abs(dy);
    if (remaining <= segLen || i === pts.length - 1) {
      const t = segLen === 0 ? 0 : Math.min(1, remaining / segLen);
      return {
        p: { x: pts[i - 1].x + dx * t, y: pts[i - 1].y + dy * t },
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      };
    }
    remaining -= segLen;
  }
  return { p: pts[pts.length - 1], angle: 0 };
}

function slicePolyline(pts: Pt[], s0: number, s1: number): Pt[] {
  const out: Pt[] = [pointAtLen(pts, s0).p];
  let walked = 0;
  for (let i = 1; i < pts.length; i++) {
    const segLen = Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
    const end = walked + segLen;
    if (end > s0 && end < s1) out.push(pts[i]);
    walked = end;
    if (walked >= s1) break;
  }
  out.push(pointAtLen(pts, s1).p);
  return out;
}

function dFor(pts: Pt[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

type Phase = 'select-mode' | 'playing' | 'won' | 'lost';

export function AmazeArrowGame() {
  const [phase, setPhase] = useState<Phase>('select-mode');
  const [mode, setMode] = useState<GameMode>('easy');
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [hearts, setHearts] = useState<number | null>(null);
  const [taps, setTaps] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finalTimeMs, setFinalTimeMs] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [rank, setRank] = useState<number | null>(null);
  const [qualifies, setQualifies] = useState<boolean | null>(null);
  const [scoreboardRefreshToken, setScoreboardRefreshToken] = useState(0);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const piecesRef = useRef<Piece[]>([]);
  const lockedRef = useRef(false);
  const phaseRef = useRef<Phase>('select-mode');
  const startedAtRef = useRef<number | null>(null);
  const wonRef = useRef(false);

  const config: ArrowModeConfig = ARROW_MODE_CONFIGS[mode];

  function syncPieces(next: Piece[]) {
    piecesRef.current = next;
    setPieces(next);
  }

  function startGame(selectedMode: GameMode) {
    const cfg = ARROW_MODE_CONFIGS[selectedMode];
    setMode(selectedMode);
    syncPieces(generateBoard(cfg, PIECE_COLORS));
    setHearts(cfg.hearts);
    setTaps(0);
    setStartedAt(null);
    startedAtRef.current = null;
    setPlayerName(loadSavedName());
    setSubmitState('idle');
    setRank(null);
    setQualifies(null);
    lockedRef.current = false;
    wonRef.current = false;
    phaseRef.current = 'playing';
    setPhase('playing');
  }

  // ชนะเมื่อลูกศรหมดกระดาน
  useEffect(() => {
    if (phase === 'playing' && startedAt !== null && pieces.length === 0 && !wonRef.current) {
      wonRef.current = true;
      const timeMs = Date.now() - startedAt;
      setFinalTimeMs(timeMs);
      phaseRef.current = 'won';
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
          const last = scores[scores.length - 1];
          setQualifies(timeMs < last.timeMs);
        })
        .catch(() => setQualifies(true));
    }
  }, [pieces, phase, startedAt, mode]);

  function animateSlide(
    pieceId: number,
    fullPts: Pt[],
    pieceLen: number,
    sTarget: number,
    bounce: boolean,
    onDone: () => void
  ) {
    const g = svgRef.current?.querySelector(`g[data-pid="${pieceId}"]`);
    const body = g?.querySelector('.arrow-body') as SVGPathElement | null;
    const headEl = g?.querySelector('.arrow-head') as SVGPathElement | null;
    if (!body || !headEl) {
      onDone();
      return;
    }
    const outDur = Math.max(130, (sTarget / SLIDE_SPEED) * 1000);
    const backDur = outDur * 0.75;
    const total = bounce ? outDur + backDur : outDur;
    const t0 = performance.now();
    let finished = false;

    function render(s: number) {
      const windowPts = slicePolyline(fullPts, s, s + pieceLen);
      body!.setAttribute('d', dFor(windowPts));
      const hp = pointAtLen(fullPts, s + pieceLen);
      headEl!.setAttribute('transform', `translate(${hp.p.x} ${hp.p.y}) rotate(${hp.angle})`);
    }

    // จบเกมด้วย setTimeout เสมอ — rAF ทำหน้าที่วาดภาพเท่านั้น
    // (ถ้าแท็บถูก throttle ภาพจะกระโดดไปท้ายสุด แต่เกมไม่ค้าง)
    function finish() {
      if (finished) return;
      finished = true;
      render(bounce ? 0 : sTarget);
      onDone();
    }

    function frame(now: number) {
      if (finished) return;
      const t = now - t0;
      if (t >= total) {
        finish();
        return;
      }
      const s = t <= outDur ? sTarget * (t / outDur) : sTarget * (1 - (t - outDur) / backDur);
      render(s);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    if (bounce) window.setTimeout(playCrash, outDur);
    window.setTimeout(finish, total + 60);
  }

  function tap(pieceId: number) {
    if (lockedRef.current || phaseRef.current !== 'playing') return;
    const piece = piecesRef.current.find((p) => p.id === pieceId);
    if (!piece) return;

    if (startedAtRef.current === null) {
      const now = Date.now();
      startedAtRef.current = now;
      setStartedAt(now);
    }
    setTaps((t) => t + 1);

    const occ = new Set<string>();
    piecesRef.current.forEach((p) => {
      if (p.id !== pieceId) p.cells.forEach((cc) => occ.add(`${cc.r},${cc.c}`));
    });

    const v = DIR_VECTORS[piece.dir];
    const head = piece.cells[0];
    let freeSteps = 0;
    let blockedAt = -1;
    let r = head.r + v.r;
    let c = head.c + v.c;
    while (r >= 0 && r < config.rows && c >= 0 && c < config.cols) {
      if (occ.has(`${r},${c}`)) {
        blockedAt = freeSteps + 1;
        break;
      }
      freeSteps++;
      r += v.r;
      c += v.c;
    }

    lockedRef.current = true;
    playSlide();

    const pts = piecePoints(piece);
    const pieceLen = totalLen(pts);
    const headPt = pts[pts.length - 1];

    if (blockedAt === -1) {
      // ทางโล่ง — วิ่งออกนอกกระดาน
      const sTarget = (freeSteps + 1.6) * CELL + pieceLen;
      const fullPts = [...pts, { x: headPt.x + v.c * (sTarget + CELL), y: headPt.y + v.r * (sTarget + CELL) }];
      animateSlide(pieceId, fullPts, pieceLen, sTarget, false, () => {
        lockedRef.current = false;
        syncPieces(piecesRef.current.filter((p) => p.id !== pieceId));
      });
    } else {
      // ชนลูกศรตัวอื่น — เด้งกลับ
      const sTarget = Math.max(0.2, blockedAt - 0.65) * CELL;
      const fullPts = [...pts, { x: headPt.x + v.c * (sTarget + CELL), y: headPt.y + v.r * (sTarget + CELL) }];
      animateSlide(pieceId, fullPts, pieceLen, sTarget, true, () => {
        lockedRef.current = false;
        if (config.hearts !== null) {
          setHearts((h) => {
            const next = (h ?? 1) - 1;
            if (next <= 0) {
              phaseRef.current = 'lost';
              setPhase('lost');
              playLose();
            }
            return next;
          });
        }
      });
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
          game: GAME_SLUG,
          mode,
          playerName: name,
          timeMs: finalTimeMs,
          moves: taps,
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

  function backToModeSelect() {
    phaseRef.current = 'select-mode';
    setPhase('select-mode');
  }

  if (phase === 'select-mode') {
    return (
      <div className="mode-select">
        <h2>เลือกระดับความยาก</h2>
        <div className="mode-cards">
          {ARROW_MODE_ORDER.map((m) => {
            const cfg = ARROW_MODE_CONFIGS[m];
            return (
              <button key={m} className={`mode-card mode-${m}`} onClick={() => startGame(m)}>
                <span className="mode-emoji">{cfg.emoji}</span>
                <span className="mode-label">{cfg.label}</span>
                <span className="mode-subtitle">{cfg.subtitle}</span>
                <span className="mode-pairs">
                  ลูกศร {cfg.pieces} ตัว{cfg.hearts !== null ? ` · ❤️ ${cfg.hearts}` : ''}
                </span>
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

  const boardW = config.cols * CELL;
  const boardH = config.rows * CELL;

  return (
    <div className="game-screen">
      <div className="game-hud">
        <button className="link-btn" onClick={backToModeSelect}>
          ← เลือกโหมดใหม่
        </button>
        <TimerDisplay startedAt={startedAt} running={phase === 'playing'} />
        <div className="hud-stat">👆 {taps} ครั้ง</div>
        {config.hearts !== null && (
          <div className="hud-stat hearts">
            {Array.from({ length: config.hearts }).map((_, i) => (
              <span key={i} className={i < (hearts ?? 0) ? '' : 'heart-off'}>
                ❤️
              </span>
            ))}
          </div>
        )}
        <div className="hud-stat">🎯 เหลือ {pieces.length}</div>
      </div>

      <div className="board-wrap">
        <svg
          ref={svgRef}
          className="arrow-board"
          viewBox={`0 0 ${boardW} ${boardH}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="board-dots" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
              <circle cx={CELL / 2} cy={CELL / 2} r="1.7" fill="#cfc2a8" />
            </pattern>
            <clipPath id="board-clip">
              <rect x="0" y="0" width={boardW} height={boardH} rx="10" />
            </clipPath>
          </defs>
          <rect x="0" y="0" width={boardW} height={boardH} rx="10" fill="#f3ecdd" />
          <rect x="0" y="0" width={boardW} height={boardH} rx="10" fill="url(#board-dots)" />
          <g clipPath="url(#board-clip)">
            {pieces.map((p) => {
              const pts = piecePoints(p);
              const headInfo = pointAtLen(pts, totalLen(pts));
              return (
                <g key={p.id} data-pid={p.id} className="arrow-piece" onClick={() => tap(p.id)}>
                  <path className="arrow-body" stroke={p.color} d={dFor(pts)} />
                  <path
                    className="arrow-head"
                    fill={p.color}
                    d="M -2 -8 L 12 0 L -2 8 Z"
                    transform={`translate(${headInfo.p.x} ${headInfo.p.y}) rotate(${headInfo.angle})`}
                  />
                  <path className="arrow-hit" d={dFor(pts)} />
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {phase === 'won' && (
        <div className="win-modal-backdrop">
          <div className="win-modal">
            <h2>🎉 เก่งมาก! เคลียร์กระดานแล้ว</h2>

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
                <span className="win-stat-label">แตะทั้งหมด</span>
                <span className="win-stat-value">{taps} ครั้ง</span>
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
              <button className="link-btn" onClick={backToModeSelect}>
                เลือกโหมดใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'lost' && (
        <div className="win-modal-backdrop">
          <div className="win-modal">
            <h2>💔 หัวใจหมดแล้ว</h2>
            <p className="muted">ไม่เป็นไร ลองกระดานใหม่ได้เลย!</p>
            <div className="win-actions">
              <button className="primary-btn" onClick={() => startGame(mode)}>
                เล่นใหม่
              </button>
              <button className="link-btn" onClick={backToModeSelect}>
                เลือกโหมดใหม่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
