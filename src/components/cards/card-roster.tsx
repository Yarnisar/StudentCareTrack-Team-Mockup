"use client";

import { useState } from "react";
import { AlertTriangle, BadgeCheck, CreditCard, RotateCcw, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PagerNumbered, usePagination } from "@/components/shared/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatThaiDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { ID_CARD_STATUS_LABEL, REVOKE_REASONS, type IdCard } from "@/lib/types";

/** แสดงรหัส QR เพียงบางส่วน — รหัสเต็มใช้ยืนยันตัวตนได้ จึงไม่แสดงเป็นข้อความในตาราง */
const maskToken = (token: string) => `••••${token.slice(-4)}`;

type Pending = { mode: "revoke" | "reissue"; cardId: string; studentId: string };

/**
 * รายชื่อนักเรียนพร้อมสถานะบัตร — ออกบัตร / ออกบัตรใหม่ / เพิกถอน (เฉพาะแอดมิน)
 * การเพิกถอนต้องระบุเหตุผลเสมอ และไม่มีการลบบัตรออกจากระบบ
 */
export function CardRoster({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (cardId: string) => void;
}) {
  const store = useStore();
  const isAdmin = store.currentUser.role === "admin_school";
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const students = store.students.filter((s) => s.status === "studying");
  const [pageSize, setPageSize] = useState(10);
  const pager = usePagination(students, pageSize);

  const issue = (studentId: string) => {
    const result = store.issueCard(studentId);
    setMessage(
      result.ok
        ? { tone: "ok", text: `ออกบัตรใหม่ให้ ${store.getStudent(studentId)?.fullName} แล้ว` }
        : { tone: "error", text: result.error }
    );
  };

  const confirmPending = () => {
    if (!pending) return;
    const result =
      pending.mode === "revoke"
        ? store.revokeCard(pending.cardId, reason)
        : store.reissueCard(pending.studentId, reason);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.error });
      return;
    }
    setMessage({
      tone: "ok",
      text:
        pending.mode === "revoke"
          ? "เพิกถอนบัตรแล้ว (บัตรยังอยู่ในประวัติ ไม่ถูกลบ)"
          : "เพิกถอนใบเดิมและออกบัตรใหม่แล้ว",
    });
    setPending(null);
    setReason("");
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15.5px] font-bold">รายชื่อและสถานะบัตร</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              เลือกบัตรที่ต้องการพิมพ์ได้จากช่องด้านซ้าย · บัตรที่เลิกใช้จะถูกเพิกถอน ไม่ถูกลบ
            </p>
          </div>
          {!isAdmin && (
            <span className="rounded-full bg-muted px-3 py-1 text-[12.5px] text-muted-foreground">
              ออกบัตรได้เฉพาะแอดมินโรงเรียน
            </span>
          )}
        </div>

        {message && (
          <p
            className={
              message.tone === "ok"
                ? "mb-3 rounded-lg bg-risk-green-bg px-3 py-2 text-[13px] text-risk-green"
                : "mb-3 rounded-lg bg-risk-red-bg px-3 py-2 text-[13px] text-risk-red"
            }
          >
            {message.text}
          </p>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" aria-label="เลือกเพื่อพิมพ์" />
              <TableHead>นักเรียน</TableHead>
              <TableHead>สถานะบัตร</TableHead>
              <TableHead>รหัส QR</TableHead>
              <TableHead>ออกบัตรเมื่อ</TableHead>
              <TableHead className="text-right">การจัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pager.slice.map((student) => {
              const active = store.activeCardOfStudent(student.studentId);
              const history = store.cardsOfStudent(student.studentId);
              const status = store.cardStatusOfStudent(student.studentId);
              const open = expanded === student.studentId;

              return (
                <TableRow key={student.studentId}>
                  <TableCell>
                    {active && (
                      <Checkbox
                        checked={selected.includes(active.cardId)}
                        onCheckedChange={() => onToggle(active.cardId)}
                        aria-label={`เลือกบัตรของ ${student.fullName} เพื่อพิมพ์`}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{student.fullName}</div>
                    <div className="text-[12.5px] text-muted-foreground">
                      {student.roomName} เลขที่ {student.classNo}
                    </div>
                  </TableCell>
                  <TableCell>
                    {status === "active" && (
                      <Badge variant="secondary">
                        <BadgeCheck className="size-3.5" /> {ID_CARD_STATUS_LABEL.active}
                      </Badge>
                    )}
                    {status === "expired" && (
                      <Badge variant="outline">
                        <AlertTriangle className="size-3.5" /> หมดอายุ
                      </Badge>
                    )}
                    {status === "revoked" && (
                      <Badge variant="destructive">{ID_CARD_STATUS_LABEL.revoked}</Badge>
                    )}
                    {status === "none" && (
                      <Badge variant="outline">
                        <AlertTriangle className="size-3.5" /> ยังไม่มีบัตร
                      </Badge>
                    )}
                    {history.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : student.studentId)}
                        className="mt-1 block text-[12px] font-semibold text-primary hover:underline"
                      >
                        {open ? "ซ่อนประวัติบัตร" : `ประวัติบัตร ${history.length} ใบ`}
                      </button>
                    )}
                    {open && <CardHistory history={history} />}
                  </TableCell>
                  <TableCell className="font-mono text-[12.5px] text-muted-foreground">
                    {active ? maskToken(active.qrCode) : "—"}
                  </TableCell>
                  <TableCell className="text-[13px]">
                    {active ? formatThaiDate(active.issuedAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && !active && (
                      <Button size="sm" onClick={() => issue(student.studentId)}>
                        <CreditCard className="size-4" /> ออกบัตร
                      </Button>
                    )}
                    {isAdmin && active && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPending({
                              mode: "reissue",
                              cardId: active.cardId,
                              studentId: student.studentId,
                            });
                            setReason(REVOKE_REASONS[0]);
                          }}
                        >
                          <RotateCcw className="size-4" /> ออกใบใหม่
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setPending({
                              mode: "revoke",
                              cardId: active.cardId,
                              studentId: student.studentId,
                            });
                            setReason(REVOKE_REASONS[0]);
                          }}
                        >
                          <Ban className="size-4" /> เพิกถอน
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

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

        {pending && (
          <div className="mt-4 rounded-xl border border-border bg-surface p-4">
            <h3 className="text-[14px] font-bold">
              {pending.mode === "revoke" ? "ยืนยันการเพิกถอนบัตร" : "ยืนยันการออกบัตรใบใหม่"}
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {pending.mode === "revoke"
                ? "บัตรจะใช้สแกนไม่ได้ทันที แต่ยังเก็บไว้ในประวัติพร้อมเหตุผล"
                : "ระบบจะเพิกถอนใบเดิมพร้อมเหตุผล แล้วออกรหัส QR ใหม่ให้นักเรียน"}{" "}
              — {store.getStudent(pending.studentId)?.fullName}
            </p>
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="revoke-reason">เหตุผล (บังคับ)</Label>
              <div className="flex flex-wrap gap-1.5">
                {REVOKE_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={
                      reason === r
                        ? "rounded-full bg-primary px-3 py-1 text-[12.5px] font-semibold text-primary-foreground"
                        : "rounded-full bg-muted px-3 py-1 text-[12.5px] text-muted-foreground hover:bg-border"
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Input
                id="revoke-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ระบุเหตุผล"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={confirmPending} disabled={!reason.trim()}>
                ยืนยัน
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setPending(null);
                  setReason("");
                }}
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CardHistory({ history }: { history: IdCard[] }) {
  const store = useStore();
  return (
    <ul className="mt-2 space-y-1 border-l-2 border-border pl-3 text-[12px] text-muted-foreground">
      {history.map((card) => (
        <li key={card.cardId}>
          {formatThaiDate(card.issuedAt)} ·{" "}
          {card.status === "active" && store.isCardExpired(card)
            ? "หมดอายุ"
            : ID_CARD_STATUS_LABEL[card.status]}
          {card.status === "revoked" && card.revokedAt
            ? ` ${formatThaiDate(card.revokedAt)} (${card.revokeReason})`
            : ""}{" "}
          · ออกโดย {store.nameOf(card.issuedBy)}
        </li>
      ))}
    </ul>
  );
}
