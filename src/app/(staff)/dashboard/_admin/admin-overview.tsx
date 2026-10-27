"use client";

/**
 * ภาพรวมของแอดมินโรงเรียน: ตัวเลขรวม → ห้องที่ควรติดตาม → ความคืบหน้ารายห้อง
 * แอดมินติดตามเป็นรายห้องหรือรายครู ไม่ได้ตามนักเรียนทีละคน (งานรายคนอยู่ในภาพรวมของครูประจำชั้น)
 * ความคืบหน้าใช้สีกลาง เพราะสีเหลือง/แดงสงวนไว้สำหรับกลุ่มเสี่ยง/กลุ่มมีปัญหา
 */

import { useMemo, useState } from "react";
import { FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { RiskDot } from "@/components/shared/risk-badge";
import { PagerNumbered, usePagination } from "./pagination";
import {
  allRooms,
  roomIssues,
  SCREENING_TARGET,
  schoolTotals,
  STALE_CASE_DAYS,
  type RoomSummary,
} from "./school-data";

type SortKey = "room" | "progress" | "red";

const TARGET_PCT = Math.round(SCREENING_TARGET * 100);
const pctOf = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

export function AdminOverview() {
  const totals = schoolTotals();
  const issues = useMemo(() => roomIssues(), []);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<SortKey>("red");
  const [onlyLow, setOnlyLow] = useState(false);

  const rooms = useMemo(() => {
    const list = allRooms.filter((r) => !onlyLow || r.lowProgress);
    return [...list].sort((a, b) => {
      if (sort === "room") return a.room.localeCompare(b.room, "th");
      if (sort === "progress") return a.screened / a.total - b.screened / b.total;
      return b.red - a.red;
    });
  }, [sort, onlyLow]);

  const pager = usePagination(rooms, pageSize);
  const issuePager = usePagination(issues, 6);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3 text-[13px] text-muted-foreground">
        <FlaskConical className="mt-0.5 size-4 shrink-0" />
        <p>
          <b className="text-foreground">ข้อมูลจำลองทั้งโรงเรียน {totals.total.toLocaleString("th-TH")} คน</b>{" "}
          ใช้ทดสอบการแสดงข้อมูลจำนวนมาก ยังไม่เชื่อมกับข้อมูลในระบบ ทำงานในหน้าอื่นแล้วตัวเลขตรงนี้จะไม่เปลี่ยน
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <Kpi label="นักเรียนทั้งหมด" value={totals.total} unit="คน" />
        <Kpi
          label="คัดกรองแล้ว"
          value={pctOf(totals.screened, totals.total)}
          unit="%"
          note={`${totals.screened.toLocaleString("th-TH")} คน`}
        />
        <Kpi label="กลุ่มเสี่ยง" value={totals.amber} unit="คน" tone="text-risk-amber" />
        <Kpi label="กลุ่มมีปัญหา" value={totals.red} unit="คน" tone="text-risk-red" />
        <Kpi
          label={`ห้องที่คัดกรองไม่ถึง ${TARGET_PCT}%`}
          value={totals.lowProgressRooms}
          unit={`จาก ${allRooms.length} ห้อง`}
        />
      </div>

      <Card className="mt-5">
        <CardContent className="p-6">
          <h2 className="text-[15.5px] font-bold">ห้องที่ควรติดตาม</h2>
          <p className="mt-0.5 mb-3 text-[12.5px] text-muted-foreground">
            เรียงจากเรื่องของนักเรียนกลุ่มมีปัญหาก่อน แล้วจึงความคืบหน้าการคัดกรอง · {issues.length} ห้อง
          </p>
          <div className="divide-y divide-border">
            {issuePager.slice.map(({ room, problemNoCase, staleCases }) => (
              <div key={room.room} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3">
                <span className="w-16 font-semibold">{room.room}</span>
                <span className="min-w-40 flex-1 text-[13px] text-muted-foreground">{room.teacher}</span>
                <span className="flex flex-wrap gap-1.5">
                  {problemNoCase > 0 && (
                    <IssueTag tone="red">กลุ่มมีปัญหายังไม่มี case {problemNoCase} คน</IssueTag>
                  )}
                  {staleCases > 0 && (
                    <IssueTag tone="red">
                      case ไม่มีการติดตามเกิน {STALE_CASE_DAYS} วัน {staleCases} case
                    </IssueTag>
                  )}
                  {room.lowProgress && (
                    <IssueTag tone="neutral">คัดกรองแล้ว {pctOf(room.screened, room.total)}%</IssueTag>
                  )}
                </span>
              </div>
            ))}
            {issues.length === 0 && (
              <p className="py-8 text-center text-[13px] text-muted-foreground">ไม่มีห้องที่ต้องติดตาม</p>
            )}
          </div>
          {issuePager.totalPages > 1 && (
            <PagerNumbered
              page={issuePager.page}
              totalPages={issuePager.totalPages}
              setPage={issuePager.setPage}
              from={issuePager.from}
              to={issuePager.to}
              total={issuePager.total}
            />
          )}
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-[15.5px] font-bold">ความคืบหน้ารายห้องเรียน</h2>
            <span className="flex-1" />
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
              <input
                type="checkbox"
                checked={onlyLow}
                onChange={(e) => {
                  setOnlyLow(e.target.checked);
                  pager.reset();
                }}
              />
              เฉพาะห้องที่คัดกรองไม่ถึง {TARGET_PCT}%
            </label>
            <NativeSelect
              aria-label="เรียงลำดับ"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortKey);
                pager.reset();
              }}
              className="w-60"
            >
              <option value="red">เรียงตามกลุ่มมีปัญหามากสุด</option>
              <option value="progress">เรียงตามคัดกรองน้อยสุด</option>
              <option value="room">เรียงตามชื่อห้อง</option>
            </NativeSelect>
          </div>

          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                <th className="w-24 py-2 font-medium">ห้อง</th>
                <th className="py-2 font-medium">ครูประจำชั้น</th>
                <th className="w-52 py-2 font-medium">ความคืบหน้าการคัดกรอง</th>
                <th className="w-20 py-2 text-center font-medium">ปกติ</th>
                <th className="w-20 py-2 text-center font-medium">เสี่ยง</th>
                <th className="w-20 py-2 text-center font-medium">มีปัญหา</th>
                <th className="w-24 py-2 text-center font-medium">case ที่เปิด</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((r) => (
                <RoomRow key={r.room} room={r} />
              ))}
            </tbody>
          </table>
          {pager.slice.length === 0 && (
            <p className="py-8 text-center text-[13px] text-muted-foreground">
              ไม่มีห้องตรงเงื่อนไข ลองเอาตัวกรองออก
            </p>
          )}

          <PagerNumbered
            page={pager.page}
            totalPages={pager.totalPages}
            setPage={pager.setPage}
            from={pager.from}
            to={pager.to}
            total={pager.total}
            pageSize={pageSize}
            onPageSize={(n) => {
              setPageSize(n);
              pager.reset();
            }}
          />
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent className="p-6">
          <h2 className="mb-3 text-[15.5px] font-bold">สัดส่วนผลคัดกรองของนักเรียนที่คัดกรองแล้ว</h2>
          <div className="flex h-5 overflow-hidden rounded-full bg-muted">
            <div className="bg-risk-green" style={{ width: `${pctOf(totals.green, totals.screened)}%` }} />
            <div className="bg-risk-amber" style={{ width: `${pctOf(totals.amber, totals.screened)}%` }} />
            <div className="bg-risk-red" style={{ width: `${pctOf(totals.red, totals.screened)}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-5 text-[13px]">
            <span className="flex items-center gap-1.5">
              <RiskDot group="green" /> ปกติ {totals.green.toLocaleString("th-TH")} คน
            </span>
            <span className="flex items-center gap-1.5">
              <RiskDot group="amber" /> เสี่ยง {totals.amber.toLocaleString("th-TH")} คน
            </span>
            <span className="flex items-center gap-1.5">
              <RiskDot group="red" /> มีปัญหา {totals.red.toLocaleString("th-TH")} คน
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RoomRow({ room: r }: { room: RoomSummary }) {
  const pct = pctOf(r.screened, r.total);
  return (
    <tr className="border-b border-border">
      <td className="py-2.5 font-semibold">{r.room}</td>
      <td className="py-2.5 text-muted-foreground">{r.teacher}</td>
      <td className="py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <span
            className={`w-24 shrink-0 text-[12px] ${
              r.lowProgress ? "font-semibold text-foreground" : "text-muted-foreground"
            }`}
          >
            {r.screened}/{r.total} ({pct}%)
          </span>
        </div>
      </td>
      <td className="py-2.5 text-center text-muted-foreground">{r.green}</td>
      <td className="py-2.5 text-center font-semibold text-risk-amber">{r.amber}</td>
      <td className="py-2.5 text-center font-bold text-risk-red">{r.red}</td>
      <td className="py-2.5 text-center text-muted-foreground">{r.openCases}</td>
    </tr>
  );
}

/** ป้ายปัญหาของห้อง: แดงเฉพาะเรื่องของนักเรียนกลุ่มมีปัญหา เรื่องความคืบหน้าใช้สีกลาง */
function IssueTag({ tone, children }: { tone: "red" | "neutral"; children: React.ReactNode }) {
  return (
    <span
      className={
        tone === "red"
          ? "rounded-md bg-risk-red-bg px-2 py-1 text-[12px] font-semibold text-risk-red"
          : "rounded-md bg-muted px-2 py-1 text-[12px] font-semibold text-muted-foreground"
      }
    >
      {children}
    </span>
  );
}

function Kpi({
  label,
  value,
  unit,
  note,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  note?: string;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[13px] font-semibold text-muted-foreground">{label}</div>
        <div className={`mt-2 text-3xl font-bold ${tone ?? ""}`}>
          {value.toLocaleString("th-TH")}{" "}
          <span className="text-[13px] font-medium text-muted-foreground">{unit}</span>
        </div>
        {note && <div className="mt-1 text-[12px] text-muted-foreground">{note}</div>}
      </CardContent>
    </Card>
  );
}
