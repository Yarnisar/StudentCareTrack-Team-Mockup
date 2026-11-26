import type { CSSProperties } from "react";
import { capacityOf } from "@/lib/exam/seating";
import { formatThaiDate } from "@/lib/format";
import type { ExamRoom, ExamSeat } from "@/lib/exam/types";

/**
 * ใบผังที่นั่งสอบ A4 แนวนอน หนึ่งหน้าต่อห้องสอบ (+ หน้ารายชื่อเรียงตามรหัสถ้าเลือก)
 * ใช้ทั้งตัวอย่างบนจอและแผ่นพิมพ์ — แสดงเลขที่นั่งกับรหัสนักเรียนเท่านั้น ห้ามมีชื่อ (ใบนี้ติดที่สาธารณะ)
 * รับเฉพาะรหัสนักเรียน ไม่รับข้อมูลชื่อเข้ามาเลย
 */

export interface SheetData {
  title: string;
  termLabel: string;
  examDate: string | null;
  examTime: string | null;
  /** ห้องสอบตามลำดับของรอบ พร้อมที่นั่งของห้องนั้น */
  rooms: { room: ExamRoom; seats: ExamSeat[] }[];
  /** วันที่พิมพ์ (ข้อความพ.ศ. จัดรูปแล้ว) */
  printedOn: string;
}

const PAGE_W = 281;
const PAGE_H = 194;
const GRID_H = 140;
const GAP = 1;

const mm = (n: number) => `calc(var(--mm) * ${n})`;

export function ExamSheets({ data, includeLookup }: { data: SheetData; includeLookup: boolean }) {
  return (
    <>
      {data.rooms.map(({ room, seats }) => (
        <RoomPage key={room.examRoomId} data={data} room={room} seats={seats} />
      ))}
      {includeLookup && <LookupPages data={data} />}
    </>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <section className="exam-page">
      <div
        style={{
          height: mm(PAGE_H),
          padding: `${mm(2)} ${mm(0)}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Header({ data, line }: { data: SheetData; line: React.ReactNode }) {
  const when = [data.examDate ? formatThaiDate(data.examDate) : null, data.examTime]
    .filter(Boolean)
    .join(" · ");
  return (
    <header style={{ height: mm(25), padding: `0 ${mm(4)}`, flexShrink: 0 }}>
      <h2 style={{ fontSize: mm(9), fontWeight: 700, lineHeight: 1.15, margin: 0 }}>{data.title}</h2>
      <p
        style={{
          fontSize: mm(5.2),
          lineHeight: 1.3,
          margin: `${mm(1.5)} 0 0`,
          display: "flex",
          flexWrap: "wrap",
          columnGap: mm(8),
        }}
      >
        {line}
        {when && <span>วัน-เวลา {when}</span>}
        <span>{data.termLabel}</span>
      </p>
    </header>
  );
}

function Footer({ left, right }: { left: string; right: string }) {
  return (
    <footer
      style={{
        marginTop: "auto",
        padding: `0 ${mm(4)}`,
        height: mm(7),
        fontSize: mm(3.8),
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        color: "#404040",
      }}
    >
      <span>{left}</span>
      <span>{right}</span>
    </footer>
  );
}

function RoomPage({ data, room, seats }: { data: SheetData; room: ExamRoom; seats: ExamSeat[] }) {
  const { rowCount: rows, colCount: cols } = room;
  const cw = Math.min((PAGE_W - 8 - GAP * (cols - 1)) / cols, 30);
  const ch = Math.min((GRID_H - GAP * (rows - 1)) / rows, 20);
  const noteFont = Math.min(3, ch * 0.28);
  const codeFont = Math.min(8, cw * 0.34, (ch - noteFont * 1.1) * 0.85);

  const byPos = new Map(seats.map((s) => [`${s.rowNo}:${s.colNo}`, s]));
  const seated = seats.filter((s) => s.studentId).length;
  const total = data.rooms.reduce((n, r) => n + r.seats.filter((s) => s.studentId).length, 0);

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${mm(cw)})`,
    gridAutoRows: mm(ch),
    gap: mm(GAP),
    justifyContent: "center",
  };

  return (
    <PageFrame>
      <Header data={data} line={<span style={{ fontWeight: 700, fontSize: mm(6.5) }}>ห้องสอบ {room.name}</span>} />
      <div
        style={{
          margin: `0 ${mm(4)} ${mm(2.5)}`,
          height: mm(8),
          background: "#262626",
          color: "#ffffff",
          borderRadius: mm(1),
          fontSize: mm(4.6),
          fontWeight: 700,
          letterSpacing: "0.04em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        หน้าห้อง / กระดาน
      </div>
      <div style={{ height: mm(GRID_H), flexShrink: 0 }}>
        <div style={gridStyle}>
          {room.layout.flatMap((cells, r) =>
            cells.map((cell, c) => {
              const key = `${r}:${c}`;
              if (cell === "aisle") return <div key={key} aria-hidden />;
              const seat = byPos.get(`${r + 1}:${c + 1}`);
              const filled = !!seat?.studentId;
              return (
                <div
                  key={key}
                  data-seat={seat?.seatNo}
                  style={{
                    border: filled ? `${mm(0.35)} solid #262626` : `${mm(0.25)} dashed #a3a3a3`,
                    borderRadius: mm(1),
                    padding: `${mm(0.4)} ${mm(0.8)}`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    overflow: "hidden",
                    color: filled ? "#111111" : "#8a8a8a",
                  }}
                >
                  <span style={{ fontSize: mm(noteFont), lineHeight: 1, color: "#525252" }}>
                    {seat?.seatNo}
                  </span>
                  <span
                    style={{
                      fontSize: mm(codeFont),
                      fontWeight: 700,
                      lineHeight: 1,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                      paddingBottom: mm(0.3),
                    }}
                  >
                    {seat?.studentId ?? ""}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
      <Footer
        left={`นั่งในห้องนี้ ${seated} / ความจุ ${capacityOf(room.layout)}${
          data.rooms.length > 1 ? ` · ทั้งรอบ ${total} คน` : ""
        }`}
        right={`พิมพ์เมื่อ ${data.printedOn}`}
      />
    </PageFrame>
  );
}

const LOOKUP_COLS = 4;
const LOOKUP_ROWS = 17;

function LookupPages({ data }: { data: SheetData }) {
  const entries = data.rooms
    .flatMap(({ room, seats }) =>
      seats
        .filter((s) => s.studentId)
        .map((s) => ({ code: s.studentId as string, room: room.name, seatNo: s.seatNo }))
    )
    .sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true }));

  const perPage = LOOKUP_COLS * LOOKUP_ROWS;
  const pages: (typeof entries)[] = [];
  for (let i = 0; i < entries.length; i += perPage) pages.push(entries.slice(i, i + perPage));
  if (pages.length === 0) pages.push([]);

  return (
    <>
      {pages.map((page, i) => (
        <PageFrame key={i}>
          <Header
            data={data}
            line={<span style={{ fontWeight: 700, fontSize: mm(6.5) }}>รายชื่อเรียงตามรหัส → ที่นั่ง</span>}
          />
          <div
            style={{
              margin: `${mm(1)} ${mm(4)} 0`,
              display: "grid",
              gridAutoFlow: "column",
              gridTemplateRows: `repeat(${LOOKUP_ROWS}, ${mm(8)})`,
              gridTemplateColumns: `repeat(${LOOKUP_COLS}, 1fr)`,
              columnGap: mm(5),
            }}
          >
            {page.map((e) => (
              <div
                key={e.code}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: mm(2.5),
                  borderBottom: `${mm(0.2)} solid #d4d4d8`,
                  fontSize: mm(4.4),
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: mm(5.2), fontVariantNumeric: "tabular-nums" }}>
                  {e.code}
                </span>
                <span aria-hidden>→</span>
                <span>
                  {e.room} · ที่ {e.seatNo}
                </span>
              </div>
            ))}
          </div>
          <Footer
            left={`หน้า ${i + 1} / ${pages.length} · ทั้งหมด ${entries.length} คน`}
            right={`พิมพ์เมื่อ ${data.printedOn}`}
          />
        </PageFrame>
      ))}
    </>
  );
}
