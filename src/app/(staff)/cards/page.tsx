"use client";

/**
 * จัดทำบัตรนักเรียน (UC14) สำหรับผู้ดูแลระบบ
 * - สถานการณ์ A: เลือกนักเรียนหนึ่งคนหรือหลายคน เลือกออกใหม่หรือทดแทน (ทดแทนต้องมีเหตุผล) กำหนดวันหมดอายุ (ตั้งต้นสิ้นปีการศึกษา)
 *   ระบบตรวจรูป ชื่อ รหัส ห้อง และปีการศึกษาจากทะเบียน แยกคนที่ข้อมูลไม่ครบไว้ทำภายหลัง (ข้อ 6–7)
 *   ไม่มีใครออกบัตรได้เลย แจ้งข้อมูลที่ต้องแก้ในระบบทะเบียน (Alt-B) ดูตัวอย่างพร้อม QR และวันหมดอายุด้านหลัง แล้วยืนยัน
 *   บัตรทดแทนยกเลิกบัตรเดิมทันที แล้วเปิดบัตรในระบบและสร้างไฟล์สำหรับพิมพ์ (ข้อ 9–12)
 * - สถานการณ์ B: บันทึกสถานะบัตรจริง พิมพ์แล้ว / มอบให้นักเรียนแล้ว
 * PROTOTYPE: ยังไม่สร้างไฟล์ PDF จริง QR เป็นภาพจำลอง และยังไม่จำลองกรณีระบบทะเบียนไม่ตอบสนอง (Alt-A)
 */

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PseudoQr } from "@/components/shared/pseudo-qr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatThaiDate } from "@/lib/format";
import { ACADEMIC_YEAR_END, CURRENT_TERM, DEMO_TODAY, SCHOOL_NAME } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { CARD_PHYSICAL_LABEL, type Student, type StudentCard } from "@/lib/types";
import { StudentId } from "@/components/shared/student-id";

/** PROTOTYPE: รายการเหตุผลเป็นข้อเสนอ */
const REPLACE_REASONS = ["บัตรหาย", "บัตรชำรุด", "ข้อมูลบนบัตรเปลี่ยน"];

const chip = (on: boolean) =>
  on
    ? "rounded-lg border border-primary bg-accent px-3 py-1.5 text-[13px] font-semibold text-primary"
    : "rounded-lg border border-border px-3 py-1.5 text-[13px] hover:bg-muted";

export default function CardsPage() {
  return (
    <Suspense fallback={null}>
      <CardsKeyed />
    </Suspense>
  );
}

function CardsKeyed() {
  const params = useSearchParams();
  return <CardsContent key={params.get("student") ?? ""} />;
}

function CardsContent() {
  // มาจากช่องค้นหา (?student=รหัส): เลือกนักเรียนคนนั้นไว้ให้
  const params = useSearchParams();
  const store = useStore();
  const [picked, setPicked] = useState<string[]>(() => (params.get("student") ? [params.get("student")!] : []));
  const [type, setType] = useState<StudentCard["type"]>("new");
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [expiresAt, setExpiresAt] = useState(ACADEMIC_YEAR_END);
  const [preview, setPreview] = useState(false);
  const [done, setDone] = useState("");

  const activeCard = (id: string) => store.studentCards.find((c) => c.studentId === id && c.status === "active");
  const finalReason = reason === "อื่น ๆ" ? otherReason.trim() : reason;

  /** ข้อมูลที่ขาดของแต่ละคนสำหรับการจัดทำครั้งนี้ (ข้อ 6–7) */
  const missingFor = (s: Student): string[] => {
    const m: string[] = [];
    if (s.hasPhoto === false) m.push("ไม่มีรูปถ่ายในระบบทะเบียน");
    if (!s.fullName || !s.studentId || !s.roomName) m.push("ข้อมูลชื่อ รหัส หรือห้องไม่ครบ");
    const card = activeCard(s.studentId);
    if (type === "new" && card) m.push("มีบัตรที่ใช้งานอยู่แล้ว ให้เลือกออกบัตรทดแทน");
    if (type === "replacement" && !card) m.push("ยังไม่มีบัตรเดิม ให้เลือกออกบัตรใหม่");
    return m;
  };
  const selected = store.students.filter((s) => picked.includes(s.studentId));
  const ready = selected.filter((s) => missingFor(s).length === 0);
  const notReady = selected.filter((s) => missingFor(s).length > 0);
  const formErrors = [
    ...(type === "replacement" && finalReason === "" ? ["ระบุเหตุผลของบัตรทดแทน"] : []),
    ...(expiresAt <= DEMO_TODAY ? ["วันหมดอายุต้องหลังวันนี้"] : []),
  ];

  const confirm = () => {
    const cards = store.issueCards(ready.map((s) => s.studentId), type, expiresAt, finalReason || undefined);
    setDone(
      `จัดทำบัตร${type === "replacement" ? "ทดแทน" : "ใหม่"} ${cards.length} ใบ · เปิดบัตรในระบบแล้ว และสร้างไฟล์สำหรับพิมพ์${type === "replacement" ? " · บัตรเดิมถูกยกเลิกแล้ว" : ""}`
    );
    setPicked([]);
    setPreview(false);
  };

  return (
    <>
      <PageHeader title="บัตรนักเรียน" subtitle={`จัดทำบัตรแบบพิมพ์และบัตรในระบบจากข้อมูลทะเบียน · ${CURRENT_TERM.label}`} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="flex-1 text-[15.5px] font-bold">นักเรียนและบัตรปัจจุบัน</h2>
                <button
                  type="button"
                  className="text-[12.5px] font-semibold text-primary"
                  onClick={() => setPicked(picked.length === store.students.length ? [] : store.students.map((s) => s.studentId))}
                >
                  {picked.length === store.students.length ? "ล้างที่เลือก" : "เลือกทั้งหมด"}
                </button>
              </div>
              <div className="divide-y divide-border">
                {store.students.map((s) => {
                  const card = activeCard(s.studentId);
                  const on = picked.includes(s.studentId);
                  return (
                    <div key={s.studentId} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
                      <label className="flex min-w-0 flex-1 basis-56 cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => setPicked((p) => (on ? p.filter((x) => x !== s.studentId) : [...p, s.studentId]))}
                        />
                        <span className="flex min-w-0 items-start gap-2.5">
                          <StudentId id={s.studentId} className="pt-0.5" />
                          <span className="min-w-0">
                            <span className="block text-[13.5px] font-medium">{s.fullName}</span>
                            <span className="block text-[11.5px] text-muted-foreground">
                              {card ? `บัตร ${card.code} · หมดอายุ ${formatThaiDate(card.expiresAt)}` : "ยังไม่มีบัตรที่ใช้งานได้"}
                            </span>
                          </span>
                        </span>
                      </label>
                      {card && (
                        <div className="flex flex-wrap gap-1" role="group" aria-label={`สถานะบัตรจริงของ ${s.fullName}`}>
                          {(["printed", "handed"] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              aria-pressed={card.physical === p}
                              onClick={() => store.setCardPhysical(card.cardId, p)}
                              className={`rounded-md border px-2 py-0.5 text-[11.5px] ${card.physical === p ? "border-primary bg-accent font-semibold text-primary" : "border-border hover:bg-muted"}`}
                            >
                              {CARD_PHYSICAL_LABEL[p]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <CardHistory />
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardContent className="space-y-4 p-5">
              <h2 className="text-[15.5px] font-bold">จัดทำบัตร · เลือกแล้ว {picked.length} คน</h2>
              <div>
                <div className="mb-1.5 text-[12.5px] text-muted-foreground">ประเภท</div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" aria-pressed={type === "new"} onClick={() => setType("new")} className={chip(type === "new")}>
                    ออกบัตรใหม่
                  </button>
                  <button type="button" aria-pressed={type === "replacement"} onClick={() => setType("replacement")} className={chip(type === "replacement")}>
                    บัตรทดแทน
                  </button>
                </div>
              </div>
              {type === "replacement" && (
                <div>
                  <div className="mb-1.5 text-[12.5px] text-muted-foreground">เหตุผล (บัตรเดิมจะถูกยกเลิกทันที)</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[...REPLACE_REASONS, "อื่น ๆ"].map((r) => (
                      <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(r)} className={chip(reason === r)}>
                        {r}
                      </button>
                    ))}
                  </div>
                  {reason === "อื่น ๆ" && (
                    <Input aria-label="เหตุผลอื่น" value={otherReason} onChange={(e) => setOtherReason(e.target.value)} placeholder="ระบุเหตุผล" className="mt-2" />
                  )}
                </div>
              )}
              <div>
                <label htmlFor="expires" className="mb-1.5 block text-[12.5px] text-muted-foreground">
                  วันหมดอายุ (ตั้งต้นสิ้นปีการศึกษา)
                </label>
                <Input id="expires" type="date" value={expiresAt} min={DEMO_TODAY} onChange={(e) => setExpiresAt(e.target.value)} className="w-48" />
              </div>

              {notReady.length > 0 && (
                <div className="rounded-lg border border-dashed border-border p-3">
                  <div className="text-[12.5px] font-semibold">
                    {ready.length === 0 ? "ออกบัตรให้นักเรียนที่เลือกไม่ได้" : "แยกไว้จัดทำภายหลัง"} · {notReady.length} คน
                  </div>
                  <ul className="mt-1 space-y-0.5 text-[12px] text-muted-foreground">
                    {notReady.map((s) => (
                      <li key={s.studentId}>
                        {s.fullName}: {missingFor(s).join(", ")}
                      </li>
                    ))}
                  </ul>
                  {ready.length === 0 && notReady.some((s) => s.hasPhoto === false) && (
                    <p className="mt-1 text-[12px]">แก้ข้อมูลที่ขาดในระบบทะเบียนก่อน แล้วกลับมาจัดทำใหม่</p>
                  )}
                </div>
              )}
              {formErrors.length > 0 && picked.length > 0 && (
                <ul className="list-disc pl-5 text-[12.5px] text-destructive">
                  {formErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              {done && (
                <p role="status" className="rounded-lg bg-accent px-3 py-2 text-[13px] text-primary">
                  {done}
                </p>
              )}
              <Button className="w-full" disabled={ready.length === 0 || formErrors.length > 0} onClick={() => setPreview(true)}>
                ตรวจข้อมูลและดูตัวอย่าง {ready.length > 0 && `(${ready.length} ใบ)`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {preview && ready[0] && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 sm:items-center" role="dialog" aria-modal="true" aria-label="ตัวอย่างบัตรนักเรียน">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-card shadow-lg sm:rounded-2xl">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <h2 className="flex-1 text-[15.5px] font-bold">ตัวอย่างบัตร · {ready[0].fullName}</h2>
              <button type="button" aria-label="ปิด" onClick={() => setPreview(false)} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid flex-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
              <div className="rounded-xl bg-primary p-4 text-white">
                <div className="text-[11px] text-violet-100">{SCHOOL_NAME} · ด้านหน้า</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-lg bg-white/20 text-[11px]">รูป</div>
                  <div>
                    <div className="text-[14px] font-bold">{ready[0].fullName}</div>
                    <div className="text-[11.5px] text-violet-100">
                      รหัส {ready[0].studentId} · {ready[0].roomName}
                    </div>
                    <div className="text-[11.5px] text-violet-100">ปีการศึกษา {CURRENT_TERM.academicYear}</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-border p-4">
                <div className="self-start text-[11px] text-muted-foreground">ด้านหลัง</div>
                <PseudoQr code={`${ready[0].studentId}-ใหม่`} size={96} />
                <div className="mt-2 text-[12px]">หมดอายุ {formatThaiDate(expiresAt)}</div>
              </div>
              <p className="text-[12.5px] text-muted-foreground sm:col-span-2">
                จะจัดทำ{type === "replacement" ? `บัตรทดแทน (${finalReason})` : "บัตรใหม่"} {ready.length} ใบ
                {type === "replacement" && " บัตรเดิมของนักเรียนเหล่านี้จะถูกยกเลิกทันทีและสแกนไม่ได้อีก"}
              </p>
            </div>
            <div className="flex gap-2 border-t border-border px-5 py-3.5">
              <Button variant="outline" onClick={() => setPreview(false)}>
                กลับไปแก้
              </Button>
              <Button className="flex-1" onClick={confirm}>
                ยืนยันจัดทำ {ready.length} ใบ
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** ประวัติการจัดทำ รวมบัตรที่ถูกยกเลิก (Post-condition) */
function CardHistory() {
  const store = useStore();
  const cards = [...store.studentCards].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)).slice(0, 8);
  return (
    <div className="mt-5 border-t border-border pt-4">
      <h3 className="mb-2 text-[13.5px] font-bold">ประวัติการจัดทำล่าสุด</h3>
      <div className="space-y-1 text-[12.5px]">
        {cards.map((c) => (
          <div key={c.cardId} className="flex flex-wrap gap-x-2 text-muted-foreground">
            <span className="text-foreground">{store.getStudent(c.studentId)?.fullName}</span>
            <span>
              บัตร {c.code} · {c.type === "replacement" ? `ทดแทน (${c.reason})` : "ออกใหม่"} · {formatThaiDate(c.issuedAt)}
            </span>
            <span>· {c.status === "cancelled" ? "ยกเลิกแล้ว" : CARD_PHYSICAL_LABEL[c.physical]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
