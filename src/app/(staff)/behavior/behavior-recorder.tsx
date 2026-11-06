"use client";

/**
 * ตัวบันทึกพฤติกรรมตัวเดียวของหน้าความประพฤติ (UC8) — ใช้ได้ทั้งครูที่โต๊ะและครูเวรหน้าประตู
 * 1. เลือกพฤติกรรม (แบ่งเป็นต้องปรับปรุง / เชิงบวก) แล้วค้างไว้
 * 2. เพิ่มนักเรียน: สแกนบัตรหรือพิมพ์ชื่อในช่องเดียว (ข้อ 2, Alt-A) สแกนแล้วเข้ารายการทันที
 * 3. เพิ่มรายละเอียดแบบพับไว้: วันที่ย้อนหลัง รายละเอียด รูปหลักฐาน (ข้อ 5, 8) ใช้กับทั้งชุด
 * 4. ตรวจทานรายการที่จัดกลุ่มตามพฤติกรรม (เลือกพฤติกรรมได้ที่ปุ่มด้านบนที่เดียว บันทึกผิดให้เอาออกแล้วสแกนใหม่) แล้วยืนยันบันทึกครั้งเดียว
 * ครูตรวจรายชื่อทั้งรายการก่อนบันทึก ตรงกับ UC8 ข้อ 4 และข้อ 12
 * รอตัดสินใจ: UC8 ข้อ 5 ให้เลือกกฎเดียวต่อรอบ แต่ตัวบันทึกนี้รับหลายกฎในรอบเดียว
 * PROTOTYPE: ยังไม่มีกล้อง พิมพ์เลขประจำตัวหรือกดรายชื่อตัวอย่างแทนการสแกน
 *   ออฟไลน์: รายการค้างอยู่ในหน้านี้ กดบันทึกได้เมื่อกลับมาออนไลน์ (Project 2: เก็บคิวในเครื่องแล้วส่งเองเมื่อต่อเน็ตได้)
 */

import { useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ImagePlus, ScanLine, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatThaiDate } from "@/lib/format";
import { resizeImage } from "@/lib/image";
import { DEMO_TODAY } from "@/lib/mock-data";
import { shiftDate } from "@/lib/periods";
import { behaviorRules, useStore } from "@/lib/store";
import type { BehaviorRule, Student } from "@/lib/types";
import { useOnline } from "@/lib/use-online";

/** รูปหลักฐานต่อหนึ่งชุดบันทึก — PROTOTYPE: จำนวนยังไม่ได้ตกลงกับทีม */
const MAX_EVIDENCE = 3;

interface Entry {
  studentId: string;
  ruleId: string;
  via: "scan" | "search";
}

type Feedback = { kind: "added" | "duplicate" | "not_found" | "saved"; text: string } | null;

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

const RULE_GROUPS: { title: string; match: (r: BehaviorRule) => boolean }[] = [
  { title: "ต้องปรับปรุง", match: (r) => r.scoreDelta < 0 },
  { title: "เชิงบวก", match: (r) => r.scoreDelta > 0 },
];
const ACTIVE_RULES = behaviorRules.filter((r) => r.isActive);

export function BehaviorRecorder({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const online = useOnline();
  const [ruleId, setRuleId] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [occurredOn, setOccurredOn] = useState(DEMO_TODAY);
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const ruleName = (id: string) => behaviorRules.find((r) => r.ruleId === id)?.name ?? "";
  const q = code.trim();
  const isCode = /^\d+$/.test(q);
  // ไม่มีบัตร: พิมพ์ชื่อแล้วกดเลือกจากรายชื่อที่ตรง
  const nameMatches = q !== "" && !isCode ? store.students.filter((s) => s.fullName.includes(q)).slice(0, 5) : [];
  const hasDetails = occurredOn !== DEMO_TODAY || description.trim() !== "" || evidence.length > 0;

  const add = (student: Student, via: Entry["via"]) => {
    setCode("");
    inputRef.current?.focus();
    if (entries.some((e) => e.studentId === student.studentId)) {
      setFeedback({ kind: "duplicate", text: `${student.fullName} อยู่ในรายการแล้ว` });
      return;
    }
    setEntries((prev) => [{ studentId: student.studentId, ruleId, via }, ...prev]);
    setFeedback({ kind: "added", text: `${student.fullName} · ${ruleName(ruleId)}` });
    navigator.vibrate?.(40);
  };

  const scan = (value: string) => {
    const student = store.getStudent(value.trim());
    if (student) add(student, "scan");
    else {
      setCode("");
      setFeedback({ kind: "not_found", text: `ไม่พบนักเรียนจากบัตร “${value.trim()}” สแกนใหม่ หรือพิมพ์ชื่อแทน` });
    }
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const resized = await Promise.all([...files].slice(0, MAX_EVIDENCE - evidence.length).map((f) => resizeImage(f)));
    setEvidence((prev) => [...prev, ...resized]);
  };

  const save = () => {
    // บันทึกรวมตามพฤติกรรมและวิธีที่ได้รายชื่อมา (ที่มาของบันทึกจึงถูกต้องรายคน)
    const groups = new Map<string, string[]>();
    for (const e of entries) {
      const key = `${e.ruleId}|${e.via}`;
      groups.set(key, [...(groups.get(key) ?? []), e.studentId]);
    }
    for (const [key, studentIds] of groups) {
      const [rid, via] = key.split("|");
      store.addBehaviorRecord({
        studentIds,
        ruleId: rid,
        description: description.trim() || "-",
        occurredOn,
        evidence,
        source: via === "scan" ? "card_scan" : "manual",
      });
    }
    setFeedback({ kind: "saved", text: `บันทึกแล้ว ${entries.length} คน` });
    // เก็บพฤติกรรมและวันที่ไว้ เผื่อบันทึกเรื่องเดียวกันต่อ
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
          <div className="space-y-3 border-b border-border px-4 py-3">
            {RULE_GROUPS.map((g) => (
              <div key={g.title}>
                <div className="mb-1.5 text-[12.5px] font-semibold">{g.title}</div>
                <div className="flex flex-wrap gap-2">
                  {ACTIVE_RULES.filter(g.match).map((r) => (
                    <button
                      key={r.ruleId}
                      type="button"
                      aria-pressed={ruleId === r.ruleId}
                      onClick={() => {
                        setRuleId(r.ruleId);
                        inputRef.current?.focus();
                      }}
                      className={chip(ruleId === r.ruleId)}
                    >
                      {r.name} <span className="text-muted-foreground">{signed(r.scoreDelta)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {ruleId && (
              <p className="text-[12.5px] text-muted-foreground">
                คนที่สแกนต่อจากนี้จะบันทึกเป็น <b className="text-foreground">{ruleName(ruleId)}</b>
              </p>
            )}
          </div>

          <div className="border-b border-border px-4 py-3">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                aria-label="สแกนบัตร หรือพิมพ์เลขประจำตัว / ชื่อ"
                value={code}
                disabled={!ruleId}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && isCode && scan(q)}
                placeholder={ruleId ? "สแกนบัตร หรือพิมพ์เลขประจำตัว / ชื่อ" : "เลือกพฤติกรรมก่อน"}
                className="h-11"
              />
              <Button className="h-11" disabled={!ruleId || !isCode} onClick={() => scan(q)}>
                <ScanLine className="size-4" /> สแกน
              </Button>
            </div>

            {nameMatches.length > 0 && (
              <div className="mt-2 divide-y divide-border rounded-lg border border-border">
                {nameMatches.map((s) => (
                  <button
                    key={s.studentId}
                    type="button"
                    onClick={() => add(s, "search")}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[13.5px] hover:bg-muted"
                  >
                    {s.fullName}
                    <span className="text-[12px] text-muted-foreground">
                      {s.roomName} เลขที่ {s.classNo}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {ruleId && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-[11.5px] text-muted-foreground">จำลองการสแกน:</span>
                {store.students.slice(0, 6).map((s) => (
                  <button
                    key={s.studentId}
                    type="button"
                    onClick={() => scan(s.studentId)}
                    className="rounded-md bg-muted px-2 py-0.5 text-[11.5px] text-muted-foreground hover:bg-muted/70"
                  >
                    {s.studentId}
                  </button>
                ))}
              </div>
            )}

            {feedback && (
              <p
                role="status"
                className={`mt-2 flex items-center gap-1.5 text-[13px] ${
                  feedback.kind === "added" || feedback.kind === "saved"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {(feedback.kind === "added" || feedback.kind === "saved") && (
                  <CheckCircle2 className="size-4 text-primary" />
                )}
                {feedback.text}
              </p>
            )}
          </div>

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
                      max={DEMO_TODAY}
                      onChange={(e) => setOccurredOn(e.target.value)}
                      className="h-10 w-40"
                    />
                  </div>
                </div>
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

          <div className="px-4 py-3">
            <div className="mb-1 text-[12.5px] font-semibold">รายการที่จะบันทึก · {entries.length} คน</div>
            {/* จัดกลุ่มตามพฤติกรรม เลือกพฤติกรรมได้ที่ปุ่มด้านบนที่เดียว บันทึกผิดให้เอาออกแล้วสแกนใหม่ */}
            {ACTIVE_RULES.filter((r) => entries.some((e) => e.ruleId === r.ruleId)).map((r) => {
              const group = entries.filter((e) => e.ruleId === r.ruleId);
              return (
                <div key={r.ruleId} className="mt-2">
                  <div className="text-[12.5px] text-muted-foreground">
                    <span className="rounded-md bg-muted px-2 py-0.5 font-semibold text-foreground">
                      {r.name} {signed(r.scoreDelta)}
                    </span>{" "}
                    · {group.length} คน
                  </div>
                  <div className="divide-y divide-border">
                    {group.map((e) => {
                      const s = store.getStudent(e.studentId);
                      const before = store.behaviorScoreOf(e.studentId);
                      return (
                        <div key={e.studentId} className="flex items-center gap-2 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13.5px] font-medium">{s?.fullName}</div>
                            <div className="text-[11.5px] text-muted-foreground">
                              {s?.roomName} เลขที่ {s?.classNo} · คะแนน {signed(before)} →{" "}
                              {signed(before + r.scoreDelta)}
                            </div>
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
              );
            })}
          </div>
        </div>

        <div className="border-t border-border px-4 py-3">
          {!online && (
            <p className="mb-2 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <WifiOff className="size-4" /> ออฟไลน์ · รายการยังอยู่ในหน้านี้ กดบันทึกได้เมื่อกลับมาออนไลน์
            </p>
          )}
          <Button className="h-12 w-full text-[15px]" disabled={entries.length === 0 || !online} onClick={save}>
            {entries.length === 0 ? "บันทึก" : `ตรวจแล้ว บันทึก ${entries.length} คน`}
          </Button>
        </div>
      </div>
    </div>
  );
}
