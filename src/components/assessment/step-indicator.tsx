const STEPS = ["Red Flag", "9S", "SDQ"];

export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={
                active
                  ? "rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground"
                  : done
                    ? "rounded-full bg-risk-green-bg px-3.5 py-1.5 text-[13px] font-semibold text-risk-green"
                    : "rounded-full bg-muted px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground"
              }
            >
              {step}. {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
