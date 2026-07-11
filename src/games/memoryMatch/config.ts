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
  { emoji: '🐶', bg: '#ecd9c0' },
  { emoji: '🌈', bg: '#cbdeed' },
  { emoji: '⚽', bg: '#f0dfa4' },
  { emoji: '🚀', bg: '#d6cfec' },
  { emoji: '🐟', bg: '#bfdfe9' },
  { emoji: '🐱', bg: '#eccfcf' },
  { emoji: '🐦', bg: '#cfe6d2' },
  { emoji: '🎈', bg: '#ecd3e2' },
  { emoji: '🍎', bg: '#eed0d0' },
  { emoji: '🌻', bg: '#ede2b2' },
  { emoji: '🚗', bg: '#c8dcec' },
  { emoji: '🎵', bg: '#d9cfec' },
  { emoji: '🏀', bg: '#eed8c0' },
  { emoji: '🦋', bg: '#d2e4da' },
  { emoji: '🍦', bg: '#eed6de' },
  { emoji: '🎁', bg: '#cfdeec' },
  { emoji: '🐢', bg: '#d5e4c6' },
  { emoji: '🍉', bg: '#eed1cc' },
  { emoji: '🦁', bg: '#eed9b6' },
  { emoji: '🌙', bg: '#d7dbee' },
  { emoji: '🐝', bg: '#ece0b0' },
  { emoji: '🍭', bg: '#e9d2e2' },
  { emoji: '🚲', bg: '#c6dede' },
  { emoji: '🐧', bg: '#d9dee9' },
];
