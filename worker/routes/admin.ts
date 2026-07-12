import { Hono } from 'hono';
import type { AppEnv } from '../env';
import type { ScoreRecord } from '@shared/types';

export const adminRoutes = new Hono<AppEnv>();

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

// ทุก endpoint ต้องส่ง header x-admin-key ที่ตรงกับ ADMIN_PASSWORD
adminRoutes.use('*', async (c, next) => {
  const key = c.req.header('x-admin-key');
  if (!c.env.ADMIN_PASSWORD || !key || key !== c.env.ADMIN_PASSWORD) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  await next();
});

// GET /api/admin/scores?game=&mode= — ดูคะแนนทั้งหมด (ไม่จำกัด top 10)
adminRoutes.get('/scores', async (c) => {
  const game = c.req.query('game');
  const mode = c.req.query('mode');
  const conditions: string[] = [];
  const binds: string[] = [];
  if (game) {
    conditions.push(`game = ?${binds.length + 1}`);
    binds.push(game);
  }
  if (mode) {
    conditions.push(`mode = ?${binds.length + 1}`);
    binds.push(mode);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM scores ${where} ORDER BY game, mode, time_ms ASC LIMIT 500`
  )
    .bind(...binds)
    .all<ScoreRow>();
  return c.json({ scores: (results ?? []).map(toRecord) });
});

// DELETE /api/admin/scores/:id — ลบคะแนนรายแถว
adminRoutes.delete('/scores/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: 'invalid_id' }, 400);
  await c.env.DB.prepare(`DELETE FROM scores WHERE id = ?1`).bind(id).run();
  return c.json({ ok: true });
});

// POST /api/admin/scores/clear { game, mode } — ล้างทั้งโหมด
adminRoutes.post('/scores/clear', async (c) => {
  const body = await c.req.json<{ game?: string; mode?: string }>().catch(() => null);
  if (!body?.game || !body?.mode) return c.json({ error: 'invalid_body' }, 400);
  await c.env.DB.prepare(`DELETE FROM scores WHERE game = ?1 AND mode = ?2`)
    .bind(body.game, body.mode)
    .run();
  return c.json({ ok: true });
});
