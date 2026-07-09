import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "植物遗言",
  description: "给快养死的植物拍照，生成好笑但有用的诊断和求救信",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
