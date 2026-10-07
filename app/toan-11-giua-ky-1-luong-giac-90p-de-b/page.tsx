'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA GIỮA KỲ I MÔN TOÁN LỚP 11 - 90 PHÚT [ĐỀ B]';
const EXAM_SUBTITLE = 'CHƯƠNG I: HÀM SỐ LƯỢNG GIÁC VÀ PHƯƠNG TRÌNH LƯỢNG GIÁC';
const EXAM_TIME_NOTE = '(Thời gian làm bài: 90 phút • Tỷ lệ: 90% Trắc nghiệm 30 câu + 10% Tự luận 1 câu)';

// --- CẤU HÌNH WEBHOOK URL ---
const GOOGLE_APP_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwFjkENCxOPVJcFo8OmXuLad5kcMEC9_Uu48hF045AO0yC8-TnHivEI0ohfUHZkJQlN/exec';
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook-test/cham-diem-integra';

// --- INTERFACES & TYPES (TUÂN THỦ 100% CẤU TRÚC SHUFFLE OBJECT VÀ ISCORRECT) ---
export interface OptionItem {
  id: number; // originalIndex: 0, 1, 2, 3
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

export interface QuestionShortAns {
  id: string;
  number: number;
  subLabel?: string;
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

// ==========================================
// DỮ LIỆU ĐỀ THI GIỮA KỲ 1 TOÁN 11 [ĐỀ B] - 90 PHÚT
// TẤT CẢ KÝ TỰ ĐẶC BIỆT (\right, \dfrac,...) ĐỀU ĐƯỢC DOUBLE-ESCAPE CHUẨN XÁC
// ==========================================

const MCQ_QUESTIONS_GK1_TOAN11_DE_B: QuestionMCQ[] = [
  // CHỦ ĐỀ 1: GIÁ TRỊ LƯỢNG GIÁC CỦA GÓC LƯỢNG GIÁC (8 CÂU: 1 -> 8)
  {
    id: 'gkb1',
    number: 1,
    type: 'mcq',
    skill: 'Định nghĩa giá trị lượng giác trên đường tròn lượng giác đơn vị',
    points: 0.3,
    text: 'Trên mặt phẳng tọa độ $Oxy$, cho đường tròn lượng giác tâm $O$ bán kính $R=1$ với điểm gốc $A(1;0)$. Mỗi góc lượng giác $\\alpha$ xác định duy nhất một điểm $M(x_M; y_M)$ trên đường tròn lượng giác. Khẳng định nào sau đây <strong>đúng</strong>?',
    options: [
      { id: 0, text: '$\\sin\\alpha = y_M$', isCorrect: true },
      { id: 1, text: '$\\cos\\alpha = y_M$', isCorrect: false },
      { id: 2, text: '$\\tan\\alpha = \\dfrac{x_M}{y_M}$', isCorrect: false },
      { id: 3, text: '$\\cot\\alpha = \\dfrac{y_M}{x_M}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Theo định nghĩa giá trị lượng giác của góc lượng giác trên đường tròn đơn vị, tung độ $y_M$ của điểm $M$ chính là $\\sin\\alpha$ ($y_M = \\sin\\alpha$) và hoành độ $x_M$ là $\\cos\\alpha$ ($x_M = \\cos\\alpha$).',
  },
  {
    id: 'gkb2',
    number: 2,
    type: 'mcq',
    skill: 'Đổi số đo góc lượng giác từ độ sang radian',
    points: 0.3,
    text: 'Số đo góc lượng giác $\\alpha = 165^\\circ$ khi đổi sang đơn vị radian bằng:',
    options: [
      { id: 0, text: '$\\dfrac{7\\pi}{12}$', isCorrect: false },
      { id: 1, text: '$\\dfrac{11\\pi}{12}$', isCorrect: true },
      { id: 2, text: '$\\dfrac{5\\pi}{12}$', isCorrect: false },
      { id: 3, text: '$\\dfrac{11\\pi}{6}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Đổi từ độ sang radian: $$\\alpha = 165 \\times \\dfrac{\\pi}{180} = \\dfrac{165\\pi}{180} = \\dfrac{11\\pi}{12}\\text{ (rad)}$$',
  },
  {
    id: 'gkb3',
    number: 3,
    type: 'mcq',
    skill: 'Xét dấu các giá trị lượng giác ở góc phần tư thứ III',
    points: 0.3,
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\pi < \\alpha < \\dfrac{3\\pi}{2}$. Mệnh đề nào sau đây <strong>đúng</strong>?',
    options: [
      { id: 0, text: '$\\sin\\alpha > 0, \\cos\\alpha < 0$', isCorrect: false },
      { id: 1, text: '$\\sin\\alpha > 0, \\cos\\alpha > 0$', isCorrect: false },
      { id: 2, text: '$\\sin\\alpha < 0, \\cos\\alpha < 0$', isCorrect: true },
      { id: 3, text: '$\\sin\\alpha < 0, \\cos\\alpha > 0$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Khi $\\pi < \\alpha < \\dfrac{3\\pi}{2}$, điểm $M$ biểu diễn góc $\\alpha$ nằm ở góc phần tư thứ III trên đường tròn lượng giác. Do đó cả hoành độ $\\cos\\alpha < 0$ và tung độ $\\sin\\alpha < 0$.',
  },
  {
    id: 'gkb4',
    number: 4,
    type: 'mcq',
    skill: 'Tính giá trị lượng giác khi biết một giá trị lượng giác và góc phần tư III',
    points: 0.3,
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\sin\\alpha = -\\dfrac{4}{5}$ và $\\pi < \\alpha < \\dfrac{3\\pi}{2}$. Giá trị của $\\cos\\alpha$ bằng:',
    options: [
      { id: 0, text: '$\\dfrac{3}{5}$', isCorrect: false },
      { id: 1, text: '$-\\dfrac{3}{5}$', isCorrect: true },
      { id: 2, text: '$-\\dfrac{9}{25}$', isCorrect: false },
      { id: 3, text: '$\\dfrac{9}{25}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Vì góc $\\alpha$ thuộc góc phần tư III nên $\\cos\\alpha < 0$. Áp dụng hệ thức $\\sin^2\\alpha + \\cos^2\\alpha = 1$: $$\\cos^2\\alpha = 1 - \\sin^2\\alpha = 1 - \\left(-\\dfrac{4}{5}\\right)^2 = \\dfrac{9}{25} \\implies \\cos\\alpha = -\\sqrt{\\dfrac{9}{25}} = -\\dfrac{3}{5}$$',
  },
  {
    id: 'gkb5',
    number: 5,
    type: 'mcq',
    skill: 'Nhận biết các hệ thức lượng giác cơ bản',
    points: 0.3,
    text: 'Trong các khẳng định sau, đẳng thức nào <strong>sai</strong> với mọi góc lượng giác $\\alpha$ làm cho biểu thức có nghĩa?',
    options: [
      { id: 0, text: '$\\sin^2\\alpha + \\cos^2\\alpha = 1$', isCorrect: false },
      { id: 1, text: '$1 + \\tan^2\\alpha = -\\dfrac{1}{\\cos^2\\alpha}$', isCorrect: true },
      { id: 2, text: '$1 + \\cot^2\\alpha = \\dfrac{1}{\\sin^2\\alpha}$', isCorrect: false },
      { id: 3, text: '$\\tan\\alpha \\cdot \\cot\\alpha = 1$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Hệ thức lượng giác cơ bản đúng là $1 + \\tan^2\\alpha = \\dfrac{1}{\\cos^2\\alpha}$. Khẳng định $1 + \\tan^2\\alpha = -\\dfrac{1}{\\cos^2\\alpha}$ có dấu âm ở vế phải nên là khẳng định sai.',
  },
  {
    id: 'gkb6',
    number: 6,
    type: 'mcq',
    skill: 'Rút gọn biểu thức lượng giác bằng công thức các góc liên quan đặc biệt',
    points: 0.3,
    text: 'Rút gọn biểu thức $P = \\cos(\\pi - \\alpha) + \\sin\\left(\\dfrac{\\pi}{2} - \\alpha\\right) - \\cos(-\\alpha)$ ta được:',
    options: [
      { id: 0, text: '$P = \\cos\\alpha$', isCorrect: false },
      { id: 1, text: '$P = -\\cos\\alpha$', isCorrect: true },
      { id: 2, text: '$P = 3\\cos\\alpha$', isCorrect: false },
      { id: 3, text: '$P = -\\sin\\alpha$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Sử dụng công thức các góc liên quan đặc biệt:<br>- $\\cos(\\pi - \\alpha) = -\\cos\\alpha$<br>- $\\sin\\left(\\dfrac{\\pi}{2} - \\alpha\\right) = \\cos\\alpha$<br>- $\\cos(-\\alpha) = \\cos\\alpha$<br>Thay vào $P$: $$P = -\\cos\\alpha + \\cos\\alpha - \\cos\\alpha = -\\cos\\alpha$$',
  },
  {
    id: 'gkb7',
    number: 7,
    type: 'mcq',
    skill: 'Tính tích sin a cos a từ hiệu sin a - cos a',
    points: 0.3,
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\sin\\alpha - \\cos\\alpha = \\dfrac{1}{3}$. Giá trị của tích $\\sin\\alpha \\cos\\alpha$ bằng:',
    options: [
      { id: 0, text: '$\\dfrac{2}{9}$', isCorrect: false },
      { id: 1, text: '$\\dfrac{4}{9}$', isCorrect: true },
      { id: 2, text: '$-\\dfrac{4}{9}$', isCorrect: false },
      { id: 3, text: '$\\dfrac{8}{9}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Bình phương hai vế của đẳng thức $\\sin\\alpha - \\cos\\alpha = \\dfrac{1}{3}$: $$(\\sin\\alpha - \\cos\\alpha)^2 = \\left(\\dfrac{1}{3}\\right)^2 \\iff \\sin^2\\alpha - 2\\sin\\alpha \\cos\\alpha + \\cos^2\\alpha = \\dfrac{1}{9}$$ $$\\iff 1 - 2\\sin\\alpha \\cos\\alpha = \\dfrac{1}{9} \\iff 2\\sin\\alpha \\cos\\alpha = \\dfrac{8}{9} \\iff \\sin\\alpha \\cos\\alpha = \\dfrac{4}{9}$$',
  },
  {
    id: 'gkb8',
    number: 8,
    type: 'mcq',
    skill: 'Tính quãng đường chuyển động của đầu kim đồng hồ',
    points: 0.3,
    text: 'Kim phút của một đồng hồ có chiều dài $10\\text{ cm}$. Trong khoảng thời gian $20\\text{ phút}$, đầu kim phút di chuyển được một quãng đường bằng:',
    options: [
      { id: 0, text: '$\\dfrac{10\\pi}{3}\\text{ cm}$', isCorrect: false },
      { id: 1, text: '$\\dfrac{20\\pi}{3}\\text{ cm}$', isCorrect: true },
      { id: 2, text: '$20\\pi\\text{ cm}$', isCorrect: false },
      { id: 3, text: '$\\dfrac{40\\pi}{3}\\text{ cm}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong><br>- Kim phút quay hết 1 vòng ($2\\pi\\text{ rad}$) trong $60\\text{ phút}$.<br>- Trong $20\\text{ phút}$, kim phút quay được góc lượng giác có số đo: $$\\alpha = \\dfrac{20}{60} \\times 2\\pi = \\dfrac{2\\pi}{3}\\text{ (rad)}$$<br>- Quãng đường đầu kim phút di chuyển: $$l = R \\cdot \\alpha = 10 \\times \\dfrac{2\\pi}{3} = \\dfrac{20\\pi}{3}\\text{ (cm)}$$',
  },

  // CHỦ ĐỀ 2: CÔNG THỨC LƯỢNG GIÁC (6 CÂU: 9 -> 14)
  {
    id: 'gkb9',
    number: 9,
    type: 'mcq',
    skill: 'Nhận biết công thức cộng lượng giác cho sin của một hiệu',
    points: 0.3,
    text: 'Trong các công thức cộng dưới đây, công thức nào <strong>đúng</strong>?',
    options: [
      { id: 0, text: '$\\sin(a-b) = \\sin a \\cos b + \\cos a \\sin b$', isCorrect: false },
      { id: 1, text: '$\\sin(a-b) = \\sin a \\cos b - \\cos a \\sin b$', isCorrect: true },
      { id: 2, text: '$\\cos(a-b) = \\cos a \\cos b - \\sin a \\sin b$', isCorrect: false },
      { id: 3, text: '$\\cos(a+b) = \\cos a \\cos b + \\sin a \\sin b$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Theo công thức cộng đối với sin của một hiệu: $\\sin(a-b) = \\sin a \\cos b - \\cos a \\sin b$.',
  },
  {
    id: 'gkb10',
    number: 10,
    type: 'mcq',
    skill: 'Áp dụng công thức nhân đôi của cosin',
    points: 0.3,
    text: 'Biết $\\cos a = -\\dfrac{1}{3}$. Giá trị của $\\cos 2a$ bằng:',
    options: [
      { id: 0, text: '$\\dfrac{7}{9}$', isCorrect: false },
      { id: 1, text: '$-\\dfrac{7}{9}$', isCorrect: true },
      { id: 2, text: '$\\dfrac{2}{9}$', isCorrect: false },
      { id: 3, text: '$-\\dfrac{2}{9}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Sử dụng công thức nhân đôi của cosin theo cosin: $$\\cos 2a = 2\\cos^2 a - 1 = 2 \\cdot \\left(-\\dfrac{1}{3}\\right)^2 - 1 = \\dfrac{2}{9} - 1 = -\\dfrac{7}{9}$$',
  },
  {
    id: 'gkb11',
    number: 11,
    type: 'mcq',
    skill: 'Nhận biết công thức biến đổi tích thành tổng cho cos a cos b',
    points: 0.3,
    text: 'Khẳng định nào sau đây <strong>đúng</strong> về công thức biến đổi tích thành tổng?',
    options: [
      { id: 0, text: '$\\cos a \\cos b = \\dfrac{1}{2}[\\cos(a-b) + \\cos(a+b)]$', isCorrect: true },
      { id: 1, text: '$\\cos a \\cos b = \\dfrac{1}{2}[\\cos(a-b) - \\cos(a+b)]$', isCorrect: false },
      { id: 2, text: '$\\sin a \\sin b = \\dfrac{1}{2}[\\cos(a-b) + \\cos(a+b)]$', isCorrect: false },
      { id: 3, text: '$\\sin a \\cos b = \\dfrac{1}{2}[\\sin(a-b) - \\sin(a+b)]$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Theo công thức biến đổi tích thành tổng: $\\cos a \\cos b = \\dfrac{1}{2}[\\cos(a-b) + \\cos(a+b)]$.',
  },
  {
    id: 'gkb12',
    number: 12,
    type: 'mcq',
    skill: 'Rút gọn phân thức lượng giác bằng công thức biến đổi tổng thành tích',
    points: 0.3,
    text: 'Rút gọn biểu thức $M = \\dfrac{\\sin 4x + \\sin 2x}{\\cos 4x + \\cos 2x}$ (với điều kiện biểu thức xác định) ta được:',
    options: [
      { id: 0, text: '$M = \\tan 2x$', isCorrect: false },
      { id: 1, text: '$M = \\tan 3x$', isCorrect: true },
      { id: 2, text: '$M = \\tan 6x$', isCorrect: false },
      { id: 3, text: '$M = \\cot 3x$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Áp dụng công thức biến đổi tổng thành tích: $$\\sin 4x + \\sin 2x = 2\\sin 3x \\cos x$$ $$\\cos 4x + \\cos 2x = 2\\cos 3x \\cos x$$ Suy ra: $$M = \\dfrac{2\\sin 3x \\cos x}{2\\cos 3x \\cos x} = \\dfrac{\\sin 3x}{\\cos 3x} = \\tan 3x$$',
  },
  {
    id: 'gkb13',
    number: 13,
    type: 'mcq',
    skill: 'Tính giá trị biểu thức tích hai sin góc đặc biệt',
    points: 0.3,
    text: 'Không sử dụng máy tính cầm tay, tính giá trị biểu thức $A = \\sin 105^\\circ \\cdot \\sin 15^\\circ$.',
    options: [
      { id: 0, text: '$\\dfrac{1}{2}$', isCorrect: false },
      { id: 1, text: '$\\dfrac{1}{4}$', isCorrect: true },
      { id: 2, text: '$\\dfrac{\\sqrt{3}}{4}$', isCorrect: false },
      { id: 3, text: '$\\dfrac{\\sqrt{2}}{4}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Biến đổi tích thành tổng: $$A = \\sin 105^\\circ \\sin 15^\\circ = \\dfrac{1}{2}[\\cos(105^\\circ - 15^\\circ) - \\cos(105^\\circ + 15^\\circ)] = \\dfrac{1}{2}[\\cos 90^\\circ - \\cos 120^\\circ] = \\dfrac{1}{2}\\left(0 - \\left(-\\dfrac{1}{2}\\right)\\right) = \\dfrac{1}{4}$$',
  },
  {
    id: 'gkb14',
    number: 14,
    type: 'mcq',
    skill: 'Xác định biên độ và pha ban đầu của dao động tổng hợp',
    points: 0.3,
    text: 'Một thiết bị truyền tín hiệu phát ra hai sóng âm có dạng $f_1(t) = 4\\sin t$ và $f_2(t) = 4\\cos t$ ($t$ tính bằng giây). Âm kết hợp có dạng $f(t) = f_1(t) + f_2(t) = A\\sin(t + \\varphi)$ với $A > 0$ và $-\\pi \\le \\varphi \\le \\pi$. Biên độ âm $A$ và pha ban đầu $\\varphi$ lần lượt bằng:',
    options: [
      { id: 0, text: '$A = 4\\sqrt{2}, \\varphi = \\dfrac{\\pi}{4}$', isCorrect: true },
      { id: 1, text: '$A = 8, \\varphi = \\dfrac{\\pi}{4}$', isCorrect: false },
      { id: 2, text: '$A = 4\\sqrt{2}, \\varphi = -\\dfrac{\\pi}{4}$', isCorrect: false },
      { id: 3, text: '$A = 4, \\varphi = \\dfrac{\\pi}{2}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> $$f(t) = 4\\sin t + 4\\cos t = 4\\sqrt{2}\\left(\\dfrac{1}{\\sqrt{2}}\\sin t + \\dfrac{1}{\\sqrt{2}}\\cos t\\right) = 4\\sqrt{2}\\sin\\left(t + \\dfrac{\\pi}{4}\\right)$$ Suy ra biên độ $A = 4\\sqrt{2}$ và pha ban đầu $\\varphi = \\dfrac{\\pi}{4}$.',
  },

  // CHỦ ĐỀ 3: HÀM SỐ LƯỢNG GIÁC (7 CÂU: 15 -> 21)
  {
    id: 'gkb15',
    number: 15,
    type: 'mcq',
    skill: 'Tìm tập xác định của hàm số cotang',
    points: 0.3,
    text: 'Tập xác định $D$ của hàm số $y = \\cot\\left(x + \\dfrac{\\pi}{6}\\right)$ là:',
    options: [
      { id: 0, text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{\\pi}{6} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: false },
      { id: 1, text: '$D = \\mathbb{R} \\setminus \\left\\{-\\dfrac{\\pi}{6} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: true },
      { id: 2, text: '$D = \\mathbb{R} \\setminus \\left\\{-\\dfrac{\\pi}{6} + k2\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: false },
      { id: 3, text: '$D = \\mathbb{R} \\setminus \\left\\{k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Hàm số $y = \\cot\\left(x + \\dfrac{\\pi}{6}\\right)$ xác định khi và chỉ khi: $$x + \\dfrac{\\pi}{6} \\ne k\\pi \\iff x \\ne -\\dfrac{\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$$',
  },
  {
    id: 'gkb16',
    number: 16,
    type: 'mcq',
    skill: 'Tìm tập giá trị của hàm số lượng giác dạng a cos(x) + b',
    points: 0.3,
    text: 'Tập giá trị $T$ của hàm số $y = 3\\cos\\left(x - \\dfrac{\\pi}{6}\\right) + 2$ là:',
    options: [
      { id: 0, text: '$T = [-3; 3]$', isCorrect: false },
      { id: 1, text: '$T = [-1; 5]$', isCorrect: true },
      { id: 2, text: '$T = [-5; 1]$', isCorrect: false },
      { id: 3, text: '$T = [-1; 3]$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Vì $-1 \\le \\cos\\left(x - \\dfrac{\\pi}{6}\\right) \\le 1 \\implies -3 \\le 3\\cos\\left(x - \\dfrac{\\pi}{6}\\right) \\le 3 \\implies -1 \\le y \\le 5$. Do đó $T = [-1; 5]$.',
  },
  {
    id: 'gkb17',
    number: 17,
    type: 'mcq',
    skill: 'Nhận biết hàm số lẻ',
    points: 0.3,
    text: 'Hàm số nào dưới đây là hàm số lẻ trên tập xác định của nó?',
    options: [
      { id: 0, text: '$y = \\cos x$', isCorrect: false },
      { id: 1, text: '$y = x \\cos x$', isCorrect: true },
      { id: 2, text: '$y = x \\sin x$', isCorrect: false },
      { id: 3, text: '$y = \\cos 2x$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Xét $f(x) = x \\cos x$, có tập xác định $D = \\mathbb{R}$. Với mọi $x \\in \\mathbb{R}$: $$f(-x) = (-x)\\cos(-x) = -x \\cos x = -f(x)$$ Do đó $y = x \\cos x$ là hàm số lẻ.',
  },
  {
    id: 'gkb18',
    number: 18,
    type: 'mcq',
    skill: 'Xác định chu kỳ tuần hoàn của hàm số sin(ax + b)',
    points: 0.3,
    text: 'Chu kỳ tuần hoàn $T$ của hàm số $y = \\sin\\left(3x + \\dfrac{\\pi}{3}\\right)$ bằng:',
    options: [
      { id: 0, text: '$T = 2\\pi$', isCorrect: false },
      { id: 1, text: '$T = \\pi$', isCorrect: false },
      { id: 2, text: '$T = \\dfrac{2\\pi}{3}$', isCorrect: true },
      { id: 3, text: '$T = \\dfrac{\\pi}{3}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Hàm số $y = \\sin(ax + b)$ tuần hoàn với chu kỳ $T = \\dfrac{2\\pi}{|a|}$. Áp dụng với $a = 3 \\implies T = \\dfrac{2\\pi}{3}$.',
  },
  {
    id: 'gkb19',
    number: 19,
    type: 'mcq',
    skill: 'Xét chiều biến thiên của hàm số cos x',
    points: 0.3,
    text: 'Mệnh đề nào sau đây <strong>đúng</strong> khi nói về sự biến thiên của hàm số $y = \\cos x$?',
    options: [
      { id: 0, text: 'Đồng biến trên khoảng $(0; \\pi)$', isCorrect: false },
      { id: 1, text: 'Nghịch biến trên khoảng $(0; \\pi)$', isCorrect: true },
      { id: 2, text: 'Nghịch biến trên khoảng $(\\pi; 2\\pi)$', isCorrect: false },
      { id: 3, text: 'Đồng biến trên toàn bộ khoảng $(0; 2\\pi)$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Dựa vào đồ thị hàm số $y = \\cos x$: khi $x$ tăng từ $0$ đến $\\pi$ thì $\\cos x$ giảm từ $1$ xuống $-1$. Do đó hàm số nghịch biến trên khoảng $(0; \\pi)$.',
  },
  {
    id: 'gkb20',
    number: 20,
    type: 'mcq',
    skill: 'Tìm giá trị lớn nhất và giá trị nhỏ nhất của hàm số lượng giác quy về bậc hai',
    points: 0.3,
    text: 'Giá trị lớn nhất $M$ và giá trị nhỏ nhất $m$ của hàm số $y = 2\\sin^2 x + 3\\cos x + 1$ là:',
    options: [
      { id: 0, text: '$M = 4, m = -1$', isCorrect: false },
      { id: 1, text: '$M = \\dfrac{33}{8}, m = -2$', isCorrect: true },
      { id: 2, text: '$M = \\dfrac{25}{8}, m = -1$', isCorrect: false },
      { id: 3, text: '$M = 3, m = -2$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Biến đổi hàm số theo $\\cos x$: $$y = 2(1 - \\cos^2 x) + 3\\cos x + 1 = -2\\cos^2 x + 3\\cos x + 3$$ Đặt $t = \\cos x$ với $t \\in [-1; 1]$. Xét tam thức $g(t) = -2t^2 + 3t + 3$:<br>- Đỉnh parabol $t_0 = \\dfrac{3}{4} \\in [-1; 1] \\implies g\\left(\\dfrac{3}{4}\\right) = -2\\left(\\dfrac{9}{16}\\right) + 3\\left(\\dfrac{3}{4}\\right) + 3 = \\dfrac{33}{8}$.<br>- Giá trị tại biên: $g(-1) = -2$, $g(1) = 4$.<br>Do đó giá trị lớn nhất $M = \\dfrac{33}{8}$ và giá trị nhỏ nhất $m = -2$.',
  },
  {
    id: 'gkb21',
    number: 21,
    type: 'mcq',
    skill: 'Mô hình hóa cực trị mực nước cửa sông theo hàm lượng giác',
    points: 0.3,
    text: 'Mực nước tại một cửa sông thay đổi theo thời gian $t$ (giờ, $0 \\le t \\le 24$) trong ngày được mô hình hóa bởi hàm số $h(t) = 3\\cos\\left(\\dfrac{\\pi t}{12}\\right) + 8$ (mét). Mực nước cửa sông đạt giá trị cao nhất bằng bao nhiêu mét và vào thời điểm mấy giờ?',
    options: [
      { id: 0, text: '$8\\text{ m}$ vào lúc $6\\text{ giờ}$ và $18\\text{ giờ}$', isCorrect: false },
      { id: 1, text: '$11\\text{ m}$ vào lúc $0\\text{ giờ}$ và $24\\text{ giờ}$', isCorrect: true },
      { id: 2, text: '$11\\text{ m}$ vào lúc $12\\text{ giờ}$', isCorrect: false },
      { id: 3, text: '$8\\text{ m}$ vào lúc $12\\text{ giờ}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Mực nước cao nhất khi $\\cos\\left(\\dfrac{\\pi t}{12}\\right) = 1 \\implies h_{\\max} = 3(1) + 8 = 11\\text{ m}$. $$\\cos\\left(\\dfrac{\\pi t}{12}\\right) = 1 \\iff \\dfrac{\\pi t}{12} = k2\\pi \\iff t = 24k \\quad (k \\in \\mathbb{Z})$$ Với $0 \\le t \\le 24 \\implies t = 0\\text{ giờ}$ và $t = 24\\text{ giờ}$.',
  },

  // CHỦ ĐỀ 4: PHƯƠNG TRÌNH LƯỢNG GIÁC CƠ BẢN (9 CÂU: 22 -> 30)
  {
    id: 'gkb22',
    number: 22,
    type: 'mcq',
    skill: 'Tìm điều kiện tham số để phương trình cos x = m có nghiệm',
    points: 0.3,
    text: 'Phương trình lượng giác $\\cos x = m$ (với $m$ là tham số thực) có nghiệm khi và chỉ khi:',
    options: [
      { id: 0, text: '$m \\in (-1; 1)$', isCorrect: false },
      { id: 1, text: '$m \\in [-1; 1]$', isCorrect: true },
      { id: 2, text: '$m \\in \\mathbb{R}$', isCorrect: false },
      { id: 3, text: '$m \\le 1$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Tập giá trị của hàm cosin là $[-1; 1]$ nên phương trình $\\cos x = m$ có nghiệm $\\iff m \\in [-1; 1]$.',
  },
  {
    id: 'gkb23',
    number: 23,
    type: 'mcq',
    skill: 'Giải phương trình cos x = cos(pi/4)',
    points: 0.3,
    text: 'Tất cả các nghiệm của phương trình $\\cos x = \\cos\\dfrac{\\pi}{4}$ là:',
    options: [
      { id: 0, text: '$x = \\pm \\dfrac{\\pi}{4} + k2\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: true },
      { id: 1, text: '$x = \\dfrac{\\pi}{4} + k2\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
      { id: 2, text: '$x = \\pm \\dfrac{\\pi}{4} + k\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
      { id: 3, text: '$x = \\dfrac{\\pi}{4} + k\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Công thức nghiệm cosin cơ bản: $\\cos x = \\cos\\alpha \\iff x = \\pm \\alpha + k2\\pi \\quad (k \\in \\mathbb{Z})$.',
  },
  {
    id: 'gkb24',
    number: 24,
    type: 'mcq',
    skill: 'Giải phương trình cotang cơ bản cot x = 1/sqrt(3)',
    points: 0.3,
    text: 'Tất cả các nghiệm của phương trình $\\cot x = \\dfrac{1}{\\sqrt{3}}$ là:',
    options: [
      { id: 0, text: '$x = \\dfrac{\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
      { id: 1, text: '$x = \\dfrac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: true },
      { id: 2, text: '$x = \\dfrac{\\pi}{3} + k2\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
      { id: 3, text: '$x = \\pm \\dfrac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> $\\cot x = \\dfrac{1}{\\sqrt{3}} = \\cot\\dfrac{\\pi}{3} \\iff x = \\dfrac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$.',
  },
  {
    id: 'gkb25',
    number: 25,
    type: 'mcq',
    skill: 'Giải phương trình sin(2x + pi/3) = 0',
    points: 0.3,
    text: 'Tập nghiệm của phương trình $\\sin\\left(2x + \\dfrac{\\pi}{3}\\right) = 0$ là:',
    options: [
      { id: 0, text: '$S = \\left\\{\\dfrac{\\pi}{6} + \\dfrac{k\\pi}{2} \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: false },
      { id: 1, text: '$S = \\left\\{-\\dfrac{\\pi}{6} + \\dfrac{k\\pi}{2} \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: true },
      { id: 2, text: '$S = \\left\\{-\\dfrac{\\pi}{3} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: false },
      { id: 3, text: '$S = \\left\\{-\\dfrac{\\pi}{6} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> $$\\sin\\left(2x + \\dfrac{\\pi}{3}\\right) = 0 \\iff 2x + \\dfrac{\\pi}{3} = k\\pi \\iff 2x = -\\dfrac{\\pi}{3} + k\\pi \\iff x = -\\dfrac{\\pi}{6} + \\dfrac{k\\pi}{2} \\quad (k \\in \\mathbb{Z})$$',
  },
  {
    id: 'gkb26',
    number: 26,
    type: 'mcq',
    skill: 'Giải và hợp nghiệm phương trình cos 2x = cos x',
    points: 0.3,
    text: 'Nghiệm của phương trình $\\cos 2x = \\cos x$ là:',
    options: [
      { id: 0, text: '$x = k2\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
      { id: 1, text: '$x = \\dfrac{k2\\pi}{3} \\quad (k \\in \\mathbb{Z})$', isCorrect: true },
      { id: 2, text: '$x = \\dfrac{\\pi}{3} + \\dfrac{k2\\pi}{3} \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
      { id: 3, text: '$x = k\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> $$\\cos 2x = \\cos x \\iff \\left[\\begin{array}{l} 2x = x + k2\\pi \\\\ 2x = -x + k2\\pi \\end{array}\\right. \\iff \\left[\\begin{array}{l} x = k2\\pi \\\\ 3x = k2\\pi \\end{array}\\right. \\iff x = \\dfrac{k2\\pi}{3} \\quad (k \\in \\mathbb{Z})$$<br>(do họ $x = k2\\pi$ là tập con của họ $x = \\dfrac{k2\\pi}{3}$).',
  },
  {
    id: 'gkb27',
    number: 27,
    type: 'mcq',
    skill: 'Đếm số nghiệm của phương trình sin x trên đoạn cho trước',
    points: 0.3,
    text: 'Số nghiệm của phương trình $\\sin x = -\\dfrac{\\sqrt{3}}{2}$ trên đoạn $[0; 2\\pi]$ là:',
    options: [
      { id: 0, text: '$1$', isCorrect: false },
      { id: 1, text: '$2$', isCorrect: true },
      { id: 2, text: '$3$', isCorrect: false },
      { id: 3, text: '$4$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> $\\sin x = \\sin\\left(-\\dfrac{\\pi}{3}\\right) \\iff \\left[\\begin{array}{l} x = -\\dfrac{\\pi}{3} + k2\\pi \\\\ x = \\dfrac{4\\pi}{3} + k2\\pi \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$.<br>Xét $x \\in [0; 2\\pi]$, chọn $k$ thu được $2$ nghiệm là $x_1 = \\dfrac{4\\pi}{3}$ và $x_2 = \\dfrac{5\\pi}{3}$.',
  },
  {
    id: 'gkb28',
    number: 28,
    type: 'mcq',
    skill: 'Tính tổng nghiệm của phương trình tan trên khoảng',
    points: 0.3,
    text: 'Tổng tất cả các nghiệm của phương trình $\\tan x - 1 = 0$ thuộc khoảng $(0; 2\\pi)$ bằng:',
    options: [
      { id: 0, text: '$\\dfrac{\\pi}{4}$', isCorrect: false },
      { id: 1, text: '$\\dfrac{5\\pi}{4}$', isCorrect: false },
      { id: 2, text: '$\\dfrac{3\\pi}{2}$', isCorrect: true },
      { id: 3, text: '$2\\pi$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> $\\tan x = 1 \\iff x = \\dfrac{\\pi}{4} + k\\pi \\quad (k \\in \\mathbb{Z})$.<br>Thuộc khoảng $(0; 2\\pi)$ có 2 nghiệm: $x_1 = \\dfrac{\\pi}{4}$ ($k=0$) và $x_2 = \\dfrac{5\\pi}{4}$ ($k=1$).<br>Tổng hai nghiệm là $x_1 + x_2 = \\dfrac{\\pi}{4} + \\dfrac{5\\pi}{4} = \\dfrac{6\\pi}{4} = \\dfrac{3\\pi}{2}$.',
  },
  {
    id: 'gkb29',
    number: 29,
    type: 'mcq',
    skill: 'Biểu diễn nghiệm phương trình lượng giác có điều kiện trên đường tròn',
    points: 0.3,
    text: 'Số điểm biểu diễn các nghiệm của phương trình $\\dfrac{\\sin 2x}{\\sin x} = 0$ trên đường tròn lượng giác là:',
    options: [
      { id: 0, text: '$1$', isCorrect: false },
      { id: 1, text: '$2$', isCorrect: true },
      { id: 2, text: '$3$', isCorrect: false },
      { id: 3, text: '$4$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Điều kiện xác định: $\\sin x \\ne 0 \\iff x \\ne k\\pi \\quad (k \\in \\mathbb{Z})$.<br>Phương trình $\\iff \\sin 2x = 0 \\iff 2\\sin x \\cos x = 0 \\iff \\cos x = 0$ (do $\\sin x \\ne 0$).<br>$$\\cos x = 0 \\iff x = \\dfrac{\\pi}{2} + k\\pi \\quad (k \\in \\mathbb{Z})$$<br>Các nghiệm này thỏa mãn ĐKXĐ. Trên đường tròn lượng giác có đúng $2$ điểm biểu diễn là $B(0;1)$ và $B\'(0;-1)$.',
  },
  {
    id: 'gkb30',
    number: 30,
    type: 'mcq',
    skill: 'Tìm tham số m để phương trình lượng giác có nghiệm duy nhất trên khoảng',
    points: 0.3,
    text: 'Tìm tất cả các giá trị thực của tham số $m$ để phương trình $\\sin x = m - 1$ có đúng một nghiệm thuộc khoảng $\\left(0; \\dfrac{\\pi}{2}\\right)$.',
    options: [
      { id: 0, text: '$0 < m < 1$', isCorrect: false },
      { id: 1, text: '$1 < m < 2$', isCorrect: true },
      { id: 2, text: '$-1 < m < 1$', isCorrect: false },
      { id: 3, text: '$1 \\le m \\le 2$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Với mọi $x \\in \\left(0; \\dfrac{\\pi}{2}\\right)$, ta có $0 < \\sin x < 1$. Do đó phương trình có nghiệm duy nhất thuộc khoảng khi và chỉ khi: $$0 < m - 1 < 1 \\iff 1 < m < 2$$',
  },
];

// PHẦN II. TỰ LUẬN (1 CÂU GỒM 2 Ý: a & b - TỔNG 1,0 ĐIỂM)
const SHORTANS_QUESTIONS_GK1_TOAN11_DE_B: QuestionShortAns[] = [
  {
    id: 'gkb31a',
    number: 31,
    subLabel: 'Ý a',
    type: 'shortans',
    skill: 'Tính giá trị hàm số lượng giác trong mô hình chuyển động đu quay',
    points: 0.5,
    text: '<strong>Bài toán mô hình hóa cabin đu quay:</strong><br>Một cabin đu quay có bán kính $R = 25\\text{ m}$ quay đều với chu kỳ $10\\text{ phút}$. Trục quay $O$ được đặt ở độ cao $27\\text{ m}$ so với mặt đất. Chiều cao $h$ (mét) của cabin so với mặt đất tại thời điểm $t$ (phút) kể từ khi vòng quay bắt đầu vận hành từ vị trí thấp nhất được mô hình hóa bởi công thức: $$h(t) = 27 - 25\\cos\\left(\\dfrac{\\pi t}{5}\\right)$$<br><strong>Ý a) (0,5 điểm):</strong> Tính chiều cao của cabin so với mặt đất ở thời điểm $t = 2{,}5\\text{ phút}$.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'h(2,5) = 27 m (hoặc 27)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('27');
    },
    explanation:
      '<strong>Lời giải chi tiết Ý a (0,5 điểm):</strong><br>- Tại thời điểm $t = 2{,}5\\text{ phút}$, thay $t = 2{,}5$ vào công thức chiều cao $h(t)$: $$h(2{,}5) = 27 - 25\\cos\\left(\\dfrac{\\pi \\cdot 2{,}5}{5}\\right) = 27 - 25\\cos\\left(\\dfrac{\\pi}{2}\\right)$$ (0,25đ)<br>- Vì $\\cos\\left(\\dfrac{\\pi}{2}\\right) = 0$ nên $h(2{,}5) = 27 - 25(0) = 27\\text{ (m)}$. Vậy ở thời điểm $t = 2{,}5\\text{ phút}$, cabin ở độ cao $27\\text{ m}$ so với mặt đất (ngang độ cao trục quay $O$). (0,25đ)',
  },
  {
    id: 'gkb31b',
    number: 31,
    subLabel: 'Ý b',
    type: 'shortans',
    skill: 'Giải phương trình lượng giác tìm thời điểm đạt độ cao trong vòng quay đầu tiên',
    points: 0.5,
    text: '<strong>Ý b) (0,5 điểm):</strong> Trong vòng quay đầu tiên ($0 \\le t \\le 10\\text{ phút}$), xác định tất cả các thời điểm $t$ để cabin ở độ cao đúng $39{,}5\\text{ m}$ so với mặt đất.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 't = 10/3 phút và t = 20/3 phút (hoặc 10/3; 20/3)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const hasFractions = clean.includes('10/3') && clean.includes('20/3');
      const hasDecimals =
        (clean.includes('3.3') || clean.includes('3,3')) &&
        (clean.includes('6.6') || clean.includes('6,6') || clean.includes('6.7') || clean.includes('6,7'));
      const hasMinutesSeconds =
        clean.includes('3') && clean.includes('20') && clean.includes('6') && clean.includes('40');
      return hasFractions || hasDecimals || hasMinutesSeconds;
    },
    explanation:
      '<strong>Lời giải chi tiết Ý b (0,5 điểm):</strong><br>- Cabin ở độ cao $39{,}5\\text{ m} \\iff h(t) = 39{,}5 \\iff 27 - 25\\cos\\left(\\dfrac{\\pi t}{5}\\right) = 39{,}5 \\iff -25\\cos\\left(\\dfrac{\\pi t}{5}\\right) = 12{,}5 \\iff \\cos\\left(\\dfrac{\\pi t}{5}\\right) = -\\dfrac{1}{2}$. (0,25đ)<br>- Giải phương trình: $$\\dfrac{\\pi t}{5} = \\pm \\dfrac{2\\pi}{3} + k2\\pi \\iff t = \\pm \\dfrac{10}{3} + 10k \\quad (k \\in \\mathbb{Z})$$<br>- Xét trong vòng quay đầu tiên ($0 \\le t \\le 10\\text{ phút}$):<br>  + Nhánh $t = \\dfrac{10}{3} + 10k$: chọn $k = 0 \\implies t = \\dfrac{10}{3}\\text{ phút}$ (hoặc $3\\text{ phút } 20\\text{ giây}$, khi cabin đang đi lên).<br>  + Nhánh $t = -\\dfrac{10}{3} + 10k$: chọn $k = 1 \\implies t = \\dfrac{20}{3}\\text{ phút}$ (hoặc $6\\text{ phút } 40\\text{ giây}$, khi cabin đang đi xuống).<br>Vậy trong vòng quay đầu tiên, cabin ở độ cao $39{,}5\\text{ m}$ tại hai thời điểm $t = \\dfrac{10}{3}\\text{ phút}$ và $t = \\dfrac{20}{3}\\text{ phút}$. (0,25đ)',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan11GiuaKy1LuongGiac90pDeBPage() {
  // 1. STATE THÔNG TIN HỌC SINH
  const [tenHocSinh, setTenHocSinh] = useState<string>('');
  const [maHocSinh, setMaHocSinh] = useState<string>('');
  const [lopNhom, setLopNhom] = useState<string>('');

  // 2. STATE LÀM BÀI & TRẢ LỜI
  // mcqAnswers lưu id gốc của OptionItem được chọn (ví dụ: { 'gkb1': 0, 'gkb2': 1 })
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State lưu danh sách câu hỏi trắc nghiệm đã xáo trộn phương án (Fisher-Yates)
  // Mỗi câu hỏi chứa options dạng Object [{ id, text, isCorrect }]
  const [shuffledMCQQuestions, setShuffledMCQQuestions] = useState<QuestionMCQ[]>(() =>
    MCQ_QUESTIONS_GK1_TOAN11_DE_B.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ ...opt })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS_GK1_TOAN11_DE_B.map((q) => ({
      ...q,
      options: shuffleOptions(q.options),
    }));
    setShuffledMCQQuestions(shuffled);
  }, []);

  // CẬP NHẬT TIÊU ĐỀ TRÌNH DUYỆT (DOCUMENT.TITLE) ĐỘNG TỪ MÃ NGUỒN LATEX
  useEffect(() => {
    document.title = `${EXAM_TITLE} - ${EXAM_SUBTITLE}`;
  }, []);

  // 3. STATE KẾT QUẢ & ĐIỂM SỐ
  const [diemSo, setDiemSo] = useState<number>(0);
  const [soCauDungMCQ, setSoCauDungMCQ] = useState<number>(0);
  const [soCauDungShort, setSoCauDungShort] = useState<number>(0);
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

  // Tiến độ làm bài
  const answeredMCQCount = Object.keys(mcqAnswers).length;
  const answeredShortCount = Object.values(shortAnswers).filter((v) => v.trim().length > 0).length;
  const totalQuestions =
    MCQ_QUESTIONS_GK1_TOAN11_DE_B.length + SHORTANS_QUESTIONS_GK1_TOAN11_DE_B.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 5. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  // Chấm điểm BẤT BIẾN theo trường isCorrect và ID gốc của đáp án, TUYỆT ĐỐI không dựa vào index hiển thị
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS11-GK1-90P-B';
    const lop = lopNhom.trim() || 'Lớp 11';

    if (!tenHocSinh.trim()) {
      const confirmAnonymous = window.confirm(
        'Bạn chưa nhập Họ và tên. Bạn có muốn nộp bài với tên "Học sinh ẩn danh" không?'
      );
      if (!confirmAnonymous) return;
    }

    setIsSubmitting(true);

    // Chấm điểm trắc nghiệm dựa hoàn toàn trên trường isCorrect của Option được chọn
    let calculatedScore = 0;
    let correctMCQ = 0;
    let correctShort = 0;
    const wrongSkills: string[] = [];

    shuffledMCQQuestions.forEach((q) => {
      const selectedIndex = mcqAnswers[q.id];
      const chosenOption = selectedIndex !== undefined ? q.options[selectedIndex] : null;
      const isCorrect = chosenOption ? chosenOption.isCorrect === true : false;

      if (isCorrect) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm tự luận (2 ý x 0.5đ = 1.0đ)
    SHORTANS_QUESTIONS_GK1_TOAN11_DE_B.forEach((q) => {
      const studentText = shortAnswers[q.id] || '';
      const isCorrect = q.validator(studentText);
      if (isCorrect) {
        calculatedScore += q.points;
        correctShort += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    const finalScore = Math.min(10, Math.round(calculatedScore * 100) / 100);
    const uniqueWrongSkills = Array.from(new Set(wrongSkills));

    setDiemSo(finalScore);
    setSoCauDungMCQ(correctMCQ);
    setSoCauDungShort(correctShort);
    setMangCauSai(uniqueWrongSkills);

    const thoiGianLamPhut = Math.max(1, Math.round((90 * 60 - timeLeft) / 60));

    const chiTietPhanHoiObj = {
      ho_ten: ten,
      ma_so: ma,
      lop: lop,
      de_thi: `${EXAM_TITLE} - ${EXAM_SUBTITLE}`,
      diem_so: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS_GK1_TOAN11_DE_B.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_GK1_TOAN11_DE_B.length}`,
      thoi_gian_lam_phut: thoiGianLamPhut,
      thoi_gian_nop: new Date().toLocaleString('vi-VN'),
      ky_nang_sai: uniqueWrongSkills,
      dap_an_mcq_selected_ids: mcqAnswers,
      dap_an_tu_luan: shortAnswers,
    };

    const webhookGASPayload = {
      action: 'submit_test',
      data: {
        Student_ID: ma,
        Task_ID: 'KIEM_TRA_GIUA_KY_1_TOAN_11_LUONG_GIAC_90P_DE_B',
        Diem_So: finalScore,
        Thoi_Gian_Lam: thoiGianLamPhut,
        Chi_Tiet_Phan_Hoi: JSON.stringify(chiTietPhanHoiObj),
      },
    };

    // 1. Fetch gửi Webhook Google Apps Script
    try {
      await fetch(GOOGLE_APP_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(webhookGASPayload),
        mode: 'no-cors',
      });
      console.log('✅ Đã gửi Webhook tới Google Apps Script thành công!');
    } catch (err) {
      console.warn('⚠️ Lỗi gửi Webhook GAS (vẫn tiếp tục):', err);
    }

    // 2. Fetch gửi Webhook n8n
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...webhookGASPayload,
          full_details: chiTietPhanHoiObj,
        }),
      });
      console.log('✅ Đã gửi Webhook tới n8n thành công!');
    } catch (err) {
      console.warn('⚠️ Lỗi gửi Webhook n8n (vẫn tiếp tục):', err);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 6. LÀM LẠI BÀI THI (RESET & RE-SHUFFLE)
  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn làm lại bài thi từ đầu? Dữ liệu bài làm hiện tại sẽ bị xóa.')) {
      setMcqAnswers({});
      setShortAnswers({});
      setIsSubmitted(false);
      setTimeLeft(90 * 60);
      setDiemSo(0);
      setSoCauDungMCQ(0);
      setSoCauDungShort(0);
      setMangCauSai([]);

      const reshuffled = MCQ_QUESTIONS_GK1_TOAN11_DE_B.map((q) => ({
        ...q,
        options: shuffleOptions(q.options),
      }));
      setShuffledMCQQuestions(reshuffled);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-50 text-slate-800 font-sans pb-16">
      {/* HEADER BANNER - TIÊU ĐỀ ĐỘNG 100% TỪ MÃ NGUỒN LATEX */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-sky-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse"></span>
              {EXAM_SUBTITLE}
            </div>
            <h1 className="text-lg md:text-xl font-extrabold text-slate-900 leading-snug">
              {EXAM_TITLE}
            </h1>
            <p className="text-xs text-slate-500">{EXAM_TIME_NOTE}</p>
          </div>

          {/* ĐỒNG HỒ ĐẾM NGƯỢC */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-base transition-all ${
                timeLeft < 300
                  ? 'bg-rose-50 border-rose-300 text-rose-600 animate-bounce'
                  : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}
            >
              <svg
                className="w-5 h-5 text-current animate-spin"
                style={{ animationDuration: '4s' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatTime(timeLeft)}</span>
            </div>

            {!isSubmitted && (
              <button
                id="btn-nop-bai"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Đang nộp...' : 'Nộp bài thi'}
              </button>
            )}
          </div>
        </div>

        {/* THANH TIẾN ĐỘ */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-gradient-to-r from-sky-500 to-indigo-600 h-1.5 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        {/* KHUNG THÔNG TIN THÍ SINH */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-sky-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Thông tin thí sinh dự thi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="input-ten"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
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
              <label
                htmlFor="input-ma-hs"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Mã học sinh / SBD
              </label>
              <input
                id="input-ma-hs"
                type="text"
                disabled={isSubmitted}
                value={maHocSinh}
                onChange={(e) => setMaHocSinh(e.target.value)}
                placeholder="VD: HS11-002"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label
                htmlFor="input-lop"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS11-GK1-90P-B'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '11'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Trắc nghiệm: <strong>{soCauDungMCQ}/{shuffledMCQQuestions.length}</strong> câu đúng</span>
                  <span>Tự luận: <strong>{soCauDungShort}/{SHORTANS_QUESTIONS_GK1_TOAN11_DE_B.length}</strong> ý đúng</span>
                  <span>Thời gian làm bài: <strong>{Math.max(1, Math.round((90 * 60 - timeLeft) / 60))} phút</strong></span>
                </div>
              </div>

              {/* KHỐI ĐIỂM SỐ TỔNG KẾT */}
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
          </section>
        )}

        {/* ======================================================== */}
        {/* PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN (9,0 ĐIỂM - 30 CÂU) */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-sky-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (30 CÂU - 9,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-sky-800/80 px-3 py-1 rounded-full text-sky-200 font-medium">
              0,3 điểm / câu • 4 lựa chọn (1 đáp án đúng duy nhất)
            </span>
          </div>

          <div className="space-y-4">
            {shuffledMCQQuestions.map((q) => {
              const selectedIndex = mcqAnswers[q.id];
              const chosenOption = selectedIndex !== undefined ? q.options[selectedIndex] : null;
              const isStudentCorrect = chosenOption ? chosenOption.isCorrect === true : false;

              // TÍNH TOÁN ĐỘNG CHỮ CÁI ĐÁP ÁN ĐÚNG TRÊN MẢNG HIỆN TẠI (A, B, C, D)
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
                    </div>

                    {/* Hiển thị kết quả chấm điểm khi đã nộp bài */}
                    {isSubmitted && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                          isStudentCorrect
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isStudentCorrect ? '✓ Đúng (+0.3đ)' : '✕ Sai (+0.0đ)'}
                      </span>
                    )}
                  </div>

                  {/* Nội dung câu hỏi (Bọc trong MathContent) */}
                  <MathContent
                    content={q.text}
                    className="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mb-4"
                  />

                  {/* Danh sách 4 phương án (Đã xáo trộn Object giữ cờ isCorrect) */}
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
                          // Phương án đúng luôn được highlight màu xanh ngọc
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-300';
                        } else if (isOptionSelected && !isOptionCorrect) {
                          // Nếu học sinh chọn sai phương án này thì gạch ngang đỏ
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
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition shrink-0 ${
                              isOptionSelected
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {displayLabel}
                          </span>
                          <MathContent content={opt.text} className="text-sm flex-1" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Lời giải chi tiết sau khi nộp (Hiển thị chữ cái đúng ĐỘNG sau khi shuffle) */}
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
        {/* PHẦN II: TỰ LUẬN (1,0 ĐIỂM - 1 CÂU GỒM 2 Ý: a & b)     */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN II. TỰ LUẬN - TOÁN THỰC TẾ (1 CÂU - 1,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              Gồm 2 ý: a) (0,5 điểm) và b) (0,5 điểm)
            </span>
          </div>

          <div className="space-y-4">
            {SHORTANS_QUESTIONS_GK1_TOAN11_DE_B.map((q) => {
              const currentVal = shortAnswers[q.id] || '';
              const isCorrect = isSubmitted && q.validator(currentVal);

              return (
                <div
                  key={q.id}
                  id={`cau-${q.number}-${q.subLabel}`}
                  className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-900 font-bold text-sm">
                        Câu {q.number} ({q.subLabel})
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                        {q.points} điểm
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
                        {isCorrect ? '✓ Đúng (+0.5đ)' : '✕ Chưa chính xác (+0.0đ)'}
                      </span>
                    )}
                  </div>

                  {/* Đề bài bọc trong MathContent */}
                  <MathContent
                    content={q.text}
                    className="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mb-4"
                  />

                  {/* Ô nhập câu trả lời ngắn - TUYỆT ĐỐI KHÔNG GÁN ĐÁP ÁN VÀO PLACEHOLDER HOẶC DEFAULTVALUE */}
                  <div className="max-w-md">
                    <label
                      htmlFor={`input-${q.id}`}
                      className="block text-xs font-bold text-slate-600 mb-1"
                    >
                      Đáp án của thí sinh:
                    </label>
                    <input
                      id={`input-${q.id}`}
                      type="text"
                      disabled={isSubmitted}
                      value={currentVal}
                      onChange={(e) =>
                        setShortAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      placeholder={q.placeholder}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium disabled:bg-slate-100"
                    />
                  </div>

                  {/* Lời giải sau khi nộp bài (Có đủ overflow-x-auto whitespace-pre-wrap break-words) */}
                  {isSubmitted && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm bg-slate-50/80 p-3.5 rounded-xl text-slate-700 space-y-2 overflow-x-auto whitespace-pre-wrap break-words">
                      <div className="font-semibold text-emerald-800">
                        Đáp số chuẩn: <MathContent content={q.correctDisplay} as="span" className="font-bold" />
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

        {/* NÚT NỘP BÀI DƯỚI CHÂN TRANG */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Đã làm: <strong className="text-slate-900">{totalAnswered}/{totalQuestions}</strong> câu hỏi • Thời gian còn lại: <strong className="text-sky-700">{formatTime(timeLeft)}</strong>
          </div>

          {!isSubmitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-700 hover:via-indigo-700 hover:to-purple-700 active:scale-95 text-white font-bold text-base rounded-2xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Đang xử lý nộp bài...</span>
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
                  Nộp bài thi ({totalAnswered}/{totalQuestions} câu)
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="py-3 px-6 bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm rounded-xl shadow-md transition"
              >
                Làm lại bài thi từ đầu
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
