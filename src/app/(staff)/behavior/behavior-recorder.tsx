"use client";

/**
 * ตัวบันทึกพฤติกรรมตัวเดียวของหน้าความประพฤติ (UC8) — ใช้ได้ทั้งครูที่โต๊ะและครูเวรหน้าประตู
 * หนึ่งรอบบันทึกใช้พฤติกรรมเดียว (UC8 ข้อ 5 และ 17)
 * 1. เลือกพฤติกรรม (ตัดคะแนน / เพิ่มคะแนน / ส่งต่อ) จากกฎชุดเดียวกับหน้าตั้งค่า เลือกแล้วย่อเป็นบรรทัดเดียว กด "เปลี่ยน" เพื่อเลือกใหม่
 *    เมื่อมีนักเรียนในรายการแล้วการเปลี่ยนพฤติกรรมต้องล้างรายการก่อน
 *    กฎที่บทบาทของครูไม่มีสิทธิ์บันทึกจะกดไม่ได้และบอกว่าใครบันทึกได้ (ข้อ 6, Alt-B ข้อ 5)
 * 2. เพิ่มนักเรียน: สแกนบัตรหรือพิมพ์รหัส / ชื่อในช่องเดียว (ข้อ 2, Alt-A) แล้วกด Enter สแกนแล้วเข้ารายการทันที รายชื่ออยู่ใต้ช่องค้นหา
 * 3. เพิ่มรายละเอียดแบบพับไว้: วันที่เกิดพฤติกรรม รายละเอียด รูปหลักฐาน (ข้อ 5, 8) ใช้กับทั้งรอบ
 * 4. ตรวจรายชื่อพร้อมคะแนนก่อนและหลัง และบอกคนที่จะเข้าหรือขึ้นระดับเฝ้าระวัง (ข้อ 4, 11, 16) แล้วยืนยันบันทึกครั้งเดียว (ข้อ 12)
 *    กฎส่งต่อไม่ปรับคะแนน และแจ้งครูที่ปรึกษาให้พิจารณาเปิดกรณี (Alt-G)
 * 5. บันทึกแล้วพฤติกรรมยังค้างไว้ บันทึกรอบถัดไปได้ทันที (ข้อ 17)
 * PROTOTYPE: ยังไม่มีกล้อง พิมพ์เลขประจำตัวหรือกดรายชื่อตัวอย่างแทนการสแกน
 *   การแจ้งเตือน (ผู้ปกครอง ครูที่ปรึกษา ผู้ที่กำหนดในแต่ละระดับ) แสดงเป็นข้อความหลังบันทึกเท่านั้น ยังไม่ส่งจริง
 *   ออฟไลน์: รายการค้างอยู่ในหน้านี้ กดบันทึกได้เมื่อกลับมาออนไลน์ (Project 2: เก็บคิวในเครื่องแล้วส่งเองเมื่อต่อเน็ตได้)
 */

import { useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ImagePlus, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatThaiDate } from "@/lib/format";
import { resizeImage } from "@/lib/image";
import { DEMO_TODAY } from "@/lib/mock-data";
import { shiftDate } from "@/lib/periods";
import { searchStudents } from "@/lib/student-search";
import { RULE_KIND_LABEL, canRecordRule, recordersText, ruleKind, ruleScoreText, type RuleKind } from "@/lib/behavior-rules";
import { WATCH_NOTIFY_LABEL } from "@/lib/behavior-score";
import { useStore } from "@/lib/store";
import type { Student } from "@/lib/types";
import { useOnline } from "@/lib/use-online";

/** รูปหลักฐานต่อหนึ่งชุดบันทึก — PROTOTYPE: จำนวนยังไม่ได้ตกลงกับทีม */
const MAX_EVIDENCE = 3;

interface Entry {
  studentId: string;
  via: "scan" | "search";
}

type Feedback = { kind: "added" | "duplicate" | "not_found" | "saved"; text: string } | null;

const RULE_GROUPS: RuleKind[] = ["deduct", "add", "refer"];

/** studentId: เปิดจากหน้านักเรียน เลือกนักเรียนคนนั้นไว้ให้แล้ว เหลือเลือกพฤติกรรม */
export function BehaviorRecorder({ onClose, studentId }: { onClose: () => void; studentId?: string }) {
  const store = useStore();
  const online = useOnline();
  const [ruleId, setRuleId] = useState("");
  const [entries, setEntries] = useState<Entry[]>(() => (studentId ? [{ studentId, via: "search" }] : []));
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [occurredOn, setOccurredOn] = useState(DEMO_TODAY);
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [backdateReason, setBackdateReason] = useState("");
  // เลือกพฤติกรรมแล้วย่อเป็นบรรทัดเดียว กด "เปลี่ยน" เพื่อเปิดรายการอีกครั้ง
  const [picking, setPicking] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeRules = store.behaviorRules.filter((r) => r.isActive);
  const rule = activeRules.find((r) => r.ruleId === ruleId && canRecordRule(r));
  const ruleName = rule?.name ?? "";
  const refer = rule ? ruleKind(rule) === "refer" : false;
  const at = `${occurredOn}T23:59:59`;
  /** ระดับเฝ้าระวังก่อนและหลังบันทึกของแต่ละคน (ข้อ 16) */
  const watchChange = (studentId: string) => {
    const before = store.behaviorWatchLevelOf(studentId);
    const after = rule ? store.behaviorWatchLevelOf(studentId, { delta: rule.scoreDelta, at }) : before;
    return { before, after };
  };
  /** มีนักเรียนในรายการแล้ว = รอบนี้ล็อกพฤติกรรมไว้ */
  // เปิดจากหน้านักเรียน: มีนักเรียนในรายการก่อนเลือกพฤติกรรมได้ จึงล็อกเมื่อเลือกพฤติกรรมแล้วเท่านั้น
  const locked = entries.length > 0 && !!rule;
  const q = code.trim();
  // รหัสบัตรรูปแบบ "เลขประจำตัว-ลำดับบัตร" (เครื่องอ่านบัตรพิมพ์ลงช่อง) ส่วนรหัส ชื่อ หรือ "3/1-12" ค้นจากนักเรียนที่บันทึกได้
  const cardLike = /^\d{5}-\d+$/.test(q);
  const found = q !== "" && !cardLike ? searchStudents(q, store.recordableStudents, store.studentCards, DEMO_TODAY) : null;
  const matches = found ? found.students.slice(0, 5) : [];
  const onEnter = () => {
    if (!q) return;
    if (cardLike) return scan(q);
    if (found?.exact) return add(found.exact, "search");
    if (matches.length === 1) return add(matches[0], "search");
    // รหัส 5 หลักที่ไม่อยู่ในห้องที่รับผิดชอบ: บอกเหตุผลแทนการเงียบ
    if (/^\d{5}$/.test(q)) scan(q);
  };
  const changeRule = () => {
    if (locked && !window.confirm(`ล้างรายการ ${entries.length} คนเพื่อเปลี่ยนพฤติกรรมไหม`)) return;
    if (locked) setEntries([]);
    setPicking(true);
  };
  // บันทึกย้อนหลังได้ไม่เกินที่แอดมินกำหนด และต้องระบุเหตุผล (ข้อ 6, 8, Alt-B)
  const minDate = shiftDate(DEMO_TODAY, -store.behaviorScoreConfig.backdateDays);
  const backdated = occurredOn < DEMO_TODAY;
  const dateError =
    occurredOn > DEMO_TODAY
      ? "วันที่เกิดเหตุต้องไม่เกินวันนี้"
      : occurredOn < minDate
        ? `บันทึกย้อนหลังได้ไม่เกิน ${store.behaviorScoreConfig.backdateDays} วัน`
        : backdated && backdateReason.trim() === ""
          ? "ระบุเหตุผลที่บันทึกย้อนหลัง"
          : "";
  const hasDetails = occurredOn !== DEMO_TODAY || description.trim() !== "" || evidence.length > 0;

  const add = (student: Student, via: Entry["via"]) => {
    setCode("");
    inputRef.current?.focus();
    // ตรวจสิทธิ์ต่อนักเรียน: ต้องเป็นห้องที่เป็นครูประจำชั้นหรือห้องที่สอน (ข้อ 6, Alt-B ข้อ 4)
    if (!store.canRecordStudent(student.studentId)) {
      setFeedback({ kind: "not_found", text: `${student.fullName} (${student.roomName}) ไม่อยู่ในห้องที่คุณสอนหรือเป็นครูประจำชั้น จึงบันทึกไม่ได้` });
      return;
    }
    if (entries.some((e) => e.studentId === student.studentId)) {
      setFeedback({ kind: "duplicate", text: `${student.fullName} อยู่ในรายการแล้ว` });
      return;
    }
    setEntries((prev) => [{ studentId: student.studentId, via }, ...prev]);
    setFeedback({ kind: "added", text: `${student.fullName} · ${ruleName}` });
    navigator.vibrate?.(40);
  };

  const scan = (value: string) => {
    const v = value.trim();
    // สแกนบัตร: ตรวจว่าบัตรยังใช้งานได้ บัตรที่ยกเลิกหรือหมดอายุให้เลือกจากรายชื่อแทน (UC8 Alt-A, UC14)
    const card = store.studentCards.find((c) => c.code === v);
    if (card) {
      if (card.status === "cancelled" || card.expiresAt < DEMO_TODAY) {
        setCode("");
        setFeedback({
          kind: "not_found",
          text: `บัตร “${v}” ${card.status === "cancelled" ? "ถูกยกเลิกแล้ว" : "หมดอายุแล้ว"} ให้พิมพ์ชื่อเลือกจากรายชื่อแทน`,
        });
        return;
      }
      const student = store.getStudent(card.studentId);
      if (student) add(student, "scan");
      return;
    }
    // พิมพ์เลขประจำตัวเอง นับเป็นการเลือกจากรายชื่อ
    const student = store.getStudent(v);
    if (student) add(student, "search");
    else {
      setCode("");
      setFeedback({ kind: "not_found", text: `ไม่พบนักเรียนจากบัตร “${v}” สแกนใหม่ หรือพิมพ์ชื่อแทน` });
    }
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const resized = await Promise.all([...files].slice(0, MAX_EVIDENCE - evidence.length).map((f) => resizeImage(f)));
    setEvidence((prev) => [...prev, ...resized]);
  };

  const save = () => {
    if (!rule) return;
    // คนที่เข้าหรือขึ้นระดับเฝ้าระวัง ต้องคำนวณก่อนเพิ่มรายการ (Alt-D)
    const raised = entries
      .map((e) => ({ id: e.studentId, ...watchChange(e.studentId) }))
      .filter((w) => w.after > w.before);
    // พฤติกรรมเดียวทั้งรอบ แยกเฉพาะวิธีที่ได้รายชื่อมา (ที่มาของบันทึกจึงถูกต้องรายคน)
    for (const via of ["scan", "search"] as const) {
      const studentIds = entries.filter((e) => e.via === via).map((e) => e.studentId);
      if (studentIds.length === 0) continue;
      store.addBehaviorRecord({
        studentIds,
        ruleId,
        description: description.trim() || "-",
        occurredOn,
        evidence,
        source: via === "scan" ? "card_scan" : "manual",
        backdateReason: backdated ? backdateReason.trim() : undefined,
      });
    }
    const notes = [`แจ้งผู้ปกครอง ${entries.length} คนในระบบ`];
    if (refer) notes.push("แจ้งครูที่ปรึกษาให้พิจารณาเปิดกรณีช่วยเหลือ");
    if (raised.length > 0) {
      const top = Math.max(...raised.map((w) => w.after));
      const extra = store.behaviorScoreConfig.watchLevels
        .slice(0, top)
        .flatMap((l) => l.notify)
        .filter((n, i, all) => all.indexOf(n) === i)
        .map((n) => WATCH_NOTIFY_LABEL[n]);
      notes.push(
        `${raised.length} คนเข้าสถานะเฝ้าระวัง แจ้งครูที่ปรึกษา นักเรียน และผู้ปกครอง${extra.length ? ` รวมถึง${extra.join(" ")}` : ""}`
      );
    }
    setFeedback({ kind: "saved", text: `บันทึกแล้ว ${entries.length} คน · ${ruleName} · ${notes.join(" · ")}` });
    // เก็บพฤติกรรมและวันที่ไว้ เผื่อบันทึกเรื่องเดียวกันต่อ หรือเลือกพฤติกรรมใหม่สำหรับรอบถัดไป
    setEntries([]);
    setDescription("");
    setEvidence([]);
  };

  const close = () => {
    if (entries.length > 0 && !window.confirm(`ยังไม่ได้บันทึก ${entries.length} คน ปิดเลยไหม`)) return;
    onClose();
  };

  const chip = (active: boolean) =>
    active
      ? "rounded-lg border border-primary bg-accent px-3 py-2 text-[13.5px] font-semibold text-primary"
      : "rounded-lg border border-border px-3 py-2 text-[13.5px] hover:bg-muted";

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-center overflow-hidden bg-surface"
      role="dialog"
      aria-label="บันทึกพฤติกรรม"
    >
      <div className="flex h-full w-full max-w-md min-w-0 flex-col bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <h2 className="flex-1 text-[16px] font-bold">บันทึกพฤติกรรม</h2>
          <Button variant="ghost" size="icon" aria-label="ปิด" onClick={close}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* 1. พฤติกรรม: เลือกแล้วย่อเป็นบรรทัดเดียว กด "เปลี่ยน" เพื่อเลือกใหม่ */}
          <div className="border-b border-border px-4 py-3">
            {rule && !picking ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-muted-foreground">พฤติกรรม (ใช้กับทุกคนที่เลือก)</div>
                    <div className="text-[15px] font-semibold">
                      {rule.name}{" "}
                      <span className="font-normal text-muted-foreground">{refer ? "ส่งต่อ · ไม่ปรับคะแนน" : ruleScoreText(rule)}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={changeRule}>
                    เปลี่ยน
                  </Button>
                </div>
                {refer && <p className="mt-1.5 text-[12.5px] text-muted-foreground">บันทึกแล้วแจ้งครูที่ปรึกษาให้พิจารณาเปิดกรณีช่วยเหลือ</p>}
              </>
            ) : (
              <div className="space-y-3">
                {RULE_GROUPS.map((kind) => {
                  const list = activeRules.filter((r) => ruleKind(r) === kind);
                  if (list.length === 0) return null;
                  return (
                    <div key={kind}>
                      <div className="mb-1.5 text-[12.5px] font-semibold">{RULE_KIND_LABEL[kind]}</div>
                      <div className="flex flex-wrap gap-2">
                        {list.map((r) => {
                          const allowed = canRecordRule(r);
                          return (
                            <button
                              key={r.ruleId}
                              type="button"
                              aria-pressed={ruleId === r.ruleId}
                              disabled={!allowed}
                              title={allowed ? undefined : `บันทึกได้เฉพาะ${recordersText(r)}`}
                              onClick={() => {
                                setRuleId(r.ruleId);
                                setPicking(false);
                                inputRef.current?.focus();
                              }}
                              className={`${chip(ruleId === r.ruleId)} text-left disabled:cursor-not-allowed disabled:opacity-40`}
                            >
                              {r.name}{" "}
                              {kind !== "refer" && <span className="text-muted-foreground">{ruleScoreText(r)}</span>}
                              {!allowed && (
                                <span className="block text-[11px] font-normal text-muted-foreground">เฉพาะ{recordersText(r)}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. ค้นหานักเรียน: สแกนบัตร (เครื่องอ่านพิมพ์รหัสลงช่อง) หรือพิมพ์รหัส / ชื่อ แล้วกด Enter */}
          <div className="border-b border-border px-4 py-3">
            <Input
              ref={inputRef}
              aria-label="สแกนบัตร หรือพิมพ์รหัส / ชื่อ"
              value={code}
              disabled={!ruleId}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onEnter()}
              placeholder={ruleId ? "สแกนบัตร หรือพิมพ์รหัส / ชื่อ" : "เลือกพฤติกรรมก่อน"}
              className="h-11"
            />

            {matches.length > 0 && (
              <div className="mt-2 divide-y divide-border rounded-lg border border-border">
                {matches.map((s) => (
                  <button
                    key={s.studentId}
                    type="button"
                    onClick={() => add(s, "search")}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-[13.5px] hover:bg-muted"
                  >
                    <span className="w-12 shrink-0 text-[12px] text-muted-foreground tabular-nums">{s.studentId}</span>
                    <span className="min-w-0 flex-1 truncate">{s.fullName}</span>
                    <span className="text-[12px] text-muted-foreground">
                      {s.roomName} เลขที่ {s.classNo}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {q !== "" && !cardLike && matches.length === 0 && !/^\d{5}$/.test(q) && (
              <p className="mt-2 text-[12.5px] text-muted-foreground">ไม่พบนักเรียนในห้องที่คุณรับผิดชอบ</p>
            )}

            {feedback && (
              <p
                role="status"
                className={`mt-2 flex items-center gap-1.5 text-[13px] ${
                  feedback.kind === "added" || feedback.kind === "saved" ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {(feedback.kind === "added" || feedback.kind === "saved") && <CheckCircle2 className="size-4 text-primary" />}
                {feedback.text}
              </p>
            )}

            {/* ใช้ทดสอบเท่านั้น ไม่แสดงในระบบจริง */}
            {process.env.NODE_ENV !== "production" && ruleId && (
              <div className="mt-2">
                <button
                  type="button"
                  aria-expanded={testMode}
                  onClick={() => setTestMode((v) => !v)}
                  className="text-[11.5px] text-muted-foreground underline underline-offset-2"
                >
                  โหมดทดสอบ: จำลองการสแกนบัตร
                </button>
                {testMode && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {/* บัตรตัวอย่าง รวมบัตรที่ถูกยกเลิกแล้ว 1 ใบ และบัตรนักเรียนห้องที่ไม่ได้สอน เพื่อดูกรณีบันทึกไม่ได้ */}
                    {store.studentCards.map((c) => (
                      <button
                        key={c.cardId}
                        type="button"
                        onClick={() => scan(c.code)}
                        className="rounded-md bg-muted px-2 py-0.5 text-[11.5px] text-muted-foreground hover:bg-muted/70"
                      >
                        {c.code}
                        {c.status === "cancelled" && " (ยกเลิก)"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. รายชื่อที่เลือกแล้ว อยู่ใต้ช่องค้นหา เห็นผลทันทีที่สแกน (ตรวจรายชื่อพร้อมคะแนนก่อน/หลัง ข้อ 4, 11, 16) */}
          <div className="border-b border-border px-4 py-3">
            <div className="mb-1 text-[12.5px] font-semibold">เลือกแล้ว {entries.length} คน</div>
            {entries.length === 0 && (
              <p className="py-1 text-[13px] text-muted-foreground">นักเรียนที่สแกนหรือเลือกจะแสดงที่นี่</p>
            )}
            <div className="divide-y divide-border">
              {!rule &&
                entries.map((e) => (
                  <div key={e.studentId} className="py-2.5 text-[13.5px]">
                    <span className="font-semibold">{store.getStudent(e.studentId)?.fullName}</span>
                    <span className="ml-2 text-[12px] text-muted-foreground">เลือกพฤติกรรมด้านบน</span>
                  </div>
                ))}
              {rule &&
                entries.map((e) => {
                  const s = store.getStudent(e.studentId);
                  // คะแนนก่อนและหลัง คิดตามวันที่เกิดพฤติกรรม และอยู่ระหว่างคะแนนต่ำสุดถึงเพดาน (ข้อ 11, 13)
                  const before = store.behaviorScoreOf(e.studentId);
                  const after = store.behaviorScoreOf(e.studentId, { delta: rule.scoreDelta, at });
                  const capped = !refer && after - before !== rule.scoreDelta;
                  const watch = watchChange(e.studentId);
                  return (
                    <div key={e.studentId} className="flex items-center gap-2 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-medium">{s?.fullName}</div>
                        <div className="text-[11.5px] text-muted-foreground">
                          {s?.roomName} เลขที่ {s?.classNo} ·{" "}
                          {refer ? `คะแนน ${before} (ไม่ปรับคะแนน)` : `คะแนน ${before} → ${after}`}
                          {capped && (rule.scoreDelta > 0 ? " (ถึงเพดานแล้ว)" : " (ถึงคะแนนต่ำสุดแล้ว)")}
                        </div>
                        {watch.after > watch.before && (
                          <div className="mt-0.5 text-[11.5px] font-semibold text-foreground">
                            {watch.before === 0 ? `เข้าสถานะเฝ้าระวังระดับ ${watch.after}` : `ขึ้นเป็นเฝ้าระวังระดับ ${watch.after}`}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label={`เอา ${s?.fullName} ออก`}
                        onClick={() => setEntries((prev) => prev.filter((x) => x.studentId !== e.studentId))}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 4. รายละเอียด (ไม่บังคับ) */}
          <div className="border-b border-border px-4 py-2">
            <button
              type="button"
              aria-expanded={showDetails}
              onClick={() => setShowDetails((v) => !v)}
              className="flex w-full items-center gap-2 py-1 text-[13px] font-semibold"
            >
              เพิ่มรายละเอียด
              <span className="font-normal text-muted-foreground">
                {hasDetails ? `วันที่ ${formatThaiDate(occurredOn)}${evidence.length ? ` · รูป ${evidence.length}` : ""}` : "ไม่บังคับ"}
              </span>
              <span className="flex-1" />
              <ChevronDown className={`size-4 text-muted-foreground transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </button>

            {showDetails && (
              <div className="space-y-3 pt-2 pb-2">
                <div>
                  <div className="mb-1.5 text-[12.5px] text-muted-foreground">วันที่เกิดเหตุ</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { label: "วันนี้", date: DEMO_TODAY },
                      { label: "เมื่อวาน", date: shiftDate(DEMO_TODAY, -1) },
                    ].map((o) => (
                      <button
                        key={o.label}
                        type="button"
                        aria-pressed={occurredOn === o.date}
                        onClick={() => setOccurredOn(o.date)}
                        className={chip(occurredOn === o.date)}
                      >
                        {o.label}
                      </button>
                    ))}
                    <Input
                      type="date"
                      aria-label="วันที่เกิดเหตุ"
                      value={occurredOn}
                      min={minDate}
                      max={DEMO_TODAY}
                      onChange={(e) => setOccurredOn(e.target.value)}
                      className="h-10 w-40"
                    />
                  </div>
                </div>
                {backdated && (
                  <Input
                    aria-label="เหตุผลที่บันทึกย้อนหลัง"
                    placeholder="เหตุผลที่บันทึกย้อนหลัง (จำเป็น)"
                    value={backdateReason}
                    onChange={(e) => setBackdateReason(e.target.value)}
                  />
                )}
                <Textarea
                  aria-label="รายละเอียดเหตุการณ์"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="รายละเอียดเหตุการณ์"
                />
                <div className="flex flex-wrap gap-2">
                  {evidence.map((src, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element -- data URL ในต้นแบบ ใช้ next/image ไม่ได้ */}
                      <img src={src} alt={`หลักฐาน ${i + 1}`} className="size-14 rounded-lg border border-border object-cover" />
                      <button
                        type="button"
                        aria-label={`ลบหลักฐาน ${i + 1}`}
                        onClick={() => setEvidence((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  {evidence.length < MAX_EVIDENCE && (
                    <label className="flex size-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-border text-[11px] text-muted-foreground hover:bg-muted">
                      <ImagePlus className="size-5" />
                      แนบรูป
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          void addPhotos(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="border-t border-border px-4 py-3">
          {!online && (
            <p className="mb-2 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <WifiOff className="size-4" /> ออฟไลน์ · รายการยังอยู่ในหน้านี้ กดบันทึกได้เมื่อกลับมาออนไลน์
            </p>
          )}
          {dateError && entries.length > 0 && (
            <p className="mb-2 text-[12.5px] text-destructive">
              {dateError}{" "}
              <button type="button" className="underline underline-offset-2" onClick={() => setShowDetails(true)}>
                แก้ที่ “เพิ่มรายละเอียด”
              </button>
            </p>
          )}
          {(!rule || entries.length === 0) && (
            <p className="mb-2 text-center text-[12.5px] text-muted-foreground">{!rule ? "เลือกพฤติกรรมก่อน" : "เลือกนักเรียนอย่างน้อย 1 คน"}</p>
          )}
          <Button className="h-12 w-full text-[15px]" disabled={entries.length === 0 || !rule || !online || !!dateError} onClick={save}>
            {entries.length === 0 ? "บันทึก" : `ตรวจแล้ว บันทึก ${entries.length} คน`}
          </Button>
        </div>
      </div>
    </div>
  );
}
