"use client";

/**
 * PROTOTYPE ONLY — กลไก "ถามยืนยันก่อนปิด-เปิด" 3 แบบ (ทิ้งได้)
 *
 * คำถามที่ตอบ: การสลับสวิตช์ในหน้าตั้งค่าควรถามยืนยันแบบไหน จึงกันการกดพลาดได้
 * โดยไม่ทำให้ผู้ดูแลระบบที่ต้องแก้หลายรายการรำคาญจนเลิกใช้
 *
 * A = กล่องยืนยันกลางจอ (หยุดทุกอย่าง ต้องตัดสินใจ)
 * B = ยืนยันในที่ (ไม่เสียบริบท ยังเห็นรายการรอบ ๆ)
 * C = ทำทันทีแล้วให้ถอนคืนได้ (ไม่มีแรงเสียดทาน แต่การกระทำเกิดขึ้นจริงแล้ว)
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ConfirmStyle = "A" | "B" | "C";

export const CONFIRM_VARIANTS = [
  { key: "A", name: "กล่องยืนยันกลางจอ" },
  { key: "B", name: "ยืนยันในที่" },
  { key: "C", name: "ทำทันที + ถอนคืนได้" },
];

export interface ConfirmRequest {
  /** ไอดีประจำจุดที่กด ใช้ให้แบบ B รู้ว่าต้องแสดงแถบยืนยันตรงไหน */
  id: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  /** ข้อความที่ขึ้นบน toast ของแบบ C หลังทำไปแล้ว */
  doneLabel?: string;
  danger?: boolean;
  apply: () => void;
  /** การถอนคืน ถ้าไม่ระบุจะถือว่าเรียก apply ซ้ำได้ (สวิตช์เปิด-ปิดเป็นแบบนั้น) */
  undo?: () => void;
}

interface ConfirmValue {
  style: ConfirmStyle;
  request: (req: ConfirmRequest) => void;
  /** แบบ B: คืน JSX แถบยืนยันถ้าจุดนี้กำลังรอยืนยันอยู่ */
  inlineFor: (id: string) => ReactNode;
  pendingId: string | null;
}

const Ctx = createContext<ConfirmValue | null>(null);

export function useConfirm() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConfirm ต้องอยู่ภายใต้ ConfirmProvider");
  return ctx;
}

interface Toast {
  key: number;
  message: string;
  undo: () => void;
}

const UNDO_SECONDS = 8;

export function ConfirmProvider({
  style,
  children,
}: {
  style: ConfirmStyle;
  children: ReactNode;
}) {
  const [pending, setPending] = useState<ConfirmRequest | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  const request = useCallback(
    (req: ConfirmRequest) => {
      if (style === "C") {
        req.apply();
        const key = ++toastSeq.current;
        setToasts((prev) => [
          ...prev,
          {
            key,
            message: req.doneLabel ?? req.title,
            undo: req.undo ?? req.apply,
          },
        ]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.key !== key)), UNDO_SECONDS * 1000);
        return;
      }
      setPending(req);
    },
    [style]
  );

  const confirmPending = () => {
    pending?.apply();
    setPending(null);
  };

  useEffect(() => {
    if (style !== "A" || !pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPending(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [style, pending]);

  const inlineFor = useCallback(
    (id: string): ReactNode => {
      if (style !== "B" || pending?.id !== id) return null;
      return (
        <div className="mt-2 rounded-xl border border-risk-amber bg-risk-amber-bg p-3">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-risk-amber" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-risk-amber">{pending.title}</p>
              {pending.description && (
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-risk-amber">
                  {pending.description}
                </p>
              )}
              <div className="mt-2.5 flex gap-2">
                <Button size="sm" onClick={confirmPending}>
                  {pending.confirmLabel ?? "ยืนยัน"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                  ยกเลิก
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    },
    // confirmPending อ่านค่า pending ล่าสุดอยู่แล้วผ่าน closure ของ render รอบนี้
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [style, pending]
  );

  return (
    <Ctx.Provider value={{ style, request, inlineFor, pendingId: pending?.id ?? null }}>
      {children}

      {style === "A" && pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  pending.danger ? "bg-risk-red-bg text-risk-red" : "bg-accent text-primary"
                }`}
              >
                <AlertTriangle className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15.5px] font-bold">{pending.title}</h2>
                {pending.description && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {pending.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="ปิด"
                onClick={() => setPending(null)}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button size="lg" variant="ghost" onClick={() => setPending(null)}>
                ยกเลิก
              </Button>
              <Button
                size="lg"
                variant={pending.danger ? "destructive" : "default"}
                onClick={confirmPending}
              >
                {pending.confirmLabel ?? "ยืนยัน"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {style === "C" && toasts.length > 0 && (
        <div className="fixed bottom-28 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-6">
          {toasts.map((t) => (
            <div
              key={t.key}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xl"
            >
              <span className="min-w-0 flex-1 text-[13px]">{t.message}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  t.undo();
                  setToasts((prev) => prev.filter((x) => x.key !== t.key));
                }}
              >
                <Undo2 className="size-3.5" /> เลิกทำ
              </Button>
            </div>
          ))}
        </div>
      )}
    </Ctx.Provider>
  );
}
