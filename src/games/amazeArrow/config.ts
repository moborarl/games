import type { GameMode } from '../../lib/modes';

export const CELL = 40;

// โทนสีลูกศรแบบ muted ไม่แสบตา เข้ากับกระดานครีม
export const PIECE_COLORS = ['#7a5a3e', '#4a7a68', '#5b6b9e', '#9e5b6b', '#7a6a3e', '#5f7a4a'];

export interface ArrowModeConfig {
  mode: GameMode;
  label: string;
  subtitle: string;
  emoji: string;
  cols: number;
  rows: number;
  pieces: number;
  snakeRatio: number;
  snakeMin: number;
  snakeMax: number;
  hearts: number | null; // null = ไม่มีตาย (โหมดง่าย)
}

export const ARROW_MODE_CONFIGS: Record<GameMode, ArrowModeConfig> = {
  easy: {
    mode: 'easy',
    label: 'ง่าย',
    subtitle: 'สำหรับเด็ก 8 ขวบ',
    emoji: '🐣',
    cols: 12,
    rows: 9,
    pieces: 16,
    snakeRatio: 0.2,
    snakeMin: 3,
    snakeMax: 4,
    hearts: null,
  },
  medium: {
    mode: 'medium',
    label: 'ปานกลาง',
    subtitle: 'สำหรับเด็ก 13 ขวบ',
    emoji: '🦊',
    cols: 15,
    rows: 12,
    pieces: 42,
    snakeRatio: 0.4,
    snakeMin: 4,
    snakeMax: 7,
    hearts: 3,
  },
  hard: {
    mode: 'hard',
    label: 'ยาก',
    subtitle: 'สำหรับผู้ใหญ่',
    emoji: '🐉',
    cols: 20,
    rows: 15,
    pieces: 66,
    snakeRatio: 0.45,
    snakeMin: 5,
    snakeMax: 10,
    hearts: 3,
  },
};

export const ARROW_MODE_ORDER: GameMode[] = ['easy', 'medium', 'hard'];
