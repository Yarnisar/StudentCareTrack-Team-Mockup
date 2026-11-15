"use client";

/**
 * ช่องค้นหานักเรียนที่หัวทุกหน้า: พิมพ์แล้วผลขึ้นใต้ช่อง
 * - รหัส ชื่อ หรือห้อง-เลขที่ ("3/1-12") · รหัสครบแล้วกด Enter ไปทันที · เครื่องอ่านบัตรพิมพ์รหัสบัตรแทนได้
 * - ค้นเฉพาะนักเรียนในขอบเขตสิทธิ์ตามการมอบหมาย รหัสที่อยู่นอกขอบเขตบอกเหตุผล
 * - ปลายทาง: ห้องที่เป็นครูประจำชั้น → หน้าข้อมูลนักเรียน, ห้องที่สอน → บันทึกพฤติกรรม,
 *   ผู้ดูแลระบบ → งานจัดทำบัตร (ผู้ดูแลระบบไม่เข้าหน้าข้อมูลรายคน 3.4.1)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { DEMO_TODAY } from "@/lib/mock-data";
import { canViewStudent, recordableRooms } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { searchStudents } from "@/lib/student-search";
import type { Student } from "@/lib/types";

const MAX = 8;

export function GlobalSearch() {
  const store = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // บทบาทที่ไม่มีนักเรียนให้ค้น ไม่แสดงช่องค้นหา
  if (store.role !== "admin" && recordableRooms(store.role).length === 0) return null;

  return (
    <>
      <div className="hidden lg:block">
        <SearchBox />
      </div>
      <button
        type="button"
        aria-label="ค้นหานักเรียน"
        onClick={() => setMobileOpen(true)}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
      >
        <Search className="size-5" />
      </button>
      {mobileOpen && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center gap-2 border-b border-border bg-card p-3 lg:hidden">
          <div className="flex-1">
            <SearchBox autoFocus onDone={() => setMobileOpen(false)} />
          </div>
          <button type="button" aria-label="ปิด" onClick={() => setMobileOpen(false)} className="rounded-md p-2 text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>
      )}
    </>
  );
}

function SearchBox({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const store = useStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);

  const isAdmin = store.role === "admin";
  // ผู้ดูแลระบบค้นในรายชื่อเดียวกับหน้าบัตร ครูค้นตามห้องที่ได้รับมอบหมาย
  const pool = isAdmin ? store.students : store.recordableStudents;
  const q = query.trim();
  const result = searchStudents(q, pool, store.studentCards, DEMO_TODAY);
  const list = result.students.slice(0, MAX);
  const outside =
    !result.note && list.length === 0 && /^\d{5}$/.test(q) ? store.directory.find((s) => s.studentId === q) : undefined;

  const hrefOf = (s: Student) =>
    isAdmin
      ? `/cards?student=${s.studentId}`
      : canViewStudent(store.role, s.roomName)
        ? `/students/${s.studentId}`
        : `/behavior?record=${s.studentId}`;

  const go = (s: Student) => {
    setQuery("");
    onDone?.();
    router.push(hrefOf(s));
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, list.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && list[active]) go(list[active]);
          else if (e.key === "Escape") setQuery("");
        }}
        placeholder="ค้นหานักเรียน..."
        aria-label="ค้นหานักเรียน ด้วยรหัส ชื่อ หรือห้อง-เลขที่"
        className="h-10 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-[13.5px] outline-none focus:border-primary lg:w-56"
      />
      {focused && q !== "" && (
        <div className="absolute top-full right-0 z-50 mt-1 w-full min-w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg lg:w-80">
          {list.map((s, i) => (
            <button
              key={s.studentId}
              type="button"
              // กดก่อน blur เพื่อไม่ให้รายการหายก่อนเลือก
              onMouseDown={(e) => {
                e.preventDefault();
                go(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === active ? "bg-accent" : ""}`}
            >
              <span className="w-12 shrink-0 text-[12.5px] text-muted-foreground tabular-nums">{s.studentId}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold">{s.fullName}</span>
                <span className="block text-[11.5px] text-muted-foreground">
                  {s.roomName} เลขที่ {s.classNo}
                </span>
              </span>
            </button>
          ))}
          {list.length === 0 && (
            <p className="px-3 py-3 text-[12.5px] text-muted-foreground">
              {result.note ?? (outside ? `${outside.fullName} (${outside.roomName}) ไม่อยู่ในห้องที่คุณรับผิดชอบ` : "ไม่พบนักเรียน")}
            </p>
          )}
          {result.students.length > MAX && (
            <p className="border-t border-border px-3 py-1.5 text-[11.5px] text-muted-foreground">
              อีก {result.students.length - MAX} คน พิมพ์เพิ่มเพื่อให้แคบลง
            </p>
          )}
        </div>
      )}
    </div>
  );
}
