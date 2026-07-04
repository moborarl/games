CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game TEXT NOT NULL DEFAULT 'memory-match',
  mode TEXT NOT NULL CHECK (mode IN ('easy', 'medium', 'hard')),
  player_name TEXT NOT NULL,
  time_ms INTEGER NOT NULL,
  moves INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_scores_leaderboard ON scores (game, mode, time_ms);
