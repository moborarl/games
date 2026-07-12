import { Hono } from 'hono';
import type { AppEnv } from './env';
import { scoresRoutes } from './routes/scores';
import { adminRoutes } from './routes/admin';

const app = new Hono<AppEnv>();

app.get('/api/health', (c) => c.json({ ok: true }));
app.route('/api/scores', scoresRoutes);
app.route('/api/admin', adminRoutes);

app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) return c.json({ error: 'not_found' }, 404);
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
