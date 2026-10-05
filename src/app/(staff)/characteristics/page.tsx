"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DcScoreEntry } from "@/components/characteristics/dc-score-entry";
import { DcSummaryPanel } from "@/components/characteristics/dc-summary-panel";
import { useStore } from "@/lib/store";

type Tab = "summary" | "entry";

export default function CharacteristicsPage() {
  const store = useStore();
  return (
    <>
      <PageHeader
        title="คุณลักษณะอันพึงประสงค์"
        subtitle={`ประเมิน 8 ด้าน · ครูประจำวิชาบันทึก ปพ.5 → ครูประจำชั้นสรุป ปพ.6 · ${store.currentTerm.label}`}
      />
      {/* เปลี่ยนผู้ใช้ (role switcher) → เริ่มสถานะของหน้าใหม่ */}
      <CharacteristicsContent key={store.currentUser.userId} />
    </>
  );
}

function CharacteristicsContent() {
  const store = useStore();
  const { myTeachings, myHomeroomRoomIds } = store;
  const roomsWithStudents = store.classrooms.filter((c) => store.studentsOfRoom(c.roomId).length > 0);
  const roomOptions = [
    ...store.classrooms.filter((c) => myHomeroomRoomIds.includes(c.roomId)),
    ...roomsWithStudents.filter((c) => !myHomeroomRoomIds.includes(c.roomId)),
  ];

  const [tab, setTab] = useState<Tab>(() =>
    myTeachings.length > 0 && myHomeroomRoomIds.length === 0 ? "entry" : "summary"
  );
  const [roomId, setRoomId] = useState(() => roomOptions[0]?.roomId ?? "");
  const [teachingId, setTeachingId] = useState(() => myTeachings[0]?.teachingId ?? "");

  const roomName = (id: string) => store.classrooms.find((c) => c.roomId === id)?.roomName ?? id;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {myTeachings.length > 0 ? (
          <div className="inline-flex rounded-lg bg-muted p-[3px]">
            {(
              [
                ["summary", "สรุปผล ปพ.6"],
                ["entry", "บันทึกคะแนนรายวิชา (ปพ.5)"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`rounded-md px-3 py-1.5 text-[13px] font-semibold ${
                  tab === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        {tab === "summary" ? (
          <label className="flex items-center gap-2 text-[13px]">
            <span className="text-muted-foreground">ห้อง</span>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-[13px]"
            >
              {roomOptions.map((c) => (
                <option key={c.roomId} value={c.roomId}>
                  {c.roomName}
                  {myHomeroomRoomIds.includes(c.roomId) ? " (ห้องที่เป็นครูประจำชั้น)" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="flex items-center gap-2 text-[13px]">
            <span className="text-muted-foreground">รายวิชา</span>
            <select
              value={teachingId}
              onChange={(e) => setTeachingId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-[13px]"
            >
              {myTeachings.map((t) => (
                <option key={t.teachingId} value={t.teachingId}>
                  {store.subjectOf(t.subjectId)?.subjectCode} {store.subjectOf(t.subjectId)?.name} · {roomName(t.roomId)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {tab === "entry" && teachingId ? (
        <DcScoreEntry key={teachingId} teachingId={teachingId} />
      ) : roomId ? (
        <DcSummaryPanel key={roomId} roomId={roomId} />
      ) : (
        <p className="py-10 text-center text-[13px] text-muted-foreground">ยังไม่มีห้องเรียนที่มีนักเรียน</p>
      )}
    </div>
  );
}
