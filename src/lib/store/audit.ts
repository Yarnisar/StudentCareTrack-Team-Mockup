/**
 * Audit slice: audit_logs (append-only — ไม่มี API แก้หรือลบ)
 *
 * ทุก mutation ในทุก slice ต้องเรียก logAudit()
 * VIEW_SENSITIVE: เรียก logSensitiveView() เมื่อแอดมิน/ผู้บริหารเปิดข้อมูลรายคน หรือเมื่อเปิดคำตอบรายข้อของ SDQ
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { seedAuditLogs } from "../mock-data";
import { nowThaiIso } from "../format";
import { AUDIT_ACTION_LABEL, type AuditAction, type AuditDetail, type AuditLog } from "../types";
import type { CoreSlice } from "./core";
import { nextId } from "./ids";

export interface AuditSlice {
  /** ใหม่สุดก่อน */
  auditLogs: AuditLog[];
  /**
   * เพิ่ม 1 แถวใน audit log ผู้กระทำ = currentUser เว้นแต่ส่ง userId (เช่น SYSTEM_USER_ID เมื่อระบบทำเอง)
   * entityType = ชื่อตาราง เช่น "behavior_records"
   */
  logAudit: (
    action: AuditAction,
    entityType: string,
    entityId: string,
    detail?: AuditDetail | null,
    userId?: string
  ) => AuditLog;
  /**
   * บันทึก VIEW_SENSITIVE ถ้าผู้ใช้ปัจจุบันเป็นแอดมิน/ผู้บริหาร (หรือ always = true เช่น เปิดคำตอบรายข้อ SDQ)
   * กันบันทึกซ้ำจากการ mount ซ้ำภายใน 5 วินาที — เรียกจาก useEffect ของหน้าได้เลย
   */
  logSensitiveView: (entityType: string, entityId: string, opts?: { always?: boolean; note?: string }) => void;
}

const VIEW_DEDUPE_MS = 5000;

/** ข้อความสั้นของ 1 แถว สำหรับรายการ audit log */
export function auditSummary(log: AuditLog): string {
  const parts = [`${AUDIT_ACTION_LABEL[log.action]} ${log.entityType} #${log.entityId}`];
  if (log.detail?.note) parts.push(log.detail.note);
  if (log.detail?.reason) parts.push(`เหตุผล: ${log.detail.reason}`);
  return parts.join(" · ");
}

export function useAuditSlice(core: CoreSlice): AuditSlice {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(seedAuditLogs);
  const lastViews = useRef(new Map<string, number>());
  const { currentUser } = core;

  // ฟังก์ชันคงที่ตราบเท่าที่ผู้ใช้ไม่เปลี่ยน (ไม่ขึ้นกับ auditLogs) — หน้าที่เรียกจาก useEffect จึงไม่ยิงซ้ำหลังทุกการบันทึก
  const logAudit = useCallback<AuditSlice["logAudit"]>(
    (action, entityType, entityId, detail = null, userId) => {
      const entry: AuditLog = {
        logId: nextId("AL"),
        userId: userId ?? currentUser.userId,
        action,
        entityType,
        entityId,
        detail,
        createdAt: nowThaiIso(),
      };
      setAuditLogs((prev) => [entry, ...prev]);
      return entry;
    },
    [currentUser]
  );

  const logSensitiveView = useCallback<AuditSlice["logSensitiveView"]>(
    (entityType, entityId, opts) => {
      if (!opts?.always && currentUser.role !== "admin_school") return;
      const key = `${currentUser.userId}|${entityType}|${entityId}`;
      // นาฬิกาจริงใช้เฉพาะกันบันทึกซ้ำจากการ mount ซ้ำ (เช่น StrictMode) ไม่ได้บันทึกลงข้อมูล
      const now = Date.now();
      const last = lastViews.current.get(key);
      if (last !== undefined && now - last < VIEW_DEDUPE_MS) return;
      lastViews.current.set(key, now);
      logAudit("VIEW_SENSITIVE", entityType, entityId, opts?.note ? { note: opts.note } : null);
    },
    [currentUser, logAudit]
  );

  return useMemo<AuditSlice>(
    () => ({ auditLogs, logAudit, logSensitiveView }),
    [auditLogs, logAudit, logSensitiveView]
  );
}
