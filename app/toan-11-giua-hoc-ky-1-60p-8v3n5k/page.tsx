'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN ĐỀ THI ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ 1 MÔN TOÁN LỚP 11';
const EXAM_SUBTITLE = 'CHƯƠNG TRÌNH GDPT 2018 -- THỜI GIAN LÀM BÀI: 60 PHÚT';
const EXAM_TIME_NOTE =
  'Thời gian làm bài: 60 phút • Đề thi gồm 10 câu trắc nghiệm ABCD (4,0đ), 02 câu Đúng/Sai (2,0đ) và 05 câu trả lời ngắn (4,0đ)';

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

// Thang điểm Bộ GD&ĐT 2025 cho phần Đúng/Sai (tối đa 1.0 điểm/câu, tổng 2.0 điểm)
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
    skill: 'Công thức biểu diễn số đo của các góc lượng giác có cùng tia đầu và tia cuối',
    points: 0.4,
    text: 'Cho góc lượng giác $(Ou, Ov)$ có số đo là $\\dfrac{\\pi}{4}$. Công thức biểu diễn số đo của tất cả các góc lượng giác có cùng tia đầu $Ou$ và tia cuối $Ov$ là:',
    options: [
      { text: '$\\dfrac{\\pi}{4} + k\\pi \\ (k \\in \\mathbb{Z})$', isCorrect: false },
      { text: '$\\dfrac{\\pi}{4} + k2\\pi \\ (k \\in \\mathbb{Z})$', isCorrect: true },
      { text: '$-\\dfrac{\\pi}{4} + k2\\pi \\ (k \\in \\mathbb{Z})$', isCorrect: false },
      { text: '$\\dfrac{\\pi}{4} + k\\dfrac{\\pi}{2} \\ (k \\in \\mathbb{Z})$', isCorrect: false },
    ],
    explanation:
      'Theo định nghĩa về số đo của góc lượng giác, hai góc lượng giác có cùng tia đầu và tia cuối thì có số đo sai khác nhau một bội nguyên của $2\\pi$ (hoặc $360^\\circ$). Do đó công thức tổng quát là $\\text{sđ}(Ou, Ov) = \\dfrac{\\pi}{4} + k2\\pi \\ (k \\in \\mathbb{Z})$.',
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Xác định dấu của các giá trị lượng giác trong góc phần tư thứ II',
    points: 0.4,
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\dfrac{\\pi}{2} < \\alpha < \\pi$. Khẳng định nào sau đây là đúng?',
    options: [
      { text: '$\\sin \\alpha < 0$', isCorrect: false },
      { text: '$\\cos \\alpha < 0$', isCorrect: true },
      { text: '$\\tan \\alpha > 0$', isCorrect: false },
      { text: '$\\cot \\alpha > 0$', isCorrect: false },
    ],
    explanation:
      'Vì điểm biểu diễn của góc lượng giác $\\alpha$ nằm ở góc phần tư thứ II trên đường tròn lượng giác nên hoành độ mang dấu âm ($x_M < 0$) và tung độ mang dấu dương ($y_M > 0$). Do đó $\\cos \\alpha < 0$, $\\sin \\alpha > 0$, $\\tan \\alpha = \\dfrac{\\sin \\alpha}{\\cos \\alpha} < 0$, $\\cot \\alpha < 0$.',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Công thức cộng lượng giác đối với hàm cosin và sin',
    points: 0.4,
    text: 'Khẳng định nào sau đây là đúng với mọi góc lượng giác $a$ và $b$?',
    options: [
      { text: '$\\cos(a + b) = \\cos a \\cos b + \\sin a \\sin b$', isCorrect: false },
      { text: '$\\cos(a + b) = \\cos a \\cos b - \\sin a \\sin b$', isCorrect: true },
      { text: '$\\sin(a + b) = \\sin a \\cos b - \\cos a \\sin b$', isCorrect: false },
      { text: '$\\sin(a - b) = \\sin a \\cos b + \\cos a \\sin b$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức cộng đối với hàm số cosin: $\\cos(a + b) = \\cos a \\cos b - \\sin a \\sin b$.',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Chu kì tuần hoàn của các hàm số lượng giác cơ bản',
    points: 0.4,
    text: 'Chu kì tuần hoàn của hàm số lượng giác $y = \\sin x$ là:',
    options: [
      { text: '$\\pi$', isCorrect: false },
      { text: '$2\\pi$', isCorrect: true },
      { text: '$\\dfrac{\\pi}{2}$', isCorrect: false },
      { text: '$4\\pi$', isCorrect: false },
    ],
    explanation:
      'Hàm số $y = \\sin x$ có tập xác định $\\mathbb{R}$ và là hàm số tuần hoàn với chu kì $T = 2\\pi$, vì $\\sin(x + 2\\pi) = \\sin x$ với mọi $x \\in \\mathbb{R}$ và $2\\pi$ là số dương nhỏ nhất thỏa mãn đẳng thức này.',
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Giải phương trình lượng giác cơ bản dạng sin(u) = m',
    points: 0.4,
    text: 'Tất cả các nghiệm của phương trình lượng giác $\\sin\\left(x - \\dfrac{\\pi}{6}\\right) = \\dfrac{1}{2}$ là:',
    options: [
      {
        text: '$\\left[\\begin{aligned} x &= \\dfrac{\\pi}{3} + k2\\pi \\\\ x &= \\pi + k2\\pi \\end{aligned}\\right. \\ (k \\in \\mathbb{Z})$',
        isCorrect: true,
      },
      {
        text: '$\\left[\\begin{aligned} x &= k2\\pi \\\\ x &= \\dfrac{2\\pi}{3} + k2\\pi \\end{aligned}\\right. \\ (k \\in \\mathbb{Z})$',
        isCorrect: false,
      },
      {
        text: '$\\left[\\begin{aligned} x &= \\dfrac{\\pi}{3} + k\\pi \\\\ x &= \\pi + k\\pi \\end{aligned}\\right. \\ (k \\in \\mathbb{Z})$',
        isCorrect: false,
      },
      {
        text: '$\\left[\\begin{aligned} x &= \\dfrac{\\pi}{6} + k2\\pi \\\\ x &= \\dfrac{5\\pi}{6} + k2\\pi \\end{aligned}\\right. \\ (k \\in \\mathbb{Z})$',
        isCorrect: false,
      },
    ],
    explanation:
      'Ta có $\\dfrac{1}{2} = \\sin\\dfrac{\\pi}{6}$. Do đó:$$\\sin\\left(x - \\dfrac{\\pi}{6}\\right) = \\sin\\dfrac{\\pi}{6} \\iff \\left[\\begin{aligned} x - \\dfrac{\\pi}{6} &= \\dfrac{\\pi}{6} + k2\\pi \\\\ x - \\dfrac{\\pi}{6} &= \\pi - \\dfrac{\\pi}{6} + k2\\pi \\end{aligned}\\right. \\iff \\left[\\begin{aligned} x &= \\dfrac{\\pi}{3} + k2\\pi \\\\ x &= \\pi + k2\\pi \\end{aligned}\\right. \\quad (k \\in \\mathbb{Z}).$$',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Xác định các số hạng của dãy số cho bởi công thức truy hồi',
    points: 0.4,
    text: 'Cho dãy số $(u_n)$ được xác định bởi hệ thức truy hồi: $\\begin{cases} u_1 = 3 \\\\ u_{n+1} = 2u_n - 1 \\quad (\\forall n \\ge 1) \\end{cases}$. Số hạng thứ tư $u_4$ của dãy số bằng:',
    options: [
      { text: '$9$', isCorrect: false },
      { text: '$17$', isCorrect: true },
      { text: '$33$', isCorrect: false },
      { text: '$15$', isCorrect: false },
    ],
    explanation:
      'Tính lần lượt từng số hạng:<br>• $u_1 = 3$<br>• $u_2 = 2u_1 - 1 = 2(3) - 1 = 5$<br>• $u_3 = 2u_2 - 1 = 2(5) - 1 = 9$<br>• $u_4 = 2u_3 - 1 = 2(9) - 1 = 17$.',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Công thức số hạng tổng quát của cấp số cộng',
    points: 0.4,
    text: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = -2$ và công sai $d = 3$. Giá trị của số hạng thứ $10$ là:',
    options: [
      { text: '$28$', isCorrect: false },
      { text: '$27$', isCorrect: false },
      { text: '$25$', isCorrect: true },
      { text: '$-29$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức số hạng tổng quát của cấp số cộng:$$u_{10} = u_1 + (10 - 1)d = -2 + 9 \\cdot 3 = 25.$$',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Tìm công bội của cấp số nhân từ các số hạng đã cho',
    points: 0.4,
    text: 'Cho cấp số nhân $(u_n)$ có số hạng đầu $u_1 = 3$ và số hạng thứ tư $u_4 = 24$. Công bội $q$ của cấp số nhân đó bằng:',
    options: [
      { text: '$2$', isCorrect: true },
      { text: '$-2$', isCorrect: false },
      { text: '$4$', isCorrect: false },
      { text: '$8$', isCorrect: false },
    ],
    explanation:
      'Ta có $u_4 = u_1 \\cdot q^3 \\iff 24 = 3 \\cdot q^3 \\iff q^3 = 8 \\iff q = 2$.',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Tính giá trị đại diện của nhóm số liệu ghép nhóm',
    points: 0.4,
    text: 'Trong mẫu số liệu ghép nhóm, giá trị đại diện của nhóm số liệu $[20; 30)$ là:',
    options: [
      { text: '$20$', isCorrect: false },
      { text: '$25$', isCorrect: true },
      { text: '$30$', isCorrect: false },
      { text: '$10$', isCorrect: false },
    ],
    explanation:
      'Giá trị đại diện của nhóm $[a; b)$ là trung bình cộng của hai đầu mút:$$c = \\dfrac{a + b}{2} = \\dfrac{20 + 30}{2} = 25.$$',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Xác định độ dài của các nhóm trong mẫu số liệu ghép nhóm',
    points: 0.4,
    text: 'Thời gian tự học ở nhà mỗi ngày (đơn vị: giờ) của học sinh được chia thành các khoảng: $[0; 2)$, $[2; 4)$, $[4; 6)$, $[6; 8)$. Độ dài của mỗi nhóm trong mẫu số liệu ghép nhóm này bằng:',
    options: [
      { text: '$1$', isCorrect: false },
      { text: '$4$', isCorrect: false },
      { text: '$2$', isCorrect: true },
      { text: '$6$', isCorrect: false },
    ],
    explanation:
      'Độ dài của nhóm $[a; b)$ được tính bằng hiệu giữa đầu mút phải và đầu mút trái:$$l = b - a = 2 - 0 = 2.$$',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 11,
    type: 'tf',
    skill: 'Khảo sát tính chất và số nghiệm phương trình của hàm số lượng giác',
    text: 'Cho hàm số lượng giác $f(x) = 2\\cos\\left(2x - \\dfrac{\\pi}{3}\\right) + 1$.',
    items: [
      { key: 'a', text: 'Tập xác định của hàm số là $D = \\mathbb{R}$', correct: true },
      { key: 'b', text: 'Chu kì tuần hoàn của hàm số là $\\pi$', correct: true },
      {
        key: 'c',
        text: 'Giá trị lớn nhất của hàm số bằng $3$ và giá trị nhỏ nhất của hàm số bằng $-1$',
        correct: true,
      },
      {
        key: 'd',
        text: 'Trên đoạn $[0; \\pi]$, phương trình $f(x) = 2$ có đúng $2$ nghiệm phân biệt',
        correct: false,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Hàm số cosin xác định với mọi giá trị $2x - \\dfrac{\\pi}{3} \\in \\mathbb{R}$, do đó tập xác định là $D = \\mathbb{R}$.<br>• <strong>b) Đúng.</strong> Hàm số có dạng $y = A\\cos(\\omega x + \\varphi) + B$ với $\\omega = 2 > 0$. Chu kì tuần hoàn là $T = \\dfrac{2\\pi}{\\omega} = \\dfrac{2\\pi}{2} = \\pi$.<br>• <strong>c) Đúng.</strong> Với mọi $x \\in \\mathbb{R}$, ta có $-1 \\le \\cos\\left(2x - \\dfrac{\\pi}{3}\\right) \\le 1$. Nhân $2$ và cộng $1$ vào các vế: $$-2 + 1 \\le 2\\cos\\left(2x - \\dfrac{\\pi}{3}\\right) + 1 \\le 2 + 1 \\iff -1 \\le f(x) \\le 3.$$ Vậy giá trị nhỏ nhất bằng $-1$ và giá trị lớn nhất bằng $3$.<br>• <strong>d) Sai.</strong> Xét phương trình: $$f(x) = 2 \\iff 2\\cos\\left(2x - \\dfrac{\\pi}{3}\\right) + 1 = 2 \\iff \\cos\\left(2x - \\dfrac{\\pi}{3}\\right) = \\dfrac{1}{2} = \\cos\\dfrac{\\pi}{3}.$$ $$\\iff \\left[\\begin{aligned} 2x - \\dfrac{\\pi}{3} &= \\dfrac{\\pi}{3} + k2\\pi \\\\ 2x - \\dfrac{\\pi}{3} &= -\\dfrac{\\pi}{3} + k2\\pi \\end{aligned}\\right. \\iff \\left[\\begin{aligned} 2x &= \\dfrac{2\\pi}{3} + k2\\pi \\\\ 2x &= k2\\pi \\end{aligned}\\right. \\iff \\left[\\begin{aligned} x &= \\dfrac{\\pi}{3} + k\\pi \\\\ x &= k\\pi \\end{aligned}\\right. \\quad (k \\in \\mathbb{Z}).$$ Trên đoạn $[0; \\pi]$, các nghiệm là:<br>- Từ họ $x = k\\pi$: $k = 0 \\implies x = 0$; $k = 1 \\implies x = \\pi$.<br>- Từ họ $x = \\dfrac{\\pi}{3} + k\\pi$: $k = 0 \\implies x = \\dfrac{\\pi}{3}$.<br>Như vậy phương trình có đúng $3$ nghiệm phân biệt $\\{0; \\dfrac{\\pi}{3}; \\pi\\}$ trên đoạn $[0; \\pi]$, nên khẳng định có đúng $2$ nghiệm là sai.',
  },
  {
    id: 'tf2',
    number: 12,
    type: 'tf',
    skill: 'Tính chất số hạng, số hạng tổng quát và tổng n số hạng đầu cấp số cộng',
    text: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 3$ và công sai $d = 4$.',
    items: [
      { key: 'a', text: 'Số hạng thứ hai của cấp số cộng là $u_2 = 7$', correct: true },
      {
        key: 'b',
        text: 'Công thức số hạng tổng quát của cấp số cộng là $u_n = 4n - 1$ với mọi $n \\ge 1$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Số $2024$ là một số hạng của cấp số cộng $(u_n)$',
        correct: false,
      },
      {
        key: 'd',
        text: 'Tổng của $20$ số hạng đầu tiên của cấp số cộng là $S_{20} = 820$',
        correct: true,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Ta có $u_2 = u_1 + d = 3 + 4 = 7$.<br>• <strong>b) Đúng.</strong> Công thức số hạng tổng quát là: $$u_n = u_1 + (n - 1)d = 3 + (n - 1)4 = 4n - 1 \\quad (\\forall n \\ge 1).$$<br>• <strong>c) Sai.</strong> Giả sử $2024$ là số hạng thứ $n$ của cấp số cộng, khi đó: $$4n - 1 = 2024 \\iff 4n = 2025 \\iff n = \\dfrac{2025}{4} = 506{,}25 \\notin \\mathbb{N}^*.$$ Vậy $2024$ không thuộc dãy số.<br>• <strong>d) Đúng.</strong> Tổng $20$ số hạng đầu tiên là: $$S_{20} = \\dfrac{20[2u_1 + 19d]}{2} = 10[2(3) + 19(4)] = 10(6 + 76) = 10 \\cdot 82 = 820.$$',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 13,
    type: 'shortans',
    skill: 'Tính giá trị số hạng của dãy số xác định bằng đa thức bậc hai',
    points: 0.8,
    text: 'Cho dãy số $(u_n)$ xác định bởi công thức số hạng tổng quát $u_n = n^2 - 2n + 5$. Tìm giá trị của số hạng $u_5$.',
    placeholder: 'Nhập giá trị số nguyên (VD: 16)',
    correctDisplay: '20',
    explanation:
      'Thay $n = 5$ vào công thức của số hạng tổng quát ta được: $$u_5 = 5^2 - 2(5) + 5 = 25 - 10 + 5 = 20.$$',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '');
      return c === '20' || c === 'u5=20' || c === 'u_5=20';
    },
  },
  {
    id: 'sa2',
    number: 14,
    type: 'shortans',
    skill: 'Tính tổng n số hạng đầu tiên của cấp số nhân',
    points: 0.8,
    text: 'Cho cấp số nhân $(u_n)$ có các số hạng đều mang dấu dương, biết $u_2 = 6$ và $u_5 = 48$. Tính tổng của $8$ số hạng đầu tiên ($S_8$) của cấp số nhân đó.',
    placeholder: 'Nhập giá trị tổng S_8 (VD: 512)',
    correctDisplay: '765',
    explanation:
      'Gọi $q$ là công bội của cấp số nhân. Ta có mối liên hệ: $$u_5 = u_2 \\cdot q^3 \\iff 48 = 6 \\cdot q^3 \\iff q^3 = 8 \\iff q = 2.$$ Số hạng đầu tiên của cấp số nhân là: $$u_1 = \\dfrac{u_2}{q} = \\dfrac{6}{2} = 3.$$ Tổng của $8$ số hạng đầu tiên là: $$S_8 = \\dfrac{u_1(1 - q^8)}{1 - q} = \\dfrac{3(1 - 2^8)}{1 - 2} = \\dfrac{3(1 - 256)}{-1} = 3 \\cdot 255 = 765.$$',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '');
      return c === '765' || c === 's8=765' || c === 's_8=765';
    },
  },
  {
    id: 'sa3',
    number: 15,
    type: 'shortans',
    skill: 'Ứng dụng thực tế của cấp số cộng tính tổng số lượng ghế khán đài',
    points: 0.8,
    text: 'Một rạp xiếc ngoài trời thiết kế một khán đài gồm $20$ hàng ghế xếp theo hình cung đồng tâm. Hàng ghế thứ nhất gần sân khấu nhất có $15$ chỗ ngồi, và cứ mỗi hàng tiếp theo có nhiều hơn hàng ngay trước nó $4$ chỗ ngồi. Hỏi toàn bộ khán đài đó có tất cả bao nhiêu chỗ ngồi?',
    placeholder: 'Nhập số lượng chỗ ngồi (VD: 850)',
    correctDisplay: '1060 (chỗ ngồi)',
    explanation:
      'Số lượng chỗ ngồi ở mỗi hàng lập thành một cấp số cộng $(u_n)$ với số hạng đầu $u_1 = 15$, công sai $d = 4$ và số hàng ghế $n = 20$. Tổng số chỗ ngồi trên khán đài tương ứng với tổng của $20$ số hạng đầu: $$S_{20} = \\dfrac{n[2u_1 + (n - 1)d]}{2} = \\dfrac{20[2 \\cdot 15 + (20 - 1) \\cdot 4]}{2} = 10(30 + 76) = 10 \\cdot 106 = 1\\,060\\text{ (chỗ ngồi)}.$$',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '').replace(/\./g, '');
      return c === '1060' || c.includes('1060');
    },
  },
  {
    id: 'sa4',
    number: 16,
    type: 'shortans',
    skill: 'Công thức nhân đôi và hệ thức lượng giác cơ bản',
    points: 0.8,
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\cos \\alpha = -\\dfrac{3}{5}$ và $\\pi < \\alpha < \\dfrac{3\\pi}{2}$. Tính giá trị của biểu thức $P = \\sin 2\\alpha + \\cos 2\\alpha$.',
    placeholder: 'Nhập phân số hoặc số thập phân (VD: 7/25 hoặc 0.28)',
    correctDisplay: '17/25 (hoặc 0,68)',
    explanation:
      'Vì $\\pi < \\alpha < \\dfrac{3\\pi}{2}$ nên điểm biểu diễn của góc $\\alpha$ nằm ở góc phần tư thứ III, do đó $\\sin \\alpha < 0$. Áp dụng hệ thức cơ bản giữa sin và cosin: $$\\sin^2 \\alpha = 1 - \\cos^2 \\alpha = 1 - \\left(-\\dfrac{3}{5}\\right)^2 = 1 - \\dfrac{9}{25} = \\dfrac{16}{25} \\implies \\sin \\alpha = -\\dfrac{4}{5}.$$ Áp dụng các công thức nhân đôi: $$\\sin 2\\alpha = 2\\sin \\alpha \\cos \\alpha = 2\\left(-\\dfrac{4}{5}\\right)\\left(-\\dfrac{3}{5}\\right) = \\dfrac{24}{25},$$ $$\\cos 2\\alpha = 2\\cos^2 \\alpha - 1 = 2\\left(-\\dfrac{3}{5}\\right)^2 - 1 = 2 \\cdot \\dfrac{9}{25} - 1 = \\dfrac{18}{25} - 1 = -\\dfrac{7}{25}.$$ Thay vào biểu thức $P$: $$P = \\sin 2\\alpha + \\cos 2\\alpha = \\dfrac{24}{25} + \\left(-\\dfrac{7}{25}\\right) = \\dfrac{17}{25} = 0{,}68.$$',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');
      return c === '17/25' || c === '0.68' || c === 'p=17/25' || c === 'p=0.68';
    },
  },
  {
    id: 'sa5',
    number: 17,
    type: 'shortans',
    skill: 'Giải hệ phương trình lượng giác cơ bản dạng sin và cos',
    points: 0.8,
    text: 'Giải các phương trình lượng giác sau:<br>a) $\\sin\\left(2x + \\dfrac{\\pi}{4}\\right) = \\dfrac{\\sqrt{2}}{2}$<br>b) $\\cos 3x + \\cos x = 0$',
    placeholder: 'Nhập các họ nghiệm (VD: x = k*pi, x = pi/3 + k*pi; ...)',
    correctDisplay: 'a) x = kπ, x = π/4 + kπ; b) x = π/4 + kπ/2, x = -π/2 + kπ (k ∈ ℤ)',
    explanation:
      '<strong>a)</strong> Ta có $\\dfrac{\\sqrt{2}}{2} = \\sin\\dfrac{\\pi}{4}$. Phương trình đã cho tương đương với: $$\\sin\\left(2x + \\dfrac{\\pi}{4}\\right) = \\sin\\dfrac{\\pi}{4} \\iff \\left[\\begin{aligned} 2x + \\dfrac{\\pi}{4} &= \\dfrac{\\pi}{4} + k2\\pi \\\\ 2x + \\dfrac{\\pi}{4} &= \\pi - \\dfrac{\\pi}{4} + k2\\pi \\end{aligned}\\right. \\iff \\left[\\begin{aligned} 2x &= k2\\pi \\\\ 2x &= \\dfrac{\\pi}{2} + k2\\pi \\end{aligned}\\right. \\iff \\left[\\begin{aligned} x &= k\\pi \\\\ x &= \\dfrac{\\pi}{4} + k\\pi \\end{aligned}\\right. \\quad (k \\in \\mathbb{Z}).$$ Vậy phương trình có các họ nghiệm là $x = k\\pi$ và $x = \\dfrac{\\pi}{4} + k\\pi \\ (k \\in \\mathbb{Z})$.<br><br><strong>b)</strong> Biến đổi phương trình: $$\\cos 3x + \\cos x = 0 \\iff \\cos 3x = -\\cos x \\iff \\cos 3x = \\cos(\\pi - x).$$ Áp dụng công thức nghiệm cơ bản của cosin: $$\\left[\\begin{aligned} 3x &= \\pi - x + k2\\pi \\\\ 3x &= -(\\pi - x) + k2\\pi \\end{aligned}\\right. \\iff \\left[\\begin{aligned} 4x &= \\pi + k2\\pi \\\\ 2x &= -\\pi + k2\\pi \\end{aligned}\\right. \\iff \\left[\\begin{aligned} x &= \\dfrac{\\pi}{4} + k\\dfrac{\\pi}{2} \\\\ x &= -\\dfrac{\\pi}{2} + k\\pi \\end{aligned}\\right. \\quad (k \\in \\mathbb{Z}).$$ Vậy phương trình có các họ nghiệm là $x = \\dfrac{\\pi}{4} + k\\dfrac{\\pi}{2}$ và $x = -\\dfrac{\\pi}{2} + k\\pi \\ (k \\in \\mathbb{Z})$.',
    validator: (val: string) => {
      const c = val.toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');
      const hasPartA =
        (c.includes('kpi') || c.includes('k*pi') || c.includes('kπ')) &&
        (c.includes('pi/4') || c.includes('π/4') || c.includes('1/4'));
      const hasPartB =
        (c.includes('pi/4') || c.includes('π/4')) &&
        (c.includes('pi/2') || c.includes('π/2') || c.includes('-pi/2') || c.includes('-π/2'));
      const hasAnyValid =
        c.includes('pi/4') ||
        c.includes('π/4') ||
        c.includes('kpi') ||
        c.includes('pi/2') ||
        c.includes('π/2') ||
        c.includes('k2pi');
      return hasPartA || hasPartB || hasAnyValid;
    },
  },
];

export default function Toan11GiuaKy160PPage() {
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

  // 4. ĐỒNG HỒ ĐẾM NGƯỢC (60 PHÚT = 3600 GIÂY)
  const [timeLeft, setTimeLeft] = useState<number>(60 * 60);

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
    const ma = maHocSinh.trim() || 'HS11-GK1-60P';
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

    // Chấm Phần I (10 câu MCQ, 0.40đ/câu = 4.0đ)
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

    // Chấm Phần II (2 bài Đúng/Sai, tối đa 1.0đ/bài = 2.0đ)
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

    // Chấm Phần III (5 câu ngắn, 0.8đ/câu = 4.0đ)
    let p3CorrectCount = 0;
    RAW_SHORTANS_QUESTIONS.forEach((q) => {
      const studentText = shortAnswers[q.id] || '';
      const isCorrect = q.validator(studentText);
      if (isCorrect) {
        p3CorrectCount += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });
    const p3Score = p3CorrectCount * 0.8;

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
      thoiGianLamGiay: 60 * 60 - timeLeft,
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
      console.error('Lỗi thực thi gửi Webhook:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pb-20 selection:bg-sky-500 selection:text-white">
      {/* HEADER / THANH TRẠNG THÁI CỐ ĐỊNH */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight line-clamp-1">
                {EXAM_TITLE}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                {EXAM_SUBTITLE}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Đồng hồ đếm ngược */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-bold transition-colors ${
                timeLeft < 300
                  ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                  : 'bg-sky-50 border-sky-200 text-sky-700'
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
            {!isSubmitted ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-1">
                <span>✓ Đã nộp bài</span>
              </div>
            )}
          </div>
        </div>

        {/* Thanh tiến độ */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-sky-500 h-1 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* THANH ĐIỀU HƯỚNG NHANH CÁC CÂU HỎI (QUICK NAV) */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <details className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 group">
          <summary className="text-xs font-bold text-slate-700 flex items-center justify-between cursor-pointer list-none select-none">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Bảng điều hướng câu hỏi ({totalAnswered}/{totalItems} mục hoàn thành)
            </span>
            <span className="text-[11px] text-slate-400 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>

          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
            {/* Phần I */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase">
                Phần I: Trắc nghiệm ABCD (Câu 1 - 10)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {shuffledMCQQuestions.map((q) => {
                  const isDone = mcqAnswers[q.id] !== undefined;
                  return (
                    <a
                      key={q.id}
                      href={`#cau-${q.number}`}
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition border ${
                        isDone
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {q.number}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Phần II */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase">
                Phần II: Đúng/Sai (Câu 11 - 12)
              </div>
              <div className="flex flex-wrap gap-2">
                {RAW_TF_QUESTIONS.map((q) => {
                  const subs = tfAnswers[q.id] || {};
                  const subCount = Object.values(subs).filter((v) => v !== undefined && v !== null).length;
                  return (
                    <a
                      key={q.id}
                      href={`#cau-${q.number}`}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition border ${
                        subCount === 4
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : subCount > 0
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Câu {q.number}</span>
                      <span className="text-[10px] opacity-80">({subCount}/4)</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Phần III */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase">
                Phần III: Trả lời ngắn (Câu 13 - 17)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {RAW_SHORTANS_QUESTIONS.map((q) => {
                  const isDone = (shortAnswers[q.id] || '').trim().length > 0;
                  return (
                    <a
                      key={q.id}
                      href={`#cau-${q.number}`}
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition border ${
                        isDone
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {q.number}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </details>
      </div>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-8">
        {/* KHỐI THÔNG TIN ĐỀ THI */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-sky-100/50 blur-2xl pointer-events-none" />
          <div className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 mb-3 border border-sky-200">
            TOÁN 11 • KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ 1
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
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Họ và tên thí sinh
              </label>
              <input
                type="text"
                disabled={isSubmitted}
                value={tenHocSinh}
                onChange={(e) => setTenHocSinh(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Mã số học sinh / SBD
              </label>
              <input
                type="text"
                disabled={isSubmitted}
                value={maHocSinh}
                onChange={(e) => setMaHocSinh(e.target.value)}
                placeholder="Ví dụ: 11A1-05"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Lớp / Nhóm học
              </label>
              <input
                type="text"
                disabled={isSubmitted}
                value={lopNhom}
                onChange={(e) => setLopNhom(e.target.value)}
                placeholder="Ví dụ: 11A1"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS11-GK1-60P'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '11'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Phần I: <strong>{diemPhan1.toFixed(2)}/4.0đ</strong> ({soCauDungMCQ}/10 câu đúng)</span>
                  <span>Phần II: <strong>{diemPhan2.toFixed(2)}/2.0đ</strong></span>
                  <span>Phần III: <strong>{diemPhan3.toFixed(2)}/4.0đ</strong></span>
                  <span>Thời gian làm bài: <strong>{Math.max(1, Math.round((60 * 60 - timeLeft) / 60))} phút</strong></span>
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
        {/* PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN (10 CÂU - 4,0 ĐIỂM)   */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-sky-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (10 CÂU - 4,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-sky-800/80 px-3 py-1 rounded-full text-sky-200 font-medium">
              0,40 điểm / câu • 4 lựa chọn (1 đáp án đúng duy nhất)
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
                        {q.points.toFixed(2)} điểm
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
                        {isStudentCorrect
                          ? `✓ Đúng (+${q.points.toFixed(2)}đ)`
                          : `✕ Sai (Đáp án: ${dynamicCorrectLetter})`}
                      </span>
                    )}
                  </div>

                  {/* Nội dung câu hỏi */}
                  <MathContent
                    content={q.text}
                    className="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mb-4 overflow-x-auto whitespace-pre-wrap break-words"
                  />

                  {/* Các phương án A, B, C, D */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, oIdx) => {
                      const letter = ['A', 'B', 'C', 'D'][oIdx];
                      const isSelected = selectedIndex === oIdx;

                      let btnStyle = 'border-slate-200 hover:border-sky-300 bg-slate-50/50 text-slate-700';

                      if (isSubmitted) {
                        if (opt.isCorrect) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                        } else if (isSelected && !opt.isCorrect) {
                          btnStyle = 'border-rose-400 bg-rose-50 text-rose-800';
                        } else {
                          btnStyle = 'border-slate-200 opacity-60 bg-slate-50 text-slate-500';
                        }
                      } else if (isSelected) {
                        btnStyle = 'border-sky-600 bg-sky-50/80 text-sky-950 font-semibold ring-2 ring-sky-500/20';
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() =>
                            setMcqAnswers((prev) => ({
                              ...prev,
                              [q.id]: oIdx,
                            }))
                          }
                          className={`flex items-start text-left gap-3 p-3.5 rounded-xl border transition-all text-sm cursor-pointer disabled:cursor-default overflow-x-auto whitespace-pre-wrap break-words ${btnStyle}`}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                              isSubmitted
                                ? opt.isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : isSelected
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                                : isSelected
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {letter}
                          </span>
                          <div className="flex-1 overflow-x-auto whitespace-pre-wrap break-words">
                            <MathContent content={opt.text} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Lời giải chi tiết khi nộp bài */}
                  {isSubmitted && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm bg-slate-50/80 p-3.5 rounded-xl text-slate-700 overflow-x-auto whitespace-pre-wrap break-words">
                      <div className="flex items-center gap-2 mb-1.5 font-semibold text-slate-800">
                        <span className="text-sky-600">💡</span> Lời giải chi tiết:
                      </div>
                      <MathContent content={q.explanation} className="leading-relaxed" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (02 CÂU - 2,0 ĐIỂM)          */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-emerald-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (02 CÂU - 2,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-emerald-800/80 px-3 py-1 rounded-full text-emerald-200 font-medium">
              Tối đa 1,00 điểm / câu (Đúng 1 ý: 0,10đ | 2 ý: 0,25đ | 3 ý: 0,50đ | 4 ý: 1,00đ)
            </span>
          </div>

          <div className="space-y-5">
            {RAW_TF_QUESTIONS.map((q) => {
              const studentAnswers = tfAnswers[q.id] || {};
              let correctCount = 0;
              q.items.forEach((item) => {
                if (studentAnswers[item.key] === item.correct) {
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
                      <MathContent content={q.explanation} className="leading-relaxed" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN (05 CÂU - 4,0 ĐIỂM)     */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN (05 CÂU - 4,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              0,80 điểm / câu • Học sinh tự điền kết quả vào ô trống
            </span>
          </div>

          <div className="space-y-5">
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
                        {q.points.toFixed(2)} điểm
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
                        {isCorrect ? `✓ Đúng (+${q.points.toFixed(2)}đ)` : '✕ Sai (+0.0đ)'}
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
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-400'
                              : 'border-rose-400 bg-rose-50 text-rose-900'
                            : 'border-slate-300 bg-white'
                        }`}
                      />
                    </div>

                    {isSubmitted && (
                      <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                        <span>Đáp án chuẩn:</span>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-900 rounded-lg font-mono">
                          {q.correctDisplay}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Lời giải chi tiết Phần III */}
                  {isSubmitted && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm bg-slate-50/80 p-3.5 rounded-xl text-slate-700 overflow-x-auto whitespace-pre-wrap break-words">
                      <div className="flex items-center gap-2 mb-2 font-semibold text-slate-800">
                        <span className="text-indigo-600">💡</span> Lời giải chi tiết:
                      </div>
                      <MathContent content={q.explanation} className="leading-relaxed" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* NÚT NỘP BÀI DƯỚI ĐÁY TRANG */}
        <div className="flex flex-col items-center justify-center pt-6 pb-12 gap-3">
          {!isSubmitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-800 shadow-lg shadow-sky-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'ĐANG CHẤM BÀI...' : 'NỘP BÀI THI'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 transition cursor-pointer"
            >
              ↑ Xem lại kết quả & điểm chi tiết
            </button>
          )}
          <p className="text-xs text-slate-400">
            Hệ thống hỗ trợ tự động chấm điểm và bảo mật chuẩn Bộ Giáo dục & Đào tạo 2025.
          </p>
        </div>
      </main>
    </div>
  );
}
