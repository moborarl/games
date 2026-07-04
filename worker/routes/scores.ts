import { Hono } from 'hono';
import type { AppEnv } from '../env';
import type { ScoreRecord, SubmitScorePayload } from '@shared/types';

const MODES = new Set(['easy', 'medium', 'hard']);
const MAX_NAME_LEN = 20;

export const scoresRoutes = new Hono<AppEnv>();

interface ScoreRow {
  id: number;
  game: string;
  mode: string;
  player_name: string;
  time_ms: number;
  moves: number;
  created_at: string;
}

function toRecord(row: ScoreRow): ScoreRecord {
  return {
    id: row.id,
    game: row.game,
    mode: row.mode as ScoreRecord['mode'],
    playerName: row.player_name,
    timeMs: row.time_ms,
    moves: row.moves,
    createdAt: row.created_at,
  };
}

// GET /api/scores?game=memory-match&mode=easy&limit=10
scoresRoutes.get('/', async (c) => {
  const game = c.req.query('game') ?? 'memory-match';
  const mode = c.req.query('mode') ?? 'easy';
  const limit = Math.min(Number(c.req.query('limit') ?? '10') || 10, 50);

  if (!MODES.has(mode)) return c.json({ error: 'invalid_mode' }, 400);

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM scores WHERE game = ?1 AND mode = ?2 ORDER BY time_ms ASC, moves ASC LIMIT ?3`
  )
    .bind(game, mode, limit)
    .all<ScoreRow>();

  return c.json({ mode, scores: (results ?? []).map(toRecord) });
});

// POST /api/scores
scoresRoutes.post('/', async (c) => {
  const body = await c.req.json<Partial<SubmitScorePayload>>().catch(() => null);
  if (!body) return c.json({ error: 'invalid_body' }, 400);

  const game = (body.game ?? 'memory-match').toString().slice(0, 40);
  const mode = body.mode;
  const playerName = (body.playerName ?? '').toString().trim().slice(0, MAX_NAME_LEN);
  const timeMs = Number(body.timeMs);
  const moves = Number(body.moves);

  if (!mode || !MODES.has(mode)) return c.json({ error: 'invalid_mode' }, 400);
  if (!playerName) return c.json({ error: 'invalid_player_name' }, 400);
  if (!Number.isFinite(timeMs) || timeMs <= 0 || timeMs > 1000 * 60 * 60) {
    return c.json({ error: 'invalid_time' }, 400);
  }
  if (!Number.isFinite(moves) || moves <= 0 || moves > 10000) {
    return c.json({ error: 'invalid_moves' }, 400);
  }

  const inserted = await c.env.DB.prepare(
    `INSERT INTO scores (game, mode, player_name, time_ms, moves) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING *`
  )
    .bind(game, mode, playerName, Math.round(timeMs), Math.round(moves))
    .first<ScoreRow>();

  if (!inserted) return c.json({ error: 'insert_failed' }, 500);

  const { count } = (await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM scores WHERE game = ?1 AND mode = ?2 AND time_ms < ?3`
  )
    .bind(game, mode, inserted.time_ms)
    .first<{ count: number }>()) ?? { count: 0 };

  return c.json({ score: toRecord(inserted), rank: count + 1 }, 201);
});
