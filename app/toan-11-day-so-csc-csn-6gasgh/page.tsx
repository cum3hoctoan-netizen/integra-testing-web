'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA MÔN TOÁN LỚP 11 - 90 PHÚT';
const EXAM_SUBTITLE = 'CHỦ ĐỀ: DÃY SỐ - CẤP SỐ CỘNG - CẤP SỐ NHÂN';
const EXAM_TIME_NOTE =
  '(Thời gian làm bài: 90 phút - Chuẩn cấu trúc đánh giá năng lực GDPT 2018 • 12 câu trắc nghiệm + 4 bài Đúng/Sai + 6 câu trả lời ngắn)';

// --- CẤU HÌNH WEBHOOK URL ---
const GOOGLE_APP_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwFjkENCxOPVJcFo8OmXuLad5kcMEC9_Uu48hF045AO0yC8-TnHivEI0ohfUHZkJQlN/exec';
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook-test/cham-diem-integra';

// --- INTERFACES & TYPES (CHUẨN OBJECT ARRAY VỚI CỜ isCorrect ĐỘNG) ---
export interface OptionItem {
  text: string;
  isCorrect: boolean;
}

export interface QuestionMCQ {
  id: string;
  number: number;
  type: 'mcq';
  skill: string;
  points: number;
  text: string;
  options: OptionItem[];
  explanation: string;
}

export interface TFItem {
  key: 'a' | 'b' | 'c' | 'd';
  text: string;
  correct: boolean;
}

export interface QuestionTF {
  id: string;
  number: number;
  type: 'tf';
  skill: string;
  text: string;
  items: TFItem[];
  explanation: string;
}

export interface QuestionShortAns {
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

// Thuật toán xáo trộn mảng Fisher-Yates (Knuth Shuffle) cho mảng Object
function shuffleOptions(options: OptionItem[]): OptionItem[] {
  const result: OptionItem[] = options.map((opt) => ({ ...opt }));
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Thang điểm Bộ GD&ĐT 2025 cho phần Đúng/Sai (tối đa 1.0 điểm/câu, tổng 4.0 điểm)
function calculateTFPoints(correctCount: number): number {
  if (correctCount === 1) return 0.1;
  if (correctCount === 2) return 0.25;
  if (correctCount === 3) return 0.5;
  if (correctCount === 4) return 1.0;
  return 0;
}

// ==========================================
// DỮ LIỆU ĐỀ THI GỐC (PARSE TỪ MÃ LATEX)
// ==========================================

const RAW_MCQ_QUESTIONS: QuestionMCQ[] = [
  {
    id: 'mcq1',
    number: 1,
    type: 'mcq',
    skill: 'Tính số hạng của dãy số cho bởi công thức tổng quát',
    points: 0.25,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{2n - 1}{n + 1}$. Giá trị của số hạng $u_3$ bằng:',
    options: [
      { text: '$\\dfrac{5}{4}$', isCorrect: true },
      { text: '$\\dfrac{3}{4}$', isCorrect: false },
      { text: '$\\dfrac{1}{2}$', isCorrect: false },
      { text: '$\\dfrac{5}{3}$', isCorrect: false },
    ],
    explanation:
      'Thay $n = 3$ vào công thức số hạng tổng quát của dãy số:<br>$$u_3 = \\dfrac{2(3) - 1}{3 + 1} = \\dfrac{5}{4}.$$',
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Xét tính tăng, giảm và bị chặn của dãy số phân thức bậc nhất',
    points: 0.25,
    text: 'Cho dãy số $(u_n)$ với $u_n = \\dfrac{3n + 1}{n + 2}$. Mệnh đề nào sau đây **đúng**?',
    options: [
      { text: 'Dãy số $(u_n)$ là dãy số giảm', isCorrect: false },
      { text: 'Dãy số $(u_n)$ là dãy số tăng và bị chặn trên', isCorrect: true },
      { text: 'Dãy số $(u_n)$ là dãy số tăng và không bị chặn', isCorrect: false },
      { text: 'Dãy số $(u_n)$ không tăng, không giảm', isCorrect: false },
    ],
    explanation:
      'Xét hiệu $u_{n+1} - u_n$:<br>$$u_{n+1} - u_n = \\dfrac{3(n+1) + 1}{(n+1) + 2} - \\dfrac{3n + 1}{n + 2} = \\dfrac{3n + 4}{n + 3} - \\dfrac{3n + 1}{n + 2} = \\dfrac{5}{(n+3)(n+2)} > 0 \\quad (\\forall n \\ge 1).$$<br>Do đó dãy số $(u_n)$ là dãy số tăng. Mặt khác, $u_n = \\dfrac{3(n+2) - 5}{n+2} = 3 - \\dfrac{5}{n+2} < 3$ với mọi $n \\ge 1$, nên dãy số bị chặn trên bởi $3$.',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Ứng dụng dãy số trong mô hình tăng trưởng quần thể vi khuẩn',
    points: 0.25,
    text: 'Một phòng thí nghiệm sinh học theo dõi sự tăng trưởng của quần thể vi khuẩn. Số lượng vi khuẩn tại thời điểm $n$ giờ ($n \\in \\mathbb{N}^*$) được mô hình hóa bởi dãy số $N_n = \\dfrac{1000n}{n + 9}$ (đơn vị: con). Hỏi sau ít nhất bao nhiêu giờ thì số lượng vi khuẩn trong phòng thí nghiệm đạt trên $900$ con?',
    options: [
      { text: '$81$ giờ', isCorrect: false },
      { text: '$82$ giờ', isCorrect: true },
      { text: '$90$ giờ', isCorrect: false },
      { text: '$80$ giờ', isCorrect: false },
    ],
    explanation:
      'Để số lượng vi khuẩn đạt trên $900$ con, ta có bất phương trình:<br>$$N_n > 900 \\Leftrightarrow \\dfrac{1000n}{n + 9} > 900 \\Leftrightarrow 1000n > 900n + 8100 \\Leftrightarrow 100n > 8100 \\Leftrightarrow n > 81.$$<br>Vì $n \\in \\mathbb{N}^*$ nên giá trị nhỏ nhất của $n$ là $82$. Vậy sau ít nhất $82$ giờ thì số lượng vi khuẩn đạt trên $900$ con.',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Xác định số hạng tổng quát của dãy số truy hồi phân thức bằng phép nghịch đảo',
    points: 0.25,
    text: 'Cho dãy số $(u_n)$ xác định bởi $u_1 = 2$ và $u_{n+1} = \\dfrac{u_n}{1 + 3u_n}$ với mọi $n \\ge 1$. Số hạng tổng quát $u_n$ của dãy số là:',
    options: [
      { text: '$u_n = \\dfrac{2}{6n - 5}$', isCorrect: true },
      { text: '$u_n = \\dfrac{1}{3n - 1}$', isCorrect: false },
      { text: '$u_n = \\dfrac{2}{3n - 1}$', isCorrect: false },
      { text: '$u_n = \\dfrac{1}{6n - 5}$', isCorrect: false },
    ],
    explanation:
      'Vì $u_1 = 2 > 0$ nên $u_n > 0$ với mọi $n \\ge 1$. Nghịch đảo hai vế của hệ thức truy hồi:<br>$$\\dfrac{1}{u_{n+1}} = \\dfrac{1 + 3u_n}{u_n} = \\dfrac{1}{u_n} + 3.$$<br>Đặt $v_n = \\dfrac{1}{u_n}$, ta có $v_1 = \\dfrac{1}{2}$ và $v_{n+1} = v_n + 3$. Do đó $(v_n)$ là cấp số cộng có $v_1 = \\dfrac{1}{2}$ và công sai $d = 3$.<br>Suy ra $v_n = \\dfrac{1}{2} + 3(n-1) = \\dfrac{6n - 5}{2} \\Rightarrow u_n = \\dfrac{1}{v_n} = \\dfrac{2}{6n - 5}$.',
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Tìm số hạng thứ n của cấp số cộng',
    points: 0.25,
    text: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = -3$ và công sai $d = 4$. Số hạng $u_6$ bằng:',
    options: [
      { text: '$17$', isCorrect: true },
      { text: '$21$', isCorrect: false },
      { text: '$13$', isCorrect: false },
      { text: '$-23$', isCorrect: false },
    ],
    explanation:
      'Số hạng tổng quát của cấp số cộng: $u_6 = u_1 + 5d = -3 + 5(4) = 17$.',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Tìm số hạng đầu và công sai từ hệ phương trình của cấp số cộng',
    points: 0.25,
    text: 'Cho cấp số cộng $(u_n)$ thỏa mãn hệ phương trình $\\begin{cases} u_2 + u_5 = 20 \\\\ u_3 + u_7 = 26 \\end{cases}$. Số hạng đầu $u_1$ và công sai $d$ của cấp số cộng lần lượt bằng:',
    options: [
      { text: '$u_1 = 5, d = 2$', isCorrect: true },
      { text: '$u_1 = 3, d = 3$', isCorrect: false },
      { text: '$u_1 = 2, d = 5$', isCorrect: false },
      { text: '$u_1 = 4, d = 2$', isCorrect: false },
    ],
    explanation:
      'Biểu diễn các số hạng theo $u_1$ và $d$:<br>$$\\begin{cases} (u_1 + d) + (u_1 + 4d) = 20 \\\\ (u_1 + 2d) + (u_1 + 6d) = 26 \\end{cases} \\Leftrightarrow \\begin{cases} 2u_1 + 5d = 20 \\\\ 2u_1 + 8d = 26 \\end{cases} \\Leftrightarrow \\begin{cases} 3d = 6 \\\\ 2u_1 + 5d = 20 \\end{cases} \\Leftrightarrow \\begin{cases} d = 2 \\\\ u_1 = 5. \\end{cases}$$',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Ứng dụng cấp số cộng tính tổng số ghế hội trường',
    points: 0.25,
    text: 'Một hội trường có $20$ hàng ghế. Hàng ghế đầu tiên có $15$ ghế, mỗi hàng ghế tiếp theo có nhiều hơn hàng ghế ngay trước nó $2$ ghế. Tổng số ghế trong hội trường đó bằng:',
    options: [
      { text: '$680$ ghế', isCorrect: true },
      { text: '$650$ ghế', isCorrect: false },
      { text: '$700$ ghế', isCorrect: false },
      { text: '$540$ ghế', isCorrect: false },
    ],
    explanation:
      'Số ghế ở mỗi hàng lập thành một cấp số cộng $(u_n)$ có $u_1 = 15$, công sai $d = 2$ và $n = 20$.<br>Tổng số ghế trong hội trường là tổng $20$ số hạng đầu của cấp số cộng:<br>$$S_{20} = \\dfrac{20}{2}[2u_1 + (20-1)d] = 10[2(15) + 19(2)] = 10(30 + 38) = 680\\text{ ghế}.$$',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Tìm tham số m để phương trình bậc 3 có 3 nghiệm lập thành cấp số cộng',
    points: 0.25,
    text: 'Tìm tất cả các giá trị của tham số $m$ để phương trình $x^3 - 3x^2 - 9x + m = 0$ có $3$ nghiệm phân biệt $x_1, x_2, x_3$ lập thành một cấp số cộng.',
    options: [
      { text: '$m = 11$', isCorrect: true },
      { text: '$m = -11$', isCorrect: false },
      { text: '$m = 9$', isCorrect: false },
      { text: '$m = -9$', isCorrect: false },
    ],
    explanation:
      'Giả sử phương trình có $3$ nghiệm phân biệt $x_1, x_2, x_3$ lập thành cấp số cộng $\\Rightarrow x_1 + x_3 = 2x_2$.<br>Theo định lý Vi-ét cho phương trình bậc ba: $x_1 + x_2 + x_3 = 3 \\Rightarrow 3x_2 = 3 \\Rightarrow x_2 = 1$.<br>Vì $x_2 = 1$ là nghiệm của phương trình nên: $1^3 - 3(1)^2 - 9(1) + m = 0 \\Leftrightarrow m = 11$.<br>Thử lại với $m = 11$: $x^3 - 3x^2 - 9x + 11 = 0 \\Leftrightarrow (x - 1)(x^2 - 2x - 11) = 0 \\Rightarrow x \\in \\{1 - 2\\sqrt{3}; 1; 1 + 2\\sqrt{3}\\}$, lập thành một cấp số cộng có công sai $d = 2\\sqrt{3}$. Vậy $m = 11$.',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Tìm số hạng thứ n của cấp số nhân',
    points: 0.25,
    text: 'Cho cấp số nhân $(u_n)$ có $u_1 = 3$ và công bội $q = -2$. Số hạng $u_5$ bằng:',
    options: [
      { text: '$48$', isCorrect: true },
      { text: '$-48$', isCorrect: false },
      { text: '$24$', isCorrect: false },
      { text: '$-96$', isCorrect: false },
    ],
    explanation:
      'Số hạng tổng quát của cấp số nhân: $u_5 = u_1 \\cdot q^4 = 3 \\cdot (-2)^4 = 3 \\cdot 16 = 48$.',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Tìm số hạng đầu và công bội của cấp số nhân từ hệ phương trình',
    points: 0.25,
    text: 'Cho cấp số nhân $(u_n)$ thỏa mãn $\\begin{cases} u_4 - u_2 = 54 \\\\ u_5 - u_3 = 108 \\end{cases}$. Công bội $q$ và số hạng đầu $u_1$ của cấp số nhân bằng:',
    options: [
      { text: '$u_1 = 9, q = 2$', isCorrect: true },
      { text: '$u_1 = 6, q = 3$', isCorrect: false },
      { text: '$u_1 = 9, q = -2$', isCorrect: false },
      { text: '$u_1 = 3, q = 2$', isCorrect: false },
    ],
    explanation:
      'Biểu diễn theo $u_1$ và $q$:<br>$$\\begin{cases} u_1 q^3 - u_1 q = 54 \\\\ u_1 q^4 - u_1 q^2 = 108 \\end{cases} \\Leftrightarrow \\begin{cases} u_1 q(q^2 - 1) = 54 \\quad (1) \\\\ u_1 q^2(q^2 - 1) = 108 \\quad (2) \\end{cases}$$<br>Lấy $(2)$ chia cho $(1)$ theo vế: $q = \\dfrac{108}{54} = 2$.<br>Thay $q = 2$ vào $(1)$: $u_1 \\cdot 2 \\cdot (4 - 1) = 54 \\Leftrightarrow 6u_1 = 54 \\Leftrightarrow u_1 = 9$.',
  },
  {
    id: 'mcq11',
    number: 11,
    type: 'mcq',
    skill: 'Bài toán tài chính tính lãi kép định kỳ hàng tháng',
    points: 0.25,
    text: 'Bác An gửi tiết kiệm $100$ triệu đồng vào ngân hàng với lãi suất $0{,}6\\%$/tháng theo hình thức lãi kép (tiền lãi mỗi tháng được cộng dồn vào vốn cho tháng tiếp theo). Hỏi sau đúng $2$ năm ($24$ tháng), bác An thu được tổng số tiền cả gốc lẫn lãi là bao nhiêu (làm tròn đến hàng nghìn đồng)?',
    options: [
      { text: '$115.439.000$ đồng', isCorrect: true },
      { text: '$114.400.000$ đồng', isCorrect: false },
      { text: '$116.200.000$ đồng', isCorrect: false },
      { text: '$112.000.000$ đồng', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức lãi kép $A_n = A_0(1 + r)^n$:<br>Với $A_0 = 100.000.000$ đồng, $r = 0{,}6\\% = 0{,}006$, $n = 24$ tháng.<br>Tổng số tiền thu được sau 24 tháng:<br>$$A_{24} = 100.000.000 \\times (1 + 0{,}006)^{24} \\approx 115.438.830\\text{ đồng} \\approx 115.439.000\\text{ đồng}.$$',
  },
  {
    id: 'mcq12',
    number: 12,
    type: 'mcq',
    skill: 'Mối liên hệ giữa cấp số cộng và cấp số nhân giữa 3 số thực',
    points: 0.25,
    text: 'Cho ba số thực $x, y, z$ khác $0$ theo thứ tự lập thành một cấp số nhân có công bội $q \\ne 1$. Đồng thời ba số $x, 2y, 3z$ theo thứ tự lập thành một cấp số cộng. Giá trị của công bội $q$ bằng:',
    options: [
      { text: '$q = \\dfrac{1}{3}$', isCorrect: true },
      { text: '$q = 3$', isCorrect: false },
      { text: '$q = \\dfrac{1}{2}$', isCorrect: false },
      { text: '$q = 2$', isCorrect: false },
    ],
    explanation:
      'Vì $x, y, z$ lập thành cấp số nhân công bội $q$ nên $y = xq$ và $z = xq^2$.<br>Vì $x, 2y, 3z$ lập thành cấp số cộng nên:<br>$$x + 3z = 2(2y) \\Leftrightarrow x + 3xq^2 = 4xq \\Leftrightarrow x(3q^2 - 4q + 1) = 0.$$<br>Vì $x \\ne 0$ nên $3q^2 - 4q + 1 = 0 \\Leftrightarrow \\left[\\begin{array}{l} q = 1\\text{ (loại vì } q \\ne 1) \\\\ q = \\dfrac{1}{3}\\text{ (thỏa mãn)}. \\end{array}\\right.$',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 13,
    type: 'tf',
    skill: 'Dãy số truy hồi dạng sai phân bậc hai',
    text: 'Cho dãy số $(u_n)$ xác định bởi công thức truy hồi: $u_1 = 1$ và $u_{n+1} = u_n + 2n + 1$ với mọi $n \\ge 1$. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Số hạng $u_2 = 4$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Số hạng $u_3 = 8$.',
        correct: false,
      },
      {
        key: 'c',
        text: 'Số hạng tổng quát của dãy số là $u_n = n^2$ với mọi $n \\ge 1$.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Dãy số $(u_n)$ là một dãy số bị chặn trên.',
        correct: false,
      },
    ],
    explanation:
      'a) **Đúng**. $u_2 = u_1 + 2(1) + 1 = 1 + 2 + 1 = 4$.<br>b) **Sai**. $u_3 = u_2 + 2(2) + 1 = 4 + 4 + 1 = 9 \\ne 8$.<br>c) **Đúng**. Ta có $u_{k+1} - u_k = 2k + 1$. Do đó:<br>$$u_n = u_1 + \\sum_{k=1}^{n-1} (2k + 1) = 1 + 2\\dfrac{(n-1)n}{2} + (n-1) = 1 + n^2 - n + n - 1 = n^2.$$<br>d) **Sai**. Vì $u_n = n^2 \\to +\\infty$ khi $n \\to +\\infty$ nên dãy số không bị chặn trên.',
  },
  {
    id: 'tf2',
    number: 14,
    type: 'tf',
    skill: 'Mô hình thiết kế khán đài sân vận động theo cấp số cộng và tính doanh thu',
    text: 'Một công ty xây dựng thiết kế một khán đài sân vận động hình vòng cung. Hàng ghế đầu tiên có $120$ ghế, các hàng ghế tiếp theo mỗi hàng nhiều hơn hàng ghế ngay trước đó $10$ ghế. Khán đài có tất cả $30$ hàng ghế. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Số ghế ở mỗi hàng lập thành một cấp số cộng với số hạng đầu $u_1 = 120$ và công sai $d = 10$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Hàng ghế cuối cùng (hàng thứ 30) có đúng 400 ghế.',
        correct: false,
      },
      {
        key: 'c',
        text: 'Tổng số ghế của toàn bộ khán đài là 7950 ghế.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Nếu giá vé ở hàng ghế thứ $n$ được tính theo công thức $V_n = 500 - 10n$ (nghìn đồng/vé) thì tổng doanh thu thu được khi bán hết vé của riêng hàng thứ 10 là 25 triệu đồng.',
        correct: false,
      },
    ],
    explanation:
      'a) **Đúng**. Theo thiết kế, số ghế mỗi hàng tăng đều $10$ ghế nên lập thành CSC có $u_1 = 120, d = 10$.<br>b) **Sai**. Số ghế ở hàng thứ 30 là $u_{30} = u_1 + 29d = 120 + 29(10) = 410$ ghế $\\ne 400$.<br>c) **Đúng**. Tổng số ghế khán đài: $S_{30} = \\dfrac{30}{2}(u_1 + u_{30}) = 15(120 + 410) = 7950$ ghế.<br>d) **Sai**. Hàng 10 có $u_{10} = 120 + 9(10) = 210$ ghế. Giá vé hàng 10 là $V_{10} = 500 - 10(10) = 400$ nghìn đồng = $0{,}4$ triệu đồng. Doanh thu hàng 10 = $210 \\times 0{,}4 = 84$ triệu đồng $\\ne 25$ triệu đồng.',
  },
  {
    id: 'tf3',
    number: 15,
    type: 'tf',
    skill: 'Mô hình phân chia tế bào và khối lượng sinh học theo cấp số nhân',
    text: 'Thí nghiệm nuôi cấy tế bào sinh học ghi nhận: ban đầu có $100$ tế bào, cứ sau mỗi $30$ phút số tế bào lại phân chia nhân đôi một lần. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Số lượng tế bào sau các chu kỳ phân chia lập thành một cấp số nhân có số hạng đầu $u_1 = 100$ và công bội $q = 2$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Sau 3 giờ (tương ứng 6 lần phân chia), số lượng tế bào thu được là 3200 tế bào.',
        correct: false,
      },
      {
        key: 'c',
        text: 'Sau 5 giờ (tương ứng 10 lần phân chia), số lượng tế bào vượt quá 100.000 tế bào.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Nếu mỗi tế bào có khối lượng $10^{-9}$ gam thì tổng khối lượng quần thể tế bào sau 12 giờ phân chia vượt quá 10 gam.',
        correct: false,
      },
    ],
    explanation:
      'a) **Đúng**. Ban đầu $u_1 = 100$, sau mỗi 30 phút số tế bào nhân đôi nên công bội $q = 2$.<br>b) **Sai**. Sau 3 giờ có $6$ lần phân chia, số lượng tế bào thu được sau lần phân chia thứ 6 là $u_7 = u_1 \\cdot q^6 = 100 \\cdot 2^6 = 6400$ tế bào $\\ne 3200$.<br>c) **Đúng**. Sau 5 giờ (10 lần phân chia), số lượng tế bào là $u_{11} = 100 \\cdot 2^{10} = 102.400 > 100.000$.<br>d) **Sai**. 12 giờ ứng với $24$ lần phân chia. Số tế bào thu được $N = 100 \\cdot 2^{24} = 1.677.721.600$ tế bào. Khối lượng $= 1.677.721.600 \\times 10^{-9} \\approx 1{,}68\\text{ gam} < 10\\text{ gam}$.',
  },
  {
    id: 'tf4',
    number: 16,
    type: 'tf',
    skill: 'Tìm cấp số cộng và cấp số nhân từ hệ điều kiện giữa ba số',
    text: 'Cho ba số thực $a, b, c$ thỏa mãn: $a, b, c$ theo thứ tự lập thành một cấp số cộng có tổng bằng $15$. Nếu thêm $1$ vào $a$, thêm $4$ vào $b$, và thêm $19$ vào $c$ thì ba số mới $(a+1), (b+4), (c+19)$ theo thứ tự lập thành một cấp số nhân. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Số hạng $b = 5$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Nếu công sai của cấp số cộng $d > 0$ thì $a = 2$ và $c = 8$.',
        correct: true,
      },
      {
        key: 'c',
        text: 'Với công sai $d > 0$, cấp số nhân tương ứng có công bội $q = 2$.',
        correct: false,
      },
      {
        key: 'd',
        text: 'Với công sai $d < 0$, giá trị $a = 26$ và $c = -16$.',
        correct: true,
      },
    ],
    explanation:
      'Vì $a, b, c$ lập thành CSC có tổng $a + b + c = 15 \\Rightarrow 3b = 15 \\Rightarrow b = 5$. Vậy a) **Đúng**.<br>Gọi $d$ là công sai của CSC $\\Rightarrow a = 5 - d, c = 5 + d$.<br>Ba số mới là $a+1 = 6-d$, $b+4 = 9$, $c+19 = 24+d$. Do lập thành CSN nên:<br>$$9^2 = (6-d)(24+d) \\Leftrightarrow 81 = 144 - 18d - d^2 \\Leftrightarrow d^2 + 18d - 63 = 0 \\Leftrightarrow \\left[\\begin{array}{l} d = 3 \\\\ d = -21. \\end{array}\\right.$$<br>• Với $d = 3 > 0 \\Rightarrow a = 2, c = 8$. Cấp số nhân mới là $3, 9, 27 \\Rightarrow q = 3$. Do đó b) **Đúng**, c) **Sai**.<br>• Với $d = -21 < 0 \\Rightarrow a = 5 - (-21) = 26, c = 5 + (-21) = -16$. Do đó d) **Đúng**.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 17,
    type: 'shortans',
    skill: 'Tính số hạng của dãy số từ hệ thức truy hồi tuyến tính',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ xác định bởi hệ thức truy hồi $u_1 = 3$ và $u_{n+1} = 2u_n - 1$ với mọi $n \\ge 1$. Tính số hạng $u_5$.',
    placeholder: 'Nhập giá trị số (VD: 15)',
    correctDisplay: '33',
    explanation:
      'Tính lần lượt từng số hạng của dãy số:<br>• $u_1 = 3$<br>• $u_2 = 2(3) - 1 = 5$<br>• $u_3 = 2(5) - 1 = 9$<br>• $u_4 = 2(9) - 1 = 17$<br>• $u_5 = 2(17) - 1 = 33$.',
    validator: (val: string) => val.trim() === '33',
  },
  {
    id: 'sa2',
    number: 18,
    type: 'shortans',
    skill: 'Bài toán tài chính gửi thêm tiền định kỳ đầu mỗi tháng',
    points: 0.5,
    text: 'Một người gửi $100$ triệu đồng vào ngân hàng với lãi suất $0{,}5\\%$/tháng. Đầu mỗi tháng tiếp theo, người đó gửi thêm vào tài khoản $10$ triệu đồng. Tính tổng số tiền người đó có trong tài khoản ngay sau khi gửi khoản tiền ở đầu tháng thứ $12$ (làm tròn đến hàng nghìn đồng).',
    placeholder: 'Nhập số tiền (đồng, VD: 150.000.000)',
    correctDisplay: '218.409.000 đồng',
    explanation:
      'Gọi $r = 0{,}5\\% = 0{,}005$.<br>• Đầu tháng 1, số tiền gửi ban đầu là $T_1 = 100$ triệu đồng.<br>• Cuối tháng 1, số tiền là $100(1+r)$. Đầu tháng 2 gửi thêm 10 triệu $\\Rightarrow T_2 = 100(1+r) + 10$.<br>• Cuối tháng 2, số tiền là $T_2(1+r)$. Đầu tháng 3 gửi thêm 10 triệu $\\Rightarrow T_3 = 100(1+r)^2 + 10(1+r) + 10$.<br>• Bằng phương pháp quy nạp, đầu tháng thứ 12, tổng số tiền trong tài khoản ngay sau khi gửi khoản 10 triệu là:<br>$$T_{12} = 100(1+r)^{11} + 10(1+r)^{10} + 10(1+r)^9 + \\dots + 10 = 100(1+r)^{11} + 10 \\cdot \\dfrac{(1+r)^{11} - 1}{r}.$$<br>Thay $r = 0{,}005$:<br>$$T_{12} = 100(1{,}005)^{11} + 10 \\cdot \\dfrac{(1{,}005)^{11} - 1}{0{,}005} \\approx 105{,}6385 + 112{,}770 = 218{,}4085\\text{ triệu đồng}.$$<br>Làm tròn đến hàng nghìn đồng: $218.409.000$ đồng.',
    validator: (val: string) => {
      const clean = val.trim().replace(/đồng/gi, '').replace(/\./g, '').trim();
      return clean === '218409000';
    },
  },
  {
    id: 'sa3',
    number: 19,
    type: 'shortans',
    skill: 'Tìm công sai từ tổng 10 số hạng đầu của cấp số cộng',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 4$ và tổng $10$ số hạng đầu tiên $S_{10} = 220$. Tìm công sai $d$ của cấp số cộng đó.',
    placeholder: 'Nhập giá trị công sai (VD: 2)',
    correctDisplay: '4',
    explanation:
      'Sử dụng công thức tính tổng $n$ số hạng đầu của cấp số cộng:<br>$$S_{10} = \\dfrac{10}{2}[2u_1 + 9d] = 5[2(4) + 9d] = 5(8 + 9d) = 220$$<br>$$\\Leftrightarrow 8 + 9d = 44 \\Leftrightarrow 9d = 36 \\Leftrightarrow d = 4.$$',
    validator: (val: string) => val.trim() === '4',
  },
  {
    id: 'sa4',
    number: 20,
    type: 'shortans',
    skill: 'Bài toán thực tế chi phí khoan giếng sâu 30 mét theo cấp số cộng',
    points: 0.5,
    text: 'Một thợ khoan giếng nhận hợp đồng đào một giếng sâu $30$ mét. Giá của mét khoan đầu tiên là $100.000$ đồng, và kể từ mét khoan thứ hai, giá của mỗi mét khoan sau tăng thêm $20.000$ đồng so với giá của mét khoan ngay trước đó. Tính tổng chi phí mà chủ nhà phải trả để đào xong cái giếng $30$ mét này (đơn vị: đồng).',
    placeholder: 'Nhập tổng chi phí (đồng, VD: 8.500.000)',
    correctDisplay: '11.700.000 đồng',
    explanation:
      'Chi phí đào mỗi mét giếng lập thành một cấp số cộng có $u_1 = 100.000$ đồng, công sai $d = 20.000$ đồng và $n = 30$.<br>Tổng chi phí đào giếng 30 mét là tổng 30 số hạng đầu của cấp số cộng:<br>$$S_{30} = \\dfrac{30}{2}[2u_1 + 29d] = 15[2(100.000) + 29(20.000)] = 15(200.000 + 580.000) = 11.700.000\\text{ đồng}.$$',
    validator: (val: string) => {
      const clean = val.trim().replace(/đồng/gi, '').replace(/\./g, '').trim();
      return clean === '11700000';
    },
  },
  {
    id: 'sa5',
    number: 21,
    type: 'shortans',
    skill: 'Tính tổng 8 số hạng đầu tiên của cấp số nhân',
    points: 0.5,
    text: 'Cho cấp số nhân $(u_n)$ có $u_2 = 6$ và $u_5 = 48$. Tính tổng $8$ số hạng đầu tiên $S_8$ của cấp số nhân đó.',
    placeholder: 'Nhập giá trị tổng S8 (VD: 450)',
    correctDisplay: '765',
    explanation:
      'Ta có $u_5 = u_2 \\cdot q^3 \\Leftrightarrow 48 = 6 \\cdot q^3 \\Leftrightarrow q^3 = 8 \\Leftrightarrow q = 2$.<br>Số hạng đầu $u_1 = \\dfrac{u_2}{q} = \\dfrac{6}{2} = 3$.<br>Tổng $8$ số hạng đầu tiên của cấp số nhân:<br>$$S_8 = u_1 \\cdot \\dfrac{q^8 - 1}{q - 1} = 3 \\cdot \\dfrac{2^8 - 1}{2 - 1} = 3 \\cdot (256 - 1) = 765.$$',
    validator: (val: string) => val.trim() === '765',
  },
  {
    id: 'sa6',
    number: 22,
    type: 'shortans',
    skill: 'Khấu hao giá trị xe ô tô qua 5 năm theo cấp số nhân',
    points: 0.5,
    text: 'Một chiếc xe ô tô mua mới với giá $800$ triệu đồng. Sau mỗi năm sử dụng, giá trị còn lại của chiếc xe giảm $10\\%$ so với giá trị của năm ngay trước đó. Tính giá trị còn lại của chiếc xe sau $5$ năm sử dụng (làm tròn đến hàng triệu đồng).',
    placeholder: 'Nhập giá trị còn lại (triệu đồng, VD: 350)',
    correctDisplay: '472 triệu đồng',
    explanation:
      'Giá trị còn lại của xe sau mỗi năm lập thành một cấp số nhân có $u_0 = 800$ triệu đồng và công bội $q = 1 - 10\\% = 0{,}9$.<br>Sau $5$ năm sử dụng, giá trị còn lại của chiếc xe là:<br>$$u_5 = u_0 \\cdot q^5 = 800 \\times (0{,}9)^5 = 800 \\times 0{,}59049 = 472{,}392\\text{ triệu đồng}.$$<br>Làm tròn đến hàng triệu đồng: $472$ triệu đồng.',
    validator: (val: string) => val.trim().replace(/triệu( đồng)?/gi, '').trim() === '472',
  },
];

export default function Toan11DaySoCscCsnPage() {
  // 1. STATE THÔNG TIN THÍ SINH
  const [tenHocSinh, setTenHocSinh] = useState<string>('');
  const [maHocSinh, setMaHocSinh] = useState<string>('');
  const [lopNhom, setLopNhom] = useState<string>('');

  // 2. STATE LÀM BÀI & TRẢ LỜI
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [tfAnswers, setTfAnswers] = useState<Record<string, Record<string, boolean | null>>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State lưu danh sách câu hỏi trắc nghiệm đã xáo trộn phương án (Fisher-Yates)
  const [shuffledMCQQuestions, setShuffledMCQQuestions] = useState<QuestionMCQ[]>(() =>
    RAW_MCQ_QUESTIONS.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ ...opt })),
    }))
  );

  // Xáo trộn phương án khi component được mount (Fisher-Yates)
  useEffect(() => {
    const shuffled = RAW_MCQ_QUESTIONS.map((q) => ({
      ...q,
      options: shuffleOptions(q.options),
    }));
    setShuffledMCQQuestions(shuffled);
  }, []);

  // CẬP NHẬT TIÊU ĐỀ TRÌNH DUYỆT (DOCUMENT.TITLE) ĐỘNG THEO YÊU CẦU
  useEffect(() => {
    document.title = `${EXAM_TITLE} - ${EXAM_SUBTITLE}`;
  }, []);

  // 3. STATE KẾT QUẢ & ĐIỂM SỐ
  const [diemSo, setDiemSo] = useState<number>(0);
  const [diemPhan1, setDiemPhan1] = useState<number>(0);
  const [diemPhan2, setDiemPhan2] = useState<number>(0);
  const [diemPhan3, setDiemPhan3] = useState<number>(0);
  const [soCauDungMCQ, setSoCauDungMCQ] = useState<number>(0);
  const [mangCauSai, setMangCauSai] = useState<string[]>([]);

  // 4. ĐỒNG HỒ ĐẾM NGƯỢC (90 PHÚT = 5400 GIÂY)
  const [timeLeft, setTimeLeft] = useState<number>(90 * 60);

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
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

  // Tính tiến độ làm bài
  const answeredMCQCount = Object.keys(mcqAnswers).length;
  let answeredTFSubCount = 0;
  RAW_TF_QUESTIONS.forEach((q) => {
    const subs = tfAnswers[q.id];
    if (subs) {
      ['a', 'b', 'c', 'd'].forEach((k) => {
        if (subs[k] !== undefined && subs[k] !== null) {
          answeredTFSubCount += 1;
        }
      });
    }
  });
  const answeredShortCount = Object.values(shortAnswers).filter((v) => v.trim().length > 0).length;
  const totalItems = RAW_MCQ_QUESTIONS.length + RAW_TF_QUESTIONS.length * 4 + RAW_SHORTANS_QUESTIONS.length;
  const totalAnswered = answeredMCQCount + answeredTFSubCount + answeredShortCount;
  const progressPercent = Math.min(100, Math.round((totalAnswered / totalItems) * 100));

  // 5. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS11-GK-01';
    const lop = lopNhom.trim() || 'Lớp 11';

    if (!tenHocSinh.trim()) {
      const confirmAnonymous = window.confirm(
        'Bạn chưa nhập Họ và tên. Bạn có muốn nộp bài với tên "Học sinh ẩn danh" không?'
      );
      if (!confirmAnonymous) return;
    }

    setIsSubmitting(true);

    let p1Score = 0;
    let correctMCQ = 0;
    const wrongSkills: string[] = [];

    // Chấm Phần I (12 câu MCQ, 0.25đ/câu = 3.0đ)
    shuffledMCQQuestions.forEach((q) => {
      const selectedIndex = mcqAnswers[q.id];
      const chosenOption = selectedIndex !== undefined ? q.options[selectedIndex] : null;
      const isCorrect = chosenOption ? chosenOption.isCorrect === true : false;

      if (isCorrect) {
        p1Score += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (4 bài Đúng/Sai, tối đa 1.0đ/bài = 4.0đ)
    let p2Score = 0;
    RAW_TF_QUESTIONS.forEach((q) => {
      const studentSubAnswers = tfAnswers[q.id] || {};
      let correctSubCount = 0;
      q.items.forEach((item) => {
        if (studentSubAnswers[item.key] === item.correct) {
          correctSubCount += 1;
        }
      });
      const pointsThisQ = calculateTFPoints(correctSubCount);
      p2Score += pointsThisQ;
      if (correctSubCount < 4) {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần III (6 câu ngắn, 0.5đ/câu = 3.0đ)
    let p3Score = 0;
    RAW_SHORTANS_QUESTIONS.forEach((q) => {
      const studentText = shortAnswers[q.id] || '';
      const isCorrect = q.validator(studentText);
      if (isCorrect) {
        p3Score += q.points;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    const finalScore = Math.min(10, Math.round((p1Score + p2Score + p3Score) * 100) / 100);
    const uniqueWrongSkills = Array.from(new Set(wrongSkills));

    setDiemPhan1(Math.round(p1Score * 100) / 100);
    setDiemPhan2(Math.round(p2Score * 100) / 100);
    setDiemPhan3(Math.round(p3Score * 100) / 100);
    setSoCauDungMCQ(correctMCQ);
    setDiemSo(finalScore);
    setMangCauSai(uniqueWrongSkills);
    setIsSubmitted(true);
    setIsSubmitting(false);

    // Gửi payload webhook tới Google Apps Script & n8n
    const payload = {
      timestamp: new Date().toISOString(),
      hoTen: ten,
      maHocSinh: ma,
      lop: lop,
      tenDe: EXAM_TITLE,
      chuDe: EXAM_SUBTITLE,
      tongDiem: finalScore,
      diemPhan1: Math.round(p1Score * 100) / 100,
      diemPhan2: Math.round(p2Score * 100) / 100,
      diemPhan3: Math.round(p3Score * 100) / 100,
      soCauDungMCQ: correctMCQ,
      thoiGianLamGiay: 90 * 60 - timeLeft,
      chuyenDeCanOnTap: uniqueWrongSkills,
    };

    try {
      fetch(GOOGLE_APP_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch((e) => console.error('Lỗi gửi Google Apps Script:', e));

      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch((e) => console.error('Lỗi gửi n8n webhook:', e));
    } catch (err) {
      console.warn('Không thể gửi kết quả webhook:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      {/* THANH ĐIỀU HƯỚNG VÀ TRẠNG THÁI NỔI */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              11
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 line-clamp-1">
                {EXAM_TITLE}
              </h1>
              <p className="text-xs text-slate-500 line-clamp-1">{EXAM_SUBTITLE}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Đồng hồ đếm ngược */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-mono font-bold tracking-wider shadow-inner transition ${
                timeLeft <= 300
                  ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Nút nộp bài */}
            {!isSubmitted && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Đang chấm...' : 'Nộp bài'}
              </button>
            )}
          </div>
        </div>

        {/* Thanh tiến độ */}
        <div className="w-full bg-slate-200 h-1">
          <div
            className="bg-sky-600 h-1 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-8">
        {/* KHỐI THÔNG TIN ĐỀ THI */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-sky-100/50 blur-2xl pointer-events-none" />
          <div className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 mb-3 border border-sky-200">
            TOÁN 11 • DÃY SỐ - CẤP SỐ CỘNG - CẤP SỐ NHÂN
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
            {EXAM_TITLE}
          </h2>
          <p className="text-sm sm:text-base font-semibold text-sky-700 mt-2">
            {EXAM_SUBTITLE}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl mx-auto leading-relaxed">
            {EXAM_TIME_NOTE}
          </p>
        </section>

        {/* KHỐI THÔNG TIN HỌC SINH */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Thông tin thí sinh
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="input-ten" className="block text-xs font-semibold text-slate-600 mb-1">
                Họ và tên thí sinh <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-ten"
                type="text"
                disabled={isSubmitted}
                value={tenHocSinh}
                onChange={(e) => setTenHocSinh(e.target.value)}
                placeholder="VD: Nguyễn Văn An"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label htmlFor="input-ma-hs" className="block text-xs font-semibold text-slate-600 mb-1">
                Mã học sinh / SBD
              </label>
              <input
                id="input-ma-hs"
                type="text"
                disabled={isSubmitted}
                value={maHocSinh}
                onChange={(e) => setMaHocSinh(e.target.value)}
                placeholder="VD: HS11-GK-001"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label htmlFor="input-lop" className="block text-xs font-semibold text-slate-600 mb-1">
                Lớp / Khối học
              </label>
              <input
                id="input-lop"
                type="text"
                disabled={isSubmitted}
                value={lopNhom}
                onChange={(e) => setLopNhom(e.target.value)}
                placeholder="VD: 11A1"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100"
              />
            </div>
          </div>
        </section>

        {/* BẢNG KẾT QUẢ KHI ĐÃ NỘP BÀI */}
        {isSubmitted && (
          <section className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sky-400/20 text-sky-200 border border-sky-400/30">
                  KẾT QUẢ BÀI LÀM CHÍNH THỨC
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {tenHocSinh.trim() || 'Học sinh ẩn danh'}
                </h3>
                <p className="text-sm text-sky-200">
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS11-GK-01'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '11'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Phần I: <strong>{diemPhan1.toFixed(2)}/3.0đ</strong> ({soCauDungMCQ}/12 câu đúng)</span>
                  <span>Phần II: <strong>{diemPhan2.toFixed(2)}/4.0đ</strong></span>
                  <span>Phần III: <strong>{diemPhan3.toFixed(2)}/3.0đ</strong></span>
                  <span>Thời gian làm bài: <strong>{Math.max(1, Math.round((90 * 60 - timeLeft) / 60))} phút</strong></span>
                </div>
              </div>

              {/* KHỐI ĐIỂM TỔNG KẾT */}
              <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-5 min-w-[180px] shadow-inner text-center">
                <span className="text-xs uppercase font-semibold text-sky-200 tracking-wider">
                  Tổng điểm đạt được
                </span>
                <div className="text-5xl sm:text-6xl font-black text-amber-300 my-1">
                  {diemSo.toFixed(1)}
                </div>
                <span className="text-xs text-sky-200 font-medium">Thang điểm 10.0</span>
              </div>
            </div>

            {/* PHÂN TÍCH KỸ NĂNG CẦN CẢI THIỆN */}
            {mangCauSai.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Các chuyên đề / dạng toán cần ôn luyện thêm:
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-200">
                  {mangCauSai.map((skill, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/10">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/20 hover:bg-white/30 text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                In kết quả / Lưu PDF
              </button>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN (12 CÂU - 3,0 ĐIỂM)   */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-sky-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (12 CÂU - 3,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-sky-800/80 px-3 py-1 rounded-full text-sky-200 font-medium">
              0,25 điểm / câu • 4 lựa chọn (1 đáp án đúng duy nhất)
            </span>
          </div>

          <div className="space-y-4">
            {shuffledMCQQuestions.map((q) => {
              const selectedIndex = mcqAnswers[q.id];
              const chosenOption = selectedIndex !== undefined ? q.options[selectedIndex] : null;
              const isStudentCorrect = chosenOption ? chosenOption.isCorrect === true : false;

              const correctOptionIndex = q.options.findIndex((opt) => opt.isCorrect === true);
              const dynamicCorrectLetter = ['A', 'B', 'C', 'D'][correctOptionIndex] || 'A';

              return (
                <div
                  key={q.id}
                  id={`cau-${q.number}`}
                  className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
                    isSubmitted
                      ? isStudentCorrect
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : selectedIndex !== undefined
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-amber-300 bg-amber-50/20'
                      : selectedIndex !== undefined
                      ? 'border-sky-300 shadow-sky-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-sky-100 text-sky-800 font-bold text-sm">
                        {q.number}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                        {q.points} điểm
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        • {q.skill}
                      </span>
                    </div>

                    {isSubmitted && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                          isStudentCorrect
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isStudentCorrect ? '✓ Đúng (+0.25đ)' : '✕ Sai (+0.0đ)'}
                      </span>
                    )}
                  </div>

                  <MathContent
                    content={q.text}
                    className="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mb-4 overflow-x-auto whitespace-pre-wrap break-words"
                  />

                  {/* 4 phương án xáo trộn */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, optIndex) => {
                      const displayLabel = ['A', 'B', 'C', 'D'][optIndex];
                      const isOptionSelected = selectedIndex === optIndex;
                      const isOptionCorrect = opt.isCorrect === true;

                      let btnStyle = 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300';
                      if (!isSubmitted) {
                        if (isOptionSelected) {
                          btnStyle = 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-200 font-semibold';
                        }
                      } else {
                        if (isOptionCorrect) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-300';
                        } else if (isOptionSelected && !isOptionCorrect) {
                          btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 line-through ring-2 ring-rose-200';
                        } else {
                          btnStyle = 'border-slate-200 bg-slate-50/50 opacity-60 text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={optIndex}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() =>
                            setMcqAnswers((prev) => ({
                              ...prev,
                              [q.id]: optIndex,
                            }))
                          }
                          className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer disabled:cursor-default ${btnStyle}`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                              isOptionSelected
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {displayLabel}
                          </span>
                          <MathContent content={opt.text} className="text-sm flex-1 overflow-x-auto whitespace-pre-wrap break-words" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Lời giải chi tiết */}
                  {isSubmitted && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm bg-slate-50/80 p-3.5 rounded-xl text-slate-700 overflow-x-auto whitespace-pre-wrap break-words">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md text-xs">
                          ✓ Đáp án đúng: {dynamicCorrectLetter}
                        </span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <span className="text-sky-600">💡</span> Lời giải chi tiết:
                        </span>
                      </div>
                      <MathContent
                        content={q.explanation}
                        className="overflow-x-auto whitespace-pre-wrap break-words leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (4 BÀI - 4,0 ĐIỂM)          */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-emerald-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (4 BÀI - 4,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-emerald-800/80 px-3 py-1 rounded-full text-emerald-200 font-medium">
              Tối đa 1,0 điểm / bài • 1 ý: 0.1đ | 2 ý: 0.25đ | 3 ý: 0.5đ | 4 ý: 1.0đ
            </span>
          </div>

          <div className="space-y-4">
            {RAW_TF_QUESTIONS.map((q) => {
              const studentAnswers = tfAnswers[q.id] || {};
              let correctCount = 0;
              q.items.forEach((it) => {
                if (studentAnswers[it.key] === it.correct) {
                  correctCount += 1;
                }
              });
              const earnedPoints = calculateTFPoints(correctCount);

              return (
                <div
                  key={q.id}
                  id={`cau-${q.number}`}
                  className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
                    isSubmitted
                      ? earnedPoints === 1.0
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : earnedPoints > 0
                        ? 'border-sky-300 bg-sky-50/20'
                        : 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm">
                        {q.number}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                        Tối đa 1.0 điểm
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        • {q.skill}
                      </span>
                    </div>

                    {isSubmitted && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Đúng {correctCount}/4 ý (+{earnedPoints.toFixed(2)}đ)
                      </span>
                    )}
                  </div>

                  <MathContent
                    content={q.text}
                    className="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mb-4 overflow-x-auto whitespace-pre-wrap break-words"
                  />

                  {/* Bảng 4 ý a, b, c, d */}
                  <div className="space-y-3">
                    {q.items.map((item) => {
                      const userChoice = studentAnswers[item.key];
                      const isChoiceCorrect = userChoice === item.correct;

                      return (
                        <div
                          key={item.key}
                          className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isSubmitted
                              ? isChoiceCorrect
                                ? 'border-emerald-300 bg-emerald-50/40'
                                : 'border-rose-300 bg-rose-50/40'
                              : userChoice !== undefined && userChoice !== null
                              ? 'border-emerald-200 bg-slate-50'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 flex-1">
                            <span className="font-bold text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded text-xs mt-0.5">
                              {item.key})
                            </span>
                            <MathContent
                              content={item.text}
                              className="text-sm text-slate-800 flex-1 overflow-x-auto whitespace-pre-wrap break-words"
                            />
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              disabled={isSubmitted}
                              onClick={() =>
                                setTfAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: {
                                    ...(prev[q.id] || {}),
                                    [item.key]: true,
                                  },
                                }))
                              }
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:cursor-default ${
                                userChoice === true
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              ĐÚNG
                            </button>
                            <button
                              type="button"
                              disabled={isSubmitted}
                              onClick={() =>
                                setTfAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: {
                                    ...(prev[q.id] || {}),
                                    [item.key]: false,
                                  },
                                }))
                              }
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:cursor-default ${
                                userChoice === false
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              SAI
                            </button>

                            {isSubmitted && (
                              <span
                                className={`text-xs font-bold ml-2 px-2 py-1 rounded ${
                                  isChoiceCorrect
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isChoiceCorrect
                                  ? '✓'
                                  : `✕ (Đáp án: ${item.correct ? 'ĐÚNG' : 'SAI'})`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Lời giải chi tiết Phần II */}
                  {isSubmitted && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm bg-slate-50/80 p-3.5 rounded-xl text-slate-700 overflow-x-auto whitespace-pre-wrap break-words">
                      <div className="flex items-center gap-2 mb-2 font-semibold text-slate-800">
                        <span className="text-emerald-600">💡</span> Lời giải chi tiết:
                      </div>
                      <MathContent
                        content={q.explanation}
                        className="overflow-x-auto whitespace-pre-wrap break-words leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* PHẦN III: TRẢ LỜI NGẮN (6 CÂU - 3,0 ĐIỂM)                 */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẢ LỜI NGẮN (6 CÂU - 3,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              0,5 điểm / câu • Nhập giá trị số chính xác
            </span>
          </div>

          <div className="space-y-4">
            {RAW_SHORTANS_QUESTIONS.map((q) => {
              const currentInput = shortAnswers[q.id] || '';
              const isCorrect = q.validator(currentInput);

              return (
                <div
                  key={q.id}
                  id={`cau-${q.number}`}
                  className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-rose-300 bg-rose-50/20'
                      : currentInput.trim()
                      ? 'border-indigo-300 shadow-indigo-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 font-bold text-sm">
                        {q.number}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                        {q.points} điểm
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        • {q.skill}
                      </span>
                    </div>

                    {isSubmitted && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isCorrect ? `✓ Đúng (+${q.points}đ)` : '✕ Sai (+0.0đ)'}
                      </span>
                    )}
                  </div>

                  <MathContent
                    content={q.text}
                    className="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mb-4 overflow-x-auto whitespace-pre-wrap break-words"
                  />

                  {/* Ô nhập câu trả lời ngắn */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 max-w-sm">
                      <input
                        type="text"
                        disabled={isSubmitted}
                        value={currentInput}
                        onChange={(e) =>
                          setShortAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder={q.placeholder}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 ${
                          isSubmitted
                            ? isCorrect
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                              : 'border-rose-500 bg-rose-50 text-rose-900'
                            : 'border-slate-300 bg-white'
                        }`}
                      />
                    </div>

                    {isSubmitted && !isCorrect && (
                      <div className="text-xs text-rose-600 font-medium flex items-center gap-1">
                        Đáp số đúng: <span className="font-bold underline text-emerald-700">{q.correctDisplay}</span>
                      </div>
                    )}
                  </div>

                  {/* Lời giải chi tiết Phần III */}
                  {isSubmitted && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm bg-slate-50/80 p-3.5 rounded-xl text-slate-700 overflow-x-auto whitespace-pre-wrap break-words">
                      <div className="flex items-center gap-2 mb-2 font-semibold text-slate-800">
                        <span className="text-indigo-600">💡</span> Lời giải chi tiết:
                      </div>
                      <MathContent
                        content={q.explanation}
                        className="overflow-x-auto whitespace-pre-wrap break-words leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* NÚT NỘP BÀI DƯỚI CÙNG TRANG */}
        {!isSubmitted && (
          <div className="pt-6 pb-12 flex justify-center">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3.5 text-base font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 active:scale-95 rounded-2xl shadow-lg transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Đang hoàn tất chấm điểm...' : 'HOÀN THÀNH & NỘP BÀI'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
