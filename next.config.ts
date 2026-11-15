import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker เท่านั้น: Dockerfile ตั้ง NEXT_OUTPUT=standalone เพื่อให้ image เล็ก
  // ในเครื่อง (npm run dev / npm start) ไม่เปิด จึงใช้งานได้เหมือนเดิม
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
};

export default nextConfig;
