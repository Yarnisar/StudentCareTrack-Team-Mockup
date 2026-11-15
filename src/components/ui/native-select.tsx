import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "cn"

/**
 * dropdown ของเบราว์เซอร์ — บนมือถือจะเปิดตัวเลือกของระบบปฏิบัติการ เลือกง่ายกว่าเมนูที่วาดเอง
 * ใช้กับตัวเลือกที่แน่นอนและมีหลายตัว (ประมาณ 7 ขึ้นไป) ถ้ามีไม่กี่ตัวให้ใช้ปุ่มตัวเลือกแทน
 */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        data-slot="native-select"
        className="h-10 w-full min-w-0 appearance-none rounded-lg border border-input bg-card py-1 pr-9 pl-3 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { NativeSelect }
