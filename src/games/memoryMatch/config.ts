import type { MemoryMatchMode } from '@shared/types';

export interface ModeConfig {
  mode: MemoryMatchMode;
  label: string;
  subtitle: string;
  pairs: number;
  columns: number;
  emoji: string;
}

export const MODE_CONFIGS: Record<MemoryMatchMode, ModeConfig> = {
  easy: {
    mode: 'easy',
    label: 'ง่าย',
    subtitle: 'สำหรับเด็ก 8 ขวบ',
    pairs: 6,
    columns: 4,
    emoji: '🐣',
  },
  medium: {
    mode: 'medium',
    label: 'ปานกลาง',
    subtitle: 'สำหรับเด็ก 13 ขวบ',
    pairs: 8,
    columns: 4,
    emoji: '🦊',
  },
  hard: {
    mode: 'hard',
    label: 'ยาก',
    subtitle: 'สำหรับผู้ใหญ่',
    pairs: 12,
    columns: 6,
    emoji: '🐉',
  },
};

export const MODE_ORDER: MemoryMatchMode[] = ['easy', 'medium', 'hard'];

export const CARD_SYMBOLS = [
  '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐸', '🐵', '🐷', '🦄', '🐔', '🐧', '🐢',
  '🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍍', '🥝',
];
