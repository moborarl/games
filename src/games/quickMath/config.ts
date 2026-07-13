import type { GameMode } from '../../lib/modes';

export type InputKind = 'choice' | 'keypad';

export interface QuickMathModeConfig {
  mode: GameMode;
  label: string;
  subtitle: string;
  emoji: string;
  questions: number;
  input: InputKind;
}

export const QUICK_MATH_CONFIGS: Record<GameMode, QuickMathModeConfig> = {
  easy: {
    mode: 'easy',
    label: 'ง่าย',
    subtitle: 'สำหรับเด็ก 8 ขวบ',
    emoji: '🐣',
    questions: 10,
    input: 'choice',
  },
  medium: {
    mode: 'medium',
    label: 'ปานกลาง',
    subtitle: 'สำหรับเด็ก 13 ขวบ',
    emoji: '🦊',
    questions: 12,
    input: 'keypad',
  },
  hard: {
    mode: 'hard',
    label: 'ยาก',
    subtitle: 'สำหรับผู้ใหญ่',
    emoji: '🐉',
    questions: 12,
    input: 'keypad',
  },
};

export const QUICK_MATH_ORDER: GameMode[] = ['easy', 'medium', 'hard'];

export interface Question {
  text: string;
  answer: number;
  choices?: number[]; // เฉพาะโหมด choice (ง่าย)
}

function ri(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = ri(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// สร้างตัวเลือก 4 ตัว (คำตอบถูก + ตัวลวงใกล้เคียง 3 ตัว)
function withChoices(text: string, answer: number): Question {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < 4 && guard++ < 50) {
    const delta = ri(1, 6) * (Math.random() < 0.5 ? -1 : 1);
    const d = answer + delta;
    if (d >= 0) set.add(d);
  }
  while (set.size < 4) set.add(answer + set.size); // กันกรณีเลขน้อยมาก
  return { text, answer, choices: shuffle([...set]) };
}

function genEasy(): Question {
  if (Math.random() < 0.5) {
    const a = ri(1, 20);
    const b = ri(1, 20);
    return withChoices(`${a} + ${b}`, a + b);
  }
  const a = ri(2, 20);
  const b = ri(1, a);
  return withChoices(`${a} − ${b}`, a - b);
}

function genMedium(): Question {
  const r = Math.random();
  if (r < 0.45) {
    const a = ri(2, 12);
    const b = ri(2, 12);
    return { text: `${a} × ${b}`, answer: a * b };
  }
  if (r < 0.8) {
    const b = ri(2, 12);
    const c = ri(2, 12);
    return { text: `${b * c} ÷ ${b}`, answer: c };
  }
  // เศษส่วนง่ายๆ: ครึ่ง/หนึ่งในสี่ ของจำนวนที่หารลงตัว
  if (Math.random() < 0.5) {
    const c = ri(3, 30);
    return { text: `½ ของ ${c * 2}`, answer: c };
  }
  const c = ri(2, 15);
  return { text: `¼ ของ ${c * 4}`, answer: c };
}

function genHard(): Question {
  const kind = ri(0, 2);
  if (kind === 0) {
    const a = ri(6, 19);
    const b = ri(3, 9);
    const prod = a * b;
    const c = ri(10, Math.max(11, prod - 1));
    return { text: `(${a} × ${b}) − ${c}`, answer: prod - c };
  }
  if (kind === 1) {
    const a = ri(6, 19);
    const b = ri(3, 9);
    const c = ri(10, 80);
    return { text: `(${a} × ${b}) + ${c}`, answer: a * b + c };
  }
  const a = ri(4, 12);
  const b = ri(3, 9);
  const c = ri(2, 9);
  const d = ri(2, 9);
  if (a * b >= c * d) return { text: `(${a} × ${b}) − (${c} × ${d})`, answer: a * b - c * d };
  return { text: `(${c} × ${d}) − (${a} × ${b})`, answer: c * d - a * b };
}

const GENERATORS: Record<GameMode, () => Question> = {
  easy: genEasy,
  medium: genMedium,
  hard: genHard,
};

export function buildQuestions(mode: GameMode, count: number): Question[] {
  const gen = GENERATORS[mode];
  const out: Question[] = [];
  let lastText = '';
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    const q = gen();
    if (q.text === lastText) continue; // เลี่ยงโจทย์ซ้ำติดกัน
    lastText = q.text;
    out.push(q);
  }
  return out;
}
