"use client";

import { useState } from "react";
import { cn } from "cn";
import { PageHeader } from "@/components/layout/page-header";
import { RoomDesigner } from "@/components/exam/room-designer";
import { SessionForm } from "@/components/exam/session-form";
import { SessionPanel } from "@/components/exam/session-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { capacityOf } from "@/lib/exam-seating";
import { formatThaiDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { EXAM_STATUS_LABEL } from "@/lib/types";
import "@/components/exam/print.css";

/** จัดห้องสอบ (ADR-0004) — ผู้ดูแลระบบออกแบบโต๊ะ จัดที่นั่ง และพิมพ์แปะหน้าห้อง (กันสิทธิ์ใน lib/navigation.ts + RoleGate) */
export default function ExamRoomsPage() {
  return (
    <>
      <PageHeader title="จัดห้องสอบ" subtitle="ออกแบบโต๊ะ จัดที่นั่ง พิมพ์แปะหน้าห้อง" />
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <Tabs defaultValue="sessions" className="flex-col">
          <TabsList className="mb-3">
            <TabsTrigger value="sessions" className="px-4">
              รอบสอบ
            </TabsTrigger>
            <TabsTrigger value="rooms" className="px-4">
              ห้องสอบ
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sessions">
            <SessionsTab />
          </TabsContent>
          <TabsContent value="rooms">
            <RoomsTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function SessionsTab() {
  const store = useStore();
  const [picked, setPicked] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const sessions = store.examSessions;
  const selectedId = picked ?? sessions.find((s) => s.status !== "voided")?.sessionId ?? sessions[0]?.sessionId;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {sessions.map((s) => (
          <button
            key={s.sessionId}
            type="button"
            onClick={() => {
              setPicked(s.sessionId);
              setCreating(false);
            }}
            aria-pressed={!creating && s.sessionId === selectedId}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !creating && s.sessionId === selectedId ? "border-primary bg-primary/5" : "border-border bg-card"
            )}
          >
            <span className="block font-bold">{s.title}</span>
            <span className="block text-[12px] text-muted-foreground">
              {s.examDate ? formatThaiDate(s.examDate) : "ไม่ระบุวัน"} · {EXAM_STATUS_LABEL[s.status]}
            </span>
          </button>
        ))}
        <Button variant={creating ? "outline" : "default"} onClick={() => setCreating((v) => !v)}>
          สร้างรอบสอบ
        </Button>
      </div>

      {creating ? (
        <SessionForm
          onCreated={(id) => {
            setPicked(id);
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      ) : selectedId ? (
        <SessionPanel key={selectedId} sessionId={selectedId} />
      ) : (
        <Card>
          <CardContent className="p-6 text-[13px] text-muted-foreground">ยังไม่มีรอบสอบ</CardContent>
        </Card>
      )}
    </div>
  );
}

function RoomsTab() {
  const store = useStore();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [error, setError] = useState("");

  return (
    <div className="space-y-5">
      {editing ? (
        <RoomDesigner
          key={editing}
          room={editing === "new" ? undefined : store.examRooms.find((r) => r.examRoomId === editing)}
          onDone={() => setEditing(null)}
        />
      ) : (
        <>
          <Button onClick={() => setEditing("new")}>เพิ่มห้องสอบ</Button>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {store.examRooms.map((r) => (
                <div
                  key={r.examRoomId}
                  className={cn("flex flex-wrap items-center justify-between gap-3 px-6 py-4", !r.isActive && "opacity-60")}
                >
                  <div>
                    <div className="text-[13px] font-bold">{r.name}</div>
                    <div className="text-[12px] text-muted-foreground">
                      {r.rowCount} × {r.colCount} · ความจุ {capacityOf(r.layout)}
                      {!r.isActive && " · ปิดใช้งาน"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(r.examRoomId)}>
                      แก้ไข
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const res = store.setExamRoomActive(r.examRoomId, !r.isActive);
                        setError(res.ok ? "" : res.error);
                      }}
                    >
                      {r.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          {error && (
            <p role="alert" className="text-[13px] text-destructive">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
