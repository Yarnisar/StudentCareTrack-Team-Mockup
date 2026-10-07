"use client";

/**
 * ครูและสิทธิ์ — ผู้ดูแลระบบเลือกว่าครูแต่ละคนเป็นครูประจำชั้นห้องใด และสอนวิชาใดในห้องใด (ADR-0003)
 * บทบาทของครูไม่ได้กรอกเอง: คำนวณจากการมอบหมาย (มีห้องประจำชั้นที่ยังใช้อยู่ = ครูประจำชั้น ไม่มี = ครูทั่วไป)
 * จึงแสดงผลของสิทธิ์ให้เห็นก่อนบันทึก · ยืนยันในที่ · ไม่ลบแถว ใช้การสิ้นสุดการมอบหมายพร้อมวันที่
 */

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { InlineConfirm } from "@/components/settings/confirm";
import { teacherAssignmentConfirm } from "@/components/settings/confirm-text";
import { SideDrawer } from "@/components/settings/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useDemoPageTool } from "@/lib/demo/page-tools";
import { subjects } from "@/lib/mock-data";
import { MAX_HOMEROOM_TEACHERS_PER_ROOM, useStore, type AssignmentChange } from "@/lib/store";
import { ROLE_LABEL, type SubjectTeaching, type User, type UserRole } from "@/lib/types";

const isTeacher = (u: User) => u.role === "teacher_general" || u.role === "teacher_homeroom";

/** สิ่งที่ครูทำได้ในแต่ละบทบาท (ตรงกับ lib/navigation.ts และ lib/permissions.ts) */
const ABILITIES: Record<"teacher_general" | "teacher_homeroom", string[]> = {
  teacher_general: [
    "ดูข้อมูลพื้นฐาน บันทึกความประพฤติ และให้คะแนนคุณลักษณะฯ ในวิชาที่สอน",
    "ไม่เห็นข้อมูลอ่อนไหวและเมนูคัดกรอง ประเมิน เยี่ยมบ้าน ดูแลและติดตาม",
  ],
  teacher_homeroom: [
    "ทุกอย่างของครูทั่วไป",
    "เห็นข้อมูลอ่อนไหวและใช้เมนูคัดกรอง ประเมิน เยี่ยมบ้าน ดูแลและติดตามของห้องที่ประจำชั้น",
  ],
};

const roleBadge = (role: UserRole) =>
  role === "teacher_homeroom" ? "bg-accent text-primary" : "bg-muted text-muted-foreground";

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${roleBadge(role)}`}>
      {ROLE_LABEL[role]}
    </span>
  );
}

export function TeachersSection() {
  const store = useStore();
  const [selected, setSelected] = useState<string | null>(null);

  const roomName = (roomId: string) => store.classrooms.find((c) => c.roomId === roomId)?.roomName ?? roomId;
  const subjectName = (subjectId: string) => subjects.find((s) => s.subjectId === subjectId)?.name ?? subjectId;
  const teachingLabel = (t: SubjectTeaching) => `${subjectName(t.subjectId)} ${roomName(t.roomId)}`;

  const teachers = useMemo(() => store.users.filter(isTeacher), [store.users]);
  const teacher = selected ? (store.getUser(selected) ?? null) : null;

  return (
    <Card>
      <CardContent className="p-5 lg:p-6">
        <h2 className="text-[15px] font-bold">ครูและสิทธิ์</h2>
        <p className="mt-0.5 mb-4 text-[12px] text-muted-foreground">
          สิทธิ์คำนวณจากห้องประจำชั้นที่มอบหมาย
        </p>

        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <th className="py-2 pr-2 font-medium">ชื่อครู</th>
              <th className="py-2 pr-2 font-medium">สิทธิ์</th>
              <th className="py-2 pr-2 font-medium whitespace-nowrap">ประจำชั้น</th>
              <th className="py-2 pr-2 font-medium">วิชาที่สอน</th>
              <th className="py-2">
                <span className="sr-only">การจัดการ</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((u) => {
              const rooms = store.homeroomRoomIdsOfTeacher(u.userId).map(roomName);
              const taught = store.teachingsOfTeacher(u.userId).map(teachingLabel);
              return (
                <tr key={u.userId} className="border-b border-border align-top last:border-0">
                  <td className="py-2.5 pr-2 font-medium">{u.name}</td>
                  <td className="py-2.5 pr-2">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="py-2.5 pr-2 text-muted-foreground">
                    {rooms.length > 0 ? rooms.join(", ") : "—"}
                  </td>
                  <td className="py-2.5 pr-2 text-muted-foreground">
                    {taught.length > 0
                      ? taught.length > 2
                        ? `${taught.slice(0, 2).join(", ")} +${taught.length - 2}`
                        : taught.join(", ")
                      : "—"}
                  </td>
                  <td className="py-1.5 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`แก้ไข ${u.name}`}
                      onClick={() => setSelected(u.userId)}
                    >
                      แก้ไข
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>

      {teacher && <TeacherDrawer key={teacher.userId} teacher={teacher} onClose={() => setSelected(null)} />}
    </Card>
  );
}

/** แถววิชาในแบบร่าง: แถวเดิม (มี teachingId) ถูกกดสิ้นสุดได้, แถวใหม่ยังไม่บันทึกลบทิ้งได้เลย */
interface SubjectDraftRow {
  key: string;
  subjectId: string;
  roomId: string;
  teachingId: string | null;
  ending: boolean;
}

function TeacherDrawer({ teacher, onClose }: { teacher: User; onClose: () => void }) {
  const store = useStore();
  const roomName = (roomId: string) => store.classrooms.find((c) => c.roomId === roomId)?.roomName ?? roomId;
  const subjectName = (subjectId: string) => subjects.find((s) => s.subjectId === subjectId)?.name ?? subjectId;

  const savedRooms = store.homeroomRoomIdsOfTeacher(teacher.userId);
  const savedTeachings = store.teachingsOfTeacher(teacher.userId);

  const [draftRooms, setDraftRooms] = useState<string[]>(savedRooms);
  const [draftSubjects, setDraftSubjects] = useState<SubjectDraftRow[]>(() =>
    savedTeachings.map((t) => ({
      key: t.teachingId,
      subjectId: t.subjectId,
      roomId: t.roomId,
      teachingId: t.teachingId,
      ending: false,
    }))
  );
  const [roomError, setRoomError] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState(subjects[0].subjectId);
  const [newRoom, setNewRoom] = useState(store.classrooms[0]?.roomId ?? "");
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const touch = () => {
    setConfirming(false);
    setMessage(null);
  };

  const toggleRoom = (roomId: string) => {
    touch();
    if (draftRooms.includes(roomId)) {
      setRoomError(null);
      setDraftRooms((rooms) => rooms.filter((r) => r !== roomId));
      return;
    }
    const others = store.homeroomsOfRoom(roomId).filter((h) => h.teacher.userId !== teacher.userId);
    if (others.length >= MAX_HOMEROOM_TEACHERS_PER_ROOM) {
      setRoomError(
        `ห้อง ${roomName(roomId)} มีครูประจำชั้นครบ ${MAX_HOMEROOM_TEACHERS_PER_ROOM} คนแล้ว (${others
          .map((h) => h.teacher.name)
          .join(" และ ")}) — ต้องสิ้นสุดการมอบหมายของคนใดคนหนึ่งก่อนจึงเพิ่มได้`
      );
      return;
    }
    setRoomError(null);
    setDraftRooms((rooms) => [...rooms, roomId]);
  };

  const addSubject = () => {
    touch();
    const dup = draftSubjects.find((r) => !r.ending && r.subjectId === newSubject && r.roomId === newRoom);
    if (dup) {
      setSubjectError(`${teacher.name} สอน ${subjectName(newSubject)} ${roomName(newRoom)} อยู่แล้ว`);
      return;
    }
    setSubjectError(null);
    setDraftSubjects((rows) => [
      ...rows,
      { key: `new-${newSubject}-${newRoom}`, subjectId: newSubject, roomId: newRoom, teachingId: null, ending: false },
    ]);
  };

  const toggleEnding = (row: SubjectDraftRow) => {
    touch();
    setSubjectError(null);
    setDraftSubjects((rows) =>
      row.teachingId
        ? rows.map((r) => (r.key === row.key ? { ...r, ending: !r.ending } : r))
        : rows.filter((r) => r.key !== row.key)
    );
  };

  const roleBefore: UserRole = savedRooms.length > 0 ? "teacher_homeroom" : "teacher_general";
  const roleAfter: UserRole = draftRooms.length > 0 ? "teacher_homeroom" : "teacher_general";

  const changes = useMemo<AssignmentChange[]>(() => {
    const out: AssignmentChange[] = [];
    for (const roomId of savedRooms) {
      if (!draftRooms.includes(roomId)) out.push({ kind: "endHomeroom", roomId, teacherUserId: teacher.userId });
    }
    for (const roomId of draftRooms) {
      if (!savedRooms.includes(roomId)) out.push({ kind: "assignHomeroom", roomId, teacherUserId: teacher.userId });
    }
    for (const row of draftSubjects) {
      if (row.teachingId && row.ending) out.push({ kind: "endSubject", teachingId: row.teachingId });
      if (!row.teachingId) {
        out.push({ kind: "assignSubject", teacherUserId: teacher.userId, subjectId: row.subjectId, roomId: row.roomId });
      }
    }
    return out;
  }, [savedRooms, draftRooms, draftSubjects, teacher.userId]);

  const subjectsAfter = draftSubjects
    .filter((r) => !r.ending)
    .map((r) => `${subjectName(r.subjectId)} ${roomName(r.roomId)}`);

  const confirmContent = teacherAssignmentConfirm({
    teacherName: teacher.name,
    roleBefore: ROLE_LABEL[roleBefore],
    roleAfter: ROLE_LABEL[roleAfter],
    roomsBefore: savedRooms.map(roomName),
    roomsAfter: draftRooms.map(roomName),
    subjectsBefore: savedTeachings.map((t) => `${subjectName(t.subjectId)} ${roomName(t.roomId)}`),
    subjectsAfter,
  });

  const save = () => {
    setConfirming(false);
    const result = store.applyAssignmentChanges(changes);
    if (!result.ok) {
      setMessage({ ok: false, text: result.error });
      return;
    }
    setMessage({ ok: true, text: `บันทึกแล้ว ${result.changes} รายการ` });
    // แบบร่างเริ่มใหม่จากค่าที่บันทึกแล้ว
    setDraftSubjects((rows) =>
      rows
        .filter((r) => !r.ending)
        .map((r) => ({ ...r, key: r.teachingId ?? r.key }))
    );
  };

  // เครื่องมือสาธิต (autofill): เติมแบบร่างตัวอย่าง = ครูประจำชั้นห้องแรกที่ยังว่าง + สอนวิชาแรกในห้องนั้น (ยังไม่บันทึก)
  useDemoPageTool(
    "เติมการมอบหมายตัวอย่าง",
    () => {
      touch();
      const open = store.classrooms.find(
        (c) =>
          draftRooms.includes(c.roomId) ||
          store.homeroomsOfRoom(c.roomId).filter((h) => h.teacher.userId !== teacher.userId).length <
            MAX_HOMEROOM_TEACHERS_PER_ROOM
      );
      if (!open) return;
      setRoomError(null);
      setDraftRooms((rooms) => (rooms.includes(open.roomId) ? rooms : [...rooms, open.roomId]));
      setDraftSubjects((rows) =>
        rows.some((r) => !r.ending && r.subjectId === subjects[0].subjectId && r.roomId === open.roomId)
          ? rows
          : [
              ...rows,
              { key: `new-${subjects[0].subjectId}-${open.roomId}`, subjectId: subjects[0].subjectId, roomId: open.roomId, teachingId: null, ending: false },
            ]
      );
    },
    "ติ๊กครูประจำชั้นห้องแรกที่ว่าง และเพิ่มวิชาแรกของห้องนั้นในแบบร่าง"
  );

  const dirty = changes.length > 0;

  return (
    <SideDrawer title={teacher.name} subtitle="การมอบหมายและสิทธิ์" onClose={onClose}>
      <div className="space-y-5">
        <section>
          <h4 className="text-[13px] font-semibold">ครูประจำชั้น</h4>
          <p className="mb-2 text-[12px] text-muted-foreground">
            ห้องละไม่เกิน {MAX_HOMEROOM_TEACHERS_PER_ROOM} คน
          </p>
          <div className="space-y-1.5">
            {store.classrooms.map((c) => {
              const others = store.homeroomsOfRoom(c.roomId).filter((h) => h.teacher.userId !== teacher.userId);
              const checked = draftRooms.includes(c.roomId);
              return (
                <label
                  key={c.roomId}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border px-3 py-2 text-[13px] hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-primary"
                    checked={checked}
                    onChange={() => toggleRoom(c.roomId)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{c.roomName}</span>
                    {others.length > 0 && (
                      <span className="block text-[12px] text-muted-foreground">
                        กับ {others.map((h) => h.teacher.name).join(", ")}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          {roomError && (
            <p role="alert" className="mt-2 rounded-lg bg-risk-red-bg px-3 py-2 text-[12px] text-risk-red">
              {roomError}
            </p>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-[13px] font-semibold">วิชาที่สอน</h4>
          <ul className="space-y-1.5">
            {draftSubjects.length === 0 && <li className="text-[12px] text-muted-foreground">ยังไม่ได้สอนวิชาใด</li>}
            {draftSubjects.map((row) => (
              <li
                key={row.key}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-[13px]"
              >
                <span className={`min-w-0 flex-1 ${row.ending ? "text-muted-foreground line-through" : ""}`}>
                  {subjectName(row.subjectId)} · {roomName(row.roomId)}
                  {!row.teachingId && <span className="ml-1.5 text-[11px] text-primary">(เพิ่มใหม่)</span>}
                </span>
                <button
                  type="button"
                  onClick={() => toggleEnding(row)}
                  className="rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-muted"
                >
                  {row.teachingId ? (row.ending ? "ยกเลิกการสิ้นสุด" : "สิ้นสุด") : "เอาออก"}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-2.5 grid grid-cols-[1fr_auto_auto] items-end gap-2">
            <div>
              <Label htmlFor="new-subject" className="text-[11.5px] text-muted-foreground">
                เพิ่มวิชา
              </Label>
              <select
                id="new-subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-border bg-card px-2 text-[13px]"
              >
                {subjects.map((s) => (
                  <option key={s.subjectId} value={s.subjectId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="new-room" className="text-[11.5px] text-muted-foreground">
                ห้อง
              </Label>
              <select
                id="new-room"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className="mt-1 h-9 rounded-lg border border-border bg-card px-2 text-[13px]"
              >
                {store.classrooms.map((c) => (
                  <option key={c.roomId} value={c.roomId}>
                    {c.roomName}
                  </option>
                ))}
              </select>
            </div>
            <Button size="lg" variant="outline" onClick={addSubject} aria-label="เพิ่มวิชา">
              <Plus className="size-4" />
            </Button>
          </div>
          {subjectError && (
            <p role="alert" className="mt-2 rounded-lg bg-risk-red-bg px-3 py-2 text-[12px] text-risk-red">
              {subjectError}
            </p>
          )}
        </section>

        <section className="rounded-xl bg-surface p-3">
          <h4 className="text-[13px] font-semibold">สิทธิ์ของครู</h4>
          <p className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
            {roleBefore !== roleAfter ? (
              <>
                <RoleBadge role={roleBefore} /> → <RoleBadge role={roleAfter} />
              </>
            ) : (
              <RoleBadge role={roleAfter} />
            )}
            {roleBefore !== roleAfter && <span>หลังบันทึก</span>}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] leading-relaxed">
            {ABILITIES[roleAfter as "teacher_general" | "teacher_homeroom"].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        {message && (
          <p className={`text-[12px] ${message.ok ? "text-risk-green" : "text-risk-red"}`} role="status">
            {message.text}
          </p>
        )}

        {confirming ? (
          <InlineConfirm content={confirmContent} onConfirm={save} onCancel={() => setConfirming(false)} />
        ) : (
          <Button size="lg" className="w-full" disabled={!dirty} onClick={() => setConfirming(true)}>
            บันทึก
          </Button>
        )}
      </div>
    </SideDrawer>
  );
}
