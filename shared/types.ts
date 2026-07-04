export type MemoryMatchMode = 'easy' | 'medium' | 'hard';

export interface ScoreRecord {
  id: number;
  game: string;
  mode: MemoryMatchMode;
  playerName: string;
  timeMs: number;
  moves: number;
  createdAt: string;
}

export interface SubmitScorePayload {
  game: string;
  mode: MemoryMatchMode;
  playerName: string;
  timeMs: number;
  moves: number;
}

export interface SubmitScoreResponse {
  score: ScoreRecord;
  rank: number;
}

export interface ScoreboardResponse {
  mode: MemoryMatchMode;
  scores: ScoreRecord[];
}
