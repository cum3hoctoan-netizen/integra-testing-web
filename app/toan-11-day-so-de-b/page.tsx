'use client';

import React, { useState, useEffect } from 'react';

// --- CẤU HÌNH WEBHOOK URL ---
const GOOGLE_APP_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwFjkENCxOPVJcFo8OmXuLad5kcMEC9_Uu48hF045AO0yC8-TnHivEI0ohfUHZkJQlN/exec';
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook-test/cham-diem-integra';

// --- INTERFACES & TYPES ---
interface Option {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

interface ShuffledOption {
  originalKey: 'A' | 'B' | 'C' | 'D';
  text: string;
}

interface QuestionMCQ {
  id: string;
  number: number;
  type: 'mcq';
  skill: string;
  points: number;
  text: string;
  options: Option[];
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

interface ShuffledQuestionMCQ extends Omit<QuestionMCQ, 'options'> {
  options: ShuffledOption[];
}

interface QuestionShortAns {
  id: string;
  number: number;
  type: 'shortans';
  skill: string;
  points: number;
  text: string;
  placeholder: string;
  correctDisplay: string;
  explanation: string;
  validator: (val: string) => boolean;
}

// Thuật toán xáo trộn mảng Fisher-Yates (Knuth Shuffle)
function shuffleOptions(options: Option[]): ShuffledOption[] {
  const result: ShuffledOption[] = options.map((opt) => ({
    originalKey: opt.key,
    text: opt.text,
  }));
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ==========================================
// DỮ LIỆU ĐỀ THI DÃY SỐ TOÁN 11 - ĐỀ B (45 PHÚT)
// ==========================================

// PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (14 CÂU - 7,0 ĐIỂM, 0.5Đ/CÂU)
const MCQ_QUESTIONS_DAYSO_DE_B: QuestionMCQ[] = [
  {
    id: 'dsb1',
    number: 1,
    type: 'mcq',
    skill: 'Tính các số hạng của dãy số cho bởi công thức tổng quát',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{3n + 1}{n + 3}$. Số hạng $u_3$ của dãy số bằng:',
    options: [
      { key: 'A', text: '$u_3 = \\dfrac{5}{3}$' },
      { key: 'B', text: '$u_3 = \\dfrac{3}{5}$' },
      { key: 'C', text: '$u_3 = \\dfrac{7}{6}$' },
      { key: 'D', text: '$u_3 = 2$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Thay $n = 3$ vào công thức số hạng tổng quát $u_n = \\dfrac{3n+1}{n+3}$: $$u_3 = \\dfrac{3(3) + 1}{3 + 3} = \\dfrac{10}{6} = \\dfrac{5}{3}.$$<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'dsb2',
    number: 2,
    type: 'mcq',
    skill: 'Tính các số hạng của dãy số cho bởi hệ thức truy hồi',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ xác định bởi $u_1 = 2$ và $u_{n+1} = 3u_n - 2$ với mọi $n \\ge 1$. Số hạng $u_4$ của dãy số bằng:',
    options: [
      { key: 'A', text: '$u_4 = 10$' },
      { key: 'B', text: '$u_4 = 28$' },
      { key: 'C', text: '$u_4 = 82$' },
      { key: 'D', text: '$u_4 = 26$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng công thức truy hồi để tính các số hạng đầu:<br>- Với $n = 1 \\implies u_2 = 3u_1 - 2 = 3(2) - 2 = 4$.<br>- Với $n = 2 \\implies u_3 = 3u_2 - 2 = 3(4) - 2 = 10$.<br>- Với $n = 3 \\implies u_4 = 3u_3 - 2 = 3(10) - 2 = 28$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'dsb3',
    number: 3,
    type: 'mcq',
    skill: 'Khái niệm và định nghĩa dãy số giảm',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$. Khẳng định nào sau đây là <strong>đúng</strong> về định nghĩa dãy số giảm?',
    options: [
      { key: 'A', text: 'Dãy số $(u_n)$ là dãy số giảm nếu $u_{n+1} > u_n$ với mọi $n \\in \\mathbb{N}^*$' },
      { key: 'B', text: 'Dãy số $(u_n)$ là dãy số giảm nếu $u_{n+1} < u_n$ với mọi $n \\in \\mathbb{N}^*$' },
      { key: 'C', text: 'Dãy số $(u_n)$ là dãy số giảm nếu $u_{n+1} \\ge u_n$ với mọi $n \\in \\mathbb{N}^*$' },
      { key: 'D', text: 'Dãy số $(u_n)$ là dãy số giảm nếu $u_{n+1} = u_n$ với mọi $n \\in \\mathbb{N}^*$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo định nghĩa, dãy số $(u_n)$ được gọi là dãy số giảm nếu với mọi $n \\in \\mathbb{N}^*$, ta đều có $u_{n+1} < u_n$ (hay $u_{n+1} - u_n < 0$).<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'dsb4',
    number: 4,
    type: 'mcq',
    skill: 'Khái niệm dãy số bị chặn dưới',
    points: 0.5,
    text: 'Dãy số $(u_n)$ được gọi là <strong>bị chặn dưới</strong> nếu:',
    options: [
      { key: 'A', text: 'Tồn tại một số thực $M$ sao cho $u_n \\le M$ với mọi $n \\in \\mathbb{N}^*$' },
      { key: 'B', text: 'Tồn tại một số thực $m$ sao cho $u_n \\ge m$ với mọi $n \\in \\mathbb{N}^*$' },
      { key: 'C', text: 'Tồn tại các số thực $m, M$ sao cho $m < u_n < M$ với mọi $n \\in \\mathbb{N}^*$' },
      { key: 'D', text: 'Tồn tại một số thực $m$ sao cho $u_n < m$ với mọi $n \\in \\mathbb{N}^*$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo định nghĩa, dãy số $(u_n)$ được gọi là bị chặn dưới nếu tồn tại một số thực $m$ sao cho $u_n \\ge m$ với mọi $n \\in \\mathbb{N}^*$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'dsb5',
    number: 5,
    type: 'mcq',
    skill: 'Nhận biết dãy số bị chặn',
    points: 0.5,
    text: 'Trong các dãy số cho bởi công thức số hạng tổng quát sau đây, dãy số nào là dãy số <strong>bị chặn</strong>?',
    options: [
      { key: 'A', text: '$u_n = \\dfrac{2n + 1}{n + 1}$' },
      { key: 'B', text: '$u_n = 2n^2 + 3$' },
      { key: 'C', text: '$u_n = 3^n$' },
      { key: 'D', text: '$u_n = 4n - 1$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Xét dãy số $u_n = \\dfrac{2n + 1}{n + 1} = 2 - \\dfrac{1}{n + 1}$.<br>Vì $n \\ge 1$ nên $n + 1 \\ge 2 \\implies 0 < \\dfrac{1}{n + 1} \\le \\dfrac{1}{2}$.<br>Suy ra $\\dfrac{3}{2} \\le 2 - \\dfrac{1}{n + 1} < 2$, tức là $1 < u_n < 2$ với mọi $n \\in \\mathbb{N}^*$.<br>Do đó dãy số $u_n = \\dfrac{2n+1}{n+1}$ bị chặn. Các dãy số $2n^2+3, 3^n, 4n-1$ đều không bị chặn trên.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'dsb6',
    number: 6,
    type: 'mcq',
    skill: 'Xét tính tăng giảm của dãy số phân thức bậc nhất',
    points: 0.5,
    text: 'Xét tính tăng, giảm của dãy số $(u_n)$ với $u_n = \\dfrac{4n - 1}{n + 2}$. Khẳng định nào sau đây <strong>đúng</strong>?',
    options: [
      { key: 'A', text: 'Dãy số $(u_n)$ là dãy số tăng' },
      { key: 'B', text: 'Dãy số $(u_n)$ là dãy số giảm' },
      { key: 'C', text: 'Dãy số $(u_n)$ không tăng, không giảm' },
      { key: 'D', text: 'Dãy số $(u_n)$ bị chặn trên bởi $3$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Xét hiệu $u_{n+1} - u_n$: $$u_{n+1} - u_n = \\dfrac{4(n+1) - 1}{(n+1) + 2} - \\dfrac{4n - 1}{n + 2} = \\dfrac{4n + 3}{n + 3} - \\dfrac{4n - 1}{n + 2}$$ $$= \\dfrac{(4n + 3)(n + 2) - (4n - 1)(n + 3)}{(n + 3)(n + 2)} = \\dfrac{(4n^2 + 11n + 6) - (4n^2 + 11n - 3)}{(n + 3)(n + 2)} = \\dfrac{9}{(n + 3)(n + 2)}.$$ Vì $n \\ge 1$ nên $(n+3)(n+2) > 0 \\implies u_{n+1} - u_n = \\dfrac{9}{(n+3)(n+2)} > 0$ với mọi $n \\in \\mathbb{N}^*$.<br>Do đó, dãy số $(u_n)$ là dãy số tăng.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'dsb7',
    number: 7,
    type: 'mcq',
    skill: 'Xét tính tăng giảm của dãy số phân thức bậc nhất',
    points: 0.5,
    text: 'Xét tính tăng, giảm của dãy số $(u_n)$ với $u_n = \\dfrac{n + 3}{3n + 1}$. Khẳng định nào sau đây <strong>đúng</strong>?',
    options: [
      { key: 'A', text: 'Dãy số $(u_n)$ là dãy số tăng' },
      { key: 'B', text: 'Dãy số $(u_n)$ là dãy số giảm' },
      { key: 'C', text: 'Dãy số $(u_n)$ không bị chặn' },
      { key: 'D', text: 'Dãy số $(u_n)$ bị chặn dưới bởi $1$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Xét hiệu $u_{n+1} - u_n$: $$u_{n+1} - u_n = \\dfrac{(n+1) + 3}{3(n+1) + 1} - \\dfrac{n + 3}{3n + 1} = \\dfrac{n + 4}{3n + 4} - \\dfrac{n + 3}{3n + 1}$$ $$= \\dfrac{(n + 4)(3n + 1) - (n + 3)(3n + 4)}{(3n + 4)(3n + 1)} = \\dfrac{(3n^2 + 13n + 4) - (3n^2 + 13n + 12)}{(3n + 4)(3n + 1)} = \\dfrac{-8}{(3n + 4)(3n + 1)}.$$ Vì $n \\ge 1$ nên $(3n+4)(3n+1) > 0 \\implies u_{n+1} - u_n < 0$ với mọi $n \\in \\mathbb{N}^*$.<br>Do đó dãy số $(u_n)$ là dãy số giảm.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'dsb8',
    number: 8,
    type: 'mcq',
    skill: 'Chứng minh dãy số bị chặn',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{3n^2 + 2}{n^2 + 1}$. Khẳng định nào sau đây <strong>đúng</strong>?',
    options: [
      { key: 'A', text: 'Dãy số $(u_n)$ chỉ bị chặn dưới bởi $0$' },
      { key: 'B', text: 'Dãy số $(u_n)$ chỉ bị chặn trên bởi $3$' },
      { key: 'C', text: 'Dãy số $(u_n)$ bị chặn vì $0 < u_n < 3$ với mọi $n \\in \\mathbb{N}^*$' },
      { key: 'D', text: 'Dãy số $(u_n)$ không bị chặn' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Với mọi $n \\in \\mathbb{N}^*$:<br>- Vì $3n^2 + 2 > 0$ và $n^2 + 1 > 0$ nên $u_n > 0$.<br>- Biến đổi $u_n = \\dfrac{3(n^2 + 1) - 1}{n^2 + 1} = 3 - \\dfrac{1}{n^2 + 1}$.<br>Vì $n \\ge 1 \\implies n^2 + 1 \\ge 2 \\implies 0 < \\dfrac{1}{n^2 + 1} \\le \\dfrac{1}{2} \\implies \\dfrac{5}{2} \\le u_n < 3$.<br>Suy ra $0 < u_n < 3$ với mọi $n \\in \\mathbb{N}^*$, do đó dãy số $(u_n)$ bị chặn.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'dsb9',
    number: 9,
    type: 'mcq',
    skill: 'Tìm giá trị lớn nhất của số hạng dãy số (BĐT Cauchy)',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{n}{n^2 + 9}$. Giá trị lớn nhất của số hạng $u_n$ trong dãy số bằng:',
    options: [
      { key: 'A', text: '$\\dfrac{1}{9}$' },
      { key: 'B', text: '$\\dfrac{1}{6}$' },
      { key: 'C', text: '$\\dfrac{1}{3}$' },
      { key: 'D', text: '$\\dfrac{3}{10}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng bất đẳng thức Cauchy cho hai số dương $n$ và $\\dfrac{9}{n}$: $$n^2 + 9 \\ge 2\\sqrt{n^2 \\cdot 9} = 6n.$$ Do đó $u_n = \\dfrac{n}{n^2 + 9} \\le \\dfrac{n}{6n} = \\dfrac{1}{6}$.<br>Đẳng thức xảy ra khi $n^2 = 9 \\Leftrightarrow n = 3$ (do $n \\in \\mathbb{N}^*$).<br>Vậy giá trị lớn nhất của $u_n$ trong dãy số bằng $\\dfrac{1}{6}$, đạt được khi $n = 3$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'dsb10',
    number: 10,
    type: 'mcq',
    skill: 'Tìm tham số để dãy số đơn điệu',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{n + a}{2n + 1}$ ($a$ là tham số thực). Tìm tất cả các giá trị của $a$ để $(u_n)$ là dãy số giảm.',
    options: [
      { key: 'A', text: '$a < \\dfrac{1}{2}$' },
      { key: 'B', text: '$a > \\dfrac{1}{2}$' },
      { key: 'C', text: '$a < 2$' },
      { key: 'D', text: '$a > 2$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Xét hiệu $u_{n+1} - u_n$: $$u_{n+1} - u_n = \\dfrac{(n+1) + a}{2(n+1) + 1} - \\dfrac{n + a}{2n + 1} = \\dfrac{n + a + 1}{2n + 3} - \\dfrac{n + a}{2n + 1}$$ $$= \\dfrac{(n + a + 1)(2n + 1) - (n + a)(2n + 3)}{(2n + 3)(2n + 1)} = \\dfrac{1 - 2a}{(2n + 3)(2n + 1)}.$$ Để dãy số $(u_n)$ là dãy số giảm thì $u_{n+1} - u_n < 0$ với mọi $n \\in \\mathbb{N}^*$.<br>Vì $(2n+3)(2n+1) > 0$ với mọi $n \\ge 1$, điều này tương đương với: $$1 - 2a < 0 \\Leftrightarrow 2a > 1 \\Leftrightarrow a > \\dfrac{1}{2}.$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'dsb11',
    number: 11,
    type: 'mcq',
    skill: 'Tìm tham số thỏa mãn tính tăng và bị chặn trên',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{2^n + a}{2^n + 3}$ ($a$ là tham số thực). Có bao nhiêu giá trị nguyên của $a \\in [-5; 10]$ để $(u_n)$ là dãy số tăng và bị chặn trên bởi $2$?',
    options: [
      { key: 'A', text: '$7$' },
      { key: 'B', text: '$5$' },
      { key: 'C', text: '$6$' },
      { key: 'D', text: '$4$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong><br>1. Xét hiệu $u_{n+1} - u_n$: $$u_{n+1} - u_n = \\dfrac{2^{n+1} + a}{2^{n+1} + 3} - \\dfrac{2^n + a}{2^n + 3} = \\dfrac{2^n(6 - 3a)}{(2^{n+1} + 3)(2^n + 3)}.$$ Để $(u_n)$ là dãy số tăng thì $u_{n+1} - u_n > 0 \\forall n \\ge 1 \\Leftrightarrow 6 - 3a > 0 \\Leftrightarrow a < 2$.<br><br>2. Điều kiện bị chặn trên bởi $2$: $u_n \\le 2$ với mọi $n \\ge 1$. $$\\dfrac{2^n + a}{2^n + 3} \\le 2 \\Leftrightarrow 2^n + a \\le 2 \\cdot 2^n + 6 \\Leftrightarrow a \\le 2^n + 6 \\quad (\\forall n \\ge 1).$$ Điều này tương đương $a \\le \\min_{n \\ge 1}(2^n + 6) = 2^1 + 6 = 8$.<br><br>Kết hợp $a < 2$ và $a \\le 8$, ta được $a < 2$. Các giá trị nguyên $a \\in [-5; 10]$ thỏa mãn là $a \\in \\{-5; -4; -3; -2; -1; 0; 1\\}$. Có $7$ giá trị nguyên thỏa mãn.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'dsb12',
    number: 12,
    type: 'mcq',
    skill: 'Ứng dụng thực tế của dãy số (Mô hình nuôi cấy vi khuẩn)',
    points: 0.5,
    text: 'Lượng vi khuẩn trong một môi trường nuôi cấy sau $n$ giờ ($n \\in \\mathbb{N}^*$) được mô hình hóa bởi dãy số $P_n = \\dfrac{120n}{n^2 + 3}$ (đơn vị: nghìn con). Lượng vi khuẩn ở giờ thứ $3$ sau khi bắt đầu nuôi cấy bằng bao nhiêu?',
    options: [
      { key: 'A', text: '$30\\text{ nghìn con}$' },
      { key: 'B', text: '$40\\text{ nghìn con}$' },
      { key: 'C', text: '$25\\text{ nghìn con}$' },
      { key: 'D', text: '$36\\text{ nghìn con}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Lượng vi khuẩn ở giờ thứ $3$ ($n = 3$) được tính bằng cách thay $n = 3$ vào công thức dãy số: $$P_3 = \\dfrac{120(3)}{3^2 + 3} = \\dfrac{360}{9 + 3} = \\dfrac{360}{12} = 30\\text{ nghìn con}.$$<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'dsb13',
    number: 13,
    type: 'mcq',
    skill: 'Ứng dụng thực tế của dãy số (Mô hình kinh tế chi phí sản xuất)',
    points: 0.5,
    text: 'Một xưởng sản xuất thiết bị công nghệ có chi phí sản xuất trung bình $C_n$ (tính bằng nghìn đồng/sản phẩm) khi sản xuất $n$ sản phẩm ($n \\in \\mathbb{N}^*$) được mô hình hóa bởi dãy số $C_n = 60 + \\dfrac{400}{n + 1}$. Khẳng định nào sau đây <strong>đúng</strong> khi nói về sự thay đổi của chi phí sản xuất trung bình khi số lượng sản phẩm $n$ tăng lên?',
    options: [
      { key: 'A', text: 'Chi phí sản xuất trung bình tăng dần và bị chặn dưới bởi $60$ nghìn đồng' },
      { key: 'B', text: 'Chi phí sản xuất trung bình giảm dần và bị chặn dưới bởi $60$ nghìn đồng' },
      { key: 'C', text: 'Chi phí sản xuất trung bình giảm dần và giảm về $0$ nghìn đồng' },
      { key: 'D', text: 'Chi phí sản xuất trung bình tăng dần và không bị chặn' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong><br>1. Xét hiệu $C_{n+1} - C_n = \\left(60 + \\dfrac{400}{n + 2}\\right) - \\left(60 + \\dfrac{400}{n + 1}\\right) = \\dfrac{-400}{(n+2)(n+1)} < 0 \\quad (\\forall n \\in \\mathbb{N}^*)$. Do đó, chi phí sản xuất trung bình $C_n$ giảm dần khi $n$ tăng lên.<br>2. Vì $n \\ge 1$ nên $\\dfrac{400}{n+1} > 0 \\implies C_n = 60 + \\dfrac{400}{n+1} > 60$ với mọi $n \\in \\mathbb{N}^*$.<br>Vậy chi phí sản xuất trung bình giảm dần và bị chặn dưới bởi $60$ nghìn đồng.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'dsb14',
    number: 14,
    type: 'mcq',
    skill: 'Ứng dụng thực tế của dãy số (Mô hình mạng xã hội Logistic)',
    points: 0.5,
    text: 'Số lượt xem một video ngắn trên nền tảng mạng xã hội ở ngày thứ $n$ ($n \\in \\mathbb{N}^*$) được mô hình hóa bởi dãy số $V_n = \\dfrac{10000}{1 + 49 \\cdot 2^{-n}}$ (lượt xem). Hỏi bắt đầu từ ngày thứ mấy thì số lượt xem video trong ngày vượt quá $8000$ lượt?',
    options: [
      { key: 'A', text: 'Ngày thứ $7$' },
      { key: 'B', text: 'Ngày thứ $8$' },
      { key: 'C', text: 'Ngày thứ $9$' },
      { key: 'D', text: 'Ngày thứ $10$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Yêu cầu số lượt xem vượt quá $8000$ lượt: $$V_n > 8000 \\Leftrightarrow \\dfrac{10000}{1 + 49 \\cdot 2^{-n}} > 8000 \\Leftrightarrow 1 + 49 \\cdot 2^{-n} < \\dfrac{10000}{8000} = 1{,}25$$ $$\\Leftrightarrow 49 \\cdot 2^{-n} < 0{,}25 \\Leftrightarrow 2^{-n} < \\dfrac{0{,}25}{49} = \\dfrac{1}{196} \\Leftrightarrow 2^n > 196.$$ Thử các giá trị nguyên $n$:<br>- Với $n = 7 \\implies 2^7 = 128 < 196$.<br>- Với $n = 8 \\implies 2^8 = 256 > 196$.<br>Do $n \\in \\mathbb{N}^*$, giá trị nhỏ nhất thỏa mãn là $n = 8$. Vậy bắt đầu từ ngày thứ $8$ thì số lượt xem video vượt quá $8000$ lượt.<br><strong>Đáp án đúng: B.</strong>',
  },
];

// PHẦN II. TỰ LUẬN (2 CÂU - 3,0 ĐIỂM, 1.5Đ/CÂU)
const SHORTANS_QUESTIONS_DAYSO_DE_B: QuestionShortAns[] = [
  {
    id: 'dsb15',
    number: 15,
    type: 'shortans',
    skill: 'Xác định công thức số hạng tổng quát của dãy số truy hồi nghịch đảo',
    points: 1.5,
    text: 'Cho dãy số $(u_n)$ xác định bởi hệ thức truy hồi: $u_1 = \\dfrac{1}{3}$ và $u_{n+1} = \\dfrac{u_n}{1 + 2u_n}$ với mọi $n \\ge 1$.<br><br><strong>a) (0,75 điểm)</strong> Tính $4$ số hạng đầu $u_1, u_2, u_3, u_4$ của dãy số.<br><strong>b) (0,75 điểm)</strong> Dự đoán công thức số hạng tổng quát $u_n$ theo $n$ và chứng minh công thức đó.',
    placeholder: 'Ví dụ: u1=1/3, u2=1/5, u3=1/7, u4=1/9; un = 1/(2n+1)',
    correctDisplay: 'u1 = 1/3, u2 = 1/5, u3 = 1/7, u4 = 1/9; un = 1/(2n+1)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const hasTerms = clean.includes('1/3') && clean.includes('1/5') && clean.includes('1/7') && clean.includes('1/9');
      const hasFormula = clean.includes('1/(2n+1)') || clean.includes('1/(1+2n)');
      return hasTerms || hasFormula;
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>- $u_1 = \\dfrac{1}{3}$ (0,25đ)<br>- $u_2 = \\dfrac{u_1}{1 + 2u_1} = \\dfrac{1/3}{1 + 2(1/3)} = \\dfrac{1/3}{5/3} = \\dfrac{1}{5}$ (0,25đ)<br>- $u_3 = \\dfrac{u_2}{1 + 2u_2} = \\dfrac{1/5}{1 + 2(1/5)} = \\dfrac{1/5}{7/5} = \\dfrac{1}{7}$ (0,25đ)<br>- $u_4 = \\dfrac{u_3}{1 + 2u_3} = \\dfrac{1/7}{1 + 2(1/7)} = \\dfrac{1/7}{9/7} = \\dfrac{1}{9}$<br><br><strong>b) (0,75 điểm)</strong><br>Dự đoán: $u_n = \\dfrac{1}{2n+1}$ với mọi $n \\ge 1$. (0,25đ)<br>Chứng minh: Xét nghịch đảo $\\dfrac{1}{u_{n+1}} = \\dfrac{1 + 2u_n}{u_n} = \\dfrac{1}{u_n} + 2$.<br>Do đó: $\\dfrac{1}{u_n} = \\dfrac{1}{u_1} + 2(n-1) = 3 + 2n - 2 = 2n + 1 \\implies u_n = \\dfrac{1}{2n+1}$ với mọi $n \\ge 1$. (0,5đ)',
  },
  {
    id: 'dsb16',
    number: 16,
    type: 'shortans',
    skill: 'Chứng minh tính tăng giảm và tính bị chặn của dãy số phân thức',
    points: 1.5,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{3n - 2}{n + 1}$.<br><br><strong>a) (0,75 điểm)</strong> Chứng minh rằng dãy số $(u_n)$ là dãy số tăng trên $\\mathbb{N}^*$.<br><strong>b) (0,75 điểm)</strong> Chứng minh rằng dãy số $(u_n)$ là dãy số bị chặn.',
    placeholder: 'Ví dụ: a) un+1 - un = 5/((n+2)(n+1)) > 0; b) 1/2 <= un < 3',
    correctDisplay: 'a) un+1 - un = 5/((n+2)(n+1)) > 0 (dãy số tăng); b) 1/2 ≤ un < 3 (bị chặn)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const hasDiff = clean.includes('5/') || clean.includes('>0') || clean.includes('tang') || clean.includes('tăng');
      const hasBound = clean.includes('1/2') || clean.includes('<3') || clean.includes('bichan') || clean.includes('bịchặn');
      return hasDiff || hasBound;
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>Xét hiệu $u_{n+1} - u_n$: $$u_{n+1} - u_n = \\dfrac{3(n+1) - 2}{(n+1) + 1} - \\dfrac{3n - 2}{n + 1} = \\dfrac{3n + 1}{n + 2} - \\dfrac{3n - 2}{n + 1} = \\dfrac{5}{(n+2)(n+1)}.$$ Với mọi $n \\in \\mathbb{N}^*$, ta có $(n+2)(n+1) > 0 \\implies u_{n+1} - u_n = \\dfrac{5}{(n+2)(n+1)} > 0$. Vậy dãy số $(u_n)$ là dãy số tăng trên $\\mathbb{N}^*$. (0,75đ)<br><br><strong>b) (0,75 điểm)</strong><br>- Bị chặn dưới: Do $(u_n)$ là dãy số tăng nên với mọi $n \\in \\mathbb{N}^*$, ta có $u_n \\ge u_1 = \\dfrac{3(1)-2}{1+1} = \\dfrac{1}{2}$. Vậy $(u_n)$ bị chặn dưới bởi $\\dfrac{1}{2}$. (0,25đ)<br>- Bị chặn trên: Biến đổi $u_n = \\dfrac{3(n+1) - 5}{n+1} = 3 - \\dfrac{5}{n+1}$. Vì $n \\ge 1 \\implies n+1 \\ge 2 \\implies \\dfrac{5}{n+1} > 0 \\implies u_n = 3 - \\dfrac{5}{n+1} < 3$ với mọi $n \\in \\mathbb{N}^*$. Vậy $(u_n)$ bị chặn trên bởi $3$. (0,25đ)<br>Vì $\\dfrac{1}{2} \\le u_n < 3 \\quad (\\forall n \\in \\mathbb{N}^*)$ nên $(u_n)$ là dãy số bị chặn. (0,25đ)',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan11DaySoDeBPage() {
  // 1. STATE THÔNG TIN HỌC SINH
  const [tenHocSinh, setTenHocSinh] = useState<string>('');
  const [maHocSinh, setMaHocSinh] = useState<string>('');
  const [lopNhom, setLopNhom] = useState<string>('');

  // 2. STATE LÀM BÀI & TRẢ LỜI
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State lưu danh sách câu hỏi trắc nghiệm đã xáo trộn phương án (Fisher-Yates)
  const [shuffledMCQQuestions, setShuffledMCQQuestions] = useState<ShuffledQuestionMCQ[]>(() =>
    MCQ_QUESTIONS_DAYSO_DE_B.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ originalKey: opt.key, text: opt.text })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS_DAYSO_DE_B.map((q) => ({
      ...q,
      options: shuffleOptions(q.options),
    }));
    setShuffledMCQQuestions(shuffled);
  }, []);

  // 3. STATE KẾT QUẢ & CHẤM ĐIỂM
  const [diemSo, setDiemSo] = useState<number>(0);
  const [mangCauSai, setMangCauSai] = useState<string[]>([]);
  const [soCauDungMCQ, setSoCauDungMCQ] = useState<number>(0);
  const [soCauDungShort, setSoCauDungShort] = useState<number>(0);

  // 4. STATE ĐỒNG HỒ ĐẾM NGƯỢC (45 PHÚT = 2700 GIÂY)
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60);

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 5. TRIGGER KATEX VỚI RENDERMATHINELEMENT
  useEffect(() => {
    const triggerKaTeX = () => {
      if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
        try {
          (window as any).renderMathInElement(document.body, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
            ],
            throwOnError: false,
          });
        } catch (e) {
          console.warn('Lỗi khi render KaTeX:', e);
        }
      }
    };

    triggerKaTeX();
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
        triggerKaTeX();
        clearInterval(interval);
      }
    }, 200);

    const timeout = setTimeout(() => clearInterval(interval), 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isSubmitted, shuffledMCQQuestions]);

  // Tiến độ làm bài
  const answeredMCQCount = Object.keys(mcqAnswers).length;
  const answeredShortCount = Object.values(shortAnswers).filter((v) => v.trim().length > 0).length;
  const totalQuestions = MCQ_QUESTIONS_DAYSO_DE_B.length + SHORTANS_QUESTIONS_DAYSO_DE_B.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 6. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS11-DAYSO-DE-B';
    const lop = lopNhom.trim() || 'Lớp 11';

    if (!tenHocSinh.trim()) {
      const confirmAnonymous = window.confirm(
        'Bạn chưa nhập Họ và tên. Bạn có muốn nộp bài với tên "Học sinh ẩn danh" không?'
      );
      if (!confirmAnonymous) {
        const inputTen = document.getElementById('input-ten');
        if (inputTen) inputTen.focus();
        return;
      }
    }

    setIsSubmitting(true);

    let calculatedScore = 0;
    let correctMCQ = 0;
    let correctShort = 0;
    const wrongSkills: string[] = [];

    // Chấm Phần I (14 câu MCQ, 0.5đ/câu)
    MCQ_QUESTIONS_DAYSO_DE_B.forEach((q) => {
      const studentChoice = mcqAnswers[q.id];
      if (studentChoice === q.correct) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (2 câu Tự luận, 1.5đ/câu)
    SHORTANS_QUESTIONS_DAYSO_DE_B.forEach((q) => {
      const studentText = shortAnswers[q.id] || '';
      const isCorrect = q.validator(studentText);
      if (isCorrect) {
        calculatedScore += q.points;
        correctShort += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    const finalScore = Math.min(10, Math.round(calculatedScore * 10) / 10);
    const uniqueWrongSkills = Array.from(new Set(wrongSkills));

    setDiemSo(finalScore);
    setSoCauDungMCQ(correctMCQ);
    setSoCauDungShort(correctShort);
    setMangCauSai(uniqueWrongSkills);
    setIsSubmitted(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Payload gửi Webhook GAS
    const thoiGianLamGiay = 45 * 60 - timeLeft;
    const thoiGianLamPhut = Math.max(1, Math.round(thoiGianLamGiay / 60));

    const chiTietPhanHoiObj = {
      hoc_sinh: ten,
      ma_hs: ma,
      lop: lop,
      bai_thi: 'ĐỀ KIỂM TRA MÔN TOÁN LỚP 11 - DÃY SỐ [ĐỀ B]',
      diem: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS_DAYSO_DE_B.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_DAYSO_DE_B.length}`,
      thoi_gian_lam_phut: thoiGianLamPhut,
      thoi_gian_nop: new Date().toLocaleString('vi-VN'),
      ky_nang_sai: uniqueWrongSkills,
      dap_an_mcq: mcqAnswers,
      dap_an_tu_luan: shortAnswers,
    };

    const webhookGASPayload = {
      action: 'submit_test',
      data: {
        Student_ID: ma,
        Task_ID: 'KIEM_TRA_DAY_SO_TOAN_11_DE_B',
        Diem_So: finalScore,
        Thoi_Gian_Lam: thoiGianLamPhut,
        Chi_Tiet_Phan_Hoi: JSON.stringify(chiTietPhanHoiObj),
      },
    };

    // 1. Fetch gửi Webhook Google Apps Script
    try {
      await fetch(GOOGLE_APP_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(webhookGASPayload),
      });
    } catch (err) {
      console.warn('Lỗi gửi Webhook Google Apps Script:', err);
    }

    // 2. Fetch gửi dự phòng sang n8n Webhook
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoc_sinh: ten,
          ma_hs: ma,
          lop: lop,
          bai_thi: 'ĐỀ KIỂM TRA TOÁN 11 - DÃY SỐ [ĐỀ B]',
          diem: finalScore,
          ky_nang_sai: uniqueWrongSkills,
          thoi_gian_nop: new Date().toLocaleString('vi-VN'),
        }),
      });
    } catch (err) {
      console.warn('Lỗi gửi Webhook n8n:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn làm lại bài thi từ đầu?')) {
      setMcqAnswers({});
      setShortAnswers({});
      setIsSubmitted(false);
      setDiemSo(0);
      setMangCauSai([]);
      setSoCauDungMCQ(0);
      setSoCauDungShort(0);
      setTimeLeft(45 * 60);
      // Xáo trộn lượt mới bằng thuật toán Fisher-Yates khi làm lại
      setShuffledMCQQuestions(
        MCQ_QUESTIONS_DAYSO_DE_B.map((q) => ({
          ...q,
          options: shuffleOptions(q.options),
        }))
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER BÀI THI */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-5 text-center">
            <span className="inline-block px-3 py-1 bg-violet-50 text-violet-800 text-xs font-semibold uppercase tracking-wider rounded-full mb-2">
              Hệ thống khảo sát trực tuyến Integra &bull; Toán 11
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              ĐỀ KIỂM TRA MÔN TOÁN LỚP 11 – THỜI GIAN: 45 PHÚT [ĐỀ B]
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
              CHỦ ĐỀ: KHÁI NIỆM DÃY SỐ – TÍNH TĂNG GIẢM – TÍNH BỊ CHẶN (MA TRẬN A / 2018)
            </p>
          </div>

          {/* THANH ĐỒNG HỒ & THÔNG TIN HỌC SINH */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div>
              <label htmlFor="input-ten" className="block text-xs font-semibold text-slate-600 mb-1">
                Họ và tên học sinh <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-ten"
                type="text"
                disabled={isSubmitted}
                value={tenHocSinh}
                onChange={(e) => setTenHocSinh(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label htmlFor="input-ma-hs" className="block text-xs font-semibold text-slate-600 mb-1">
                Mã học sinh
              </label>
              <input
                id="input-ma-hs"
                type="text"
                disabled={isSubmitted}
                value={maHocSinh}
                onChange={(e) => setMaHocSinh(e.target.value)}
                placeholder="HS11-DSB01"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label htmlFor="input-lop" className="block text-xs font-semibold text-slate-600 mb-1">
                Lớp / Nhóm
              </label>
              <input
                id="input-lop"
                type="text"
                disabled={isSubmitted}
                value={lopNhom}
                onChange={(e) => setLopNhom(e.target.value)}
                placeholder="11A1"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 disabled:bg-slate-100"
              />
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-violet-50/80 border border-violet-200 rounded-xl">
              <span className="text-xs font-medium text-violet-800">Thời gian còn lại</span>
              <span
                className={`text-xl font-bold font-mono ${
                  timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-violet-950'
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* THANH TIẾN ĐỘ */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
              <span>Tiến độ hoàn thành: {totalAnswered}/{totalQuestions} câu</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        {/* KẾT QUẢ SAU KHI NỘP BÀI */}
        {isSubmitted && (
          <section className="bg-white rounded-2xl shadow-md border-2 border-violet-600 p-6 sm:p-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                  Đã hoàn thành &bull; Chấm điểm tự động
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-2">
                  Kết quả bài thi: {tenHocSinh || 'Học sinh'} ({lopNhom || 'Lớp 11'})
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Đúng {soCauDungMCQ}/14 câu Trắc nghiệm &bull; Đúng {soCauDungShort}/2 câu Tự luận
                </p>
              </div>
              <div className="text-center sm:text-right bg-gradient-to-br from-violet-50 to-purple-50 p-4 rounded-xl border border-violet-200 min-w-[140px]">
                <span className="text-xs uppercase text-slate-500 font-semibold block">Điểm số</span>
                <span className="text-4xl font-extrabold text-violet-700">{diemSo}</span>
                <span className="text-sm font-semibold text-slate-400"> / 10.0</span>
              </div>
            </div>

            {/* PHÂN TÍCH LỖI SAI & KỸ NĂNG CẦN CẢI THIỆN */}
            <div className="mt-5">
              <h3 className="text-sm font-bold text-slate-800 mb-2">
                Các chuyên đề / kỹ năng cần ôn luyện thêm:
              </h3>
              {mangCauSai.length === 0 ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-medium">
                  🎉 Xuất sắc! Bạn đã trả lời đúng tất cả các kỹ năng trong đề thi.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {mangCauSai.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Làm lại bài thi
              </button>
            </div>
          </section>
        )}

        {/* PHẦN I: TRẮC NGHIỆM */}
        <section className="space-y-4">
          <div className="bg-violet-800 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <h2 className="font-bold text-base sm:text-lg">
              PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (7,0 ĐIỂM – 14 CÂU, 0,5 Đ/CÂU)
            </h2>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-md font-medium">
              14 Câu hỏi
            </span>
          </div>

          {shuffledMCQQuestions.map((q) => {
            const studentAnswer = mcqAnswers[q.id];
            const isCorrect = studentAnswer === q.correct;
            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl p-5 sm:p-6 border transition shadow-sm ${
                  isSubmitted
                    ? isCorrect
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-violet-100 text-violet-900 text-xs font-bold rounded-md">
                      Câu {q.number}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      [Kỹ năng: {q.skill}]
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">0,5 đ</span>
                </div>

                <div
                  className="text-slate-900 text-sm sm:text-base leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: q.text }}
                />

                {/* 4 PHƯƠNG ÁN XÁO TRỘN FISHER-YATES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIndex) => {
                    const displayLabel = (['A', 'B', 'C', 'D'] as const)[optIndex];
                    const isSelected = studentAnswer === opt.originalKey;
                    const isThisCorrect = opt.originalKey === q.correct;

                    let optionStyle = 'border-slate-200 hover:bg-slate-50 text-slate-800';

                    if (isSubmitted) {
                      if (isThisCorrect) {
                        optionStyle =
                          'border-emerald-500 bg-emerald-50 font-semibold text-emerald-900 ring-2 ring-emerald-500/20';
                      } else if (isSelected && !isThisCorrect) {
                        optionStyle =
                          'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20 line-through';
                      } else {
                        optionStyle = 'border-slate-100 opacity-60 text-slate-400';
                      }
                    } else if (isSelected) {
                      optionStyle =
                        'border-violet-600 bg-violet-50/80 text-violet-950 font-semibold ring-2 ring-violet-500/20';
                    }

                    return (
                      <button
                        key={opt.originalKey}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => {
                          if (isSubmitted) return;
                          setMcqAnswers((prev) => ({ ...prev, [q.id]: opt.originalKey }));
                        }}
                        className={`text-left px-4 py-3 rounded-lg border text-sm transition flex items-start gap-3 ${optionStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected
                              ? 'bg-violet-600 text-white'
                              : isSubmitted && isThisCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {displayLabel}
                        </span>
                        <div
                          className="flex-1 overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: opt.text }}
                        />
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-lg text-sm text-slate-700">
                    <div className="flex items-center gap-1.5 font-bold text-violet-900 mb-1">
                      <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                      </svg>
                      Hướng dẫn giải chi tiết:
                    </div>
                    <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* PHẦN II: TỰ LUẬN */}
        <section className="space-y-4">
          <div className="bg-slate-800 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <h2 className="font-bold text-base sm:text-lg">
              PHẦN II. TỰ LUẬN (3,0 ĐIỂM – 2 CÂU, 1,5 Đ/CÂU)
            </h2>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-md font-medium">
              2 Câu hỏi
            </span>
          </div>

          {SHORTANS_QUESTIONS_DAYSO_DE_B.map((q) => {
            const studentText = shortAnswers[q.id] || '';
            const isCorrect = q.validator(studentText);
            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl p-5 sm:p-6 border transition shadow-sm ${
                  isSubmitted
                    ? isCorrect
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-md">
                      Câu {q.number} (Tự luận)
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      [Kỹ năng: {q.skill}]
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">1,5 đ</span>
                </div>

                <div
                  className="text-slate-900 text-sm sm:text-base leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: q.text }}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600">
                    Nhập đáp án tóm tắt hoặc kết quả của bạn:
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitted}
                    value={studentText}
                    onChange={(e) =>
                      setShortAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder={q.placeholder}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 disabled:bg-slate-100"
                  />
                </div>

                {isSubmitted && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-lg text-sm text-slate-700">
                    <div className="mb-2">
                      <span className="text-xs font-bold uppercase text-emerald-800">
                        Đáp số chuẩn:
                      </span>
                      <p className="font-semibold text-slate-900 mt-0.5">{q.correctDisplay}</p>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-violet-900 mb-1">
                      <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                      </svg>
                      Thang điểm & Lời giải chi tiết:
                    </div>
                    <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* NÚT NỘP BÀI THI */}
        <div className="pt-4 pb-12 flex flex-col items-center">
          {!isSubmitted ? (
            <button
              id="btn-nop-bai"
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full sm:w-80 py-4 px-6 bg-violet-700 hover:bg-violet-800 disabled:bg-violet-400 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-violet-600/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang chấm điểm & nộp bài...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  NỘP BÀI THI (45 PHÚT)
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="py-3 px-6 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl shadow transition"
              >
                Làm lại bài thi
              </button>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="py-3 px-6 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 rounded-xl shadow-sm transition"
              >
                Xem lại điểm số & bài làm
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
