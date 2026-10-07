'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA GIỮA KỲ I MÔN TOÁN LỚP 11 - 90 PHÚT';
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
// DỮ LIỆU ĐỀ THI GIỮA KỲ 1 TOÁN 11 - 90 PHÚT
// ==========================================

const MCQ_QUESTIONS_GK1_TOAN11: QuestionMCQ[] = [
  // CHỦ ĐỀ 1: GIÁ TRỊ LƯỢNG GIÁC CỦA GÓC LƯỢNG GIÁC (8 CÂU)
  {
    id: 'gk1',
    number: 1,
    type: 'mcq',
    skill: 'Định nghĩa giá trị lượng giác trên đường tròn lượng giác',
    points: 0.3,
    text: 'Trên mặt phẳng tọa độ $Oxy$, cho đường tròn lượng giác tâm $O$ bán kính $R=1$ với điểm gốc $A(1;0)$. Mỗi góc lượng giác $\\alpha$ xác định duy nhất một điểm $M(x_M; y_M)$ trên đường tròn lượng giác. Khẳng định nào sau đây <strong>đúng</strong>?',
    options: [
      { id: 0, text: '$\\sin\\alpha = x_M$', isCorrect: false },
      { id: 1, text: '$\\cos\\alpha = x_M$', isCorrect: true },
      { id: 2, text: '$\\tan\\alpha = \\dfrac{x_M}{y_M}$', isCorrect: false },
      { id: 3, text: '$\\cot\\alpha = \\dfrac{y_M}{x_M}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Theo định nghĩa giá trị lượng giác của góc lượng giác trên đường tròn đơn vị, hoành độ $x_M$ của điểm $M$ chính là $\\cos\\alpha$ ($x_M = \\cos\\alpha$) và tung độ $y_M$ chính là $\\sin\\alpha$ ($y_M = \\sin\\alpha$).<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk2',
    number: 2,
    type: 'mcq',
    skill: 'Chuyển đổi số đo góc giữa độ và radian',
    points: 0.3,
    text: 'Số đo góc lượng giác $\\alpha = 105^\\circ$ khi đổi sang đơn vị radian bằng:',
    options: [
      { id: 0, text: '$\\dfrac{5\\pi}{12}$', isCorrect: false },
      { id: 1, text: '$\\dfrac{\\pi}{12}$', isCorrect: false },
      { id: 2, text: '$\\dfrac{7\\pi}{12}$', isCorrect: true },
      { id: 3, text: '$\\dfrac{7\\pi}{6}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Sử dụng công thức chuyển đổi số đo góc từ độ sang radian: $$\\alpha = 105 \\times \\dfrac{\\pi}{180} = \\dfrac{105\\pi}{180} = \\dfrac{7\\pi}{12}\\text{ (rad)}$$<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'gk3',
    number: 3,
    type: 'mcq',
    skill: 'Xét dấu các giá trị lượng giác theo góc phần tư',
    points: 0.3,
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\dfrac{\\pi}{2} < \\alpha < \\pi$. Mệnh đề nào sau đây <strong>đúng</strong>?',
    options: [
      { id: 0, text: '$\\sin\\alpha < 0, \\cos\\alpha > 0$', isCorrect: false },
      { id: 1, text: '$\\sin\\alpha > 0, \\cos\\alpha > 0$', isCorrect: false },
      { id: 2, text: '$\\sin\\alpha > 0, \\cos\\alpha < 0$', isCorrect: true },
      { id: 3, text: '$\\sin\\alpha < 0, \\cos\\alpha < 0$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Khi $\\dfrac{\\pi}{2} < \\alpha < \\pi$, điểm biểu diễn $M$ của góc $\\alpha$ nằm ở góc phần tư thứ II trên mặt phẳng $Oxy$. Tại đây, hoành độ $x_M = \\cos\\alpha < 0$ và tung độ $y_M = \\sin\\alpha > 0$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'gk4',
    number: 4,
    type: 'mcq',
    skill: 'Tính giá trị lượng giác khi biết một giá trị lượng giác và khoảng của góc',
    points: 0.3,
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\cos\\alpha = -\\dfrac{3}{5}$ và $90^\\circ < \\alpha < 180^\\circ$. Giá trị của $\\sin\\alpha$ bằng:',
    options: [
      { id: 0, text: '$-\\dfrac{4}{5}$', isCorrect: false },
      { id: 1, text: '$\\dfrac{4}{5}$', isCorrect: true },
      { id: 2, text: '$\\dfrac{16}{25}$', isCorrect: false },
      { id: 3, text: '$-\\dfrac{16}{25}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Vì $90^\\circ < \\alpha < 180^\\circ$ nên điểm biểu diễn góc $\\alpha$ thuộc góc phần tư II, do đó tung độ $\\sin\\alpha > 0$. Áp dụng đẳng thức lượng giác cơ bản $\\sin^2\\alpha + \\cos^2\\alpha = 1$: $$\\sin^2\\alpha = 1 - \\cos^2\\alpha = 1 - \\left(-\\dfrac{3}{5}\\right)^2 = \\dfrac{16}{25}$$ Vì $\\sin\\alpha > 0$ nên $\\sin\\alpha = \\sqrt{\\dfrac{16}{25}} = \\dfrac{4}{5}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk5',
    number: 5,
    type: 'mcq',
    skill: 'Nhận biết các hệ thức lượng giác cơ bản',
    points: 0.3,
    text: 'Trong các khẳng định sau, đẳng thức nào <strong>sai</strong> với mọi góc lượng giác $\\alpha$ làm cho biểu thức có nghĩa?',
    options: [
      { id: 0, text: '$\\sin^2\\alpha + \\cos^2\\alpha = 1$', isCorrect: false },
      { id: 1, text: '$1 + \\tan^2\\alpha = \\dfrac{1}{\\cos^2\\alpha}$', isCorrect: false },
      { id: 2, text: '$1 + \\cot^2\\alpha = \\dfrac{1}{\\sin^2\\alpha}$', isCorrect: false },
      { id: 3, text: '$\\tan\\alpha \\cdot \\cot\\alpha = -1$', isCorrect: true },
    ],
    explanation:
      '<strong>Lời giải:</strong> Đẳng thức đúng theo hệ thức lượng giác cơ bản là $\\tan\\alpha \\cdot \\cot\\alpha = 1$ (khi $\\sin\\alpha \\ne 0$ và $\\cos\\alpha \\ne 0$). Do đó mệnh đề $\\tan\\alpha \\cdot \\cot\\alpha = -1$ là sai.<br><strong>Đáp án đúng: D.</strong>',
  },
  {
    id: 'gk6',
    number: 6,
    type: 'mcq',
    skill: 'Rút gọn biểu thức lượng giác sử dụng tính chất góc liên quan đặc biệt',
    points: 0.3,
    text: 'Rút gọn biểu thức $P = \\sin(\\pi - \\alpha) + \\cos\\left(\\dfrac{\\pi}{2} - \\alpha\\right) - \\sin(-\\alpha)$ ta được:',
    options: [
      { id: 0, text: '$P = \\sin\\alpha$', isCorrect: false },
      { id: 1, text: '$P = 3\\sin\\alpha$', isCorrect: true },
      { id: 2, text: '$P = -\\sin\\alpha$', isCorrect: false },
      { id: 3, text: '$P = \\cos\\alpha$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Áp dụng tính chất giá trị lượng giác của các góc liên quan đặc biệt:<br>- Góc bù: $\\sin(\\pi - \\alpha) = \\sin\\alpha$<br>- Góc phụ: $\\cos\\left(\\dfrac{\\pi}{2} - \\alpha\\right) = \\sin\\alpha$<br>- Góc đối: $\\sin(-\\alpha) = -\\sin\\alpha$<br>Thay vào biểu thức $P$: $$P = \\sin\\alpha + \\sin\\alpha - (-\\sin\\alpha) = 3\\sin\\alpha$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk7',
    number: 7,
    type: 'mcq',
    skill: 'Tính tích sin và cos khi biết tổng sin + cos',
    points: 0.3,
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\sin\\alpha + \\cos\\alpha = \\dfrac{1}{2}$. Giá trị của tích $\\sin\\alpha \\cos\\alpha$ bằng:',
    options: [
      { id: 0, text: '$\\dfrac{3}{8}$', isCorrect: false },
      { id: 1, text: '$-\\dfrac{3}{8}$', isCorrect: true },
      { id: 2, text: '$-\\dfrac{3}{4}$', isCorrect: false },
      { id: 3, text: '$\\dfrac{3}{4}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Bình phương hai vế của đẳng thức $\\sin\\alpha + \\cos\\alpha = \\dfrac{1}{2}$: $$(\\sin\\alpha + \\cos\\alpha)^2 = \\left(\\dfrac{1}{2}\\right)^2 \\iff \\sin^2\\alpha + 2\\sin\\alpha \\cos\\alpha + \\cos^2\\alpha = \\dfrac{1}{4}$$ Vì $\\sin^2\\alpha + \\cos^2\\alpha = 1$ nên: $$1 + 2\\sin\\alpha \\cos\\alpha = \\dfrac{1}{4} \\iff 2\\sin\\alpha \\cos\\alpha = -\\dfrac{3}{4} \\iff \\sin\\alpha \\cos\\alpha = -\\dfrac{3}{8}$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk8',
    number: 8,
    type: 'mcq',
    skill: 'Tính độ dài cung tròn chuyển động quay bánh xe cối xay nước',
    points: 0.3,
    text: 'Một bánh xe cối xay nước nông nghiệp có đường kính $180\\text{ cm}$ quay đều quanh trục với tốc độ $15\\text{ vòng/phút}$. Quãng đường một điểm trên vành bánh xe di chuyển được trong $12\\text{ giây}$ bằng:',
    options: [
      { id: 0, text: '$270\\pi\\text{ cm}$', isCorrect: false },
      { id: 1, text: '$540\\pi\\text{ cm}$', isCorrect: true },
      { id: 2, text: '$180\\pi\\text{ cm}$', isCorrect: false },
      { id: 3, text: '$135\\pi\\text{ cm}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong><br>- Bán kính bánh xe: $R = \\dfrac{180}{2} = 90\\text{ cm}$.<br>- Tốc độ quay: $15\\text{ vòng/phút} = \\dfrac{15}{60} = 0,25\\text{ vòng/giây}$.<br>- Trong $12\\text{ giây}$, bánh xe quay được số vòng là $N = 0,25 \\times 12 = 3\\text{ vòng}$.<br>- Số đo góc quay lượng giác $\\alpha = 3 \\times 2\\pi = 6\\pi\\text{ (rad)}$.<br>- Quãng đường điểm trên vành di chuyển: $l = R \\cdot \\alpha = 90 \\times 6\\pi = 540\\pi\\text{ cm}$.<br><strong>Đáp án đúng: B.</strong>',
  },

  // CHỦ ĐỀ 2: CÔNG THỨC LƯỢNG GIÁC (6 CÂU)
  {
    id: 'gk9',
    number: 9,
    type: 'mcq',
    skill: 'Nhận biết công thức cộng lượng giác cho cosin',
    points: 0.3,
    text: 'Trong các công thức cộng dưới đây, công thức nào <strong>đúng</strong>?',
    options: [
      { id: 0, text: '$\\cos(a-b) = \\cos a \\cos b - \\sin a \\sin b$', isCorrect: false },
      { id: 1, text: '$\\cos(a+b) = \\cos a \\cos b - \\sin a \\sin b$', isCorrect: true },
      { id: 2, text: '$\\sin(a+b) = \\sin a \\cos b - \\cos a \\sin b$', isCorrect: false },
      { id: 3, text: '$\\sin(a-b) = \\sin a \\cos b + \\cos a \\sin b$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Theo công thức cộng đối với cosin của một tổng: $\\cos(a+b) = \\cos a \\cos b - \\sin a \\sin b$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk10',
    number: 10,
    type: 'mcq',
    skill: 'Áp dụng công thức nhân đôi tính cos 2a theo sin a',
    points: 0.3,
    text: 'Biết $\\sin a = \\dfrac{1}{3}$. Giá trị của $\\cos 2a$ bằng:',
    options: [
      { id: 0, text: '$-\\dfrac{7}{9}$', isCorrect: false },
      { id: 1, text: '$\\dfrac{7}{9}$', isCorrect: true },
      { id: 2, text: '$\\dfrac{2}{3}$', isCorrect: false },
      { id: 3, text: '$-\\dfrac{2}{3}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Sử dụng công thức nhân đôi của cosin theo sin: $$\\cos 2a = 1 - 2\\sin^2 a = 1 - 2 \\cdot \\left(\\dfrac{1}{3}\\right)^2 = 1 - \\dfrac{2}{9} = \\dfrac{7}{9}$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk11',
    number: 11,
    type: 'mcq',
    skill: 'Nhận biết công thức biến đổi tích thành tổng cho sin*sin',
    points: 0.3,
    text: 'Khẳng định nào sau đây <strong>đúng</strong> về công thức biến đổi tích thành tổng?',
    options: [
      { id: 0, text: '$\\sin a \\sin b = \\dfrac{1}{2}[\\cos(a-b) - \\cos(a+b)]$', isCorrect: true },
      { id: 1, text: '$\\sin a \\sin b = \\dfrac{1}{2}[\\cos(a-b) + \\cos(a+b)]$', isCorrect: false },
      { id: 2, text: '$\\cos a \\cos b = \\dfrac{1}{2}[\\cos(a-b) - \\cos(a+b)]$', isCorrect: false },
      { id: 3, text: '$\\sin a \\cos b = \\dfrac{1}{2}[\\sin(a-b) - \\sin(a+b)]$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Theo công thức biến đổi tích thành tổng đối với tích hai hàm sin: $$\\sin a \\sin b = \\dfrac{1}{2}[\\cos(a-b) - \\cos(a+b)]$$<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'gk12',
    number: 12,
    type: 'mcq',
    skill: 'Rút gọn phân thức lượng giác bằng công thức biến đổi tổng thành tích',
    points: 0.3,
    text: 'Rút gọn biểu thức $M = \\dfrac{\\sin 3x + \\sin x}{\\cos 3x + \\cos x}$ (với điều kiện biểu thức xác định) ta được:',
    options: [
      { id: 0, text: '$M = \\tan x$', isCorrect: false },
      { id: 1, text: '$M = \\tan 2x$', isCorrect: true },
      { id: 2, text: '$M = \\tan 3x$', isCorrect: false },
      { id: 3, text: '$M = \\cot 2x$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Áp dụng công thức biến đổi tổng thành tích cho tử số và mẫu số:<br>$$\\sin 3x + \\sin x = 2\\sin 2x \\cos x$$<br>$$\\cos 3x + \\cos x = 2\\cos 2x \\cos x$$<br>Do đó: $$M = \\dfrac{2\\sin 2x \\cos x}{2\\cos 2x \\cos x} = \\dfrac{\\sin 2x}{\\cos 2x} = \\tan 2x$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk13',
    number: 13,
    type: 'mcq',
    skill: 'Tính giá trị biểu thức tích hai giá trị cos góc đặc biệt',
    points: 0.3,
    text: 'Không sử dụng máy tính cầm tay, tính giá trị biểu thức $A = \\cos 75^\\circ \\cdot \\cos 15^\\circ$.',
    options: [
      { id: 0, text: '$\\dfrac{1}{2}$', isCorrect: false },
      { id: 1, text: '$\\dfrac{1}{4}$', isCorrect: true },
      { id: 2, text: '$\\dfrac{\\sqrt{3}}{4}$', isCorrect: false },
      { id: 3, text: '$\\dfrac{\\sqrt{3}}{2}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Biến đổi tích thành tổng: $$A = \\cos 75^\\circ \\cos 15^\\circ = \\dfrac{1}{2}[\\cos(75^\\circ - 15^\\circ) + \\cos(75^\\circ + 15^\\circ)] = \\dfrac{1}{2}[\\cos 60^\\circ + \\cos 90^\\circ] = \\dfrac{1}{2}\\left(\\dfrac{1}{2} + 0\\right) = \\dfrac{1}{4}$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk14',
    number: 14,
    type: 'mcq',
    skill: 'Tổng hợp sóng âm lượng giác',
    points: 0.3,
    text: 'Một thiết bị âm thanh nhận hai nguồn tín hiệu sóng âm thuần $f_1(t) = 3\\sin t$ và $f_2(t) = 3\\cos t$ ($t$ là thời gian tính bằng giây). Sóng âm tổng hợp có dạng $f(t) = f_1(t) + f_2(t) = A\\sin(t + \\varphi)$ với $A > 0$ và $-\\pi \\le \\varphi \\le \\pi$. Biên độ âm $A$ và pha ban đầu $\\varphi$ lần lượt bằng:',
    options: [
      { id: 0, text: '$A = 3\\sqrt{2}, \\varphi = \\dfrac{\\pi}{4}$', isCorrect: true },
      { id: 1, text: '$A = 6, \\varphi = \\dfrac{\\pi}{4}$', isCorrect: false },
      { id: 2, text: '$A = 3\\sqrt{2}, \\varphi = -\\dfrac{\\pi}{4}$', isCorrect: false },
      { id: 3, text: '$A = 3, \\varphi = \\dfrac{\\pi}{2}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Biến đổi vế phải bằng công thức cộng: $$f(t) = 3\\sin t + 3\\cos t = 3\\sqrt{2}\\left(\\dfrac{1}{\\sqrt{2}}\\sin t + \\dfrac{1}{\\sqrt{2}}\\cos t\\right) = 3\\sqrt{2}\\sin\\left(t + \\dfrac{\\pi}{4}\\right)$$ Đối chiếu với dạng $f(t) = A\\sin(t + \\varphi) \\implies A = 3\\sqrt{2}$ và $\\varphi = \\dfrac{\\pi}{4}$.<br><strong>Đáp án đúng: A.</strong>',
  },

  // CHỦ ĐỀ 3: HÀM SỐ LƯỢNG GIÁC (7 CÂU)
  {
    id: 'gk15',
    number: 15,
    type: 'mcq',
    skill: 'Tìm tập xác định của hàm số tang',
    points: 0.3,
    text: 'Tập xác định $D$ của hàm số $y = \\tan\\left(x - \\dfrac{\\pi}{3}\\right)$ là:',
    options: [
      { id: 0, text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{\\pi}{3} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: false },
      { id: 1, text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{5\\pi}{6} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: true },
      { id: 2, text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{5\\pi}{6} + k2\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: false },
      { id: 3, text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{\\pi}{2} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Hàm số $y = \\tan\\left(x - \\dfrac{\\pi}{3}\\right)$ xác định khi và chỉ khi: $$x - \\dfrac{\\pi}{3} \\ne \\dfrac{\\pi}{2} + k\\pi \\iff x \\ne \\dfrac{5\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk16',
    number: 16,
    type: 'mcq',
    skill: 'Tìm tập giá trị của hàm số lượng giác dạng bậc nhất theo sin',
    points: 0.3,
    text: 'Tập giá trị $T$ của hàm số $y = 2\\sin\\left(x + \\dfrac{\\pi}{4}\\right) - 3$ là:',
    options: [
      { id: 0, text: '$T = [-2; 2]$', isCorrect: false },
      { id: 1, text: '$T = [-5; -1]$', isCorrect: true },
      { id: 2, text: '$T = [-1; 5]$', isCorrect: false },
      { id: 3, text: '$T = [-3; 2]$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Với mọi $x \\in \\mathbb{R}$, ta có $-1 \\le \\sin\\left(x + \\dfrac{\\pi}{4}\right) \\le 1 \\implies -2 \\le 2\\sin\\left(x + \\dfrac{\\pi}{4}\right) \\le 2 \\implies -5 \\le y \\le -1$. Do đó tập giá trị của hàm số là $T = [-5; -1]$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk17',
    number: 17,
    type: 'mcq',
    skill: 'Xét tính chẵn, lẻ của hàm số lượng giác',
    points: 0.3,
    text: 'Hàm số nào dưới đây là hàm số chẵn trên tập xác định của nó?',
    options: [
      { id: 0, text: '$y = \\sin x$', isCorrect: false },
      { id: 1, text: '$y = x \\sin x$', isCorrect: true },
      { id: 2, text: '$y = \\tan x$', isCorrect: false },
      { id: 3, text: '$y = \\sin x \\cdot \\cos 2x$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Xét $f(x) = x \\sin x$ có tập xác định $D = \\mathbb{R}$. Với mọi $x \\in \\mathbb{R}$: $$f(-x) = (-x)\\sin(-x) = (-x)(-\\sin x) = x \\sin x = f(x)$$ Do đó $y = x \\sin x$ là hàm số chẵn.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk18',
    number: 18,
    type: 'mcq',
    skill: 'Tìm chu kỳ tuần hoàn của hàm số cos(ax+b)',
    points: 0.3,
    text: 'Chu kỳ tuần hoàn $T$ của hàm số $y = \\cos\\left(2x - \\dfrac{\\pi}{4}\\right)$ bằng:',
    options: [
      { id: 0, text: '$T = 2\\pi$', isCorrect: false },
      { id: 1, text: '$T = \\pi$', isCorrect: true },
      { id: 2, text: '$T = \\dfrac{\\pi}{2}$', isCorrect: false },
      { id: 3, text: '$T = 4\\pi$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Hàm số $y = \\cos(ax + b)$ tuần hoàn với chu kỳ $T = \\dfrac{2\\pi}{|a|}$. Áp dụng với $a = 2 \\implies T = \\dfrac{2\\pi}{2} = \\pi$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk19',
    number: 19,
    type: 'mcq',
    skill: 'Khảo sát tính đơn điệu của hàm số lượng giác y = sin x',
    points: 0.3,
    text: 'Mệnh đề nào sau đây <strong>đúng</strong> khi nói về sự biến thiên của hàm số $y = \\sin x$?',
    options: [
      { id: 0, text: 'Đồng biến trên khoảng $\\left(0; \\dfrac{\\pi}{2}\\right)$ và nghịch biến trên khoảng $\\left(\\dfrac{\\pi}{2}; \\pi\\right)$', isCorrect: true },
      { id: 1, text: 'Nghịch biến trên khoảng $\\left(0; \\dfrac{\\pi}{2}\\right)$ và đồng biến trên khoảng $\\left(\\dfrac{\\pi}{2}; \\pi\\right)$', isCorrect: false },
      { id: 2, text: 'Đồng biến trên toàn bộ khoảng $(0; \\pi)$', isCorrect: false },
      { id: 3, text: 'Nghịch biến trên toàn bộ khoảng $(0; \\pi)$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Dựa vào đồ thị hàm số $y = \\sin x$: khi $x$ tăng từ $0$ đến $\\dfrac{\\pi}{2}$ thì $\\sin x$ tăng từ $0$ lên $1$ (đồng biến); khi $x$ tăng từ $\\dfrac{\\pi}{2}$ đến $\\pi$ thì $\\sin x$ giảm từ $1$ xuống $0$ (nghịch biến).<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'gk20',
    number: 20,
    type: 'mcq',
    skill: 'Tìm giá trị lớn nhất, nhỏ nhất của hàm số lượng giác quy về bậc hai',
    points: 0.3,
    text: 'Giá trị lớn nhất $M$ và giá trị nhỏ nhất $m$ của hàm số $y = 2\\cos^2 x + 2\\sin x + 1$ là:',
    options: [
      { id: 0, text: '$M = 4, m = -1$', isCorrect: false },
      { id: 1, text: '$M = 3,5, m = -1$', isCorrect: true },
      { id: 2, text: '$M = 3,5, m = 1$', isCorrect: false },
      { id: 3, text: '$M = 3, m = -1$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Biến đổi hàm số theo $\\sin x$: $$y = 2(1 - \\sin^2 x) + 2\\sin x + 1 = -2\\sin^2 x + 2\\sin x + 3$$ Đặt $t = \\sin x$ với $t \\in [-1; 1]$. Khảo sát tam thức $g(t) = -2t^2 + 2t + 3$ trên $[-1; 1]$:<br>- Đỉnh parabol $t_0 = \\dfrac{1}{2} \\in [-1; 1] \\implies g\\left(\\dfrac{1}{2}\\right) = 3,5$.<br>- Biên: $g(-1) = -1$; $g(1) = 3$.<br>Do đó $M = 3,5$ và $m = -1$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk21',
    number: 21,
    type: 'mcq',
    skill: 'Mô hình hóa bài toán dao động thủy triều bằng hàm số lượng giác',
    points: 0.3,
    text: 'Mực nước biển tại một trạm quan trắc phụ thuộc thời gian $t$ (giờ, $0 \\le t \\le 24$) trong ngày được mô hình hóa bởi hàm số $h(t) = 2,5\\cos\\left(\\dfrac{\\pi t}{6}\\right) + 10$ (mét). Mực nước biển đạt giá trị cao nhất bằng bao nhiêu mét và vào thời điểm mấy giờ?',
    options: [
      { id: 0, text: '$10\\text{ m}$ vào lúc $6\\text{ giờ}$ và $18\\text{ giờ}$', isCorrect: false },
      { id: 1, text: '$12,5\\text{ m}$ vào lúc $0\\text{ giờ}, 12\\text{ giờ}$ và $24\\text{ giờ}$', isCorrect: true },
      { id: 2, text: '$12,5\\text{ m}$ vào lúc $6\\text{ giờ}$ và $18\\text{ giờ}$', isCorrect: false },
      { id: 3, text: '$10\\text{ m}$ vào lúc $12\\text{ giờ}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Vì $-1 \\le \\cos\\left(\\dfrac{\\pi t}{6}\\right) \\le 1$ nên $h(t) \\le 2,5(1) + 10 = 12,5\\text{ m}$. Đạt giá trị lớn nhất khi $\\cos\\left(\\dfrac{\\pi t}{6}\\right) = 1 \\iff \\dfrac{\\pi t}{6} = k2\\pi \\iff t = 12k$. Với $0 \\le t \\le 24 \\implies t \\in \\{0; 12; 24\\}$ (tức lúc $0$ giờ, $12$ giờ trưa và $24$ giờ đêm).<br><strong>Đáp án đúng: B.</strong>',
  },

  // CHỦ ĐỀ 4: PHƯƠNG TRÌNH LƯỢNG GIÁC CƠ BẢN (9 CÂU)
  {
    id: 'gk22',
    number: 22,
    type: 'mcq',
    skill: 'Điều kiện có nghiệm của phương trình sin x = m',
    points: 0.3,
    text: 'Phương trình lượng giác $\\sin x = m$ (với $m$ là tham số thực) có nghiệm khi và chỉ khi:',
    options: [
      { id: 0, text: '$m \\in (-1; 1)$', isCorrect: false },
      { id: 1, text: '$m \\in [-1; 1]$', isCorrect: true },
      { id: 2, text: '$m \\in \\mathbb{R}$', isCorrect: false },
      { id: 3, text: '$m \\ge 0$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Vì tập giá trị của hàm số $y = \\sin x$ là $[-1; 1]$ nên phương trình $\\sin x = m$ có nghiệm khi và chỉ khi $-1 \\le m \\le 1$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk23',
    number: 23,
    type: 'mcq',
    skill: 'Công thức nghiệm cơ bản của phương trình sin',
    points: 0.3,
    text: 'Tất cả các nghiệm của phương trình $\\sin x = \\sin\\dfrac{\\pi}{6}$ là:',
    options: [
      { id: 0, text: '$\\left[\\begin{array}{l} x = \\dfrac{\\pi}{6} + k2\\pi \\\\ x = \\dfrac{5\\pi}{6} + k2\\pi \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$', isCorrect: true },
      { id: 1, text: '$\\left[\\begin{array}{l} x = \\dfrac{\\pi}{6} + k2\\pi \\\\ x = -\\dfrac{\\pi}{6} + k2\\pi \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
      { id: 2, text: '$x = \\pm \\dfrac{\\pi}{6} + k2\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
      { id: 3, text: '$x = \\dfrac{\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Theo công thức nghiệm phương trình sin cơ bản: $$\\sin x = \\sin\\alpha \\iff \\left[\\begin{array}{l} x = \\alpha + k2\\pi \\\\ x = \\pi - \\alpha + k2\\pi \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$$ Với $\\alpha = \\dfrac{\\pi}{6} \\implies x = \\dfrac{\\pi}{6} + k2\\pi$ hoặc $x = \\pi - \\dfrac{\\pi}{6} + k2\\pi = \\dfrac{5\\pi}{6} + k2\\pi$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'gk24',
    number: 24,
    type: 'mcq',
    skill: 'Giải phương trình tang cơ bản',
    points: 0.3,
    text: 'Tất cả các nghiệm của phương trình $\\tan x = \\sqrt{3}$ là:',
    options: [
      { id: 0, text: '$x = \\dfrac{\\pi}{3} + k2\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
      { id: 1, text: '$x = \\dfrac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: true },
      { id: 2, text: '$x = \\dfrac{\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
      { id: 3, text: '$x = \\pm \\dfrac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Ta có $\\tan x = \\sqrt{3} = \\tan\\dfrac{\\pi}{3} \\iff x = \\dfrac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk25',
    number: 25,
    type: 'mcq',
    skill: 'Giải phương trình cos(ax+b) = 0',
    points: 0.3,
    text: 'Tập nghiệm của phương trình $\\cos\\left(2x - \\dfrac{\\pi}{4}\\right) = 0$ là:',
    options: [
      { id: 0, text: '$S = \\left\\{\\dfrac{\\pi}{8} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: false },
      { id: 1, text: '$S = \\left\\{\\dfrac{3\\pi}{8} + \\dfrac{k\\pi}{2} \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: true },
      { id: 2, text: '$S = \\left\\{\\dfrac{3\\pi}{8} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: false },
      { id: 3, text: '$S = \\left\\{\\dfrac{\\pi}{4} + \\dfrac{k\\pi}{2} \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> $$\\cos\\left(2x - \\dfrac{\\pi}{4}\\right) = 0 \\iff 2x - \\dfrac{\\pi}{4} = \\dfrac{\\pi}{2} + k\\pi \\iff 2x = \\dfrac{3\\pi}{4} + k\\pi \\iff x = \\dfrac{3\\pi}{8} + \\dfrac{k\\pi}{2} \\quad (k \\in \\mathbb{Z})$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk26',
    number: 26,
    type: 'mcq',
    skill: 'Giải phương trình sin 2x = sin x',
    points: 0.3,
    text: 'Nghiệm của phương trình $\\sin 2x = \\sin x$ là:',
    options: [
      { id: 0, text: '$x = k2\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
      { id: 1, text: '$\\left[\\begin{array}{l} x = k2\\pi \\\\ x = \\dfrac{\\pi}{3} + \\dfrac{k2\\pi}{3} \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$', isCorrect: true },
      { id: 2, text: '$x = \\dfrac{\\pi}{3} + k2\\pi \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
      { id: 3, text: '$\\left[\\begin{array}{l} x = k\\pi \\\\ x = \\dfrac{\\pi}{3} + k\\pi \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> $$\\sin 2x = \\sin x \\iff \\left[\\begin{array}{l} 2x = x + k2\\pi \\\\ 2x = \\pi - x + k2\\pi \\end{array}\\right. \\iff \\left[\\begin{array}{l} x = k2\\pi \\\\ 3x = \\pi + k2\\pi \\end{array}\\right. \\iff \\left[\\begin{array}{l} x = k2\\pi \\\\ x = \\dfrac{\\pi}{3} + \\dfrac{k2\\pi}{3} \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk27',
    number: 27,
    type: 'mcq',
    skill: 'Tìm số nghiệm của phương trình cos trên đoạn',
    points: 0.3,
    text: 'Số nghiệm của phương trình $\\cos x = -\\dfrac{1}{2}$ trên đoạn $[0; 2\\pi]$ là:',
    options: [
      { id: 0, text: '$1$', isCorrect: false },
      { id: 1, text: '$2$', isCorrect: true },
      { id: 2, text: '$3$', isCorrect: false },
      { id: 3, text: '$4$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Phương trình tương đương $\\cos x = \\cos\\dfrac{2\\pi}{3} \\iff x = \\pm \\dfrac{2\\pi}{3} + k2\\pi \\quad (k \\in \\mathbb{Z})$. Xét $x \\in [0; 2\\pi]$: chọn $k = 0 \\Rightarrow x_1 = \\dfrac{2\\pi}{3}$; chọn $k = 1 \\Rightarrow x_2 = \\dfrac{4\\pi}{3}$. Vậy phương trình có $2$ nghiệm phân biệt trên đoạn $[0; 2\\pi]$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk28',
    number: 28,
    type: 'mcq',
    skill: 'Tính tổng nghiệm của phương trình tan trên khoảng',
    points: 0.3,
    text: 'Tổng tất cả các nghiệm của phương trình $\\sqrt{3}\\tan x - 1 = 0$ thuộc khoảng $(0; 2\\pi)$ bằng:',
    options: [
      { id: 0, text: '$\\dfrac{\\pi}{6}$', isCorrect: false },
      { id: 1, text: '$\\dfrac{7\\pi}{6}$', isCorrect: false },
      { id: 2, text: '$\\dfrac{4\\pi}{3}$', isCorrect: true },
      { id: 3, text: '$\\dfrac{3\\pi}{2}$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> $\\tan x = \\dfrac{1}{\\sqrt{3}} \\iff x = \\dfrac{\\pi}{6} + k\\pi$. Với $x \\in (0; 2\\pi)$ ta có $x_1 = \\dfrac{\\pi}{6}$ và $x_2 = \\dfrac{7\\pi}{6}$. Tổng hai nghiệm là $\\dfrac{\\pi}{6} + \\dfrac{7\\pi}{6} = \\dfrac{4\\pi}{3}$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'gk29',
    number: 29,
    type: 'mcq',
    skill: 'Biểu diễn nghiệm phương trình lượng giác có điều kiện trên đường tròn',
    points: 0.3,
    text: 'Số điểm biểu diễn các nghiệm của phương trình $\\dfrac{\\sin 2x}{\\cos x} = 0$ trên đường tròn lượng giác là:',
    options: [
      { id: 0, text: '$1$', isCorrect: false },
      { id: 1, text: '$2$', isCorrect: true },
      { id: 2, text: '$3$', isCorrect: false },
      { id: 3, text: '$4$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Điều kiện xác định: $\\cos x \\ne 0 \\iff x \\ne \\dfrac{\\pi}{2} + k\\pi$. Khi đó $\\sin 2x = 0 \\iff 2\\sin x \\cos x = 0 \\iff \\sin x = 0 \\iff x = k\\pi$. Các nghiệm $x = k\\pi$ thỏa mãn điều kiện và được biểu diễn bởi đúng 2 điểm phân biệt là $(1; 0)$ và $(-1; 0)$ trên đường tròn lượng giác.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk30',
    number: 30,
    type: 'mcq',
    skill: 'Tìm tham số m để phương trình lượng giác có nghiệm duy nhất trên khoảng',
    points: 0.3,
    text: 'Tìm tất cả các giá trị thực của tham số $m$ để phương trình $\\cos x = m + 1$ có đúng một nghiệm thuộc khoảng $\\left(0; \\dfrac{\\pi}{2}\\right)$.',
    options: [
      { id: 0, text: '$-1 < m < 1$', isCorrect: false },
      { id: 1, text: '$-1 < m < 0$', isCorrect: true },
      { id: 2, text: '$0 < m < 1$', isCorrect: false },
      { id: 3, text: '$-1 \\le m \\le 0$', isCorrect: false },
    ],
    explanation:
      '<strong>Lời giải:</strong> Với mọi $x \\in \\left(0; \\dfrac{\\pi}{2}\\right)$, ta có $0 < \\cos x < 1$. Do đó phương trình có nghiệm duy nhất thuộc khoảng khi và chỉ khi: $$0 < m + 1 < 1 \\iff -1 < m < 0$$<br><strong>Đáp án đúng: B.</strong>',
  },
];

// PHẦN II. TỰ LUẬN (1 CÂU GỒM 2 Ý: a & b - TỔNG 1,0 ĐIỂM)
const SHORTANS_QUESTIONS_GK1_TOAN11: QuestionShortAns[] = [
  {
    id: 'gk31a',
    number: 31,
    subLabel: 'Ý a',
    type: 'shortans',
    skill: 'Tính giá trị hàm số lượng giác trong mô hình chuyển động đu quay Sun Wheel',
    points: 0.5,
    text: '<strong>Bài toán mô hình hóa cabin đu quay Sun Wheel:</strong><br>Một cabin đu quay Sun Wheel có bán kính $R = 30\\text{ m}$ quay đều với chu kỳ $12\\text{ phút}$. Trục quay $O$ được đặt ở độ cao $32\\text{ m}$ so với mặt đất. Chiều cao $h$ (mét) của cabin so với mặt đất tại thời điểm $t$ (phút) kể từ khi vòng quay bắt đầu vận hành từ vị trí thấp nhất $A_0(0; -30)$ được mô hình hóa bởi công thức: $$h(t) = 32 - 30\\cos\\left(\\dfrac{\\pi t}{6}\\right)$$<br><strong>Ý a) (0,5 điểm):</strong> Tính chiều cao của cabin so với mặt đất ở thời điểm $t = 3\\text{ phút}$.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'h(3) = 32 m (hoặc 32)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('32');
    },
    explanation:
      '<strong>Lời giải chi tiết Ý a (0,5 điểm):</strong><br>- Tại thời điểm $t = 3\\text{ phút}$, thay $t = 3$ vào công thức chiều cao $h(t)$: $$h(3) = 32 - 30\\cos\\left(\\dfrac{\\pi \\cdot 3}{6}\\right) = 32 - 30\\cos\\left(\\dfrac{\\pi}{2}\\right)$$ (0,25đ)<br>- Vì $\\cos\\left(\\dfrac{\\pi}{2}\\right) = 0$ nên $h(3) = 32 - 30(0) = 32\\text{ (m)}$. Vậy ở thời điểm $t = 3\\text{ phút}$, cabin ở độ cao $32\\text{ m}$ so với mặt đất (ngang với độ cao của trục quay $O$). (0,25đ)',
  },
  {
    id: 'gk31b',
    number: 31,
    subLabel: 'Ý b',
    type: 'shortans',
    skill: 'Giải phương trình lượng giác tìm thời điểm đạt độ cao trong vòng quay đầu tiên',
    points: 0.5,
    text: '<strong>Ý b) (0,5 điểm):</strong> Trong vòng quay đầu tiên ($0 \\le t \\le 12\\text{ phút}$), xác định tất cả các thời điểm $t$ để cabin ở độ cao đúng $47\\text{ m}$ so với mặt đất.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 't = 4 phút và t = 8 phút (hoặc 4; 8)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('4') && clean.includes('8');
    },
    explanation:
      '<strong>Lời giải chi tiết Ý b (0,5 điểm):</strong><br>- Cabin đạt độ cao $47\\text{ m} \\iff h(t) = 47 \\iff 32 - 30\\cos\\left(\\dfrac{\\pi t}{6}\\right) = 47 \\iff \\cos\\left(\\dfrac{\\pi t}{6}\\right) = -\\dfrac{1}{2}$. (0,25đ)<br>- Giải phương trình: $$\\dfrac{\\pi t}{6} = \\pm \\dfrac{2\\pi}{3} + k2\\pi \\iff t = \\pm 4 + 12k \\quad (k \\in \\mathbb{Z})$$<br>- Xét trong vòng quay đầu tiên ($0 \\le t \\le 12\\text{ phút}$):<br>  + Nhánh $t = 4 + 12k$ với $k = 0 \\implies t = 4\\text{ phút}$ (đang đi lên).<br>  + Nhánh $t = -4 + 12k$ với $k = 1 \\implies t = 8\\text{ phút}$ (đang đi xuống).<br>Vậy trong vòng quay đầu tiên, cabin ở độ cao $47\\text{ m}$ tại hai thời điểm $t = 4\\text{ phút}$ và $t = 8\\text{ phút}$. (0,25đ)',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan11GiuaKy1LuongGiac90pPage() {
  // 1. STATE THÔNG TIN HỌC SINH
  const [tenHocSinh, setTenHocSinh] = useState<string>('');
  const [maHocSinh, setMaHocSinh] = useState<string>('');
  const [lopNhom, setLopNhom] = useState<string>('');

  // 2. STATE LÀM BÀI & TRẢ LỜI
  // mcqAnswers lưu id gốc của OptionItem được chọn
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State lưu danh sách câu hỏi trắc nghiệm đã xáo trộn phương án (Fisher-Yates)
  const [shuffledMCQQuestions, setShuffledMCQQuestions] = useState<QuestionMCQ[]>(() =>
    MCQ_QUESTIONS_GK1_TOAN11.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ ...opt })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS_GK1_TOAN11.map((q) => ({
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
    MCQ_QUESTIONS_GK1_TOAN11.length + SHORTANS_QUESTIONS_GK1_TOAN11.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 5. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  // Chấm điểm BẤT BIẾN theo trường isCorrect và ID gốc của đáp án
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS11-GK1-90P';
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

    MCQ_QUESTIONS_GK1_TOAN11.forEach((q) => {
      const studentSelectedId = mcqAnswers[q.id];
      const chosenOption = q.options.find((opt) => opt.id === studentSelectedId);
      const isCorrect = chosenOption ? chosenOption.isCorrect : false;

      if (isCorrect) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm tự luận (2 ý x 0.5đ = 1.0đ)
    SHORTANS_QUESTIONS_GK1_TOAN11.forEach((q) => {
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
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS_GK1_TOAN11.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_GK1_TOAN11.length}`,
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
        Task_ID: 'KIEM_TRA_GIUA_KY_1_TOAN_11_LUONG_GIAC_90P',
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

      const reshuffled = MCQ_QUESTIONS_GK1_TOAN11.map((q) => ({
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
                placeholder="VD: HS11-001"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS11-GK1-90P'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '11'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Trắc nghiệm: <strong>{soCauDungMCQ}/{MCQ_QUESTIONS_GK1_TOAN11.length}</strong> câu đúng</span>
                  <span>Tự luận: <strong>{soCauDungShort}/{SHORTANS_QUESTIONS_GK1_TOAN11.length}</strong> ý đúng</span>
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
              const selectedOptId = mcqAnswers[q.id];
              const chosenOption = q.options.find((opt) => opt.id === selectedOptId);
              const isCorrect = chosenOption ? chosenOption.isCorrect : false;

              return (
                <div
                  key={q.id}
                  id={`cau-${q.number}`}
                  className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : selectedOptId !== undefined
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-amber-300 bg-amber-50/20'
                      : selectedOptId !== undefined
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

                    {/* Hiển thị kết quả khi đã submit */}
                    {isSubmitted && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isCorrect ? '✓ Đúng (+0.3đ)' : '✕ Sai (+0.0đ)'}
                      </span>
                    )}
                  </div>

                  {/* Nội dung câu hỏi (Bọc trong MathContent) */}
                  <MathContent
                    content={q.text}
                    className="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mb-4"
                  />

                  {/* Danh sách 4 phương án (Đã xáo trộn Object theo Fisher-Yates) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, displayIndex) => {
                      const displayLabel = ['A', 'B', 'C', 'D'][displayIndex];
                      const isOptionSelected = selectedOptId === opt.id;
                      const isOptionCorrect = opt.isCorrect;

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
                          key={opt.id}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() =>
                            setMcqAnswers((prev) => ({
                              ...prev,
                              [q.id]: opt.id,
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

                  {/* Lời giải chi tiết sau khi nộp (Có đủ overflow-x-auto whitespace-pre-wrap break-words) */}
                  {isSubmitted && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm bg-slate-50/80 p-3.5 rounded-xl text-slate-700 overflow-x-auto whitespace-pre-wrap break-words">
                      <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                        <span className="text-sky-600">💡</span> Lời giải chi tiết:
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
            {SHORTANS_QUESTIONS_GK1_TOAN11.map((q) => {
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
