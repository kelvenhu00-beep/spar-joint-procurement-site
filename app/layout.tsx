import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPAR 进口商品联采系统",
  description: "面向区域头部超市企业的进口商品 B2B 联合采购系统原型。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
