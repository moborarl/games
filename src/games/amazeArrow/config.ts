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
  turnBias: number; // โอกาสที่ลำตัวจะเลี้ยว (ยิ่งสูง ยิ่งหักมุมหลายชั้น)
  fill?: boolean; // true = วางลูกศรจนเต็มกระดาน (pieces กลายเป็นเพดานสูงสุด)
  hearts: number | null; // null = ไม่มีตาย (โหมดง่าย)
}

export const ARROW_MODE_CONFIGS: Record<GameMode, ArrowModeConfig> = {
  // ง่าย = ระดับ "ปานกลาง" เดิม
  easy: {
    mode: 'easy',
    label: 'ง่าย',
    subtitle: 'สำหรับเด็ก 8 ขวบ',
    emoji: '🐣',
    cols: 24,
    rows: 15,
    pieces: 28,
    snakeRatio: 1,
    snakeMin: 4,
    snakeMax: 9,
    turnBias: 0.72,
    hearts: null,
  },
  // ปานกลาง = ระดับ "ยาก" เดิม
  medium: {
    mode: 'medium',
    label: 'ปานกลาง',
    subtitle: 'สำหรับเด็ก 13 ขวบ',
    emoji: '🦊',
    cols: 30,
    rows: 20,
    pieces: 34,
    snakeRatio: 1,
    snakeMin: 5,
    snakeMax: 13,
    turnBias: 0.72,
    hearts: 3,
  },
  // ยาก = extreme: กระดาน ×4, ลูกศรยาว 14-20, หักมุมจัด, อัดแน่นเต็มกระดาน
  hard: {
    mode: 'hard',
    label: 'ยาก',
    subtitle: 'สำหรับผู้ใหญ่',
    emoji: '🐉',
    cols: 48,
    rows: 30,
    pieces: 300,
    snakeRatio: 1,
    snakeMin: 14,
    snakeMax: 20,
    turnBias: 0.88,
    fill: true,
    hearts: 3,
  },
};

export const ARROW_MODE_ORDER: GameMode[] = ['easy', 'medium', 'hard'];
