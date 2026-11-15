/**
 * ภาพ QR จำลองจากรหัสบัตร (UC14) — รูปแบบคงที่ต่อรหัส จึงเห็นว่าบัตรแต่ละใบไม่ซ้ำกัน
 * PROTOTYPE: ไม่ใช่ QR ที่สแกนได้จริง Project 2 ใช้ไลบรารีสร้าง QR จากรหัสบัตร
 */

const N = 21;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** จุดหาตำแหน่ง 3 มุมแบบ QR จริง */
function inFinder(x: number, y: number): boolean | null {
  for (const [ox, oy] of [
    [0, 0],
    [N - 7, 0],
    [0, N - 7],
  ]) {
    const dx = x - ox;
    const dy = y - oy;
    if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) {
      const edge = dx === 0 || dx === 6 || dy === 0 || dy === 6;
      const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
      return edge || core;
    }
    if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) return false;
  }
  return null;
}

export function PseudoQr({ code, size = 160 }: { code: string; size?: number }) {
  let seed = hash(code);
  const cells: [number, number][] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const finder = inFinder(x, y);
      seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0;
      const on = finder ?? (seed & 1) === 1;
      if (on) cells.push([x, y]);
    }
  return (
    <svg width={size} height={size} viewBox={`-1 -1 ${N + 2} ${N + 2}`} role="img" aria-label={`QR ของบัตร ${code}`} className="bg-white">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  );
}
