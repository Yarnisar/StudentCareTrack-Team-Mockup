import { cn } from "cn";

/**
 * ลำดับการประเมินสุขภาพจิต
 * - ภาคเรียนที่ 1 (หรือนักเรียนที่ยังไม่เคยประเมิน): Red Flag → 9S → SDQ ครั้งที่ N
 * - ภาคเรียนที่ 2 ที่ใช้ผล Red Flag/9S จากภาคเรียนที่ 1 (carried): สองขั้นแรกแสดงว่า "ภาคเรียนที่ 1" แล้ว
 * - skipNineS: Red Flag ควรดูแล ข้าม 9S ไป SDQ
 */
export function StepIndicator({
  current,
  round = 1,
  carried = false,
  skipNineS = false,
}: {
  current: 1 | 2 | 3;
  round?: 1 | 2;
  carried?: boolean;
  skipNineS?: boolean;
}) {
  const steps = [
    { label: "Red Flag", note: carried ? "ภาคเรียนที่ 1" : null },
    { label: "9S", note: skipNineS ? "ข้าม" : carried ? "ภาคเรียนที่ 1" : null },
    { label: `SDQ ครั้งที่ ${round}`, note: null },
  ];
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {steps.map((s, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current || (carried && step < 3);
        return (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px]",
                active
                  ? "bg-primary font-semibold text-primary-foreground"
                  : done
                    ? "bg-risk-green-bg font-semibold text-risk-green"
                    : "bg-muted font-medium text-muted-foreground"
              )}
            >
              {step}. {s.label}
              {s.note && <span className="ml-1 text-[12px] font-normal opacity-80">({s.note})</span>}
            </span>
            {i < steps.length - 1 && <span className="h-px w-6 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
