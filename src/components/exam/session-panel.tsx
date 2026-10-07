"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ExamSheets, type SheetData } from "@/components/exam/seating-sheets";
import { academicTerms } from "@/lib/mock-data";
import { formatThaiDate, nowThaiIso } from "@/lib/format";
import { useStore, type ExamReassign } from "@/lib/store";
import { EXAM_METHOD_LABEL, EXAM_STATUS_LABEL, type ExamRoom } from "@/lib/types";

const noopSubscribe = () => () => {};

/** รายละเอียดรอบสอบ: จัดใหม่ เผยแพร่ ยกเลิก และตัวอย่างใบพิมพ์ (คอมโพเนนต์เดียวกับแผ่นพิมพ์) */
export function SessionPanel({ sessionId }: { sessionId: string }) {
  const store = useStore();
  const [includeLookup, setIncludeLookup] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  // พอร์ทัลสำหรับแผ่นพิมพ์ — มีเฉพาะฝั่งไคลเอนต์
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const session = store.examSessions.find((s) => s.sessionId === sessionId);
  if (!session) return null;

  const seats = store.seatsOfSession(sessionId);
  const rooms = session.examRoomIds
    .map((id) => store.examRooms.find((r) => r.examRoomId === id))
    .filter((r): r is ExamRoom => !!r);
  const studentCount = store.studentsInScope(session.studentScope).length;
  const classNames = session.studentScope
    .map((id) => store.classrooms.find((c) => c.roomId === id)?.roomName)
    .filter(Boolean)
    .join(", ");
  const term = academicTerms.find((t) => t.termId === session.termId);

  const sheet: SheetData = {
    title: session.title,
    termLabel: term?.label ?? store.currentTerm.label,
    examDate: session.examDate,
    examTime: session.examTime,
    rooms: rooms.map((room) => ({ room, seats: seats.filter((s) => s.examRoomId === room.examRoomId) })),
    printedOn: formatThaiDate(nowThaiIso()),
  };

  const voided = session.status === "voided";
  const run = (r: { ok: true } | { ok: false; error: string }) => setError(r.ok ? "" : r.error);
  const reassign = (how: ExamReassign) => run(store.reassignExamSession(sessionId, how));

  const doVoid = () => {
    const r = store.voidExamSession(sessionId, reason);
    run(r);
    if (r.ok) {
      setVoiding(false);
      setReason("");
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold">{session.title}</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {classNames} · {studentCount} คน · {EXAM_METHOD_LABEL[session.method]}
              {session.seed !== null && ` (seed ${session.seed})`}
            </p>
          </div>
          <Badge variant={session.status === "published" ? "default" : "secondary"}>
            {EXAM_STATUS_LABEL[session.status]}
          </Badge>
        </div>

        {voided ? (
          <p className="text-[13px] text-muted-foreground">เหตุผลที่ยกเลิก: {session.voidReason}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => window.print()}>
                <Printer className="size-4" /> พิมพ์แปะหน้าห้องสอบ
              </Button>
              <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                <Checkbox checked={includeLookup} onCheckedChange={(v) => setIncludeLookup(v === true)} />
                รวมรายชื่อเรียงตามรหัส
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {session.status === "draft" && (
                <Button variant="outline" size="sm" onClick={() => run(store.publishExamSession(sessionId))}>
                  เผยแพร่
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => reassign("by_code")}>
                จัดใหม่ตามรหัส
              </Button>
              {session.method === "random" && (
                <Button variant="outline" size="sm" onClick={() => reassign("same_seed")}>
                  จัดใหม่ด้วย seed เดิม
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => reassign("new_seed")}>
                สุ่มใหม่
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setVoiding((v) => !v)}>
                ยกเลิกรอบสอบ
              </Button>
            </div>
            {voiding && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label="เหตุผลที่ยกเลิก"
                  className="max-w-xs"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="เหตุผลที่ยกเลิก"
                />
                <Button variant="destructive" size="sm" onClick={doVoid}>
                  ยืนยันยกเลิก
                </Button>
              </div>
            )}
          </>
        )}

        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}

        {!voided && (
          <div className="space-y-3" data-testid="exam-preview">
            <ExamSheets data={sheet} includeLookup={includeLookup} />
          </div>
        )}
      </CardContent>

      {/* แผ่นพิมพ์: ซ่อนบนจอ ตอนพิมพ์เหลือแค่ส่วนนี้ */}
      {mounted &&
        !voided &&
        createPortal(
          <div data-print-sheet className="exam-print-root">
            <ExamSheets data={sheet} includeLookup={includeLookup} />
          </div>,
          document.body
        )}
    </Card>
  );
}
