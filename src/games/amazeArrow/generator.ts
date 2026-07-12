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
 *
 * โหมด fill: เติมจากกลางกระดานออกไปหาขอบ (ชิ้นวางทีหลังอยู่ริมกว่า จึงยังมี
 * ทางออก) และเมื่อการสุ่มหาที่วางไม่เจอ จะสแกนไล่ทุกช่องแบบละเอียด —
 * หยุดเฉพาะเมื่อไม่เหลือที่วางจริงๆ ทำให้กระดานแน่นเกือบเต็ม
 */
export function generateBoard(cfg: ArrowModeConfig, colors: string[]): Piece[] {
  const occupied = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;
  const inBoard = (r: number, c: number) => r >= 0 && r < cfg.rows && c >= 0 && c < cfg.cols;
  const pieces: Piece[] = [];
  const placedRays: Set<string>[] = [];

  // ระยะห่างจากขอบกระดาน (ยิ่งมาก = ยิ่งอยู่ลึกกลางกระดาน)
  const depthOf = (cc: Cell) => Math.min(cc.r, cc.c, cfg.rows - 1 - cc.r, cfg.cols - 1 - cc.c);

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

  // สร้างลำตัวด้วย DFS แบบ backtracking เพื่อให้ลูกศรยาวๆ ไม่ตันกลางทาง
  // เอนไปทาง "เลี้ยว" (turnBias) เพื่อให้หักมุมหลายชั้นแบบซิกแซก
  function growBody(head: Cell, dir: Dir, targetLen: number, raySet: Set<string>, budgetMax: number): Cell[] | null {
    const cells: Cell[] = [head];
    if (targetLen === 1) return cells;
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
    const used = new Set(cells.map((cc) => key(cc.r, cc.c)));
    let budget = budgetMax;
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
      let ordered = Math.random() < cfg.turnBias ? [...turning, ...straight] : [...straight, ...turning];
      // โหมด fill: ลำตัวเดินช่องลึกก่อน (stable sort คงลำดับเลี้ยว/ตรงไว้เป็นรอง)
      // เพื่อให้งูขดอยู่ในโซนลึก ไม่เลื้อยออกไปล้อมพื้นที่ว่างเป็นโพรงปิดตาย
      if (cfg.fill) ordered = [...ordered].sort((a, b) => depthOf(b) - depthOf(a));
      for (const n of ordered) {
        cells.push(n);
        used.add(key(n.r, n.c));
        if (grow()) return true;
        cells.pop();
        used.delete(key(n.r, n.c));
      }
      return false;
    };
    return grow() ? cells : null;
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
    const cells = growBody(head, dir, targetLen, raySet, 1600);
    if (!cells) return null;

    // raysBlocked = จำนวน ray ของชิ้นก่อนหน้าที่ลำตัวชิ้นนี้เข้าไปขวาง
    let raysBlocked = 0;
    for (const rs of placedRays) {
      if (cells.some((cc) => rs.has(key(cc.r, cc.c)))) raysBlocked++;
    }
    // โหมด fill: ความลึกต้องนำเสมอ (เติมแบบหัวหอมจากในออกนอก กันโพรงปิดตาย
    // ที่วางอะไรไม่ได้อีก) — ลำดับบังคับเกิดเองเพราะชิ้นในต้องรอชิ้นนอกออกก่อน
    // โหมดปกติ: เอาการขวาง ray เป็นหลักเหมือนเดิม
    const deepest = Math.min(...cells.map(depthOf));
    const score = cfg.fill ? deepest * 10000 + raysBlocked : raysBlocked * 1000 + deepest;
    return { cells, dir, ray, score };
  }

  function commit(cand: Candidate): Piece {
    const id = pieces.length;
    cand.cells.forEach((cc) => occupied.add(key(cc.r, cc.c)));
    placedRays.push(new Set(cand.ray.map((cc) => key(cc.r, cc.c))));
    return { id, cells: cand.cells, dir: cand.dir, color: colors[id % colors.length] };
  }

  function tryPlaceRandom(targetLen: number): Piece | null {
    let best: Candidate | null = null;
    let found = 0;
    for (let attempt = 0; attempt < 300 && found < 14; attempt++) {
      const cand = buildCandidate(targetLen);
      if (!cand) continue;
      found++;
      if (!best || cand.score > best.score) best = cand;
    }
    return best ? commit(best) : null;
  }

  // สแกนไล่ทุกช่องว่าง (ลึกสุดก่อน) — ใช้เมื่อการสุ่มหาที่วางไม่เจอแล้ว
  function tryPlaceExhaustive(targetLen: number): Piece | null {
    const free: Cell[] = [];
    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        if (!occupied.has(key(r, c))) free.push({ r, c });
      }
    }
    shuffle(free);
    free.sort((a, b) => depthOf(b) - depthOf(a));
    for (const head of free) {
      for (const dir of shuffle([...DIRS])) {
        const ray = rayCells(head, dir);
        if (ray.some((cc) => occupied.has(key(cc.r, cc.c)))) continue;
        const raySet = new Set(ray.map((cc) => key(cc.r, cc.c)));
        const cells = growBody(head, dir, targetLen, raySet, 400);
        if (cells) return commit({ cells, dir, ray, score: 0 });
      }
    }
    return null;
  }

  while (pieces.length < cfg.pieces) {
    const len = cfg.snakeMin + rand(cfg.snakeMax - cfg.snakeMin + 1);
    const randomLadder = cfg.fill ? [len, 10, 7, 5, 3, 2] : [len, cfg.snakeMin, 2];
    let piece: Piece | null = null;
    for (const L of randomLadder) {
      piece = tryPlaceRandom(Math.max(2, Math.min(L, len)));
      if (piece) break;
    }
    if (!piece && cfg.fill) {
      // สุ่มไม่เจอแล้ว — สแกนละเอียดด้วยชิ้นสั้นเพื่ออุดช่องที่เหลือ
      for (const L of [6, 4, 3, 2]) {
        piece = tryPlaceExhaustive(L);
        if (piece) break;
      }
    }
    if (!piece) break; // ไม่เหลือที่วางจริงๆ
    pieces.push(piece);
  }
  return pieces;
}
