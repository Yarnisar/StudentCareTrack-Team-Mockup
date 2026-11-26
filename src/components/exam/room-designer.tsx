"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { blankLayout, capacityOf, resizeLayout, seatNumbers } from "@/lib/exam/seating";
import { useExam } from "@/lib/exam/store";
import { EXAM_MAX_SIDE, type ExamCell, type ExamRoom } from "@/lib/exam/types";

const clampSide = (n: number) => Math.min(EXAM_MAX_SIDE, Math.max(1, n));

/** ออกแบบผังโต๊ะของห้องสอบ: ตาราง แถว × คอลัมน์ คลิกช่องเพื่อสลับโต๊ะ/ทางเดิน */
export function RoomDesigner({
  room,
  onDone,
}: {
  room?: ExamRoom;
  onDone: () => void;
}) {
  const store = useExam();
  const [name, setName] = useState(room?.name ?? "");
  const [rowsText, setRowsText] = useState(String(room?.rowCount ?? 5));
  const [colsText, setColsText] = useState(String(room?.colCount ?? 6));
  const [layout, setLayout] = useState<ExamCell[][]>(() => room?.layout ?? blankLayout(5, 6));
  const [cursor, setCursor] = useState({ r: 0, c: 0 });
  const [error, setError] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  const rows = layout.length;
  const cols = layout[0]?.length ?? 0;
  const numbers = seatNumbers(layout);
  const capacity = capacityOf(layout);

  const resize = (nextRows: string, nextCols: string) => {
    setRowsText(nextRows);
    setColsText(nextCols);
    const r = parseInt(nextRows, 10);
    const c = parseInt(nextCols, 10);
    if (Number.isNaN(r) || Number.isNaN(c)) return;
    const rr = clampSide(r);
    const cc = clampSide(c);
    setLayout((prev) => resizeLayout(prev, rr, cc));
    setCursor((cur) => ({ r: Math.min(cur.r, rr - 1), c: Math.min(cur.c, cc - 1) }));
  };

  const toggle = (r: number, c: number) =>
    setLayout((prev) =>
      prev.map((row, ri) =>
        ri === r ? row.map((cell, ci): ExamCell => (ci === c ? (cell === "desk" ? "aisle" : "desk") : cell)) : row
      )
    );

  const moveTo = (r: number, c: number) => {
    setCursor({ r, c });
    gridRef.current?.querySelector<HTMLElement>(`[data-cell="${r}:${c}"]`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, r: number, c: number) => {
    const next: Record<string, [number, number]> = {
      ArrowUp: [Math.max(0, r - 1), c],
      ArrowDown: [Math.min(rows - 1, r + 1), c],
      ArrowLeft: [r, Math.max(0, c - 1)],
      ArrowRight: [r, Math.min(cols - 1, c + 1)],
      Home: [r, 0],
      End: [r, cols - 1],
    };
    const target = next[e.key];
    if (!target) return;
    e.preventDefault();
    moveTo(target[0], target[1]);
  };

  const save = () => {
    const result = store.saveExamRoom({ name, layout }, room?.examRoomId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone();
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h2 className="text-[15px] font-bold">{room ? "แก้ไขห้องสอบ" : "เพิ่มห้องสอบ"}</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            คลิกช่อง หรือใช้ลูกศรแล้วกด Space เพื่อสลับโต๊ะ / ทางเดิน
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_6rem_6rem]">
          <div className="space-y-1.5">
            <Label htmlFor="room-name" className="text-[13px]">
              ชื่อห้องสอบ
            </Label>
            <Input id="room-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ห้องประชุม 1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="room-rows" className="text-[13px]">
              แถว
            </Label>
            <Input
              id="room-rows"
              type="number"
              min={1}
              max={EXAM_MAX_SIDE}
              value={rowsText}
              onChange={(e) => resize(e.target.value, colsText)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="room-cols" className="text-[13px]">
              คอลัมน์
            </Label>
            <Input
              id="room-cols"
              type="number"
              min={1}
              max={EXAM_MAX_SIDE}
              value={colsText}
              onChange={(e) => resize(rowsText, e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <span className="font-bold" aria-live="polite">
              ความจุ {capacity} ที่นั่ง
            </span>
            <span className="text-[12px] text-muted-foreground">
              {rows} × {cols}
            </span>
          </div>
          <div className="overflow-x-auto">
            <div style={{ minWidth: Math.max(20, cols * 34) + "px" }}>
              <div className="mb-1.5 rounded-md bg-foreground/85 py-1 text-center text-[12px] font-bold tracking-wide text-background">
                หน้าห้อง / กระดาน
              </div>
              <div
                ref={gridRef}
                role="group"
                aria-label="ผังโต๊ะ"
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {layout.flatMap((row, r) =>
                  row.map((cell, c) => {
                    const desk = cell === "desk";
                    return (
                      <button
                        key={`${r}:${c}`}
                        type="button"
                        data-cell={`${r}:${c}`}
                        aria-pressed={desk}
                        aria-label={`แถว ${r + 1} คอลัมน์ ${c + 1} ${desk ? `โต๊ะ ที่นั่ง ${numbers[r][c]}` : "ทางเดิน"}`}
                        tabIndex={cursor.r === r && cursor.c === c ? 0 : -1}
                        onFocus={() => setCursor({ r, c })}
                        onClick={() => toggle(r, c)}
                        onKeyDown={(e) => onKeyDown(e, r, c)}
                        className={cn(
                          "flex h-8 min-w-0 items-center justify-center rounded-md border text-[11px] font-bold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          desk
                            ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                            : "border-dashed border-border bg-transparent text-transparent hover:bg-muted"
                        )}
                      >
                        {desk ? numbers[r][c] : "·"}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={save}>บันทึกห้องสอบ</Button>
          <Button variant="outline" onClick={onDone}>
            ยกเลิก
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
