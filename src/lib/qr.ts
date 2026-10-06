/**
 * ตัวสร้าง QR Code ขนาดเล็ก (ไม่ใช้ไลบรารีภายนอก)
 *
 * รองรับเท่าที่โมดูลบัตรนักเรียนต้องใช้: โหมด byte (ISO-8859-1/UTF-8), ระดับแก้ความผิดพลาด M,
 * เวอร์ชัน 1–10 (เลือกเวอร์ชันเล็กที่สุดที่ใส่ข้อมูลได้) ตามมาตรฐาน ISO/IEC 18004
 *
 * ใช้กับรหัส QR ของบัตร (id_cards.qr_code) ซึ่งเป็นรหัสอ้างอิงแบบสุ่ม ความยาว ~25 ตัวอักษร
 * จึงได้ QR เวอร์ชัน 2 (25×25 โมดูล) — อ่านง่ายแม้พิมพ์ลงบัตร CR80
 */

/** ผลลัพธ์: ตารางโมดูล true = ช่องทึบ */
export interface QrMatrix {
  /** จำนวนโมดูลต่อด้าน */
  size: number;
  modules: boolean[][];
}

/** เวอร์ชันที่รองรับ: [จำนวน EC codeword ต่อบล็อก, บล็อก [จำนวนบล็อก, data codeword ต่อบล็อก][]] */
const VERSIONS: Record<number, { ecPerBlock: number; blocks: [number, number][] }> = {
  1: { ecPerBlock: 10, blocks: [[1, 16]] },
  2: { ecPerBlock: 16, blocks: [[1, 28]] },
  3: { ecPerBlock: 26, blocks: [[1, 44]] },
  4: { ecPerBlock: 18, blocks: [[2, 32]] },
  5: { ecPerBlock: 24, blocks: [[2, 43]] },
  6: { ecPerBlock: 16, blocks: [[4, 27]] },
  7: { ecPerBlock: 18, blocks: [[4, 31]] },
  8: {
    ecPerBlock: 22,
    blocks: [
      [2, 38],
      [2, 39],
    ],
  },
  9: {
    ecPerBlock: 22,
    blocks: [
      [3, 36],
      [2, 37],
    ],
  },
  10: {
    ecPerBlock: 26,
    blocks: [
      [4, 43],
      [1, 44],
    ],
  },
};

/** จุดศูนย์กลางของ alignment pattern ในแต่ละเวอร์ชัน */
const ALIGNMENT_CENTERS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

const MAX_VERSION = 10;
/** ระดับแก้ความผิดพลาด M = 00 ในข้อมูลรูปแบบ (format information) */
const EC_LEVEL_BITS = 0b00;

const dataCodewordsOf = (version: number) =>
  VERSIONS[version].blocks.reduce((sum, [count, size]) => sum + count * size, 0);

/* ---------- เลขคณิตบนฟิลด์ GF(256) สำหรับรหัส Reed–Solomon ---------- */

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
}

const gfMul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]);

/** พหุนามกำเนิดของรหัส Reed–Solomon ที่ให้ EC codeword จำนวน n ตัว */
function generatorPoly(n: number): number[] {
  let poly = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function errorCorrectionCodewords(data: number[], n: number): number[] {
  const gen = generatorPoly(n);
  const buf = [...data, ...new Array<number>(n).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = buf[i];
    if (coef === 0) continue;
    for (let j = 0; j < gen.length; j++) buf[i + j] ^= gfMul(gen[j], coef);
  }
  return buf.slice(data.length);
}

/* ---------- เข้ารหัสข้อมูล ---------- */

function toBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

function pickVersion(byteLength: number): number {
  for (let v = 1; v <= MAX_VERSION; v++) {
    const headerBits = 4 + (v < 10 ? 8 : 16);
    if (byteLength * 8 + headerBits <= dataCodewordsOf(v) * 8) return v;
  }
  throw new Error("ข้อความยาวเกินกว่าที่ตัวสร้าง QR นี้รองรับ");
}

function dataCodewords(bytes: number[], version: number): number[] {
  const total = dataCodewordsOf(version);
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };

  push(0b0100, 4); // โหมด byte
  push(bytes.length, version < 10 ? 8 : 16);
  bytes.forEach((b) => push(b, 8));

  const capacity = total * 8;
  for (let i = 0; i < 4 && bits.length < capacity; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    codewords.push(byte);
  }
  const padding = [0xec, 0x11];
  while (codewords.length < total) codewords.push(padding[(codewords.length - bits.length / 8) % 2]);
  return codewords;
}

/** แบ่งเป็นบล็อก คำนวณ EC แล้วสลับลำดับ (interleave) ตามมาตรฐาน */
function finalCodewords(bytes: number[], version: number): number[] {
  const { ecPerBlock, blocks } = VERSIONS[version];
  const all = dataCodewords(bytes, version);

  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (const [count, size] of blocks) {
    for (let i = 0; i < count; i++) {
      const block = all.slice(offset, offset + size);
      offset += size;
      dataBlocks.push(block);
      ecBlocks.push(errorCorrectionCodewords(block, ecPerBlock));
    }
  }

  const result: number[] = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxData; i++)
    for (const block of dataBlocks) if (i < block.length) result.push(block[i]);
  for (let i = 0; i < ecPerBlock; i++) for (const block of ecBlocks) result.push(block[i]);
  return result;
}

/* ---------- วางโมดูลลงตาราง ---------- */

type Grid = { modules: boolean[][]; reserved: boolean[][]; size: number };

function emptyGrid(size: number): Grid {
  return {
    size,
    modules: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
    reserved: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
  };
}

function setModule(grid: Grid, row: number, col: number, dark: boolean, reserve = true) {
  grid.modules[row][col] = dark;
  if (reserve) grid.reserved[row][col] = true;
}

function placeFinder(grid: Grid, row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || rr >= grid.size || cc < 0 || cc >= grid.size) continue;
      const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      setModule(grid, rr, cc, inRing || inCore);
    }
  }
}

function placeFunctionPatterns(version: number): Grid {
  const size = 17 + 4 * version;
  const grid = emptyGrid(size);

  placeFinder(grid, 0, 0);
  placeFinder(grid, 0, size - 7);
  placeFinder(grid, size - 7, 0);

  // timing pattern
  for (let i = 8; i < size - 8; i++) {
    setModule(grid, 6, i, i % 2 === 0);
    setModule(grid, i, 6, i % 2 === 0);
  }

  // alignment patterns (ข้ามตำแหน่งที่ทับ finder pattern)
  const centers = ALIGNMENT_CENTERS[version];
  for (const r of centers) {
    for (const c of centers) {
      const nearFinder =
        (r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6);
      if (nearFinder) continue;
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++)
          setModule(grid, r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }
  }

  // โมดูลสีเข้มตายตัว
  setModule(grid, size - 8, 8, true);

  // พื้นที่ข้อมูลรูปแบบ (format information) — จองไว้ก่อน เขียนค่าหลังเลือก mask
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setModule(grid, 8, i, false);
      setModule(grid, i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setModule(grid, 8, size - 1 - i, false);
    if (size - 1 - i !== size - 8) setModule(grid, size - 1 - i, 8, false);
  }

  // พื้นที่ข้อมูลเวอร์ชัน (เวอร์ชัน 7 ขึ้นไป)
  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const a = Math.floor(i / 3);
      const b = (i % 3) + size - 11;
      setModule(grid, b, a, false);
      setModule(grid, a, b, false);
    }
  }

  return grid;
}

function placeData(grid: Grid, codewords: number[]) {
  const bits: number[] = [];
  codewords.forEach((cw) => {
    for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
  });

  let index = 0;
  let upward = true;
  for (let right = grid.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < grid.size; v++) {
      const row = upward ? grid.size - 1 - v : v;
      for (let c = 0; c < 2; c++) {
        const col = right - c;
        if (grid.reserved[row][col]) continue;
        grid.modules[row][col] = index < bits.length ? bits[index++] === 1 : false;
      }
    }
    upward = !upward;
  }
}

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function formatBits(mask: number): number {
  const data = (EC_LEVEL_BITS << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ (((rem >> 9) & 1) * 0x537);
  return (((data << 10) | rem) ^ 0x5412) & 0x7fff;
}

function versionBits(version: number): number {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ (((rem >> 11) & 1) * 0x1f25);
  return (version << 12) | rem;
}

function applyMaskAndInfo(base: Grid, version: number, mask: number): boolean[][] {
  const size = base.size;
  const modules = base.modules.map((row) => [...row]);

  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!base.reserved[r][c] && MASKS[mask](r, c)) modules[r][c] = !modules[r][c];

  const format = formatBits(mask);
  const bit = (i: number) => ((format >> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) modules[i][8] = bit(i);
  modules[7][8] = bit(6);
  modules[8][8] = bit(7);
  modules[8][7] = bit(8);
  for (let i = 9; i <= 14; i++) modules[8][14 - i] = bit(i);
  for (let i = 0; i <= 7; i++) modules[8][size - 1 - i] = bit(i);
  for (let i = 8; i <= 14; i++) modules[size - 15 + i][8] = bit(i);
  modules[size - 8][8] = true;

  if (version >= 7) {
    const vb = versionBits(version);
    for (let i = 0; i < 18; i++) {
      const value = ((vb >> i) & 1) === 1;
      const a = Math.floor(i / 3);
      const b = (i % 3) + size - 11;
      modules[b][a] = value;
      modules[a][b] = value;
    }
  }

  return modules;
}

/** คะแนนโทษ 4 ข้อตามมาตรฐาน — เลือก mask ที่คะแนนต่ำสุด */
function penalty(modules: boolean[][]): number {
  const size = modules.length;
  let score = 0;

  const runScore = (line: boolean[]) => {
    let total = 0;
    let run = 1;
    for (let i = 1; i < size; i++) {
      if (line[i] === line[i - 1]) {
        run++;
      } else {
        if (run >= 5) total += 3 + (run - 5);
        run = 1;
      }
    }
    if (run >= 5) total += 3 + (run - 5);
    return total;
  };

  const FINDER_LIKE = [true, false, true, true, true, false, true, false, false, false, false];
  const hasPattern = (line: boolean[], at: number, reversed: boolean) => {
    for (let i = 0; i < FINDER_LIKE.length; i++) {
      const expected = FINDER_LIKE[reversed ? FINDER_LIKE.length - 1 - i : i];
      if (line[at + i] !== expected) return false;
    }
    return true;
  };

  for (let r = 0; r < size; r++) {
    const row = modules[r];
    const col = modules.map((line) => line[r]);
    score += runScore(row) + runScore(col);
    for (let i = 0; i + FINDER_LIKE.length <= size; i++) {
      if (hasPattern(row, i, false) || hasPattern(row, i, true)) score += 40;
      if (hasPattern(col, i, false) || hasPattern(col, i, true)) score += 40;
    }
  }

  for (let r = 0; r < size - 1; r++)
    for (let c = 0; c < size - 1; c++) {
      const v = modules[r][c];
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) score += 3;
    }

  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (modules[r][c]) dark++;
  const percent = (dark * 100) / (size * size);
  score += 10 * Math.floor(Math.abs(percent - 50) / 5);

  return score;
}

/** สร้างตารางโมดูลของ QR สำหรับข้อความ (ระดับแก้ความผิดพลาด M) */
export function encodeQr(text: string): QrMatrix {
  const bytes = toBytes(text);
  const version = pickVersion(bytes.length);
  const codewords = finalCodewords(bytes, version);

  const base = placeFunctionPatterns(version);
  placeData(base, codewords);

  let best: boolean[][] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let mask = 0; mask < 8; mask++) {
    const candidate = applyMaskAndInfo(base, version, mask);
    const score = penalty(candidate);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return { size: base.size, modules: best! };
}

/**
 * path data ของ SVG (1 หน่วย = 1 โมดูล) — ใช้คู่กับ viewBox ที่รวมขอบเงียบ (quiet zone)
 * @param quietZone จำนวนโมดูลของขอบเงียบ (มาตรฐานคือ 4)
 */
export function qrSvgPath(matrix: QrMatrix, quietZone = 4): string {
  const parts: string[] = [];
  for (let r = 0; r < matrix.size; r++) {
    let c = 0;
    while (c < matrix.size) {
      if (!matrix.modules[r][c]) {
        c++;
        continue;
      }
      let run = 1;
      while (c + run < matrix.size && matrix.modules[r][c + run]) run++;
      parts.push(`M${c + quietZone} ${r + quietZone}h${run}v1h-${run}z`);
      c += run;
    }
  }
  return parts.join("");
}

/** ขนาด viewBox ที่ต้องใช้กับ qrSvgPath */
export const qrViewBoxSize = (matrix: QrMatrix, quietZone = 4) => matrix.size + quietZone * 2;
