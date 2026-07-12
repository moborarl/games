export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_PASSWORD: string; // Worker secret (wrangler secret put ADMIN_PASSWORD) / .dev.vars ตอน dev
}

export interface AppEnv {
  Bindings: Env;
}
