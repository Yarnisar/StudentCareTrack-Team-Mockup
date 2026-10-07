"use client";

import { useId } from "react";
import { cn } from "cn";
import {
  NINE_S_CLUSTER_THRESHOLD,
  RED_FLAG_QUESTIONS,
  sdqRatersFor,
} from "@/lib/rules";
import { useStore } from "@/lib/store";
import { NINE_S_CLUSTER_LABEL, SDQ_RATER_LABEL, type SdqRater } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* สถานะของกล่อง/เส้นในแผนผัง                                           */
/* ------------------------------------------------------------------ */

type NodeState = "idle" | "active" | "done" | "skipped";

const NODE_FILL: Record<NodeState, string> = {
  idle: "fill-card stroke-border",
  active: "fill-accent stroke-primary",
  done: "fill-card stroke-primary",
  skipped: "fill-card stroke-border",
};

const NODE_TITLE_FILL: Record<NodeState, string> = {
  idle: "fill-foreground",
  active: "fill-accent-foreground",
  done: "fill-foreground",
  skipped: "fill-muted-foreground",
};

const shortRater = (r: SdqRater) =>
  SDQ_RATER_LABEL[r].replace("ประเมินตนเอง", "").replace("ประเมิน", "");

interface RoutePlan {
  round: 1 | 2;
  raters: SdqRater[];
  sdq2ForNormal: boolean;
  redFlag: NodeState;
  nineS: NodeState;
  endRound: NodeState;
  sdq: NodeState;
  result: NodeState;
  /** เส้นที่นักเรียนคนนี้เดินจริง */
  taken: Set<EdgeId>;
  /** ข้อความบอกว่าตอนนี้อยู่ขั้นไหน (null = แผนผังภาพรวม ไม่ได้อิงนักเรียนคนใด) */
  here: string | null;
}

type EdgeId = "rf-normal" | "rf-care" | "ns-normal" | "ns-care" | "normal-sdq" | "sdq-result";

/**
 * แผนผังเส้นทาง Red Flag → 9S → SDQ
 * - ไม่ส่ง studentId = แผนผังภาพรวมของกฎ
 * - ส่ง studentId = เน้นขั้นที่นักเรียนคนนั้นอยู่ และเส้นทางที่เดินมาแล้ว
 */
export function AssessmentRouteDiagram({
  studentId,
  className,
}: {
  studentId?: string;
  className?: string;
}) {
  const store = useStore();
  const uid = useId().replace(/:/g, "");
  const term = store.currentTerm;
  const sdq2ForNormal = store.schoolSettings.sdq2ForNormalStudents;
  const student = studentId ? store.getStudent(studentId) : undefined;
  const plan = studentId && student ? store.assessmentPlanOf(studentId) : null;

  const route: RoutePlan = (() => {
    const base = {
      round: term.semester,
      raters: sdqRatersFor(student?.gradeLevel ?? "ม.3"),
      sdq2ForNormal,
      taken: new Set<EdgeId>(),
      here: null as string | null,
    };
    if (!plan)
      return {
        ...base,
        redFlag: "idle" as NodeState,
        nineS: "idle" as NodeState,
        endRound: "idle" as NodeState,
        sdq: "idle" as NodeState,
        result: "idle" as NodeState,
      };

    const taken = new Set<EdgeId>();
    if (plan.redFlag?.result === "normal") taken.add("rf-normal");
    if (plan.redFlag?.result === "needs_care") taken.add("rf-care");
    if (plan.nineS?.result === "normal") taken.add("ns-normal");
    if (plan.nineS?.result === "needs_care") taken.add("ns-care");
    if (plan.nineS?.result === "normal" && plan.sdqRequired) taken.add("normal-sdq");
    if (plan.combined?.level) taken.add("sdq-result");

    const next = plan.next;
    return {
      ...base,
      round: plan.round,
      taken,
      here: HERE_TEXT[next] ?? null,
      redFlag: next === "red_flag" ? "active" : plan.redFlag ? "done" : "idle",
      nineS:
        next === "nine_s"
          ? "active"
          : plan.nineS
            ? "done"
            : plan.redFlag?.result === "needs_care"
              ? "skipped"
              : "idle",
      endRound: next === "not_required" ? "active" : "idle",
      sdq:
        next === "open_sdq" || next === "wait_sdq_window" || next === "sdq"
          ? "active"
          : plan.sdqForms.length > 0
            ? "done"
            : plan.sdqRequired
              ? "idle"
              : "skipped",
      result: next === "done" ? "active" : plan.combined?.level ? "done" : "idle",
    };
  })();

  const carriedNote =
    plan?.carriedFromEarlierTerm && route.round === 2
      ? "ใช้ผล Red Flag/9S จากภาคเรียนที่ 1 — ไม่ต้องทำซ้ำ"
      : null;

  const label = student
    ? `เส้นทางการประเมินสุขภาพจิตของ ${student.fullName}: Red Flag แล้วแยกเป็น 9S หรือ SDQ`
    : "เส้นทางการประเมินสุขภาพจิต: Red Flag แล้วแยกเป็น 9S หรือ SDQ ตามผล";

  const on = "stroke-primary";
  const off = "stroke-border";
  const edge = (id: EdgeId) => (route.taken.has(id) ? on : off);
  const head = (id: EdgeId) => `url(#${uid}-${route.taken.has(id) ? "on" : "off"})`;
  const w = (id: EdgeId) => (route.taken.has(id) ? 1.8 : 1.1);

  return (
    <figure className={cn("m-0", className)}>
      <svg
        viewBox="0 0 360 340"
        role="img"
        aria-label={label}
        className="h-auto w-full max-w-[560px]"
      >
        <defs>
          <marker id={`${uid}-on`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className="fill-primary" />
          </marker>
          <marker id={`${uid}-off`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className="fill-border" />
          </marker>
        </defs>

        {/* ---- กล่องที่ 1: Red Flag ---- */}
        <Node x={100} y={6} w={160} h={42} state={route.redFlag}>
          <NodeTitle x={180} y={25} state={route.redFlag}>
            แบบคัดกรอง Red Flag
          </NodeTitle>
          <NodeSub x={180} y={38}>
            {RED_FLAG_QUESTIONS.length} ข้อ · ตอบ “ใช่” ข้อเดียว = ควรดูแล
          </NodeSub>
        </Node>

        {/* ---- เส้น: Red Flag ปกติ → 9S ---- */}
        <path d="M150,48 V66 H105 V90" fill="none" className={edge("rf-normal")} strokeWidth={w("rf-normal")} markerEnd={head("rf-normal")} />
        <EdgeLabel x={126} y={62} anchor="middle" on={route.taken.has("rf-normal")}>
          ผลปกติ
        </EdgeLabel>

        {/* ---- เส้น: Red Flag ควรดูแล → ข้าม 9S ไป SDQ ---- */}
        <path d="M210,48 V66 H322 V178" fill="none" className={edge("rf-care")} strokeWidth={w("rf-care")} markerEnd={head("rf-care")} />
        <EdgeLabel x={264} y={62} anchor="middle" on={route.taken.has("rf-care")}>
          ควรดูแล · ข้าม 9S
        </EdgeLabel>

        {/* ---- กล่องที่ 2: 9S ---- */}
        <Node x={30} y={96} w={150} h={42} state={route.nineS}>
          <NodeTitle x={105} y={115} state={route.nineS}>
            แบบประเมิน 9S
          </NodeTitle>
          <NodeSub x={105} y={128}>
            {Object.keys(NINE_S_CLUSTER_LABEL).length} กลุ่ม · กลุ่มใด ≥ {NINE_S_CLUSTER_THRESHOLD} = ควรดูแล
          </NodeSub>
        </Node>

        {/* ---- เส้น: 9S ปกติ → จบรอบ ---- */}
        <path d="M66,138 V178" fill="none" className={edge("ns-normal")} strokeWidth={w("ns-normal")} markerEnd={head("ns-normal")} />
        <EdgeLabel x={72} y={162} anchor="start" on={route.taken.has("ns-normal")}>
          ผลปกติ
        </EdgeLabel>

        {/* ---- เส้น: 9S ควรดูแล → SDQ ---- */}
        <path d="M150,138 V156 H212 V178" fill="none" className={edge("ns-care")} strokeWidth={w("ns-care")} markerEnd={head("ns-care")} />
        <EdgeLabel x={181} y={151} anchor="middle" on={route.taken.has("ns-care")}>
          ควรดูแล
        </EdgeLabel>

        {/* ---- กล่องที่ 3ก: จบรอบคัดกรอง ---- */}
        <Node x={10} y={184} w={108} h={40} state={route.endRound}>
          <NodeTitle x={64} y={202} state={route.endRound}>
            จบการประเมินรอบนี้
          </NodeTitle>
          <NodeSub x={64} y={215}>
            ไม่ต้องทำ SDQ
          </NodeSub>
        </Node>

        {/* ---- เส้นประ: ภาคเรียนที่ 2 ให้คนที่ปกติทำ SDQ ด้วย ---- */}
        <path
          d="M118,204 H144"
          fill="none"
          strokeDasharray="3 3"
          className={route.sdq2ForNormal ? on : off}
          strokeWidth={route.sdq2ForNormal ? 1.5 : 1.1}
          markerEnd={`url(#${uid}-${route.sdq2ForNormal ? "on" : "off"})`}
        />
        <EdgeLabel x={10} y={236} anchor="start" on={false}>
          {route.sdq2ForNormal ? "ครั้งที่ 2: ผลปกติทำ SDQ ด้วย" : "ครั้งที่ 2: ผลปกติไม่ต้องทำ"}
        </EdgeLabel>

        {/* ---- กล่องที่ 3ข: SDQ ---- */}
        <Node x={152} y={178} w={200} h={54} state={route.sdq}>
          <NodeTitle x={252} y={197} state={route.sdq}>
            SDQ ครั้งที่ {route.round}
          </NodeTitle>
          <NodeSub x={252} y={210}>
            {route.raters.map(shortRater).join(" / ")}
          </NodeSub>
        </Node>

        {/* ---- เส้น: SDQ → ผลรวม ---- */}
        <path d="M252,232 V268" fill="none" className={edge("sdq-result")} strokeWidth={w("sdq-result")} markerEnd={head("sdq-result")} />
        <EdgeLabel x={258} y={254} anchor="start" on={route.taken.has("sdq-result")}>
          ฉบับครูส่งแล้ว
        </EdgeLabel>

        {/* ---- กล่องที่ 4: ผลรวม ---- */}
        <Node x={116} y={274} w={236} h={58} state={route.result}>
          <NodeTitle x={234} y={292} state={route.result}>
            ผลรวม = ระดับสูงสุดของฉบับที่ส่งแล้ว
          </NodeTitle>
          <NodeSub x={234} y={308}>
            เสี่ยง → เสนอเปิด case · มีปัญหา → เปิด case
          </NodeSub>
        </Node>
      </svg>

      <figcaption className="mt-2 space-y-1 text-[12px] text-muted-foreground">
        {route.here && (
          <p className="font-semibold text-primary">ขั้นปัจจุบัน: {route.here}</p>
        )}
        {carriedNote && <p>{carriedNote}</p>}
      </figcaption>
    </figure>
  );
}

const HERE_TEXT: Record<string, string> = {
  red_flag: "ทำแบบคัดกรอง Red Flag",
  nine_s: "ทำแบบประเมิน 9S",
  open_sdq: "เปิดแบบประเมิน SDQ",
  wait_sdq_window: "รอเปิดช่วงดำเนินงาน SDQ",
  sdq: "รอฉบับ SDQ ที่ยังไม่ส่ง",
  done: "ได้ผล SDQ รวมแล้ว",
  not_required: "จบการประเมินรอบนี้",
};

function Node({
  x,
  y,
  w,
  h,
  state,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  state: NodeState;
  children: React.ReactNode;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        strokeWidth={state === "active" ? 2 : 1.1}
        strokeDasharray={state === "skipped" ? "4 3" : undefined}
        className={NODE_FILL[state]}
      />
      {children}
    </g>
  );
}

function NodeTitle({
  x,
  y,
  state,
  children,
}: {
  x: number;
  y: number;
  state: NodeState;
  children: React.ReactNode;
}) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={11.5} fontWeight={700} className={NODE_TITLE_FILL[state]}>
      {children}
    </text>
  );
}

function NodeSub({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={9} className="fill-muted-foreground">
      {children}
    </text>
  );
}

function EdgeLabel({
  x,
  y,
  anchor,
  on,
  children,
}: {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={9}
      fontWeight={on ? 700 : 500}
      className={on ? "fill-primary" : "fill-muted-foreground"}
    >
      {children}
    </text>
  );
}
