import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '图片背景移除工具',
  description: '一键智能移除图片背景',
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
