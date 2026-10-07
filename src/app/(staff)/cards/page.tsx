"use client";

import { useState } from "react";
import { CreditCard, Printer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CheckinCardsTabs } from "@/components/layout/checkin-cards-tabs";
import { CardRoster } from "@/components/cards/card-roster";
import { CardTemplateForm } from "@/components/cards/card-template-form";
import { CardPrintSheet, StudentIdCard } from "@/components/cards/student-id-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { useDemoPageTool } from "@/lib/demo/page-tools";
import "@/components/cards/print.css";
import type { IdCard, Student } from "@/lib/types";

/**
 * บัตรนักเรียน (id_cards) — ออกบัตร เพิกถอน แม่แบบบัตร และพิมพ์บัตรจริงขนาด CR80
 * หน้านี้เปิดได้เฉพาะแอดมินโรงเรียน (กำหนดใน lib/navigation.ts และกันด้วย RoleGate)
 */
export default function CardsPage() {
  const store = useStore();
  const [selected, setSelected] = useState<string[]>([]);

  const studying = store.students.filter((s) => s.status === "studying");
  const withCard = studying.filter((s) => store.cardStatusOfStudent(s.studentId) === "active");
  const revokedCount = store.idCards.filter((c) => c.status === "revoked").length;

  const toggle = (cardId: string) =>
    setSelected((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );

  const selectAll = () =>
    setSelected(
      withCard
        .map((s) => store.activeCardOfStudent(s.studentId)?.cardId)
        .filter((id): id is string => !!id)
    );

  const printItems: { card: IdCard; student: Student }[] = [];
  for (const cardId of selected) {
    const card = store.idCards.find((c) => c.cardId === cardId);
    const user = card ? store.getUser(card.userId) : undefined;
    const student = user?.refId ? store.getStudent(user.refId) : undefined;
    if (card && student) printItems.push({ card, student });
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
      const target = withCard
        .map((s) => store.activeCardOfStudent(s.studentId))
        .find((c): c is IdCard => !!c);
      if (target) store.setCardSimulatedExpiry(target.cardId, true);
    },
    "จำลองว่าบัตรของนักเรียนคนแรกที่มีบัตรใช้งานได้หมดอายุ — ตารางแสดง \"หมดอายุ\" และหน้าเช็คอินจะปฏิเสธ QR ใบนี้ (กดอีกครั้งเพื่อยกเลิกการจำลอง; ไม่เปลี่ยนข้อมูลบัตรจริง)"
  );

  return (
    <>
      <PageHeader
        title="บัตรนักเรียน"
        subtitle="ออกบัตร เพิกถอน และพิมพ์"
        action={
          <Button onClick={() => window.print()} disabled={printItems.length === 0}>
            <Printer className="size-4" /> พิมพ์บัตรที่เลือก {printItems.length || ""}
          </Button>
        }
      />

      <CheckinCardsTabs />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="นักเรียนที่มีบัตรใช้งานได้" value={`${withCard.length} / ${studying.length} คน`} />
            <Stat label="ยังไม่มีบัตร" value={`${store.studentsWithoutCard.length} คน`} />
            <Stat label="บัตรที่เพิกถอนแล้ว" value={`${revokedCount} ใบ`} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="space-y-5">
              <CardRoster selected={selected} onToggle={toggle} />
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
                      <StudentIdCard
                        student={preview.student}
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
