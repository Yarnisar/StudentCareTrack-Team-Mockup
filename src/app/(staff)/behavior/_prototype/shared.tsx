"use client";

/**
 * PROTOTYPE ONLY — ส่วนที่ทุก variant ใช้ร่วมกัน (ทิ้งได้)
 *
 * คำถามที่ต้นแบบนี้ตอบ: "หน้าความประพฤติควรจัดวางอย่างไร ให้ชื่อพฤติกรรมและรายละเอียดเหตุการณ์
 * แสดงได้ครบโดยไม่ถูกตัด" — ของเดิมบีบรายการไว้ในคอลัมน์กว้างตายตัวข้างแถบฟอร์มด้านขวา
 * เหลือที่ให้ข้อความราว 400px จึงต้อง truncate ทิ้ง
 *
 * ไฟล์นี้เก็บเฉพาะ "เนื้อหา" ที่ใช้ซ้ำ (ฟอร์ม, การ์ดสถิติ, ป้าย) ส่วน "การจัดวาง"
 * เป็นหน้าที่ของแต่ละ variant ซึ่งเป็นสิ่งที่กำลังเปรียบเทียบกัน
 */

import { useState } from "react";
import { ImagePlus, QrCode, ScanLine, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatThaiDate } from "@/lib/format";
import { resizeImage } from "@/lib/image";
import { DEMO_TODAY } from "@/lib/mock-data";
import { shiftDate } from "@/lib/periods";
import { behaviorRules, useStore } from "@/lib/store";
import type { BehaviorRecord, BehaviorRule, Student } from "@/lib/types";

export const SEVERITY_LABEL: Record<BehaviorRule["severity"], string> = {
  minor: "เล็กน้อย",
  moderate: "ปานกลาง",
  severe: "ร้ายแรง",
  positive: "คะแนนบวก",
};

/** รูปหลักฐานต่อหนึ่งบันทึก — PROTOTYPE: จำนวนยังไม่ได้ตกลงกับทีม */
export const MAX_EVIDENCE = 3;

export function ruleOf(ruleId: string) {
  return behaviorRules.find((r) => r.ruleId === ruleId);
}

/**
 * แบบบันทึกพฤติกรรม (UC7 ข้อ 3–8): เลือกนักเรียนหนึ่งคนหรือหลายคน → พฤติกรรม → รายละเอียด วันที่ และหลักฐาน
 * → ดูคะแนนก่อนและหลังของแต่ละคน → บันทึก
 * เลือกนักเรียนได้ 2 วิธีในฟอร์มเดียวกัน: ค้นหารายชื่อ หรือสแกนบัตร (Subflow A) ทั้งสองวิธีใส่รายชื่อชุดเดียวกัน
 */
export function useBehaviorForm() {
  const store = useStore();
  const [studentIds, setStudentIds] = useState<string[]>([]);
  /** คนที่ได้มาจากการสแกนบัตร ใช้ระบุที่มาของบันทึก */
  const [scannedIds, setScannedIds] = useState<string[]>([]);
  const [ruleId, setRuleId] = useState("");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState(DEMO_TODAY);
  const [evidence, setEvidence] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  const canSave = studentIds.length > 0 && ruleId !== "" && occurredOn !== "";

  const toggleStudent = (id: string) =>
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const addScanned = (id: string) => {
    setStudentIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setScannedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const save = () => {
    const base = { ruleId, description: description.trim() || "-", occurredOn, evidence };
    const scanned = studentIds.filter((id) => scannedIds.includes(id));
    const listed = studentIds.filter((id) => !scannedIds.includes(id));
    if (scanned.length > 0) store.addBehaviorRecord({ ...base, studentIds: scanned, source: "card_scan" });
    if (listed.length > 0) store.addBehaviorRecord({ ...base, studentIds: listed });
    setSavedCount(studentIds.length);
    // เก็บพฤติกรรมและวันที่ไว้ เผื่อบันทึกเรื่องเดียวกันให้คนอื่นต่อ
    setStudentIds([]);
    setScannedIds([]);
    setDescription("");
    setEvidence([]);
    setTimeout(() => setSavedCount(0), 3000);
  };

  return {
    studentIds,
    setStudentIds,
    toggleStudent,
    addScanned,
    ruleId,
    setRuleId,
    description,
    setDescription,
    occurredOn,
    setOccurredOn,
    evidence,
    setEvidence,
    savedCount,
    canSave,
    save,
  };
}

export type BehaviorForm = ReturnType<typeof useBehaviorForm>;

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export function NewRecordFields({ form }: { form: BehaviorForm }) {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"search" | "scan">("search");
  const rule = ruleOf(form.ruleId);
  const q = query.trim();
  const visible = store.students.filter(
    (s) => q === "" || s.fullName.includes(q) || s.studentId.includes(q) || String(s.classNo) === q
  );
  const allVisibleSelected = visible.length > 0 && visible.every((s) => form.studentIds.includes(s.studentId));

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_EVIDENCE - form.evidence.length;
    const resized = await Promise.all([...files].slice(0, room).map((f) => resizeImage(f)));
    form.setEvidence((prev) => [...prev, ...resized]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>นักเรียน</Label>
          <span className="text-[12px] text-muted-foreground">
            เลือกแล้ว {form.studentIds.length} คน
            {form.studentIds.length > 0 && (
              <button type="button" onClick={() => form.setStudentIds([])} className="ml-2 text-primary hover:underline">
                ล้าง
              </button>
            )}
          </span>
        </div>
        <div className="flex rounded-lg border border-border p-1" role="group" aria-label="วิธีเลือกนักเรียน">
          {(
            [
              { key: "search", label: "ค้นหารายชื่อ", icon: Search },
              { key: "scan", label: "สแกนบัตร", icon: ScanLine },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
              className={
                mode === key
                  ? "flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent py-1.5 text-[13px] font-semibold text-primary"
                  : "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[13px] text-muted-foreground hover:bg-muted"
              }
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        {mode === "scan" ? (
          <CardScanner form={form} onSearchInstead={() => setMode("search")} />
        ) : (
          <>
          <Input
            id="student-search"
            aria-label="ค้นหานักเรียน"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อ เลขที่ หรือเลขประจำตัว"
          />
          <div className="max-h-52 overflow-y-auto rounded-lg border border-border">
            <label className="flex cursor-pointer items-center gap-2.5 border-b border-border bg-surface px-3 py-2 text-[13px] font-medium">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={() => {
                  const ids = visible.map((s) => s.studentId);
                  form.setStudentIds((prev) =>
                    allVisibleSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]
                  );
                }}
              />
              {q === "" ? "เลือกทั้งห้อง" : `เลือกทั้งหมดที่ค้นพบ (${visible.length})`}
            </label>
            {visible.map((s) => (
              <label key={s.studentId} className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-muted/50">
                <Checkbox checked={form.studentIds.includes(s.studentId)} onCheckedChange={() => form.toggleStudent(s.studentId)} />
                <span className="flex-1">{s.fullName}</span>
                <span className="text-[12px] text-muted-foreground">เลขที่ {s.classNo}</span>
              </label>
            ))}
            {visible.length === 0 && <p className="px-3 py-3 text-[13px] text-muted-foreground">ไม่พบนักเรียน</p>}
          </div>
          </>
        )}

        {mode === "scan" && form.studentIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {form.studentIds.map((id) => (
              <span key={id} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[12px]">
                {store.getStudent(id)?.fullName}
                <button type="button" aria-label="เอาออก" onClick={() => form.toggleStudent(id)}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule">ประเภทพฤติกรรม</Label>
        <select
          id="rule"
          value={form.ruleId}
          onChange={(e) => form.setRuleId(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">เลือกจากกฎความประพฤติ...</option>
          {behaviorRules.map((r) => (
            <option key={r.ruleId} value={r.ruleId}>
              {r.name} ({signed(r.scoreDelta)}{r.severity !== "positive" && ` · ${SEVERITY_LABEL[r.severity]}`})
            </option>
          ))}
        </select>
        <details className="text-[12.5px]">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            ดูกฎทั้งหมด (กำหนดโดยแอดมิน)
          </summary>
          <div className="mt-1.5 rounded-lg border border-border px-3">
            <RulesList />
          </div>
        </details>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="occurred-on">วันที่เกิดเหตุ</Label>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "วันนี้", date: DEMO_TODAY },
            { label: "เมื่อวาน", date: shiftDate(DEMO_TODAY, -1) },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={form.occurredOn === o.date}
              onClick={() => form.setOccurredOn(o.date)}
              className={
                form.occurredOn === o.date
                  ? "rounded-lg border border-primary bg-accent px-3 py-1.5 text-[13px] font-semibold text-primary"
                  : "rounded-lg border border-border px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-muted"
              }
            >
              {o.label}
            </button>
          ))}
          <Input
            id="occurred-on"
            type="date"
            value={form.occurredOn}
            max={DEMO_TODAY}
            onChange={(e) => form.setOccurredOn(e.target.value)}
            className="w-44"
          />
        </div>
        {form.occurredOn && <p className="text-[12px] text-muted-foreground">{formatThaiDate(form.occurredOn)}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="desc">รายละเอียดเหตุการณ์</Label>
        <Textarea
          id="desc"
          value={form.description}
          onChange={(e) => form.setDescription(e.target.value)}
          placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label>
          หลักฐาน <span className="font-normal text-muted-foreground">(ไม่บังคับ · ไม่เกิน {MAX_EVIDENCE} รูป)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {form.evidence.map((src, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL ในต้นแบบ ใช้ next/image ไม่ได้ */}
              <img src={src} alt={`หลักฐาน ${i + 1}`} className="size-16 rounded-lg border border-border object-cover" />
              <button
                type="button"
                aria-label={`ลบหลักฐาน ${i + 1}`}
                onClick={() => form.setEvidence((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {form.evidence.length < MAX_EVIDENCE && (
            <label className="flex size-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-border text-[11px] text-muted-foreground hover:bg-muted">
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

      {rule && form.studentIds.length > 0 && (
        <div className="rounded-lg bg-surface p-3">
          <div className="mb-1.5 text-[12.5px] font-semibold">คะแนนความประพฤติก่อน → หลังบันทึก</div>
          <div className="max-h-36 space-y-1 overflow-y-auto text-[13px]">
            {form.studentIds.map((id) => {
              const s = store.getStudent(id);
              const before = store.behaviorScoreOf(id);
              return (
                <div key={id} className="flex justify-between gap-3">
                  <span className="truncate">{s?.fullName}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {signed(before)} → <b className="text-foreground">{signed(before + rule.scoreDelta)}</b>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button className="w-full" onClick={form.save} disabled={!form.canSave}>
        บันทึกพฤติกรรม{form.studentIds.length > 1 && ` (${form.studentIds.length} คน)`}
      </Button>

      {form.savedCount > 0 && (
        <p className="rounded-lg bg-accent px-3 py-2 text-center text-[12.5px] font-semibold text-accent-foreground">
          บันทึกให้ {form.savedCount} คนแล้ว
        </p>
      )}
    </div>
  );
}

/**
 * สแกนบัตรนักเรียน (UC7 Subflow A): สแกน → ระบบแสดงนักเรียน → ครูยืนยัน → เพิ่มเข้ารายชื่อในฟอร์ม แล้วสแกนคนต่อไปได้
 * ไม่พบนักเรียนจากบัตร → แจ้งให้สแกนใหม่หรือค้นหาจากรายชื่อ (Alternate Flow C)
 * PROTOTYPE: ยังไม่มีกล้อง พิมพ์เลขประจำตัวหรือกดรายชื่อตัวอย่างแทนการสแกน
 */
function CardScanner({ form, onSearchInstead }: { form: BehaviorForm; onSearchInstead: () => void }) {
  const store = useStore();
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Student | null>(null);
  const [notFound, setNotFound] = useState("");

  const scan = (value: string) => {
    const student = store.getStudent(value.trim());
    setCode("");
    setFound(student ?? null);
    setNotFound(student ? "" : value.trim());
  };

  if (found) {
    return (
      <div className="rounded-lg border border-primary/40 bg-accent/40 p-3">
        <div className="text-[12px] text-muted-foreground">ใช่นักเรียนคนนี้ไหม</div>
        <div className="mt-0.5 text-[14px] font-semibold">{found.fullName}</div>
        <div className="text-[12px] text-muted-foreground">
          {found.roomName} เลขที่ {found.classNo} · เลขประจำตัว {found.studentId}
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              form.addScanned(found.studentId);
              setFound(null);
            }}
          >
            ใช่ เพิ่มในรายชื่อ
          </Button>
          <Button size="sm" variant="outline" onClick={() => setFound(null)}>
            ไม่ใช่ สแกนใหม่
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <QrCode className="size-4" /> สแกนบัตรทีละใบ · โหมดจำลอง: พิมพ์เลขประจำตัวแทน
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          aria-label="เลขประจำตัวนักเรียนจากบัตร"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && code && scan(code)}
          placeholder="เช่น 30125"
        />
        <Button variant="outline" onClick={() => code && scan(code)} disabled={!code}>
          <ScanLine className="size-4" /> สแกน
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {store.students.slice(0, 4).map((s) => (
          <button
            key={s.studentId}
            type="button"
            onClick={() => scan(s.studentId)}
            className="rounded-md bg-muted px-2 py-1 text-[11.5px] text-muted-foreground hover:bg-muted/70"
          >
            {s.studentId}
          </button>
        ))}
      </div>
      {notFound && (
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          ไม่พบนักเรียนจากบัตร “{notFound}” ลองสแกนใหม่ หรือ{" "}
          <button type="button" onClick={onSearchInstead} className="font-semibold text-primary hover:underline">
            ค้นหาจากรายชื่อ
          </button>
        </p>
      )}
    </div>
  );
}

export function RulesList() {
  return (
    <div className="divide-y divide-border">
      {behaviorRules.map((rule) => (
        <div key={rule.ruleId} className="flex items-center justify-between py-2.5">
          <div>
            <div className="text-[13.5px] font-medium">{rule.name}</div>
            <div className="text-[11.5px] text-muted-foreground">
              ระดับ: {SEVERITY_LABEL[rule.severity]}
            </div>
          </div>
          <span
            className={
              rule.scoreDelta > 0
                ? "text-sm font-bold text-risk-green"
                : "text-sm font-bold text-risk-red"
            }
          >
            {rule.scoreDelta > 0 ? `+${rule.scoreDelta}` : rule.scoreDelta}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[13px] font-semibold text-muted-foreground">{label}</div>
        <div className={accent ? "mt-2 text-2xl font-bold text-primary" : "mt-2 text-2xl font-bold"}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

/** ที่มาของบันทึก และรูปหลักฐานย่อ (ถ้ามี) */
export function SourceBadge({ source, evidence }: { source: BehaviorRecord["source"]; evidence?: string[] }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      <span
        className={
          source === "card_scan"
            ? "rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-primary"
            : "rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground"
        }
      >
        {source === "card_scan" ? "สแกนบัตร" : "เลือกจากรายชื่อ"}
      </span>
      {evidence?.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- รูปจากเครื่องผู้ใช้ (data URL) ไม่ผ่าน next/image
        <img key={i} src={src} alt={`หลักฐาน ${i + 1}`} className="size-7 rounded border border-border object-cover" />
      ))}
    </span>
  );
}

export function ScoreChip({ delta, size = "md" }: { delta: number; size?: "md" | "lg" }) {
  const positive = delta > 0;
  return (
    <span
      className={`shrink-0 rounded-md text-center font-bold ${
        size === "lg" ? "px-3 py-1.5 text-base" : "w-12 py-1 text-sm"
      } ${positive ? "bg-risk-green-bg text-risk-green" : "bg-risk-red-bg text-risk-red"}`}
    >
      {positive ? `+${delta}` : delta}
    </span>
  );
}
