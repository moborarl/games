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

/**
 * สร้างกระดานแบบย้อนกลับ: วางชิ้นทีละชิ้นโดยบังคับว่า "เส้นทางวิ่งออก" (ray)
 * ของชิ้นใหม่ต้องไม่ทับชิ้นที่วางไว้ก่อนหน้า — ชิ้นที่วางทีหลังจะออกก่อนเสมอ
 * ดังนั้นการกดตามลำดับ id มาก→น้อย คือเฉลยที่รับประกันว่าแก้ได้
 */
export function generateBoard(cfg: ArrowModeConfig, colors: string[]): Piece[] {
  const occupied = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;
  const inBoard = (r: number, c: number) => r >= 0 && r < cfg.rows && c >= 0 && c < cfg.cols;
  const pieces: Piece[] = [];

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

  function tryPlace(id: number, targetLen: number): Piece | null {
    for (let attempt = 0; attempt < 220; attempt++) {
      const head: Cell = { r: rand(cfg.rows), c: rand(cfg.cols) };
      if (occupied.has(key(head.r, head.c))) continue;
      const dir = DIRS[rand(4)];
      const ray = rayCells(head, dir);
      if (ray.some((cc) => occupied.has(key(cc.r, cc.c)))) continue;
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
          continue;
        }
        cells.push(second);
        let ok = true;
        while (cells.length < targetLen) {
          const cur = cells[cells.length - 1];
          const options = DIRS.map((d) => DIR_VECTORS[d])
            .map((vv) => ({ r: cur.r + vv.r, c: cur.c + vv.c }))
            .filter(
              (n) =>
                inBoard(n.r, n.c) &&
                !occupied.has(key(n.r, n.c)) &&
                !raySet.has(key(n.r, n.c)) &&
                !cells.some((cc) => cc.r === n.r && cc.c === n.c)
            );
          if (options.length === 0) {
            ok = false;
            break;
          }
          cells.push(options[rand(options.length)]);
        }
        if (!ok) continue;
      }

      cells.forEach((cc) => occupied.add(key(cc.r, cc.c)));
      return { id, cells, dir, color: colors[id % colors.length] };
    }
    return null;
  }

  for (let i = 0; i < cfg.pieces; i++) {
    const wantSnake = Math.random() < cfg.snakeRatio;
    const len = wantSnake ? cfg.snakeMin + rand(cfg.snakeMax - cfg.snakeMin + 1) : 1;
    let piece = tryPlace(i, len);
    if (!piece && len > 1) piece = tryPlace(i, 1);
    if (!piece) break; // กระดานแน่นเกินไป — จบด้วยจำนวนเท่าที่วางได้
    pieces.push(piece);
  }
  return pieces;
}
