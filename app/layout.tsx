import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ MÔN TOÁN LỚP 10 -- ĐỀ A',
  description: 'Giao diện làm bài thi trắc nghiệm Toán 10 kết nối Webhook',
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
