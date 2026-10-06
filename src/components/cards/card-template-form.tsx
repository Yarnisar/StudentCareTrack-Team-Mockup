"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatThaiDate, formatThaiDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import { CARD_QR_USAGE_LABEL, type CardQrUsage } from "@/lib/types";

/** แม่แบบบัตร: ค่าที่พิมพ์ลงบัตรทุกใบ (แก้ได้เฉพาะแอดมิน ยืนยันแบบ inline) */
export function CardTemplateForm() {
  const store = useStore();
  const template = store.cardTemplate;
  const canEdit = store.currentUser.role === "admin_school";

  const [editing, setEditing] = useState(false);
  const [expiresOn, setExpiresOn] = useState(template.expiresOn);
  const [qrUsage, setQrUsage] = useState<CardQrUsage>(template.qrUsage);
  const [showClassNo, setShowClassNo] = useState(template.showClassNo);
  const [footerNote, setFooterNote] = useState(template.footerNote);
  const [error, setError] = useState("");

  const start = () => {
    setExpiresOn(template.expiresOn);
    setQrUsage(template.qrUsage);
    setShowClassNo(template.showClassNo);
    setFooterNote(template.footerNote);
    setError("");
    setEditing(true);
  };

  const save = () => {
    const result = store.updateCardTemplate({ expiresOn, qrUsage, showClassNo, footerNote });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setEditing(false);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15.5px] font-bold">แม่แบบบัตร</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              ขนาด CR80 (85.60 × 53.98 มม.) · ปีการศึกษา {template.academicYear}
            </p>
          </div>
          {canEdit && !editing && (
            <Button variant="outline" size="sm" onClick={start}>
              <Pencil className="size-4" /> แก้ไข
            </Button>
          )}
        </div>

        {!editing ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Row label="ใช้ได้ถึง" value={formatThaiDate(template.expiresOn)} />
            <Row label="การใช้ QR" value={CARD_QR_USAGE_LABEL[template.qrUsage]} />
            <Row label="เลขที่ในห้องบนบัตร" value={template.showClassNo ? "แสดง" : "ไม่แสดง"} />
            <Row label="ข้อความท้ายบัตร" value={template.footerNote || "—"} />
          </dl>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="card-expires">ใช้ได้ถึง (พ.ศ. ปปปป-ดด-วว)</Label>
                <Input
                  id="card-expires"
                  value={expiresOn}
                  onChange={(e) => setExpiresOn(e.target.value)}
                  placeholder="2570-03-31"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-qr-usage">การใช้ QR</Label>
                <select
                  id="card-qr-usage"
                  value={qrUsage}
                  onChange={(e) => setQrUsage(e.target.value as CardQrUsage)}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px]"
                >
                  {Object.entries(CARD_QR_USAGE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="card-footer">ข้อความท้ายบัตร</Label>
              <Input
                id="card-footer"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
              />
            </div>

            <label className="flex w-fit items-center gap-2 text-[13.5px]">
              <Checkbox checked={showClassNo} onCheckedChange={(v) => setShowClassNo(v === true)} />
              แสดงเลขที่ในห้องบนบัตร
            </label>

            {error && <p className="text-[13px] text-risk-red">{error}</p>}

            <div className="flex gap-2">
              <Button size="sm" onClick={save}>
                <Check className="size-4" /> บันทึกแม่แบบ
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        )}

        <p className="mt-4 rounded-lg bg-surface px-3 py-2 text-[12.5px] text-muted-foreground">
          แก้ไขล่าสุดโดย {store.nameOf(template.updatedBy)} · {formatThaiDateTime(template.updatedAt)}
          {!canEdit && " · แก้ไขได้เฉพาะแอดมินโรงเรียน"}
        </p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12.5px] text-muted-foreground">{label}</dt>
      <dd className="text-[13.5px] font-semibold">{value}</dd>
    </div>
  );
}
