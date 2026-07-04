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

export interface CardSymbol {
  emoji: string;
  bg: string;
}

// A mix of animals, nature, sports, food, and everyday objects so the
// deck doesn't read as "just animal faces" — each gets its own pastel tile
// color, similar to a printed card-game deck.
export const CARD_SYMBOLS: CardSymbol[] = [
  { emoji: '🐶', bg: '#f6dfc0' },
  { emoji: '🌈', bg: '#cfe8fb' },
  { emoji: '⚽', bg: '#fde79a' },
  { emoji: '🚀', bg: '#dcd2fb' },
  { emoji: '🐟', bg: '#bdeefc' },
  { emoji: '🐱', bg: '#fbd3d3' },
  { emoji: '🐦', bg: '#d3f3d6' },
  { emoji: '🎈', bg: '#fcd9ec' },
  { emoji: '🍎', bg: '#ffd6d6' },
  { emoji: '🌻', bg: '#fdeeb0' },
  { emoji: '🚗', bg: '#cbe8fd' },
  { emoji: '🎵', bg: '#e3d6fb' },
  { emoji: '🏀', bg: '#ffe2c2' },
  { emoji: '🦋', bg: '#d9f0e6' },
  { emoji: '🍦', bg: '#ffe0ea' },
  { emoji: '🎁', bg: '#d6e8fc' },
  { emoji: '🐢', bg: '#dcf0c9' },
  { emoji: '🍉', bg: '#ffd7d1' },
  { emoji: '🦁', bg: '#fde3b8' },
  { emoji: '🌙', bg: '#dfe3fb' },
  { emoji: '🐝', bg: '#fff0b3' },
  { emoji: '🍭', bg: '#fbdaf0' },
  { emoji: '🚲', bg: '#c9ecec' },
  { emoji: '🐧', bg: '#e2e7f5' },
];
