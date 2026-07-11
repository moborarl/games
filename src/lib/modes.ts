import type { MemoryMatchMode } from '@shared/types';

export type GameMode = MemoryMatchMode;

export const MODE_ORDER: GameMode[] = ['easy', 'medium', 'hard'];

export const MODE_META: Record<GameMode, { label: string; emoji: string }> = {
  easy: { label: 'ง่าย', emoji: '🐣' },
  medium: { label: 'ปานกลาง', emoji: '🦊' },
  hard: { label: 'ยาก', emoji: '🐉' },
};

export const MAX_RANKS = 10;
