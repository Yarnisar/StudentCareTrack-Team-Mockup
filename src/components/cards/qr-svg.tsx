"use client";

import { useMemo } from "react";
import { encodeQr, qrSvgPath, qrViewBoxSize } from "@/lib/qr";

/**
 * QR Code แบบ SVG ฝังในหน้า (ไม่ใช้ไลบรารีภายนอก — ตัวเข้ารหัสอยู่ใน lib/qr.ts)
 * ใช้สีพื้น/สีหมึกตรง ๆ เพื่อให้พิมพ์ออกกระดาษได้ถูกต้องทั้งธีมสว่างและมืด
 */
export function QrSvg({
  value,
  size = 128,
  className,
  title,
}: {
  value: string;
  /** ความกว้าง/สูงเป็น px */
  size?: number;
  className?: string;
  title?: string;
}) {
  const { path, viewBox } = useMemo(() => {
    const matrix = encodeQr(value);
    return { path: qrSvgPath(matrix), viewBox: qrViewBoxSize(matrix) };
  }, [value]);

  return (
    <svg
      role="img"
      aria-label={title ?? "รหัส QR ของบัตร"}
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={viewBox} height={viewBox} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}
