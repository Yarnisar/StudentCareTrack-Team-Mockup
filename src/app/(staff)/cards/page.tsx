"use client";

import { useState } from "react";
import { CreditCard, Printer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CardRoster } from "@/components/cards/card-roster";
import { CardTemplateForm } from "@/components/cards/card-template-form";
import { CardPrintSheet, IdCardFace, type CardOwner } from "@/components/cards/id-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { useDemoPageTool } from "@/lib/demo/page-tools";
import "@/components/cards/print.css";
import { CARD_OWNER_LABEL, type CardOwnerKind, type IdCard } from "@/lib/types";

/**
 * บัตรนักเรียน (id_cards) — ออกบัตร เพิกถอน แม่แบบบัตร และพิมพ์บัตรจริงขนาด CR80
 * หน้านี้เปิดได้เฉพาะแอดมินโรงเรียน (กำหนดใน lib/navigation.ts และกันด้วย RoleGate)
 */
export default function CardsPage() {
  const store = useStore();
  const [kind, setKind] = useState<CardOwnerKind>("student");
  const [selected, setSelected] = useState<string[]>([]);

  const switchKind = (next: CardOwnerKind) => {
    setKind(next);
    setSelected([]);
  };

  // เจ้าของบัตรของแท็บที่เปิดอยู่ (userId) — นักเรียนที่กำลังศึกษา หรือบัญชีบุคลากรทั้งหมด
  const ownerIds =
    kind === "staff"
      ? store.staffAccounts.map((u) => u.userId)
      : store.students
          .filter((s) => s.status === "studying")
          .flatMap((s) => store.users.find((u) => u.role === "student" && u.refId === s.studentId)?.userId ?? []);
  const activeCards = ownerIds.flatMap((id) => store.activeCardOfUser(id) ?? []);
  const withoutCount = ownerIds.length - activeCards.length;
  const revokedCount = store.idCards.filter(
    (c) => c.status === "revoked" && store.cardOwnerKind(c.userId) === kind
  ).length;
  const noun = kind === "staff" ? "บุคลากร" : "นักเรียน";

  const toggle = (cardId: string) =>
    setSelected((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );

  const selectAll = () => setSelected(activeCards.map((c) => c.cardId));

  const printItems: { card: IdCard; owner: CardOwner }[] = [];
  for (const cardId of selected) {
    const card = store.idCards.find((c) => c.cardId === cardId);
    const user = card ? store.getUser(card.userId) : undefined;
    if (!card || !user) continue;
    if (kind === "staff") {
      printItems.push({
        card,
        owner: { kind: "staff", name: user.name, role: user.title ?? "บุคลากร", code: user.refId ?? "" },
      });
    } else {
      const student = user.refId ? store.getStudent(user.refId) : undefined;
      if (student) printItems.push({ card, owner: { kind: "student", student } });
    }
  }

  const preview = printItems[0];

  // เครื่องมือสาธิต: จำลองบัตรหมดอายุ (กดซ้ำเพื่อยกเลิก)
  const simulated = store.simulatedExpiredCardIds;
  useDemoPageTool(
    simulated.length > 0 ? "ยกเลิกจำลอง: บัตรหมดอายุ" : "จำลอง: บัตรหมดอายุ",
    () => {
      if (simulated.length > 0) {
        simulated.forEach((id) => store.setCardSimulatedExpiry(id, false));
        return;
      }
      const target = store.idCards.find(
        (c) => store.cardOwnerKind(c.userId) === "student" && store.activeCardOfUser(c.userId)?.cardId === c.cardId
      );
      if (target) store.setCardSimulatedExpiry(target.cardId, true);
    },
    "จำลองว่าบัตรของนักเรียนคนแรกที่มีบัตรใช้งานได้หมดอายุ — ตารางแสดง \"หมดอายุ\" และหน้าเช็คอินจะปฏิเสธ QR ใบนี้ (กดอีกครั้งเพื่อยกเลิกการจำลอง; ไม่เปลี่ยนข้อมูลบัตรจริง)"
  );

  return (
    <>
      <PageHeader
        title="ออกบัตร"
        subtitle="ออกบัตร เพิกถอน และพิมพ์"
        action={
          <Button onClick={() => window.print()} disabled={printItems.length === 0}>
            <Printer className="size-4" /> พิมพ์บัตรที่เลือก {printItems.length || ""}
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="space-y-5">
          <div role="tablist" aria-label="ประเภทเจ้าของบัตร" className="inline-flex rounded-lg bg-muted p-1">
            {(["student", "staff"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                onClick={() => switchKind(k)}
                className={
                  kind === k
                    ? "rounded-md bg-card px-5 py-1.5 text-[13px] font-semibold text-foreground shadow-sm"
                    : "rounded-md px-5 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
                }
              >
                {CARD_OWNER_LABEL[k]}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label={`${noun}ที่มีบัตรใช้งานได้`} value={`${activeCards.length} / ${ownerIds.length} คน`} />
            <Stat label="ยังไม่มีบัตร" value={`${withoutCount} คน`} />
            <Stat label="บัตรที่เพิกถอนแล้ว" value={`${revokedCount} ใบ`} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="space-y-5">
              <CardRoster key={kind} kind={kind} selected={selected} onToggle={toggle} />
              <CardTemplateForm />
            </div>

            <div className="space-y-5">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[15px] font-bold">พรีวิวและพิมพ์</h2>
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      เลือกทุกใบ
                    </Button>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    เลือกไว้ {printItems.length} ใบ
                  </p>

                  <div className="mt-4 flex justify-center overflow-x-auto">
                    {preview ? (
                      <IdCardFace
                        owner={preview.owner}
                        card={preview.card}
                        template={store.cardTemplate}
                      />
                    ) : (
                      <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
                        <CreditCard className="size-8 text-muted-foreground" strokeWidth={1.3} />
                        <p className="text-[13px] text-muted-foreground">
                          เลือกบัตรจากตารางเพื่อดูตัวอย่างและพิมพ์
                        </p>
                      </div>
                    )}
                  </div>

                  {printItems.length > 0 && (
                    <Button className="mt-4 w-full" onClick={() => window.print()}>
                      <Printer className="size-4" /> พิมพ์ {printItems.length} ใบ
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* แผ่นพิมพ์: ซ่อนบนจอ แสดงเฉพาะตอนสั่งพิมพ์ */}
      <div className="hidden print:block">
        <CardPrintSheet items={printItems} template={store.cardTemplate} />
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-[12px] text-muted-foreground">{label}</div>
        <div className="mt-1 text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
