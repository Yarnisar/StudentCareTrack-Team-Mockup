"use client";

/**
 * แผงสาธิต — การ์ดลอยมุมขวาล่าง (จอกว้าง) / ปุ่มกลม + bottom sheet (จอโทรศัพท์)
 * - สวมบทบาทเป็น: เลือกกลุ่ม 4 กลุ่ม (ผู้ดูแลระบบ / ครู / นักเรียน / ผู้ปกครอง) แล้วสลับผู้ใช้โดยไม่ reload
 *   — เมื่อเลือกครูจะแบ่งต่อเป็นครูประจำชั้น / ครูทั่วไป
 * - เครื่องมือของหน้านี้: ปุ่มที่หน้าลงทะเบียนผ่าน useDemoPageTool (lib/demo/page-tools.ts)
 * แสดงทุก build; ซ่อนทั้งหมดด้วย ?demo=0 จำเฉพาะผู้ใช้ที่เลือกและสถานะย่อ/ขยายข้าม reload
 */

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronDown, FlaskConical, Wrench, X } from "lucide-react";
import { cn } from "cn";
import { demoUsers, useSwitchUser } from "@/components/layout/role-switcher";
import { useDemoPageTools } from "@/lib/demo/page-tools";
import { storedPanelCollapsed } from "@/lib/demo/persisted";
import { initialOf } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { User, UserRole } from "@/lib/types";

type RoleTab = "admin" | "teacher" | "student" | "parent";
type TeacherKind = "homeroom" | "general";

/** ระดับแรกของแผง: 4 กลุ่มผู้ใช้ — ครูแบ่งต่อเป็นครูประจำชั้น / ครูทั่วไปเมื่อเลือกครู */
const ROLE_TABS: { id: RoleTab; label: string; roles: UserRole[] }[] = [
  { id: "admin", label: "ผู้ดูแลระบบ", roles: ["admin_school"] },
  { id: "teacher", label: "ครู", roles: ["teacher_homeroom", "teacher_general"] },
  { id: "student", label: "นักเรียน", roles: ["student"] },
  { id: "parent", label: "ผู้ปกครอง", roles: ["parent"] },
];

const TEACHER_KINDS: { id: TeacherKind; label: string; role: UserRole }[] = [
  { id: "homeroom", label: "ครูประจำชั้น", role: "teacher_homeroom" },
  { id: "general", label: "ครูทั่วไป", role: "teacher_general" },
];

const tabOfRole = (role: UserRole) => ROLE_TABS.find((t) => t.roles.includes(role))?.id ?? "admin";

const PHONE_QUERY = "(max-width: 639px)";

const noopSubscribe = () => () => {};

function subscribePhone(listener: () => void) {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

export function DemoPanel() {
  return (
    <Suspense fallback={null}>
      <DemoPanelGate />
    </Suspense>
  );
}

function DemoPanelGate() {
  const params = useSearchParams();
  // แสดงหลัง hydrate เท่านั้น — ค่าที่จำไว้และขนาดจอรู้ได้เฉพาะฝั่ง client
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
  const isPhone = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false
  );

  if (!isClient || params.get("demo") === "0") return null;
  return isPhone ? <PhonePanel /> : <FloatingPanel />;
}

/* ---------- จอกว้าง ---------- */

function FloatingPanel() {
  const collapsed =
    useSyncExternalStore(storedPanelCollapsed.subscribe, storedPanelCollapsed.get, () => null) === "1";

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => storedPanelCollapsed.set("0")}
        className="fixed right-4 bottom-4 z-50 flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-[12.5px] font-semibold shadow-lg hover:bg-muted print:hidden"
      >
        <FlaskConical className="size-4 text-primary" />
        แผงสาธิต
      </button>
    );
  }

  return (
    <aside
      aria-label="แผงสาธิต"
      className="fixed right-4 bottom-4 z-50 flex max-h-[calc(100vh-2rem)] w-80 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl print:hidden"
    >
      <PanelHeader>
        <button
          type="button"
          onClick={() => storedPanelCollapsed.set("1")}
          aria-label="ย่อแผงสาธิต"
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronDown className="size-4" />
        </button>
      </PanelHeader>
      <PanelBody />
    </aside>
  );
}

/* ---------- จอโทรศัพท์ ---------- */

function PhonePanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="เปิดแผงสาธิต"
        className="fixed right-4 bottom-24 z-50 flex size-11 items-center justify-center rounded-full border border-border bg-card shadow-lg print:hidden"
      >
        <FlaskConical className="size-5 text-primary" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 print:hidden">
      <button
        type="button"
        aria-label="ปิดแผงสาธิต"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/30"
      />
      <div
        role="dialog"
        aria-label="แผงสาธิต"
        className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl bg-card shadow-xl"
      >
        <PanelHeader>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="ปิดแผงสาธิต"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </PanelHeader>
        <PanelBody onAction={() => setOpen(false)} />
      </div>
    </div>
  );
}

/* ---------- เนื้อหาร่วม ---------- */

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
      <FlaskConical className="size-4 text-primary" />
      <span className="flex-1 text-[13.5px] font-bold">แผงสาธิต</span>
      {children}
    </div>
  );
}

/** onAction: เรียกหลังสลับผู้ใช้หรือกดเครื่องมือ (bottom sheet ใช้ปิดตัวเอง) */
function PanelBody({ onAction }: { onAction?: () => void }) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
      <UserSection onAction={onAction} />
      <ToolsSection onAction={onAction} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1.5 px-1 text-[11px] font-semibold tracking-wide text-muted-foreground">{children}</h3>
  );
}

function UserSection({ onAction }: { onAction?: () => void }) {
  const store = useStore();
  const switchUser = useSwitchUser();
  const options = demoUsers(store.users);
  const current = store.currentUser;

  // กลุ่มที่กำลังเปิดดู: ตามผู้ใช้ปัจจุบันจนกว่าจะกดเลือกกลุ่มอื่น (คำนวณระหว่าง render ไม่ใช้ effect)
  const [pickedTab, setPickedTab] = useState<RoleTab | null>(null);
  const [pickedKind, setPickedKind] = useState<TeacherKind | null>(null);
  const tab = pickedTab ?? tabOfRole(current.role);
  const kind: TeacherKind = pickedKind ?? (current.role === "teacher_general" ? "general" : "homeroom");

  const rolesShown: UserRole[] =
    tab === "teacher"
      ? [TEACHER_KINDS.find((k) => k.id === kind)!.role]
      : ROLE_TABS.find((t) => t.id === tab)!.roles;
  const rows = options.filter(({ user }) => rolesShown.includes(user.role));

  const pick = (user: User) => {
    setPickedTab(null);
    setPickedKind(null);
    if (user.userId !== current.userId) switchUser(user, { stay: true });
    onAction?.();
  };

  const chooseTab = (next: RoleTab) => {
    const tabRoles = ROLE_TABS.find((t) => t.id === next)!.roles;
    const only = options.filter(({ user }) => tabRoles.includes(user.role));
    // กลุ่มที่มีผู้ใช้สาธิตคนเดียว (นักเรียน) สลับให้เลย
    if (only.length === 1) pick(only[0].user);
    else {
      setPickedTab(next);
      setPickedKind(null);
    }
  };

  return (
    <section>
      <SectionTitle>สวมบทบาทเป็น</SectionTitle>

      <div role="tablist" aria-label="กลุ่มผู้ใช้" className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
        {ROLE_TABS.map((t) => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => chooseTab(t.id)}
              className={cn(
                "rounded-lg px-1 py-1.5 text-[12px] font-semibold transition-colors",
                selected ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "teacher" && (
        <div role="tablist" aria-label="ประเภทครู" className="mt-2 grid grid-cols-2 gap-1">
          {TEACHER_KINDS.map((k) => {
            const selected = k.id === kind;
            return (
              <button
                key={k.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setPickedKind(k.id)}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-[12px] font-semibold transition-colors",
                  selected
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {k.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-2 space-y-0.5">
        {rows.map(({ user, note }) => {
          const active = user.userId === current.userId;
          return (
            <button
              key={user.userId}
              type="button"
              onClick={() => pick(user)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                active ? "bg-accent ring-1 ring-primary/40" : "hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {initialOf(user.name.replace(/^ครู/, ""))}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-[13px] font-semibold", active && "text-accent-foreground")}>
                  {user.name}
                </span>
                <span className="block truncate text-[11.5px] text-muted-foreground" title={note}>
                  {note}
                </span>
              </span>
              {active && <Check className="size-4 shrink-0 text-primary" />}
            </button>
          );
        })}
        {rows.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-[12px] text-muted-foreground">
            ไม่มีผู้ใช้สาธิตในกลุ่มนี้
          </p>
        )}
      </div>
    </section>
  );
}

function ToolsSection({ onAction }: { onAction?: () => void }) {
  const tools = useDemoPageTools();

  return (
    <section>
      <SectionTitle>เครื่องมือของหน้านี้</SectionTitle>
      {tools.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-[12px] text-muted-foreground">
          หน้านี้ไม่มีเครื่องมือกรอกข้อมูล
        </p>
      ) : (
        <div className="space-y-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => {
                tool.run();
                onAction?.();
              }}
              className="flex w-full items-start gap-2.5 rounded-lg border border-border px-2.5 py-2 text-left hover:bg-muted"
            >
              <Wrench className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold">{tool.label}</span>
                {tool.description && (
                  <span className="block text-[11.5px] text-muted-foreground">{tool.description}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
