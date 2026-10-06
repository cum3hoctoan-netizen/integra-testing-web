import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Hệ thống Kiểm tra Trực tuyến Integra',
    default: 'Hệ thống Kiểm tra Trực tuyến Toán THPT - Integra',
  },
  description: 'Hệ thống làm bài kiểm tra trực tuyến môn Toán chuẩn chương trình GDPT 2018',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
        />
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"
        />
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
