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

interface SubItemTF {
  key: 'a' | 'b' | 'c' | 'd';
  text: string;
  correct: boolean;
}

interface QuestionTF {
  id: string;
  number: number;
  type: 'tf';
  skill: string;
  text: string;
  items: SubItemTF[];
  explanation: string;
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

// Thang điểm chuẩn Bộ GD&ĐT 2025 cho phần Đúng/Sai (1.0 điểm/câu)
function calculateTFPoints(correctCount: number): number {
  if (correctCount === 1) return 0.1;
  if (correctCount === 2) return 0.25;
  if (correctCount === 3) return 0.5;
  if (correctCount === 4) return 1.0;
  return 0;
}

// ==========================================
// DỮ LIỆU ĐỀ THI GIỮA KỲ 1 TOÁN 11 (BGD 2025)
// ==========================================

// PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (12 CÂU - 3,0 ĐIỂM)
const MCQ_QUESTIONS_TOAN11: QuestionMCQ[] = [
  {
    id: 'c1',
    number: 1,
    type: 'mcq',
    skill: 'Công thức lượng giác - Công thức cộng',
    points: 0.25,
    text: 'Khẳng định nào sau đây <strong>đúng</strong> với mọi góc lượng giác $a, b$?',
    options: [
      { key: 'A', text: '$\\cos(a+b) = \\cos a \\cos b + \\sin a \\sin b$' },
      { key: 'B', text: '$\\cos(a+b) = \\cos a \\cos b - \\sin a \\sin b$' },
      { key: 'C', text: '$\\sin(a+b) = \\sin a \\cos b - \\cos a \\sin b$' },
      { key: 'D', text: '$\\sin(a-b) = \\sin a \\cos b + \\cos a \\sin b$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo công thức cộng đối với cosin của một tổng: $\\cos(a+b) = \\cos a \\cos b - \\sin a \\sin b$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'c2',
    number: 2,
    type: 'mcq',
    skill: 'Công thức lượng giác - Công thức nhân đôi',
    points: 0.25,
    text: 'Công thức nhân đôi nào sau đây là <strong>đúng</strong>?',
    options: [
      { key: 'A', text: '$\\sin 2a = \\sin a \\cos a$' },
      { key: 'B', text: '$\\sin 2a = 2\\sin a \\cos a$' },
      { key: 'C', text: '$\\cos 2a = 2\\cos^2 a + 1$' },
      { key: 'D', text: '$\\cos 2a = 1 + 2\\sin^2 a$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo công thức nhân đôi: $\\sin 2a = 2\\sin a \\cos a$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'c3',
    number: 3,
    type: 'mcq',
    skill: 'Hàm số lượng giác - Tập xác định của hàm số tang',
    points: 0.25,
    text: 'Tập xác định $D$ của hàm số $y = \\tan\\left(x - \\dfrac{\\pi}{6}\\right)$ là:',
    options: [
      { key: 'A', text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{\\pi}{6} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$' },
      { key: 'B', text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{\\pi}{2} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$' },
      { key: 'C', text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{2\\pi}{3} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$' },
      { key: 'D', text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{2\\pi}{3} + k2\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Hàm số xác định khi $x - \\dfrac{\\pi}{6} \\ne \\dfrac{\\pi}{2} + k\\pi \\Leftrightarrow x \\ne \\dfrac{2\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'c4',
    number: 4,
    type: 'mcq',
    skill: 'Hàm số lượng giác - Tập giá trị',
    points: 0.25,
    text: 'Tập giá trị $T$ của hàm số $y = 3\\sin 2x - 1$ là:',
    options: [
      { key: 'A', text: '$T = [-3; 3]$' },
      { key: 'B', text: '$T = [-4; 2]$' },
      { key: 'C', text: '$T = [-2; 4]$' },
      { key: 'D', text: '$T = [-1; 3]$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vì $-1 \\le \\sin 2x \\le 1 \\Rightarrow -3 \\le 3\\sin 2x \\le 3 \\Rightarrow -4 \\le 3\\sin 2x - 1 \\le 2$. Tập giá trị là $[-4; 2]$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'c5',
    number: 5,
    type: 'mcq',
    skill: 'Phương trình lượng giác cơ bản - Phương trình cosin',
    points: 0.25,
    text: 'Tất cả các nghiệm của phương trình lượng giác $\\cos x = \\cos\\alpha$ là:',
    options: [
      { key: 'A', text: '$x = \\alpha + k2\\pi \\quad (k \\in \\mathbb{Z})$' },
      { key: 'B', text: '$x = \\pm\\alpha + k2\\pi \\quad (k \\in \\mathbb{Z})$' },
      { key: 'C', text: '$x = \\pm\\alpha + k\\pi \\quad (k \\in \\mathbb{Z})$' },
      { key: 'D', text: '$x = \\alpha + k\\pi \\quad (k \\in \\mathbb{Z})$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Phương trình cosin cơ bản có nghiệm tổng quát là $x = \\pm\\alpha + k2\\pi \\quad (k \\in \\mathbb{Z})$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'c6',
    number: 6,
    type: 'mcq',
    skill: 'Hàm số lượng giác - Chu kỳ tuần hoàn',
    points: 0.25,
    text: 'Chu kỳ tuần hoàn $T$ của hàm số $y = \\sin 3x$ là:',
    options: [
      { key: 'A', text: '$T = 2\\pi$' },
      { key: 'B', text: '$T = \\pi$' },
      { key: 'C', text: '$T = \\dfrac{2\\pi}{3}$' },
      { key: 'D', text: '$T = \\dfrac{\\pi}{3}$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Hàm số $y = \\sin(\\omega x)$ tuần hoàn với chu kỳ $T = \\dfrac{2\\pi}{|\\omega|}$. Với $\\omega = 3 \\Rightarrow T = \\dfrac{2\\pi}{3}$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'c7',
    number: 7,
    type: 'mcq',
    skill: 'Giá trị lượng giác của một góc - Tính các giá trị khi biết sin',
    points: 0.25,
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\sin\\alpha = \\dfrac{4}{5}$ và $0 < \\alpha < \\dfrac{\\pi}{2}$. Giá trị của $\\tan\\alpha$ bằng:',
    options: [
      { key: 'A', text: '$\\dfrac{3}{4}$' },
      { key: 'B', text: '$\\dfrac{4}{3}$' },
      { key: 'C', text: '$-\\dfrac{4}{3}$' },
      { key: 'D', text: '$-\\dfrac{3}{4}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vì $0 < \\alpha < \\dfrac{\\pi}{2}$ nên $\\cos\\alpha > 0$. $\\cos\\alpha = \\sqrt{1 - \\sin^2\\alpha} = \\sqrt{1 - (4/5)^2} = \\dfrac{3}{5}$. Suy ra $\\tan\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha} = \\dfrac{4/5}{3/5} = \\dfrac{4}{3}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'c8',
    number: 8,
    type: 'mcq',
    skill: 'Công thức lượng giác - Rút gọn biểu thức lượng giác',
    points: 0.25,
    text: 'Rút gọn biểu thức $A = \\dfrac{\\sin 2x}{2\\cos x}$ (khi biểu thức có nghĩa) ta được:',
    options: [
      { key: 'A', text: '$A = \\cos x$' },
      { key: 'B', text: '$A = \\sin x$' },
      { key: 'C', text: '$A = \\tan x$' },
      { key: 'D', text: '$A = 2\\sin x$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Ta có: $A = \\dfrac{2\\sin x \\cos x}{2\\cos x} = \\sin x$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'c9',
    number: 9,
    type: 'mcq',
    skill: 'Hàm số lượng giác - Tính chẵn lẻ',
    points: 0.25,
    text: 'Xét tính chẵn, lẻ của hàm số $f(x) = x^2 \\sin x$. Khẳng định nào sau đây đúng?',
    options: [
      { key: 'A', text: '$f(x)$ là hàm số chẵn' },
      { key: 'B', text: '$f(x)$ là hàm số lẻ' },
      { key: 'C', text: '$f(x)$ vừa là hàm chẵn vừa là hàm lẻ' },
      { key: 'D', text: '$f(x)$ không chẵn cũng không lẻ' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> TXĐ $D = \\mathbb{R}$. Với mọi $x \\in \\mathbb{R} \\Rightarrow -x \\in \\mathbb{R}$ và $f(-x) = (-x)^2 \\sin(-x) = -x^2 \\sin x = -f(x)$. Do đó $f(x)$ là hàm số lẻ.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'c10',
    number: 10,
    type: 'mcq',
    skill: 'Phương trình lượng giác - Tìm số nghiệm trên đoạn',
    points: 0.25,
    text: 'Số nghiệm của phương trình $\\sin x = \\dfrac{1}{2}$ trên đoạn $[0; 2\\pi]$ là:',
    options: [
      { key: 'A', text: '$1$' },
      { key: 'B', text: '$2$' },
      { key: 'C', text: '$3$' },
      { key: 'D', text: '$4$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Phương trình có các họ nghiệm $x = \\dfrac{\\pi}{6} + k2\\pi$ và $x = \\dfrac{5\\pi}{6} + k2\\pi$. Trên $[0; 2\\pi]$, có đúng 2 nghiệm là $x_1 = \\dfrac{\\pi}{6}$ và $x_2 = \\dfrac{5\\pi}{6}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'c11',
    number: 11,
    type: 'mcq',
    skill: 'Phương trình lượng giác - Điều kiện có nghiệm của phương trình',
    points: 0.25,
    text: 'Tìm tất cả các giá trị của tham số $m$ để phương trình $\\cos 2x = m - 1$ có nghiệm.',
    options: [
      { key: 'A', text: '$m \\in [-1; 1]$' },
      { key: 'B', text: '$m \\in [0; 2]$' },
      { key: 'C', text: '$m \\in [1; 3]$' },
      { key: 'D', text: '$m \\in [-2; 0]$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Phương trình có nghiệm khi và chỉ khi $-1 \\le m - 1 \\le 1 \\Leftrightarrow 0 \\le m \\le 2$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'c12',
    number: 12,
    type: 'mcq',
    skill: 'Đồ thị hàm số lượng giác - Giao điểm với trục hoành',
    points: 0.25,
    text: 'Đồ thị hàm số $y = \\sin x$ cắt trục hoành tại tất cả các điểm có hoành độ là:',
    options: [
      { key: 'A', text: '$x = \\dfrac{\\pi}{2} + k\\pi \\quad (k \\in \\mathbb{Z})$' },
      { key: 'B', text: '$x = k\\pi \\quad (k \\in \\mathbb{Z})$' },
      { key: 'C', text: '$x = k2\\pi \\quad (k \\in \\mathbb{Z})$' },
      { key: 'D', text: '$x = \\dfrac{\\pi}{2} + k2\\pi \\quad (k \\in \\mathbb{Z})$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Giao điểm với trục hoành ứng với $y = 0 \\Leftrightarrow \\sin x = 0 \\Leftrightarrow x = k\\pi \\quad (k \\in \\mathbb{Z})$.<br><strong>Đáp án đúng: B.</strong>',
  },
];

// PHẦN II. TRẮC NGHIỆM ĐÚNG/SAI (4 BÀI - 4,0 ĐIỂM)
const TF_QUESTIONS_TOAN11: QuestionTF[] = [
  {
    id: 'tf1',
    number: 1,
    type: 'tf',
    skill: 'Góc lượng giác và các công thức lượng giác cơ bản',
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\cos\\alpha = -\\dfrac{3}{5}$ và $\\dfrac{\\pi}{2} < \\alpha < \\pi$.',
    items: [
      { key: 'a', text: 'Giá trị của $\\sin\\alpha$ bằng $\\dfrac{4}{5}$.', correct: true },
      { key: 'b', text: 'Giá trị của $\\tan\\alpha$ bằng $\\dfrac{4}{3}$.', correct: false },
      { key: 'c', text: 'Giá trị của $\\sin 2\\alpha$ bằng $-\\dfrac{24}{25}$.', correct: true },
      { key: 'd', text: 'Giá trị của $\\cos\\left(\\alpha + \\dfrac{\\pi}{3}\\right)$ bằng $\\dfrac{-3 + 4\\sqrt{3}}{10}$.', correct: false },
    ],
    explanation:
      '<strong>a) Đúng:</strong> Do $\\dfrac{\\pi}{2} < \\alpha < \\pi$ nên $\\sin\\alpha > 0 \\Rightarrow \\sin\\alpha = \\sqrt{1 - (-3/5)^2} = \\dfrac{4}{5}$.<br><strong>b) Sai:</strong> $\\tan\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha} = \\dfrac{4/5}{-3/5} = -\\dfrac{4}{3}$.<br><strong>c) Đúng:</strong> $\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha = 2 \\cdot \\dfrac{4}{5} \\cdot \\left(-\\dfrac{3}{5}\\right) = -\\dfrac{24}{25}$.<br><strong>d) Sai:</strong> $\\cos\\left(\\alpha + \\dfrac{\\pi}{3}\\right) = \\cos\\alpha \\cos\\dfrac{\\pi}{3} - \\sin\\alpha \\sin\\dfrac{\\pi}{3} = \\left(-\\dfrac{3}{5}\\right)\\left(\\dfrac{1}{2}\\right) - \\left(\\dfrac{4}{5}\\right)\\left(\\dfrac{\\sqrt{3}}{2}\\right) = \\dfrac{-3 - 4\\sqrt{3}}{10}$.',
  },
  {
    id: 'tf2',
    number: 2,
    type: 'tf',
    skill: 'Khảo sát tính chất của hàm số lượng giác',
    text: 'Xét hàm số $f(x) = 2\\sin\\left(2x - \\dfrac{\\pi}{6}\\right) + 1$.',
    items: [
      { key: 'a', text: 'Tập xác định của hàm số là $D = \\mathbb{R}$.', correct: true },
      { key: 'b', text: 'Tập giá trị của hàm số là $T = [-1; 3]$.', correct: true },
      { key: 'c', text: 'Hàm số tuần hoàn với chu kỳ $T = 2\\pi$.', correct: false },
      { key: 'd', text: 'Hàm số đồng biến trên khoảng $\\left(\\dfrac{\\pi}{6}; \\dfrac{\\pi}{3}\\right)$.', correct: true },
    ],
    explanation:
      '<strong>a) Đúng:</strong> Hàm số xác định với mọi $x \\in \\mathbb{R}$.<br><strong>b) Đúng:</strong> Vì $-1 \\le \\sin\\left(2x - \\dfrac{\\pi}{6}\\right) \\le 1 \\Rightarrow -2 \\le 2\\sin\\left(2x - \\dfrac{\\pi}{6}\\right) \\le 2 \\Rightarrow -1 \\le f(x) \\le 3$.<br><strong>c) Sai:</strong> Chu kỳ $T = \\dfrac{2\\pi}{2} = \\pi$.<br><strong>d) Đúng:</strong> Đặt $u = 2x - \\dfrac{\\pi}{6}$. Khi $x \\in \\left(\\dfrac{\\pi}{6}; \\dfrac{\\pi}{3}\\right) \\Rightarrow u \\in \\left(\\dfrac{\\pi}{6}; \\dfrac{\\pi}{2}\\right)$. Trên khoảng này $\\sin u$ đồng biến nên $f(x)$ đồng biến.',
  },
  {
    id: 'tf3',
    number: 3,
    type: 'tf',
    skill: 'Giải phương trình lượng giác bậc hai đối với cosin',
    text: 'Cho phương trình lượng giác $2\\cos^2 x - \\sqrt{3}\\cos x = 0$.',
    items: [
      { key: 'a', text: 'Phương trình tương đương với $\\left[\\begin{aligned} \\cos x &= 0 \\\\ \\cos x &= \\dfrac{\\sqrt{3}}{2} \\end{aligned}\\right.$', correct: true },
      { key: 'b', text: 'Các họ nghiệm của phương trình là $x = \\dfrac{\\pi}{2} + k\\pi$ và $x = \\pm \\dfrac{\\pi}{6} + k2\\pi \\quad (k \\in \\mathbb{Z})$.', correct: true },
      { key: 'c', text: 'Trên đoạn $[0; 2\\pi]$, phương trình có tất cả $5$ nghiệm phân biệt.', correct: false },
      { key: 'd', text: 'Tổng tất cả các nghiệm thuộc đoạn $[0; 2\\pi]$ của phương trình bằng $4\\pi$.', correct: true },
    ],
    explanation:
      '<strong>a) Đúng:</strong> Đặt $\\cos x(2\\cos x - \\sqrt{3}) = 0$.<br><strong>b) Đúng:</strong> $\\cos x = 0 \\Leftrightarrow x = \\dfrac{\\pi}{2} + k\\pi$; $\\cos x = \\dfrac{\\sqrt{3}}{2} \\Leftrightarrow x = \\pm \\dfrac{\\pi}{6} + k2\\pi$.<br><strong>c) Sai:</strong> Trên $[0; 2\\pi]$, các nghiệm là $\\left\\{\\dfrac{\\pi}{6}, \\dfrac{\\pi}{2}, \\dfrac{3\\pi}{2}, \\dfrac{11\\pi}{6}\\right\\}$ (chỉ có đúng 4 nghiệm).<br><strong>d) Đúng:</strong> Tổng nghiệm $= \\dfrac{\\pi}{2} + \\dfrac{3\\pi}{2} + \\dfrac{\\pi}{6} + \\dfrac{11\\pi}{6} = 2\\pi + 2\\pi = 4\\pi$.',
  },
  {
    id: 'tf4',
    number: 4,
    type: 'tf',
    skill: 'Ứng dụng hàm số lượng giác vào mô hình Vật lý dòng điện xoay chiều',
    text: 'Cường độ dòng điện xoay chiều trong một mạch điện phụ thuộc thời gian $t$ (giây, $t \\ge 0$) được mô hình hóa bởi hàm số $i(t) = 4\\cos\\left(100\\pi t - \\dfrac{\\pi}{3}\\right)$ (A).',
    items: [
      { key: 'a', text: 'Cường độ dòng điện cực đại trong mạch bằng $4\\text{ A}$.', correct: true },
      { key: 'b', text: 'Tại thời điểm ban đầu $t = 0\\text{ s}$, cường độ dòng điện trong mạch bằng $2\\text{ A}$.', correct: true },
      { key: 'c', text: 'Trong $0,02\\text{ giây}$ đầu tiên ($0 \\le t \\le 0,02$), dòng điện đạt giá trị cực đại đúng $1$ lần.', correct: true },
      { key: 'd', text: 'Cường độ dòng điện bằng $0\\text{ A}$ tại thời điểm $t = \\dfrac{1}{200}\\text{ giây}$.', correct: false },
    ],
    explanation:
      '<strong>a) Đúng:</strong> Biên độ dòng điện $I_{\\max} = 4\\text{ A}$.<br><strong>b) Đúng:</strong> $i(0) = 4\\cos(-\\pi/3) = 4 \\cdot \\dfrac{1}{2} = 2\\text{ A}$.<br><strong>c) Đúng:</strong> $i(t) = 4 \\Leftrightarrow 100\\pi t - \\dfrac{\\pi}{3} = k2\\pi \\Leftrightarrow t = \\dfrac{1}{300} + \\dfrac{k}{50}$. Với $0 \\le t \\le 0,02 \\Rightarrow k = 0 \\Rightarrow t = \\dfrac{1}{300}\\text{ s}$ (đạt đúng 1 lần).<br><strong>d) Sai:</strong> Tại $t = \\dfrac{1}{200} \\Rightarrow i = 4\\cos\\left(\\dfrac{\\pi}{2} - \\dfrac{\\pi}{3}\\right) = 4\\cos\\left(\\dfrac{\\pi}{6}\\right) = 2\\sqrt{3}\\text{ A} \\ne 0\\text{ A}$.',
  },
];

// PHẦN III. TRẮC NGHIỆM TRẢ LỜI NGẮN (6 CÂU - 3,0 ĐIỂM)
const SHORTANS_QUESTIONS_TOAN11: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 1,
    type: 'shortans',
    skill: 'Biến đổi và tính giá trị biểu thức lượng giác',
    points: 0.5,
    text: 'Tính giá trị của biểu thức $P = \\dfrac{\\sin 4a + \\sin 2a}{\\cos 4a + \\cos 2a + 1}$ khi $\\tan a = 3$.',
    placeholder: 'Ví dụ: -0.75 hoặc -3/4',
    correctDisplay: '-0,75 (hoặc -3/4)',
    validator: (val: string) => {
      const clean = val.trim().replace(/,/g, '.');
      return clean === '-0.75' || clean === '-3/4';
    },
    explanation:
      '<strong>Lời giải:</strong><br>Biến đổi tử số: $\\sin 4a + \\sin 2a = 2\\sin 2a \\cos 2a + \\sin 2a = \\sin 2a(2\\cos 2a + 1)$.<br>Biến đổi mẫu số: $\\cos 4a + 1 + \\cos 2a = 2\\cos^2 2a + \\cos 2a = \\cos 2a(2\\cos 2a + 1)$.<br>Do đó: $P = \\dfrac{\\sin 2a}{\\cos 2a} = \\tan 2a = \\dfrac{2\\tan a}{1 - \\tan^2 a} = \\dfrac{2(3)}{1 - 3^2} = \\dfrac{6}{-8} = -0,75$.',
  },
  {
    id: 'sa2',
    number: 2,
    type: 'shortans',
    skill: 'Tìm giá trị lớn nhất, nhỏ nhất của hàm số lượng giác',
    points: 0.5,
    text: 'Tìm giá trị lớn nhất $M$ của hàm số $y = \\sin^2 x - 4\\sin x + 5$.',
    placeholder: 'Ví dụ: 10',
    correctDisplay: '10',
    validator: (val: string) => {
      const clean = val.trim();
      return clean === '10';
    },
    explanation:
      '<strong>Lời giải:</strong><br>Đặt $t = \\sin x$ với $t \\in [-1; 1]$. Xét hàm số $f(t) = t^2 - 4t + 5$.<br>Hàm bậc hai có đỉnh $t = 2 \\notin [-1; 1]$, suy ra $f(t)$ nghịch biến liên tục trên $[-1; 1]$.<br>Do đó giá trị lớn nhất là $M = f(-1) = (-1)^2 - 4(-1) + 5 = 10$.',
  },
  {
    id: 'sa3',
    number: 3,
    type: 'shortans',
    skill: 'Đếm số nghiệm của phương trình lượng giác trong khoảng',
    points: 0.5,
    text: 'Phương trình $\\sin\\left(2x - \\dfrac{\\pi}{6}\\right) = \\dfrac{1}{2}$ có bao nhiêu nghiệm thuộc khoảng $(0; \\pi)$?',
    placeholder: 'Ví dụ: 2',
    correctDisplay: '2',
    validator: (val: string) => {
      const clean = val.trim();
      return clean === '2';
    },
    explanation:
      '<strong>Lời giải:</strong><br>Phương trình $\\Leftrightarrow \\left[\\begin{aligned} 2x - \\dfrac{\\pi}{6} &= \\dfrac{\\pi}{6} + k2\\pi \\\\ 2x - \\dfrac{\\pi}{6} &= \\dfrac{5\\pi}{6} + k2\\pi \\end{aligned}\\right. \\Leftrightarrow \\left[\\begin{aligned} x &= \\dfrac{\\pi}{6} + k\\pi \\\\ x &= \\dfrac{\\pi}{2} + k\\pi \\end{aligned}\\right. \\quad (k \\in \\mathbb{Z})$.<br>Với $x \\in (0; \\pi) \\Rightarrow$ chỉ có $x_1 = \\dfrac{\\pi}{6}$ và $x_2 = \\dfrac{\\pi}{2}$ (khi $k = 0$). Có đúng 2 nghiệm.',
  },
  {
    id: 'sa4',
    number: 4,
    type: 'shortans',
    skill: 'Ứng dụng hàm số lượng giác mô hình hóa chu kỳ thủy triều',
    points: 0.5,
    text: 'Mực nước biển tại một trạm quan trắc phụ thuộc thời gian $t$ (giờ, $0 \\le t \\le 24$) trong ngày được mô hình hóa bởi hàm số $h(t) = 3\\cos\\left(\\dfrac{\\pi t}{6}\\right) + 8$ (mét). Trong một ngày (24 giờ), có bao nhiêu thời điểm $t$ mực nước tại trạm đạt đúng $9,5\\text{ mét}$?',
    placeholder: 'Ví dụ: 4',
    correctDisplay: '4',
    validator: (val: string) => {
      const clean = val.trim();
      return clean === '4';
    },
    explanation:
      '<strong>Lời giải:</strong><br>$h(t) = 9,5 \\Leftrightarrow 3\\cos\\left(\\dfrac{\\pi t}{6}\\right) + 8 = 9,5 \\Leftrightarrow \\cos\\left(\\dfrac{\\pi t}{6}\\right) = \\dfrac{1}{2} \\Leftrightarrow \\dfrac{\\pi t}{6} = \\pm \\dfrac{\\pi}{3} + k2\\pi \\Leftrightarrow t = \\pm 2 + 12k$.<br>Trong đoạn $[0; 24]$:<br>- Họ $t = 2 + 12k \\Rightarrow t \\in \\{2, 14\\}$.<br>- Họ $t = -2 + 12k \\Rightarrow t \\in \\{10, 22\\}$.<br>Vậy có đúng 4 thời điểm.',
  },
  {
    id: 'sa5',
    number: 5,
    type: 'shortans',
    skill: 'Phương trình lượng giác chứa tham số m',
    points: 0.5,
    text: 'Tìm số các giá trị nguyên của tham số $m \\in [-5; 5]$ để phương trình $\\cos 2x - 2m\\cos x + m + 1 = 0$ có đúng $3$ nghiệm phân biệt thuộc đoạn $[0; 2\\pi]$.',
    placeholder: 'Ví dụ: 1',
    correctDisplay: '1 (ứng với m = -1)',
    validator: (val: string) => {
      const clean = val.trim();
      return clean === '1';
    },
    explanation:
      '<strong>Lời giải:</strong><br>Phương trình $\\Leftrightarrow 2\\cos^2 x - 1 - 2m\\cos x + m + 1 = 0 \\Leftrightarrow (2\\cos x - 1)(\\cos x - m) = 0 \\Leftrightarrow \\left[\\begin{aligned} \\cos x &= \\dfrac{1}{2} \\quad (1) \\\\ \\cos x &= m \\quad (2) \\end{aligned}\\right.$<br>Trên đoạn $[0; 2\\pi]$, phương trình (1) cho 2 nghiệm phân biệt $\\left\\{\\dfrac{\\pi}{3}, \\dfrac{5\\pi}{3}\\right\\}$.<br>Để phương trình ban đầu có đúng 3 nghiệm phân biệt trên $[0; 2\\pi]$ thì phương trình (2) phải có đúng 1 nghiệm thuộc $[0; 2\\pi]$ khác các nghiệm của (1).<br>Đường $y = m$ cắt đồ thị $y = \\cos x$ trên $[0; 2\\pi]$ tại đúng 1 điểm khi $m = -1$ (ứng với nghiệm $x = \\pi$).<br>Do đó có duy nhất 1 giá trị nguyên là $m = -1$.',
  },
  {
    id: 'sa6',
    number: 6,
    type: 'shortans',
    skill: 'Mô hình hóa chuyển động vòng quay mặt trời (Sun Wheel)',
    points: 0.5,
    text: 'Một chiếc cabin trên vòng quay Sun Wheel có bán kính $R = 30\\text{ m}$, tâm đặt ở độ cao $32\\text{ m}$ so với mặt đất. Vòng quay quay đều với chu kỳ $12\\text{ phút}$. Độ cao $h$ (mét) của cabin so với mặt đất tại thời điểm $t$ (phút) kể từ khi cabin ở vị trí thấp nhất được cho bởi công thức $h(t) = 32 - 30\\cos\\left(\\dfrac{\\pi t}{6}\\right)$. Trong $12\\text{ phút}$ quay đầu tiên ($0 \\le t \\le 12$), tổng thời gian (tính bằng phút) mà cabin ở độ cao từ $47\\text{ mét}$ trở lên là bao nhiêu?',
    placeholder: 'Ví dụ: 4',
    correctDisplay: '4 phút',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/phút|phut|m/g, '').trim();
      return clean === '4';
    },
    explanation:
      '<strong>Lời giải:</strong><br>$h(t) \\ge 47 \\Leftrightarrow 32 - 30\\cos\\left(\\dfrac{\\pi t}{6}\\right) \\ge 47 \\Leftrightarrow \\cos\\left(\\dfrac{\\pi t}{6}\\right) \\le -\\dfrac{1}{2}$.<br>Với $t \\in [0; 12] \\Rightarrow u = \\dfrac{\\pi t}{6} \\in [0; 2\\pi]$.<br>Nghiệm là: $\\dfrac{2\\pi}{3} \\le \\dfrac{\\pi t}{6} \\le \\dfrac{4\\pi}{3} \\Leftrightarrow 4 \\le t \\le 8$.<br>Tổng thời gian cabin ở độ cao từ $47\\text{ m}$ trở lên là $8 - 4 = 4\\text{ phút}$.',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan11GiuaKy1Page() {
  // 1. STATE THÔNG TIN HỌC SINH
  const [tenHocSinh, setTenHocSinh] = useState<string>('');
  const [maHocSinh, setMaHocSinh] = useState<string>('');
  const [lopNhom, setLopNhom] = useState<string>('');

  // 2. STATE LÀM BÀI & TRẢ LỜI
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [tfAnswers, setTfAnswers] = useState<Record<string, Record<'a' | 'b' | 'c' | 'd', boolean | null>>>({
    tf1: { a: null, b: null, c: null, d: null },
    tf2: { a: null, b: null, c: null, d: null },
    tf3: { a: null, b: null, c: null, d: null },
    tf4: { a: null, b: null, c: null, d: null },
  });
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State lưu danh sách câu hỏi trắc nghiệm Phần I đã xáo trộn phương án (Fisher-Yates)
  const [shuffledMCQQuestions, setShuffledMCQQuestions] = useState<ShuffledQuestionMCQ[]>(() =>
    MCQ_QUESTIONS_TOAN11.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ originalKey: opt.key, text: opt.text })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS_TOAN11.map((q) => ({
      ...q,
      options: shuffleOptions(q.options),
    }));
    setShuffledMCQQuestions(shuffled);
  }, []);

  // 3. STATE KẾT QUẢ & CHẤM ĐIỂM
  const [diemTong, setDiemTong] = useState<number>(0);
  const [diemPhan1, setDiemPhan1] = useState<number>(0);
  const [diemPhan2, setDiemPhan2] = useState<number>(0);
  const [diemPhan3, setDiemPhan3] = useState<number>(0);
  const [mangCauSai, setMangCauSai] = useState<string[]>([]);

  // 4. STATE ĐỒNG HỒ ĐẾM NGƯỢC (90 PHÚT = 5400 GIÂY)
  const [timeLeft, setTimeLeft] = useState<number>(90 * 60);

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
  const answeredTFCount = Object.values(tfAnswers).reduce((sum, item) => {
    const answeredSub = Object.values(item).filter((v) => v !== null).length;
    return sum + (answeredSub === 4 ? 1 : answeredSub > 0 ? 0.5 : 0);
  }, 0);
  const answeredShortCount = Object.values(shortAnswers).filter((v) => v.trim().length > 0).length;
  const totalQuestions = MCQ_QUESTIONS_TOAN11.length + TF_QUESTIONS_TOAN11.length + SHORTANS_QUESTIONS_TOAN11.length;
  const progressPercent = Math.min(
    100,
    Math.round(((answeredMCQCount + answeredTFCount + answeredShortCount) / totalQuestions) * 100)
  );

  // 6. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS11-TUDONG';
    const lop = lopNhom.trim() || '11A';

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

    let p1Score = 0;
    let p2Score = 0;
    let p3Score = 0;
    const wrongSkills: string[] = [];

    // Chấm Phần I (12 câu MCQ, 0.25đ/câu = 3.0đ)
    MCQ_QUESTIONS_TOAN11.forEach((q) => {
      const studentChoice = mcqAnswers[q.id];
      if (studentChoice === q.correct) {
        p1Score += q.points;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (4 bài Đúng/Sai, thang điểm BGD 2025: max 4.0đ)
    TF_QUESTIONS_TOAN11.forEach((q) => {
      const studentSubAnswers = tfAnswers[q.id] || { a: null, b: null, c: null, d: null };
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

    // Chấm Phần III (6 câu Trả lời ngắn, 0.5đ/câu = 3.0đ)
    SHORTANS_QUESTIONS_TOAN11.forEach((q) => {
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
    setDiemTong(finalScore);
    setMangCauSai(uniqueWrongSkills);
    setIsSubmitted(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Payload gửi Webhook GAS theo đúng đặc tả
    const thoiGianLamGiay = 90 * 60 - timeLeft;
    const thoiGianLamPhut = Math.max(1, Math.round(thoiGianLamGiay / 60));

    const chiTietPhanHoiObj = {
      hoc_sinh: ten,
      ma_hs: ma,
      lop: lop,
      bai_thi: 'ĐỀ KIỂM TRA GIỮA KỲ I TOÁN 11 - CÔNG THỨC & HÀM SỐ & PT LƯỢNG GIÁC',
      diem_tong: finalScore,
      diem_phan_1: p1Score,
      diem_phan_2: p2Score,
      diem_phan_3: p3Score,
      thoi_gian_lam_phut: thoiGianLamPhut,
      thoi_gian_nop: new Date().toLocaleString('vi-VN'),
      ky_nang_sai: uniqueWrongSkills,
      dap_an_mcq: mcqAnswers,
      dap_an_tf: tfAnswers,
      dap_an_short: shortAnswers,
    };

    const webhookGASPayload = {
      action: 'submit_test',
      data: {
        Student_ID: ma,
        Task_ID: 'GIUA_KY_1_TOAN_11',
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
          bai_thi: 'ĐỀ KIỂM TRA GIỮA KỲ I TOÁN 11',
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
      setTfAnswers({
        tf1: { a: null, b: null, c: null, d: null },
        tf2: { a: null, b: null, c: null, d: null },
        tf3: { a: null, b: null, c: null, d: null },
        tf4: { a: null, b: null, c: null, d: null },
      });
      setShortAnswers({});
      setIsSubmitted(false);
      setDiemTong(0);
      setDiemPhan1(0);
      setDiemPhan2(0);
      setDiemPhan3(0);
      setMangCauSai([]);
      setTimeLeft(90 * 60);
      // Xáo trộn lại một lượt mới bằng Fisher-Yates
      setShuffledMCQQuestions(
        MCQ_QUESTIONS_TOAN11.map((q) => ({
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
            <span className="inline-block px-3 py-1 bg-cyan-50 text-cyan-800 text-xs font-semibold uppercase tracking-wider rounded-full mb-2">
              Hệ thống khảo sát trực tuyến Integra &bull; Cấu trúc BGD 2025
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              ĐỀ KIỂM TRA GIỮA KỲ I MÔN TOÁN LỚP 11 – THỜI GIAN: 90 PHÚT
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
              CHỦ ĐỀ: CÔNG THỨC LƯỢNG GIÁC – HÀM SỐ LƯỢNG GIÁC – PHƯƠNG TRÌNH LƯỢNG GIÁC
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 disabled:bg-slate-100"
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
                placeholder="HS11-001"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 disabled:bg-slate-100"
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 disabled:bg-slate-100"
              />
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-cyan-50/80 border border-cyan-200 rounded-xl">
              <span className="text-xs font-medium text-cyan-800">Thời gian còn lại</span>
              <span
                className={`text-xl font-bold font-mono ${
                  timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-cyan-950'
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* THANH TIẾN ĐỘ */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
              <span>Tiến độ hoàn thành: {progressPercent}%</span>
              <span>Tổng 22 câu (3 phần thi)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        {/* KẾT QUẢ SAU KHI NỘP BÀI */}
        {isSubmitted && (
          <section className="bg-white rounded-2xl shadow-md border-2 border-cyan-600 p-6 sm:p-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                  Đã hoàn thành &bull; Chấm chuẩn BGD 2025
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-2">
                  Kết quả bài thi: {tenHocSinh || 'Học sinh'} ({lopNhom || 'Lớp 11'})
                </h2>
                <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-slate-600 mt-2">
                  <span className="px-2.5 py-1 bg-slate-100 rounded-md font-medium">
                    Phần I (Nhiều lựa chọn): <strong>{diemPhan1} / 3.0 đ</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 rounded-md font-medium">
                    Phần II (Đúng/Sai): <strong>{diemPhan2} / 4.0 đ</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 rounded-md font-medium">
                    Phần III (Trả lời ngắn): <strong>{diemPhan3} / 3.0 đ</strong>
                  </span>
                </div>
              </div>
              <div className="text-center sm:text-right bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-200 min-w-[150px]">
                <span className="text-xs uppercase text-slate-500 font-semibold block">Tổng điểm</span>
                <span className="text-4xl font-extrabold text-cyan-700">{diemTong}</span>
                <span className="text-sm font-semibold text-slate-400"> / 10.0</span>
              </div>
            </div>

            {/* PHÂN TÍCH LỖI SAI & KỸ NĂNG CẦN CẢI THIỆN */}
            <div className="mt-5">
              <h3 className="text-sm font-bold text-slate-800 mb-2">
                Các chủ đề / kỹ năng cần ôn luyện thêm:
              </h3>
              {mangCauSai.length === 0 ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-medium">
                  🎉 Xuất sắc! Bạn đã trả lời đúng tất cả các chủ đề trong đề thi.
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

        {/* PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN */}
        <section className="space-y-4">
          <div className="bg-cyan-800 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (3,0 ĐIỂM – 12 CÂU)
              </h2>
              <p className="text-xs text-cyan-200">Mỗi câu hỏi chọn 1 phương án đúng (0,25 điểm/câu)</p>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-md font-medium">
              12 Câu
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
                    <span className="px-2.5 py-1 bg-cyan-100 text-cyan-900 text-xs font-bold rounded-md">
                      Câu {q.number}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      [{q.skill}]
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">0,25 đ</span>
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
                        'border-cyan-600 bg-cyan-50/80 text-cyan-950 font-semibold ring-2 ring-cyan-500/20';
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
                              ? 'bg-cyan-600 text-white'
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
                    <div className="flex items-center gap-1.5 font-bold text-cyan-900 mb-1">
                      <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
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

        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI */}
        <section className="space-y-4">
          <div className="bg-teal-800 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI (4,0 ĐIỂM – 4 BÀI)
              </h2>
              <p className="text-xs text-teal-200">
                Chuẩn BGD: Đúng 1 ý: 0.1đ &bull; Đúng 2 ý: 0.25đ &bull; Đúng 3 ý: 0.5đ &bull; Đúng 4 ý: 1.0đ
              </p>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-md font-medium">
              4 Bài
            </span>
          </div>

          {TF_QUESTIONS_TOAN11.map((q) => {
            const studentItemAnswers = tfAnswers[q.id] || { a: null, b: null, c: null, d: null };
            let correctCount = 0;
            q.items.forEach((item) => {
              if (studentItemAnswers[item.key] === item.correct) correctCount += 1;
            });
            const earnedPoints = calculateTFPoints(correctCount);

            return (
              <div
                key={q.id}
                className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 transition shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-teal-100 text-teal-900 text-xs font-bold rounded-md">
                      Câu {q.number} (Đúng/Sai)
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      [{q.skill}]
                    </span>
                  </div>
                  {isSubmitted ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      +{earnedPoints} / 1,0 đ ({correctCount}/4 ý đúng)
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Tối đa 1,0 đ</span>
                  )}
                </div>

                <div
                  className="text-slate-900 text-sm sm:text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: q.text }}
                />

                {/* BẢNG 4 MỆNH ĐỀ a, b, c, d */}
                <div className="space-y-3">
                  {q.items.map((item) => {
                    const currentVal = studentItemAnswers[item.key];
                    const isItemCorrect = currentVal === item.correct;

                    let rowStyle = 'bg-slate-50 border-slate-200';
                    if (isSubmitted) {
                      rowStyle = isItemCorrect
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-rose-50/50 border-rose-300';
                    }

                    return (
                      <div
                        key={item.key}
                        className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${rowStyle}`}
                      >
                        <div className="flex items-start gap-2.5 flex-1">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {item.key}
                          </span>
                          <div
                            className="text-sm text-slate-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: item.text }}
                          />
                        </div>

                        {/* NÚT CHỌN ĐÚNG / SAI */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => {
                              if (isSubmitted) return;
                              setTfAnswers((prev) => ({
                                ...prev,
                                [q.id]: {
                                  ...prev[q.id],
                                  [item.key]: true,
                                },
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                              currentVal === true
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Đúng
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => {
                              if (isSubmitted) return;
                              setTfAnswers((prev) => ({
                                ...prev,
                                [q.id]: {
                                  ...prev[q.id],
                                  [item.key]: false,
                                },
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                              currentVal === false
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Sai
                          </button>

                          {isSubmitted && (
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded ml-1 ${
                                isItemCorrect ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                              }`}
                            >
                              Chuẩn: {item.correct ? 'ĐÚNG' : 'SAI'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isSubmitted && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-lg text-sm text-slate-700">
                    <div className="flex items-center gap-1.5 font-bold text-teal-900 mb-1">
                      <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                      </svg>
                      Hướng dẫn giải chi tiết từng ý:
                    </div>
                    <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* PHẦN III: TRẢ LỜI NGẮN */}
        <section className="space-y-4">
          <div className="bg-slate-800 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                PHẦN III. TRẮC NGHIỆM TRẢ LỜI NGẮN (3,0 ĐIỂM – 6 CÂU)
              </h2>
              <p className="text-xs text-slate-300">Điền số hoặc phân số kết quả (0,5 điểm/câu)</p>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-md font-medium">
              6 Câu
            </span>
          </div>

          {SHORTANS_QUESTIONS_TOAN11.map((q) => {
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
                      Câu {q.number} (Trả lời ngắn)
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      [{q.skill}]
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">0,5 đ</span>
                </div>

                <div
                  className="text-slate-900 text-sm sm:text-base leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: q.text }}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600">
                    Nhập kết quả tính toán của bạn:
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitted}
                    value={studentText}
                    onChange={(e) =>
                      setShortAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder={q.placeholder}
                    className="w-full sm:w-80 px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 disabled:bg-slate-100"
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
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                      <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
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

        {/* NÚT NỘP BÀI THI */}
        <div className="pt-4 pb-12 flex flex-col items-center">
          {!isSubmitted ? (
            <button
              id="btn-nop-bai"
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full sm:w-80 py-4 px-6 bg-cyan-700 hover:bg-cyan-800 disabled:bg-cyan-400 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-cyan-600/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
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
                  NỘP BÀI THI (90 PHÚT)
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
                Xem lại kết quả & phân tích
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
