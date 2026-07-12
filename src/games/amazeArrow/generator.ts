import type { ArrowModeConfig } from './config';

export type Dir = 'up' | 'down' | 'left' | 'right';

export const DIR_VECTORS: Record<Dir, { r: number; c: number }> = {
  up: { r: -1, c: 0 },
  down: { r: 1, c: 0 },
  left: { r: 0, c: -1 },
  right: { r: 0, c: 1 },
};

const DIRS: Dir[] = ['up', 'down', 'left', 'right'];

export interface Cell {
  r: number;
  c: number;
}

export interface Piece {
  id: number;
  cells: Cell[]; // cells[0] = หัวลูกศร, ที่เหลือคือลำตัวไล่ไปหาหาง
  dir: Dir;
  color: string;
}

function rand(n: number): number {
  return Math.floor(Math.random() * n);
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * สร้างกระดานแบบย้อนกลับ: วางชิ้นทีละชิ้นโดยบังคับว่า "เส้นทางวิ่งออก" (ray)
 * ของชิ้นใหม่ต้องไม่ทับชิ้นที่วางไว้ก่อนหน้า — ชิ้นที่วางทีหลังจะออกก่อนเสมอ
 * ดังนั้นการกดตามลำดับ id มาก→น้อย คือเฉลยที่รับประกันว่าแก้ได้
 *
 * ความยากมาจาก "ลำดับบังคับ": ในบรรดาตำแหน่งที่วางได้ เราเลือกตำแหน่งที่
 * ลำตัวไปขวาง ray ของชิ้นที่วางไว้ก่อนหน้าให้มากที่สุด ผู้เล่นจึงต้อง
 * เคลียร์ตัวที่ขวางออกก่อน ไม่ใช่กดตัวไหนก็ออกได้ทันที
 */
export function generateBoard(cfg: ArrowModeConfig, colors: string[]): Piece[] {
  const occupied = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;
  const inBoard = (r: number, c: number) => r >= 0 && r < cfg.rows && c >= 0 && c < cfg.cols;
  const pieces: Piece[] = [];
  const placedRays: Set<string>[] = [];

  function rayCells(head: Cell, dir: Dir): Cell[] {
    const v = DIR_VECTORS[dir];
    const out: Cell[] = [];
    let r = head.r + v.r;
    let c = head.c + v.c;
    while (inBoard(r, c)) {
      out.push({ r, c });
      r += v.r;
      c += v.c;
    }
    return out;
  }

  interface Candidate {
    cells: Cell[];
    dir: Dir;
    ray: Cell[];
    score: number;
  }

  function buildCandidate(targetLen: number): Candidate | null {
    const head: Cell = { r: rand(cfg.rows), c: rand(cfg.cols) };
    if (occupied.has(key(head.r, head.c))) return null;
    const dir = DIRS[rand(4)];
    const ray = rayCells(head, dir);
    if (ray.some((cc) => occupied.has(key(cc.r, cc.c)))) return null;
    const raySet = new Set(ray.map((cc) => key(cc.r, cc.c)));

    const cells: Cell[] = [head];
    if (targetLen > 1) {
      // ช่องที่สองต้องอยู่หลังหัวตรงๆ เพื่อให้ทิศหัวลูกศรตรงกับเส้น
      const v = DIR_VECTORS[dir];
      const second: Cell = { r: head.r - v.r, c: head.c - v.c };
      if (
        !inBoard(second.r, second.c) ||
        occupied.has(key(second.r, second.c)) ||
        raySet.has(key(second.r, second.c))
      ) {
        return null;
      }
      cells.push(second);
      // สร้างลำตัวด้วย DFS แบบ backtracking เพื่อให้ลูกศรยาวๆ ไม่ตันกลางทาง
      // เอนไปทาง "เลี้ยว" (turnBias) เพื่อให้หักมุมหลายชั้นแบบซิกแซก
      const used = new Set(cells.map((cc) => key(cc.r, cc.c)));
      let budget = 1600;
      const grow = (): boolean => {
        if (cells.length === targetLen) return true;
        if (budget-- <= 0) return false;
        const cur = cells[cells.length - 1];
        const prev = cells[cells.length - 2];
        const lastDir = { r: cur.r - prev.r, c: cur.c - prev.c };
        const options = DIRS.map((d) => DIR_VECTORS[d])
          .map((vv) => ({ r: cur.r + vv.r, c: cur.c + vv.c }))
          .filter(
            (n) =>
              inBoard(n.r, n.c) &&
              !occupied.has(key(n.r, n.c)) &&
              !raySet.has(key(n.r, n.c)) &&
              !used.has(key(n.r, n.c))
          );
        if (options.length === 0) return false;
        const turning = shuffle(options.filter((n) => n.r - cur.r !== lastDir.r || n.c - cur.c !== lastDir.c));
        const straight = shuffle(options.filter((n) => n.r - cur.r === lastDir.r && n.c - cur.c === lastDir.c));
        const ordered = Math.random() < cfg.turnBias ? [...turning, ...straight] : [...straight, ...turning];
        for (const n of ordered) {
          cells.push(n);
          used.add(key(n.r, n.c));
          if (grow()) return true;
          cells.pop();
          used.delete(key(n.r, n.c));
        }
        return false;
      };
      if (!grow()) return null;
    }

    // คะแนน = จำนวน ray ของชิ้นก่อนหน้า ที่ลำตัวชิ้นนี้เข้าไปขวาง
    let score = 0;
    for (const rs of placedRays) {
      if (cells.some((cc) => rs.has(key(cc.r, cc.c)))) score++;
    }
    return { cells, dir, ray, score };
  }

  function tryPlace(id: number, targetLen: number): Piece | null {
    let best: Candidate | null = null;
    let found = 0;
    for (let attempt = 0; attempt < 300 && found < 14; attempt++) {
      const cand = buildCandidate(targetLen);
      if (!cand) continue;
      found++;
      if (!best || cand.score > best.score) best = cand;
    }
    if (!best) return null;
    best.cells.forEach((cc) => occupied.add(key(cc.r, cc.c)));
    placedRays.push(new Set(best.ray.map((cc) => key(cc.r, cc.c))));
    return { id, cells: best.cells, dir: best.dir, color: colors[id % colors.length] };
  }

  // โหมด fill: วางไปเรื่อยๆ จนกระดานแน่น (ล้มเหลวติดกันหลายครั้งค่อยหยุด)
  // ลูกศรช่วงแรกจะยาวเต็มสเปก พอกระดานแน่นค่อยไล่ลดความยาวลง (ต่ำสุด 2)
  const failLimit = cfg.fill ? 40 : 1;
  let failStreak = 0;
  while (pieces.length < cfg.pieces && failStreak < failLimit) {
    const len = cfg.snakeMin + rand(cfg.snakeMax - cfg.snakeMin + 1);
    const ladder = cfg.fill ? [len, 10, 7, 5, 3, 2] : [len, cfg.snakeMin, 2];
    let piece: Piece | null = null;
    for (const L of ladder) {
      piece = tryPlace(pieces.length, Math.max(2, Math.min(L, len)));
      if (piece) break;
    }
    if (piece) {
      pieces.push(piece);
      failStreak = 0;
    } else {
      failStreak++;
    }
  }
  return pieces;
}
