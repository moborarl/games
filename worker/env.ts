export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

export interface AppEnv {
  Bindings: Env;
}
