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
// DỮ LIỆU ĐỀ THI TOÁN 11 - CHƯƠNG I: HÀM SỐ LƯỢNG GIÁC VÀ PHƯƠNG TRÌNH LƯỢNG GIÁC
// ==========================================

// PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (30 CÂU - 9,0 ĐIỂM, 0.3Đ/CÂU)
const MCQ_QUESTIONS_LUONG_GIAC_CH1: QuestionMCQ[] = [
  // CHỦ ĐỀ 1: GIÁ TRỊ LƯỢNG GIÁC CỦA GÓC LƯỢNG GIÁC (8 CÂU)
  {
    id: 'lg1',
    number: 1,
    type: 'mcq',
    skill: 'Định nghĩa giá trị lượng giác trên đường tròn lượng giác',
    points: 0.3,
    text: 'Trên mặt phẳng tọa độ $Oxy$, cho đường tròn lượng giác tâm $O$ bán kính $R=1$ với điểm gốc $A(1;0)$. Mỗi góc lượng giác $\\alpha$ xác định duy nhất một điểm $M(x_M; y_M)$ trên đường tròn lượng giác. Khẳng định nào sau đây <strong>đúng</strong>?',
    options: [
      { key: 'A', text: '$\\sin\\alpha = x_M$' },
      { key: 'B', text: '$\\cos\\alpha = x_M$' },
      { key: 'C', text: '$\\tan\\alpha = \\dfrac{x_M}{y_M}$' },
      { key: 'D', text: '$\\cot\\alpha = \\dfrac{y_M}{x_M}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo định nghĩa giá trị lượng giác của góc lượng giác trên đường tròn lượng giác, hoành độ $x_M$ của điểm $M$ là $\\cos\\alpha$ ($x_M = \\cos\\alpha$) và tung độ $y_M$ của điểm $M$ là $\\sin\\alpha$ ($y_M = \\sin\\alpha$).<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg2',
    number: 2,
    type: 'mcq',
    skill: 'Chuyển đổi số đo góc giữa độ và radian',
    points: 0.3,
    text: 'Số đo góc lượng giác $\\alpha = 105^\\circ$ khi đổi sang đơn vị radian bằng:',
    options: [
      { key: 'A', text: '$\\dfrac{5\\pi}{12}$' },
      { key: 'B', text: '$\\dfrac{\\pi}{12}$' },
      { key: 'C', text: '$\\dfrac{7\\pi}{12}$' },
      { key: 'D', text: '$\\dfrac{7\\pi}{6}$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Sử dụng công thức chuyển đổi số đo góc từ độ sang radian: $$\\alpha = 105 \\times \\dfrac{\\pi}{180} = \\dfrac{105\\pi}{180} = \\dfrac{7\\pi}{12}\\text{ (rad)}$$<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'lg3',
    number: 3,
    type: 'mcq',
    skill: 'Dấu của các giá trị lượng giác theo góc phần tư',
    points: 0.3,
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\dfrac{\\pi}{2} < \\alpha < \\pi$. Mệnh đề nào sau đây <strong>đúng</strong>?',
    options: [
      { key: 'A', text: '$\\sin\\alpha < 0, \\cos\\alpha > 0$' },
      { key: 'B', text: '$\\sin\\alpha > 0, \\cos\\alpha > 0$' },
      { key: 'C', text: '$\\sin\\alpha > 0, \\cos\\alpha < 0$' },
      { key: 'D', text: '$\\sin\\alpha < 0, \\cos\\alpha < 0$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Khi $\\dfrac{\\pi}{2} < \\alpha < \\pi$, điểm biểu diễn $M$ của góc $\\alpha$ nằm ở góc phần tư thứ II trên mặt phẳng $Oxy$. Tại đây, hoành độ $x_M = \\cos\\alpha < 0$ và tung độ $y_M = \\sin\\alpha > 0$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'lg4',
    number: 4,
    type: 'mcq',
    skill: 'Tính giá trị lượng giác cơ bản khi biết một giá trị lượng giác',
    points: 0.3,
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\cos\\alpha = -\\dfrac{3}{5}$ và $90^\\circ < \\alpha < 180^\\circ$. Giá trị của $\\sin\\alpha$ bằng:',
    options: [
      { key: 'A', text: '$-\\dfrac{4}{5}$' },
      { key: 'B', text: '$\\dfrac{4}{5}$' },
      { key: 'C', text: '$\\dfrac{16}{25}$' },
      { key: 'D', text: '$-\\dfrac{16}{25}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vì $90^\\circ < \\alpha < 180^\\circ$ nên điểm biểu diễn góc $\\alpha$ thuộc góc phần tư II, do đó tung độ $\\sin\\alpha > 0$. Áp dụng đẳng thức lượng giác cơ bản $\\sin^2\\alpha + \\cos^2\\alpha = 1$: $$\\sin^2\\alpha = 1 - \\cos^2\\alpha = 1 - \\left(-\\dfrac{3}{5}\\right)^2 = \\dfrac{16}{25}$$ Vì $\\sin\\alpha > 0$ nên $\\sin\\alpha = \\sqrt{\\dfrac{16}{25}} = \\dfrac{4}{5}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg5',
    number: 5,
    type: 'mcq',
    skill: 'Các hằng đẳng thức lượng giác cơ bản',
    points: 0.3,
    text: 'Trong các khẳng định sau, đẳng thức nào <strong>sai</strong> với mọi góc lượng giác $\\alpha$ làm cho biểu thức có nghĩa?',
    options: [
      { key: 'A', text: '$\\sin^2\\alpha + \\cos^2\\alpha = 1$' },
      { key: 'B', text: '$1 + \\tan^2\\alpha = \\dfrac{1}{\\cos^2\\alpha}$' },
      { key: 'C', text: '$1 + \\cot^2\\alpha = \\dfrac{1}{\\sin^2\\alpha}$' },
      { key: 'D', text: '$\\tan\\alpha \\cdot \\cot\\alpha = -1$' },
    ],
    correct: 'D',
    explanation:
      '<strong>Lời giải:</strong> Đẳng thức đúng theo hệ thức lượng giác cơ bản là $\\tan\\alpha \\cdot \\cot\\alpha = 1$ (khi $\\sin\\alpha \\ne 0$ và $\\cos\\alpha \\ne 0$). Do đó mệnh đề $\\tan\\alpha \\cdot \\cot\\alpha = -1$ là sai.<br><strong>Đáp án đúng: D.</strong>',
  },
  {
    id: 'lg6',
    number: 6,
    type: 'mcq',
    skill: 'Giá trị lượng giác của các góc liên quan đặc biệt',
    points: 0.3,
    text: 'Rút gọn biểu thức $P = \\sin(\\pi - \\alpha) + \\cos\\left(\\dfrac{\\pi}{2} - \\alpha\\right) - \\sin(-\\alpha)$ ta được:',
    options: [
      { key: 'A', text: '$P = \\sin\\alpha$' },
      { key: 'B', text: '$P = 3\\sin\\alpha$' },
      { key: 'C', text: '$P = -\\sin\\alpha$' },
      { key: 'D', text: '$P = \\cos\\alpha$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng tính chất giá trị lượng giác của các góc liên quan đặc biệt:<br>- Góc bù: $\\sin(\\pi - \\alpha) = \\sin\\alpha$<br>- Góc phụ: $\\cos\\left(\\dfrac{\\pi}{2} - \\alpha\\right) = \\sin\\alpha$<br>- Góc đối: $\\sin(-\\alpha) = -\\sin\\alpha$<br>Thay vào biểu thức $P$: $$P = \\sin\\alpha + \\sin\\alpha - (-\\sin\\alpha) = 3\\sin\\alpha$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg7',
    number: 7,
    type: 'mcq',
    skill: 'Biến đổi biểu thức đối xứng giữa sin và cos',
    points: 0.3,
    text: 'Cho góc lượng giác $\\alpha$ thỏa mãn $\\sin\\alpha + \\cos\\alpha = \\dfrac{1}{2}$. Giá trị của tích $\\sin\\alpha \\cos\\alpha$ bằng:',
    options: [
      { key: 'A', text: '$\\dfrac{3}{8}$' },
      { key: 'B', text: '$-\\dfrac{3}{8}$' },
      { key: 'C', text: '$-\\dfrac{3}{4}$' },
      { key: 'D', text: '$\\dfrac{3}{4}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Bình phương hai vế của đẳng thức $\\sin\\alpha + \\cos\\alpha = \\dfrac{1}{2}$: $$(\\sin\\alpha + \\cos\\alpha)^2 = \\left(\\dfrac{1}{2}\\right)^2 \\Leftrightarrow \\sin^2\\alpha + 2\\sin\\alpha \\cos\\alpha + \\cos^2\\alpha = \\dfrac{1}{4}$$ Vì $\\sin^2\\alpha + \\cos^2\\alpha = 1$ nên: $$1 + 2\\sin\\alpha \\cos\\alpha = \\dfrac{1}{4} \\Leftrightarrow 2\\sin\\alpha \\cos\\alpha = -\\dfrac{3}{4} \\Leftrightarrow \\sin\\alpha \\cos\\alpha = -\\dfrac{3}{8}$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg8',
    number: 8,
    type: 'mcq',
    skill: 'Ứng dụng độ dài cung và tốc độ góc trên đường tròn',
    points: 0.3,
    text: 'Một bánh xe cối xay nước nông nghiệp có đường kính $180\\text{ cm}$ quay đều quanh trục với tốc độ $15\\text{ vòng/phút}$. Quãng đường một điểm trên vành bánh xe di chuyển được trong $12\\text{ giây}$ bằng:',
    options: [
      { key: 'A', text: '$270\\pi\\text{ cm}$' },
      { key: 'B', text: '$180\\pi\\text{ cm}$' },
      { key: 'C', text: '$540\\pi\\text{ cm}$' },
      { key: 'D', text: '$135\\pi\\text{ cm}$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong><br>- Bán kính bánh xe: $R = \\dfrac{180}{2} = 90\\text{ cm}$.<br>- Tốc độ góc: bánh xe quay $15\\text{ vòng/phút} = \\dfrac{15}{60} = 0,25\\text{ vòng/giây}$.<br>- Trong $12\\text{ giây}$, bánh xe quay được số vòng là $N = 0,25 \\times 12 = 3\\text{ vòng}$.<br>- Số đo góc quay lượng giác $\\alpha = 3 \\times 2\\pi = 6\\pi\\text{ (rad)}$.<br>- Quãng đường điểm trên vành di chuyển: $l = R \\cdot \\alpha = 90 \\times 6\\pi = 540\\pi\\text{ cm}$.<br><strong>Đáp án đúng: C.</strong>',
  },

  // CHỦ ĐỀ 2: CÔNG THỨC LƯỢNG GIÁC (6 CÂU)
  {
    id: 'lg9',
    number: 9,
    type: 'mcq',
    skill: 'Công thức cộng lượng giác',
    points: 0.3,
    text: 'Trong các công thức cộng dưới đây, công thức nào <strong>đúng</strong>?',
    options: [
      { key: 'A', text: '$\\cos(a-b) = \\cos a \\cos b - \\sin a \\sin b$' },
      { key: 'B', text: '$\\cos(a+b) = \\cos a \\cos b - \\sin a \\sin b$' },
      { key: 'C', text: '$\\sin(a+b) = \\sin a \\cos b - \\cos a \\sin b$' },
      { key: 'D', text: '$\\sin(a-b) = \\sin a \\cos b + \\cos a \\sin b$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo công thức cộng đối với cosin của một tổng: $\\cos(a+b) = \\cos a \\cos b - \\sin a \\sin b$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg10',
    number: 10,
    type: 'mcq',
    skill: 'Công thức nhân đôi',
    points: 0.3,
    text: 'Biết $\\sin a = \\dfrac{1}{3}$. Giá trị của $\\cos 2a$ bằng:',
    options: [
      { key: 'A', text: '$-\\dfrac{2}{3}$' },
      { key: 'B', text: '$\\dfrac{7}{9}$' },
      { key: 'C', text: '$-\\dfrac{7}{9}$' },
      { key: 'D', text: '$\\dfrac{2}{3}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Sử dụng công thức nhân đôi của cosin theo sin: $$\\cos 2a = 1 - 2\\sin^2 a = 1 - 2 \\cdot \\left(\\dfrac{1}{3}\\right)^2 = 1 - \\dfrac{2}{9} = \\dfrac{7}{9}$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg11',
    number: 11,
    type: 'mcq',
    skill: 'Công thức biến đổi tích thành tổng',
    points: 0.3,
    text: 'Khẳng định nào sau đây <strong>đúng</strong> về công thức biến đổi tích thành tổng?',
    options: [
      { key: 'A', text: '$\\sin a \\sin b = \\dfrac{1}{2}[\\cos(a-b) - \\cos(a+b)]$' },
      { key: 'B', text: '$\\sin a \\sin b = \\dfrac{1}{2}[\\cos(a-b) + \\cos(a+b)]$' },
      { key: 'C', text: '$\\cos a \\cos b = \\dfrac{1}{2}[\\cos(a-b) - \\cos(a+b)]$' },
      { key: 'D', text: '$\\sin a \\cos b = \\dfrac{1}{2}[\\sin(a-b) - \\sin(a+b)]$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Theo công thức biến đổi tích thành tổng đối với tích hai hàm sin: $$\\sin a \\sin b = \\dfrac{1}{2}[\\cos(a-b) - \\cos(a+b)]$$<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'lg12',
    number: 12,
    type: 'mcq',
    skill: 'Công thức biến đổi tổng thành tích',
    points: 0.3,
    text: 'Rút gọn biểu thức $M = \\dfrac{\\sin 3x + \\sin x}{\\cos 3x + \\cos x}$ (với điều kiện biểu thức xác định) ta được:',
    options: [
      { key: 'A', text: '$M = \\tan x$' },
      { key: 'B', text: '$M = \\tan 2x$' },
      { key: 'C', text: '$M = \\tan 3x$' },
      { key: 'D', text: '$M = \\cot 2x$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng công thức biến đổi tổng thành tích cho tử số và mẫu số: $$\\sin 3x + \\sin x = 2\\sin 2x \\cos x; \\quad \\cos 3x + \\cos x = 2\\cos 2x \\cos x$$ Do đó: $M = \\dfrac{2\\sin 2x \\cos x}{2\\cos 2x \\cos x} = \\dfrac{\\sin 2x}{\\cos 2x} = \\tan 2x$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg13',
    number: 13,
    type: 'mcq',
    skill: 'Tính giá trị biểu thức bằng công thức tích thành tổng',
    points: 0.3,
    text: 'Không sử dụng máy tính cầm tay, tính giá trị biểu thức $A = \\cos 75^\\circ \\cdot \\cos 15^\\circ$.',
    options: [
      { key: 'A', text: '$\\dfrac{1}{2}$' },
      { key: 'B', text: '$\\dfrac{1}{4}$' },
      { key: 'C', text: '$\\dfrac{\\sqrt{3}}{4}$' },
      { key: 'D', text: '$\\dfrac{\\sqrt{3}}{2}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Biến đổi tích thành tổng: $$A = \\cos 75^\\circ \\cos 15^\\circ = \\dfrac{1}{2}[\\cos(75^\\circ - 15^\\circ) + \\cos(75^\\circ + 15^\\circ)] = \\dfrac{1}{2}[\\cos 60^\\circ + \\cos 90^\\circ] = \\dfrac{1}{2}\\left(\\dfrac{1}{2} + 0\\right) = \\dfrac{1}{4}$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg14',
    number: 14,
    type: 'mcq',
    skill: 'Ứng dụng công thức cộng tổng hợp dao động điều hòa',
    points: 0.3,
    text: 'Một thiết bị âm thanh nhận hai nguồn tín hiệu sóng âm thuần $f_1(t) = 3\\sin t$ và $f_2(t) = 3\\cos t$ ($t$ là thời gian tính bằng giây). Sóng âm tổng hợp có dạng $f(t) = f_1(t) + f_2(t) = A\\sin(t + \\varphi)$ với $A > 0$ và $-\\pi \\le \\varphi \\le \\pi$. Biên độ âm $A$ và pha ban đầu $\\varphi$ lần lượt bằng:',
    options: [
      { key: 'A', text: '$A = 3\\sqrt{2}, \\varphi = \\dfrac{\\pi}{4}$' },
      { key: 'B', text: '$A = 6, \\varphi = \\dfrac{\\pi}{4}$' },
      { key: 'C', text: '$A = 3\\sqrt{2}, \\varphi = -\\dfrac{\\pi}{4}$' },
      { key: 'D', text: '$A = 3, \\varphi = \\dfrac{\\pi}{2}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Biến đổi: $$f(t) = 3\\sin t + 3\\cos t = 3\\sqrt{2}\\left(\\dfrac{1}{\\sqrt{2}}\\sin t + \\dfrac{1}{\\sqrt{2}}\\cos t\\right) = 3\\sqrt{2}\\sin\\left(t + \\dfrac{\\pi}{4}\\right)$$ Đối chiếu dạng $f(t) = A\\sin(t + \\varphi) \\implies A = 3\\sqrt{2}$ và $\\varphi = \\dfrac{\\pi}{4}$.<br><strong>Đáp án đúng: A.</strong>',
  },

  // CHỦ ĐỀ 3: HÀM SỐ LƯỢNG GIÁC (7 CÂU)
  {
    id: 'lg15',
    number: 15,
    type: 'mcq',
    skill: 'Tìm tập xác định của hàm số lượng giác',
    points: 0.3,
    text: 'Tập xác định $D$ của hàm số $y = \\tan\\left(x - \\dfrac{\\pi}{3}\right)$ là:',
    options: [
      { key: 'A', text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{\\pi}{3} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$' },
      { key: 'B', text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{5\\pi}{6} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$' },
      { key: 'C', text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{5\\pi}{6} + k2\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$' },
      { key: 'D', text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{\\pi}{2} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Hàm số xác định khi và chỉ khi: $$x - \\dfrac{\\pi}{3} \\ne \\dfrac{\\pi}{2} + k\\pi \\Leftrightarrow x \\ne \\dfrac{5\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg16',
    number: 16,
    type: 'mcq',
    skill: 'Tìm tập giá trị của hàm số lượng giác',
    points: 0.3,
    text: 'Tập giá trị $T$ của hàm số $y = 2\\sin\\left(x + \\dfrac{\\pi}{4}\right) - 3$ là:',
    options: [
      { key: 'A', text: '$T = [-2; 2]$' },
      { key: 'B', text: '$T = [-5; -1]$' },
      { key: 'C', text: '$T = [-1; 5]$' },
      { key: 'D', text: '$T = [-3; 2]$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vì $-1 \\le \\sin\\left(x + \\dfrac{\\pi}{4}\\right) \\le 1$ nên: $$-2 \\le 2\\sin\\left(x + \\dfrac{\\pi}{4}\\right) \\le 2 \\implies -5 \\le 2\\sin\\left(x + \\dfrac{\\pi}{4}\\right) - 3 \\le -1$$ Do đó tập giá trị là $T = [-5; -1]$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg17',
    number: 17,
    type: 'mcq',
    skill: 'Xét tính chẵn lẻ của hàm số lượng giác',
    points: 0.3,
    text: 'Hàm số nào dưới đây là hàm số chẵn trên tập xác định của nó?',
    options: [
      { key: 'A', text: '$y = \\sin x$' },
      { key: 'B', text: '$y = x \\sin x$' },
      { key: 'C', text: '$y = \\tan x$' },
      { key: 'D', text: '$y = \\sin x \\cdot \\cos 2x$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Xét $f(x) = x \\sin x$ với $D = \\mathbb{R}$. Ta có: $$f(-x) = (-x)\\sin(-x) = (-x)(-\\sin x) = x \\sin x = f(x)$$ Do đó $y = x \\sin x$ là hàm số chẵn.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg18',
    number: 18,
    type: 'mcq',
    skill: 'Xác định chu kỳ tuần hoàn của hàm số lượng giác',
    points: 0.3,
    text: 'Chu kỳ tuần hoàn $T$ của hàm số $y = \\cos\\left(2x - \\dfrac{\\pi}{4}\right)$ bằng:',
    options: [
      { key: 'A', text: '$T = 2\\pi$' },
      { key: 'B', text: '$T = \\pi$' },
      { key: 'C', text: '$T = \\dfrac{\\pi}{2}$' },
      { key: 'D', text: '$T = 4\\pi$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Hàm số $y = \\cos(ax + b)$ có chu kỳ tuần hoàn $T = \\dfrac{2\\pi}{|a|}$. Áp dụng với $a = 2 \\implies T = \\dfrac{2\\pi}{2} = \\pi$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg19',
    number: 19,
    type: 'mcq',
    skill: 'Khảo sát tính đơn điệu của hàm số lượng giác',
    points: 0.3,
    text: 'Mệnh đề nào sau đây <strong>đúng</strong> khi nói về sự biến thiên của hàm số $y = \\sin x$?',
    options: [
      { key: 'A', text: 'Đồng biến trên khoảng $\\left(0; \\dfrac{\\pi}{2}\\right)$ và nghịch biến trên khoảng $\\left(\\dfrac{\\pi}{2}; \\pi\\right)$' },
      { key: 'B', text: 'Nghịch biến trên khoảng $\\left(0; \\dfrac{\\pi}{2}\\right)$ và đồng biến trên khoảng $\\left(\\dfrac{\\pi}{2}; \\pi\\right)$' },
      { key: 'C', text: 'Đồng biến trên toàn bộ khoảng $(0; \\pi)$' },
      { key: 'D', text: 'Nghịch biến trên toàn bộ khoảng $(0; \\pi)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Dựa vào đồ thị hàm số $y = \\sin x$: Khi $x$ tăng từ $0$ đến $\\dfrac{\\pi}{2}$ thì $\\sin x$ tăng từ $0$ lên $1$ (đồng biến); khi $x$ tăng từ $\\dfrac{\\pi}{2}$ đến $\\pi$ thì $\\sin x$ giảm từ $1$ về $0$ (nghịch biến).<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'lg20',
    number: 20,
    type: 'mcq',
    skill: 'Tìm giá trị lớn nhất, nhỏ nhất của hàm số lượng giác bậc hai',
    points: 0.3,
    text: 'Giá trị lớn nhất $M$ và giá trị nhỏ nhất $m$ của hàm số $y = 2\\cos^2 x + 3\\sin x + 1$ là:',
    options: [
      { key: 'A', text: '$M = 3, m = -1$' },
      { key: 'B', text: '$M = \\dfrac{25}{8}, m = -1$' },
      { key: 'C', text: '$M = 4, m = 0$' },
      { key: 'D', text: '$M = \\dfrac{25}{8}, m = 1$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Biến đổi: $y = 2(1 - \\sin^2 x) + 3\\sin x + 1 = -2\\sin^2 x + 3\\sin x + 3$. Đặt $t = \\sin x \\in [-1; 1]$. Khảo sát tam thức bậc hai $g(t) = -2t^2 + 3t + 3$ trên $[-1; 1]$, ta xác định được $M = \\dfrac{25}{8}$ và $m = -1$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg21',
    number: 21,
    type: 'mcq',
    skill: 'Mô hình hóa bài toán dao động thủy triều bằng hàm số lượng giác',
    points: 0.3,
    text: 'Mực nước biển tại một trạm quan trắc phụ thuộc thời gian $t$ (giờ, $0 \\le t \\le 24$) trong ngày được mô hình hóa bởi hàm số $h(t) = 2,5\\cos\\left(\\dfrac{\\pi t}{6}\\right) + 10$ (mét). Mực nước biển đạt giá trị cao nhất bằng bao nhiêu mét và vào thời điểm mấy giờ?',
    options: [
      { key: 'A', text: '$10\\text{ m}$ vào lúc $6\\text{ giờ}$ và $18\\text{ giờ}$' },
      { key: 'B', text: '$12,5\\text{ m}$ vào lúc $0\\text{ giờ}, 12\\text{ giờ}$ và $24\\text{ giờ}$' },
      { key: 'C', text: '$12,5\\text{ m}$ vào lúc $6\\text{ giờ}$ và $18\\text{ giờ}$' },
      { key: 'D', text: '$10\\text{ m}$ vào lúc $12\\text{ giờ}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vì $-1 \\le \\cos\\left(\\dfrac{\\pi t}{6}\\right) \\le 1$ nên $h(t) \\le 2,5(1) + 10 = 12,5\\text{ m}$. Đạt giá trị lớn nhất khi $\\cos\\left(\\dfrac{\\pi t}{6}\\right) = 1 \\iff \\dfrac{\\pi t}{6} = k2\\pi \\iff t = 12k$. Với $0 \\le t \\le 24 \\implies t \\in \\{0; 12; 24\\}$ (tức lúc $0$ giờ, $12$ giờ trưa và $24$ giờ đêm).<br><strong>Đáp án đúng: B.</strong>',
  },

  // CHỦ ĐỀ 4: PHƯƠNG TRÌNH LƯỢNG GIÁC CƠ BẢN (9 CÂU)
  {
    id: 'lg22',
    number: 22,
    type: 'mcq',
    skill: 'Điều kiện có nghiệm của phương trình lượng giác cơ bản',
    points: 0.3,
    text: 'Phương trình lượng giác $\\sin x = m$ (với $m$ là tham số thực) có nghiệm khi và chỉ khi:',
    options: [
      { key: 'A', text: '$m \\in (-1; 1)$' },
      { key: 'B', text: '$m \\in [-1; 1]$' },
      { key: 'C', text: '$m \\in \\mathbb{R}$' },
      { key: 'D', text: '$m \\ge 0$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vì tập giá trị của hàm số $y = \\sin x$ là $[-1; 1]$ nên phương trình $\\sin x = m$ có nghiệm khi và chỉ khi $-1 \\le m \\le 1$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg23',
    number: 23,
    type: 'mcq',
    skill: 'Công thức nghiệm của phương trình sin cơ bản',
    points: 0.3,
    text: 'Tất cả các nghiệm của phương trình $\\sin x = \\sin\\dfrac{\\pi}{6}$ là:',
    options: [
      { key: 'A', text: '$\\left[\\begin{array}{l} x = \\dfrac{\\pi}{6} + k2\\pi \\\\ x = \\dfrac{5\\pi}{6} + k2\\pi \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$' },
      { key: 'B', text: '$\\left[\\begin{array}{l} x = \\dfrac{\\pi}{6} + k2\\pi \\\\ x = -\\dfrac{\\pi}{6} + k2\\pi \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$' },
      { key: 'C', text: '$x = \\pm \\dfrac{\\pi}{6} + k2\\pi \\quad (k \\in \\mathbb{Z})$' },
      { key: 'D', text: '$x = \\dfrac{\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng công thức nghiệm $\\sin x = \\sin\\alpha \\iff x = \\alpha + k2\\pi$ hoặc $x = \\pi - \\alpha + k2\\pi$. Với $\\alpha = \\dfrac{\\pi}{6}$, ta được $x = \\dfrac{\\pi}{6} + k2\\pi$ hoặc $x = \\dfrac{5\\pi}{6} + k2\\pi$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'lg24',
    number: 24,
    type: 'mcq',
    skill: 'Công thức nghiệm của phương trình tan cơ bản',
    points: 0.3,
    text: 'Tất cả các nghiệm của phương trình $\\tan x = \\sqrt{3}$ là:',
    options: [
      { key: 'A', text: '$x = \\dfrac{\\pi}{3} + k2\\pi \\quad (k \\in \\mathbb{Z})$' },
      { key: 'B', text: '$x = \\dfrac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$' },
      { key: 'C', text: '$x = \\dfrac{\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$' },
      { key: 'D', text: '$x = \\pm \\dfrac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Ta có $\\tan x = \\sqrt{3} = \\tan\\dfrac{\\pi}{3} \\iff x = \\dfrac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg25',
    number: 25,
    type: 'mcq',
    skill: 'Giải phương trình cosin dạng đặc biệt bằng 0',
    points: 0.3,
    text: 'Tập nghiệm của phương trình $\\cos\\left(2x - \\dfrac{\\pi}{4}\right) = 0$ là:',
    options: [
      { key: 'A', text: '$S = \\left\\{\\dfrac{\\pi}{8} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$' },
      { key: 'B', text: '$S = \\left\\{\\dfrac{3\\pi}{8} + \\dfrac{k\\pi}{2} \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$' },
      { key: 'C', text: '$S = \\left\\{\\dfrac{3\\pi}{8} + k\\pi \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$' },
      { key: 'D', text: '$S = \\left\\{\\dfrac{\\pi}{4} + \\dfrac{k\\pi}{2} \\;\\middle|\\; k \\in \\mathbb{Z}\\right\\}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> $$\\cos\\left(2x - \\dfrac{\\pi}{4}\right) = 0 \\iff 2x - \\dfrac{\\pi}{4} = \\dfrac{\\pi}{2} + k\\pi \\iff 2x = \\dfrac{3\\pi}{4} + k\\pi \\iff x = \\dfrac{3\\pi}{8} + \\dfrac{k\\pi}{2} \\quad (k \\in \\mathbb{Z})$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg26',
    number: 26,
    type: 'mcq',
    skill: 'Giải phương trình lượng giác đưa về dạng cơ bản',
    points: 0.3,
    text: 'Nghiệm của phương trình $\\sin 2x = \\sin x$ là:',
    options: [
      { key: 'A', text: '$x = k2\\pi \\quad (k \\in \\mathbb{Z})$' },
      { key: 'B', text: '$\\left[\\begin{array}{l} x = k2\\pi \\\\ x = \\dfrac{\\pi}{3} + \\dfrac{k2\\pi}{3} \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$' },
      { key: 'C', text: '$x = \\dfrac{\\pi}{3} + k2\\pi \\quad (k \\in \\mathbb{Z})$' },
      { key: 'D', text: '$\\left[\\begin{array}{l} x = k\\pi \\\\ x = \\dfrac{\\pi}{3} + k\\pi \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> $$\\sin 2x = \\sin x \\iff \\left[\\begin{array}{l} 2x = x + k2\\pi \\\\ 2x = \\pi - x + k2\\pi \\end{array}\\right. \\iff \\left[\\begin{array}{l} x = k2\\pi \\\\ x = \\dfrac{\\pi}{3} + \\dfrac{k2\\pi}{3} \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg27',
    number: 27,
    type: 'mcq',
    skill: 'Đếm số nghiệm của phương trình lượng giác trên một đoạn',
    points: 0.3,
    text: 'Số nghiệm của phương trình $\\cos x = -\\dfrac{1}{2}$ trên đoạn $[0; 2\\pi]$ là:',
    options: [
      { key: 'A', text: '$1$' },
      { key: 'B', text: '$2$' },
      { key: 'C', text: '$3$' },
      { key: 'D', text: '$4$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> $\\cos x = -\\dfrac{1}{2} = \\cos\\dfrac{2\\pi}{3} \\iff x = \\pm \\dfrac{2\\pi}{3} + k2\\pi$. Trên đoạn $[0; 2\\pi]$ có đúng 2 nghiệm là $x_1 = \\dfrac{2\\pi}{3}$ (với $k=0$) và $x_2 = \\dfrac{4\\pi}{3}$ (với $k=1$).<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg28',
    number: 28,
    type: 'mcq',
    skill: 'Tính tổng các nghiệm của phương trình lượng giác trong khoảng',
    points: 0.3,
    text: 'Tổng tất cả các nghiệm của phương trình $\\sqrt{3}\\tan x - 1 = 0$ thuộc khoảng $(0; 2\\pi)$ bằng:',
    options: [
      { key: 'A', text: '$\\dfrac{\\pi}{6}$' },
      { key: 'B', text: '$\\dfrac{7\\pi}{6}$' },
      { key: 'C', text: '$\\dfrac{4\\pi}{3}$' },
      { key: 'D', text: '$\\dfrac{3\\pi}{2}$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> $\\tan x = \\dfrac{1}{\\sqrt{3}} \\iff x = \\dfrac{\\pi}{6} + k\\pi$. Với $x \\in (0; 2\\pi)$ ta có $x_1 = \\dfrac{\\pi}{6}$ và $x_2 = \\dfrac{7\\pi}{6}$. Tổng hai nghiệm là $\\dfrac{\\pi}{6} + \\dfrac{7\\pi}{6} = \\dfrac{4\\pi}{3}$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'lg29',
    number: 29,
    type: 'mcq',
    skill: 'Biểu diễn nghiệm phương trình lượng giác có điều kiện trên đường tròn',
    points: 0.3,
    text: 'Số điểm biểu diễn các nghiệm của phương trình $\\dfrac{\\sin 2x}{\\cos x} = 0$ trên đường tròn lượng giác là:',
    options: [
      { key: 'A', text: '$1$' },
      { key: 'B', text: '$2$' },
      { key: 'C', text: '$3$' },
      { key: 'D', text: '$4$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Điều kiện: $\\cos x \\ne 0$. Khi đó $\\sin 2x = 0 \\iff 2\\sin x \\cos x = 0 \\iff \\sin x = 0 \\iff x = k\\pi$. Các nghiệm $x = k\\pi$ thỏa mãn $\\cos x \\ne 0$ và được biểu diễn bởi đúng 2 điểm phân biệt là $(1; 0)$ và $(-1; 0)$ trên đường tròn lượng giác.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'lg30',
    number: 30,
    type: 'mcq',
    skill: 'Tìm tham số m để phương trình lượng giác có nghiệm thỏa mãn điều kiện',
    points: 0.3,
    text: 'Tìm tất cả các giá trị thực của tham số $m$ để phương trình $\\cos x = m + 1$ có đúng một nghiệm thuộc khoảng $\\left(0; \\dfrac{\\pi}{2}\\right)$.',
    options: [
      { key: 'A', text: '$-1 < m < 1$' },
      { key: 'B', text: '$-1 < m < 0$' },
      { key: 'C', text: '$0 < m < 1$' },
      { key: 'D', text: '$-1 \\le m \\le 0$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Với mọi $x \\in \\left(0; \\dfrac{\\pi}{2}\\right)$, ta có $0 < \\cos x < 1$. Do đó phương trình có nghiệm duy nhất khi và chỉ khi: $$0 < m + 1 < 1 \\iff -1 < m < 0$$<br><strong>Đáp án đúng: B.</strong>',
  },
];

// PHẦN II. TỰ LUẬN (1 CÂU - 1,0 ĐIỂM)
const SHORTANS_QUESTIONS_LUONG_GIAC_CH1: QuestionShortAns[] = [
  {
    id: 'lg31',
    number: 31,
    type: 'shortans',
    skill: 'Mô hình hóa chuyển động đu quay bằng hàm số lượng giác',
    points: 1.0,
    text: 'Một cabin đu quay Sun Wheel có bán kính $R = 30\\text{ m}$ quay đều với chu kỳ $12\\text{ phút}$. Trục quay $O$ được đặt ở độ cao $32\\text{ m}$ so với mặt đất. Chiều cao $h$ (mét) của cabin so với mặt đất tại thời điểm $t$ (phút) kể từ khi vòng quay bắt đầu vận hành từ vị trí thấp nhất $A_0(0; -30)$ được mô hình hóa bởi công thức: $$h(t) = 32 - 30\\cos\\left(\\dfrac{\\pi t}{6}\\right)$$<br><br><strong>a) (0,5 điểm)</strong> Tính chiều cao của cabin so với mặt đất ở thời điểm $t = 3\\text{ phút}$.<br><strong>b) (0,5 điểm)</strong> Trong vòng quay đầu tiên ($0 \\le t \\le 12\\text{ phút}$), xác định tất cả các thời điểm $t$ để cabin ở độ cao đúng $47\\text{ m}$ so với mặt đất.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'a) h(3) = 32 m; b) t = 4 phút và t = 8 phút',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const has32 = clean.includes('32');
      const has4 = clean.includes('4');
      const has8 = clean.includes('8');
      return has32 && has4 && has8;
    },
    explanation:
      '<strong>Lời giải chi tiết và Thang điểm (1,0 điểm):</strong><br><br><strong>a) [0,5 điểm]</strong><br>- Tại $t = 3\\text{ phút}$, thay $t = 3$ vào công thức: $$h(3) = 32 - 30\\cos\\left(\\dfrac{\\pi \\cdot 3}{6}\\right) = 32 - 30\\cos\\left(\\dfrac{\\pi}{2}\\right)$$ (0,25đ)<br>- Vì $\\cos\\left(\\dfrac{\\pi}{2}\\right) = 0$ nên $h(3) = 32 - 30(0) = 32\\text{ (m)}$. Vậy cabin ở độ cao $32\\text{ m}$ so với mặt đất. (0,25đ)<br><br><strong>b) [0,5 điểm]</strong><br>- Cabin đạt độ cao $47\\text{ m} \\iff h(t) = 47 \\iff 32 - 30\\cos\\left(\\dfrac{\\pi t}{6}\\right) = 47 \\iff \\cos\\left(\\dfrac{\\pi t}{6}\\right) = -\\dfrac{1}{2}$. (0,25đ)<br>- Giải phương trình: $$\\dfrac{\\pi t}{6} = \\pm \\dfrac{2\\pi}{3} + k2\\pi \\iff t = \\pm 4 + 12k \\quad (k \\in \\mathbb{Z})$$<br>- Trong vòng quay đầu tiên ($0 \\le t \\le 12\\text{ phút}$):<br>  + Nhánh $t = 4 + 12k$ với $k = 0 \\implies t = 4\\text{ phút}$ (đang đi lên).<br>  + Nhánh $t = -4 + 12k$ với $k = 1 \\implies t = 8\\text{ phút}$ (đang đi xuống).<br>Vậy cabin ở độ cao $47\\text{ m}$ tại hai thời điểm $t = 4\\text{ phút}$ và $t = 8\\text{ phút}$. (0,25đ)',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan11LuongGiacChuong1Page() {
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
    MCQ_QUESTIONS_LUONG_GIAC_CH1.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ originalKey: opt.key, text: opt.text })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS_LUONG_GIAC_CH1.map((q) => ({
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
  const totalQuestions = MCQ_QUESTIONS_LUONG_GIAC_CH1.length + SHORTANS_QUESTIONS_LUONG_GIAC_CH1.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 6. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS11-LG-01';
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

    // Chấm Phần I (30 câu MCQ, 0.3đ/câu)
    MCQ_QUESTIONS_LUONG_GIAC_CH1.forEach((q) => {
      const studentChoice = mcqAnswers[q.id];
      if (studentChoice === q.correct) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (1 câu Tự luận, 1.0đ/câu)
    SHORTANS_QUESTIONS_LUONG_GIAC_CH1.forEach((q) => {
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
      bai_thi: 'ĐỀ KIỂM TRA MÔN TOÁN 11 - CHƯƠNG I: HÀM SỐ LƯỢNG GIÁC VÀ PT LƯỢNG GIÁC (45 PHÚT)',
      diem: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS_LUONG_GIAC_CH1.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_LUONG_GIAC_CH1.length}`,
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
        Task_ID: 'KIEM_TRA_TOAN_11_CHUONG_1_LUONG_GIAC',
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
          bai_thi: 'ĐỀ KIỂM TRA TOÁN 11 - CHƯƠNG I: LƯỢNG GIÁC',
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
        MCQ_QUESTIONS_LUONG_GIAC_CH1.map((q) => ({
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
            <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold uppercase tracking-wider rounded-full mb-2">
              Hệ thống khảo sát trực tuyến Integra &bull; Toán 11
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              ĐỀ KIỂM TRA MÔN TOÁN LỚP 11 - 45 PHÚT
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
              CHƯƠNG I: HÀM SỐ LƯỢNG GIÁC VÀ PHƯƠNG TRÌNH LƯỢNG GIÁC &bull; Tỷ lệ: 90% Trắc nghiệm + 10% Tự luận
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 disabled:bg-slate-100"
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 disabled:bg-slate-100"
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 disabled:bg-slate-100"
              />
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
              <span className="text-xs font-medium text-amber-800">Thời gian còn lại</span>
              <span
                className={`text-xl font-bold font-mono ${
                  timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-amber-950'
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
                className="h-full bg-amber-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        {/* KẾT QUẢ SAU KHI NỘP BÀI */}
        {isSubmitted && (
          <section className="bg-white rounded-2xl shadow-md border-2 border-amber-600 p-6 sm:p-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                  Đã hoàn thành &bull; Chấm điểm tự động
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-2">
                  Kết quả bài thi: {tenHocSinh || 'Học sinh'} ({lopNhom || 'Lớp 11'})
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Đúng {soCauDungMCQ}/30 câu Trắc nghiệm &bull; Đúng {soCauDungShort}/1 câu Tự luận
                </p>
              </div>
              <div className="text-center sm:text-right bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 min-w-[140px]">
                <span className="text-xs uppercase text-slate-500 font-semibold block">Điểm số</span>
                <span className="text-4xl font-extrabold text-amber-700">{diemSo}</span>
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
          <div className="bg-amber-800 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <h2 className="font-bold text-base sm:text-lg">
              I. PHẦN TRẮC NGHIỆM (9,0 ĐIỂM – 30 CÂU, 0,3 Đ/CÂU)
            </h2>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-md font-medium">
              30 Câu hỏi
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
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-md">
                      Câu {q.number}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      [Kỹ năng: {q.skill}]
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">0,3 đ</span>
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
                        'border-amber-600 bg-amber-50/80 text-amber-950 font-semibold ring-2 ring-amber-500/20';
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
                              ? 'bg-amber-600 text-white'
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
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                      <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
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
              II. PHẦN TỰ LUẬN (1,0 ĐIỂM – 1 CÂU)
            </h2>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-md font-medium">
              1 Câu hỏi
            </span>
          </div>

          {SHORTANS_QUESTIONS_LUONG_GIAC_CH1.map((q) => {
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
                  <span className="text-xs font-semibold text-slate-400">1,0 đ</span>
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
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 disabled:bg-slate-100"
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
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                      <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
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
              className="w-full sm:w-80 py-4 px-6 bg-amber-700 hover:bg-amber-800 disabled:bg-amber-400 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-amber-600/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
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
