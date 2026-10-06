'use client';

import React, { useState, useEffect } from 'react';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA GIỮA KỲ I MÔN TOÁN LỚP 11 - 90 PHÚT';
const EXAM_SUBTITLE = 'CHƯƠNG I: HÀM SỐ LƯỢNG GIÁC VÀ PHƯƠNG TRÌNH LƯỢNG GIÁC';
const EXAM_TIME_NOTE = '(Thời gian làm bài: 90 phút • Tỷ lệ: 90% Trắc nghiệm 30 câu + 10% Tự luận 1 câu)';

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
// DỮ LIỆU ĐỀ THI GIỮA KỲ 1 TOÁN 11 - 90 PHÚT
// ==========================================

// PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (30 CÂU - 9,0 ĐIỂM, 0.3Đ/CÂU)
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
      { key: 'A', text: '$\\sin\\alpha = x_M$' },
      { key: 'B', text: '$\\cos\\alpha = x_M$' },
      { key: 'C', text: '$\\tan\\alpha = \\dfrac{x_M}{y_M}$' },
      { key: 'D', text: '$\\cot\\alpha = \\dfrac{y_M}{x_M}$' },
    ],
    correct: 'B',
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
    id: 'gk3',
    number: 3,
    type: 'mcq',
    skill: 'Xét dấu các giá trị lượng giác theo góc phần tư',
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
    id: 'gk4',
    number: 4,
    type: 'mcq',
    skill: 'Tính giá trị lượng giác khi biết một giá trị lượng giác và khoảng của góc',
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
    id: 'gk5',
    number: 5,
    type: 'mcq',
    skill: 'Nhận biết các hệ thức lượng giác cơ bản',
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
    id: 'gk6',
    number: 6,
    type: 'mcq',
    skill: 'Rút gọn biểu thức lượng giác sử dụng tính chất góc liên quan đặc biệt',
    points: 0.3,
    text: 'Rút gọn biểu thức $P = \\sin(\\pi - \\alpha) + \\cos\\left(\\dfrac{\\pi}{2} - \\alpha\right) - \\sin(-\\alpha)$ ta được:',
    options: [
      { key: 'A', text: '$P = \\sin\\alpha$' },
      { key: 'B', text: '$P = 3\\sin\\alpha$' },
      { key: 'C', text: '$P = -\\sin\\alpha$' },
      { key: 'D', text: '$P = \\cos\\alpha$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng tính chất giá trị lượng giác của các góc liên quan đặc biệt:<br>- Góc bù: $\\sin(\\pi - \\alpha) = \\sin\\alpha$<br>- Góc phụ: $\\cos\\left(\\dfrac{\\pi}{2} - \\alpha\right) = \\sin\\alpha$<br>- Góc đối: $\\sin(-\\alpha) = -\\sin\\alpha$<br>Thay vào biểu thức $P$: $$P = \\sin\\alpha + \\sin\\alpha - (-\\sin\\alpha) = 3\\sin\\alpha$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk7',
    number: 7,
    type: 'mcq',
    skill: 'Tính tích sin và cos khi biết tổng sin + cos',
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
      { key: 'A', text: '$270\\pi\\text{ cm}$' },
      { key: 'B', text: '$540\\pi\\text{ cm}$' },
      { key: 'C', text: '$180\\pi\\text{ cm}$' },
      { key: 'D', text: '$135\\pi\\text{ cm}$' },
    ],
    correct: 'B',
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
    id: 'gk10',
    number: 10,
    type: 'mcq',
    skill: 'Áp dụng công thức nhân đôi tính cos 2a theo sin a',
    points: 0.3,
    text: 'Biết $\\sin a = \\dfrac{1}{3}$. Giá trị của $\\cos 2a$ bằng:',
    options: [
      { key: 'A', text: '$-\\dfrac{7}{9}$' },
      { key: 'B', text: '$\\dfrac{7}{9}$' },
      { key: 'C', text: '$\\dfrac{2}{3}$' },
      { key: 'D', text: '$-\\dfrac{2}{3}$' },
    ],
    correct: 'B',
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
    id: 'gk12',
    number: 12,
    type: 'mcq',
    skill: 'Rút gọn phân thức lượng giác bằng công thức biến đổi tổng thành tích',
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
    id: 'gk14',
    number: 14,
    type: 'mcq',
    skill: 'Tổng hợp sóng âm lượng giác',
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
      '<strong>Lời giải:</strong> Biến đổi vế phải bằng công thức cộng: $$f(t) = 3\\sin t + 3\\cos t = 3\\sqrt{2}\\left(\\dfrac{1}{\\sqrt{2}}\\sin t + \\dfrac{1}{\\sqrt{2}}\\cos t\\right) = 3\\sqrt{2}\\sin\\left(t + \\dfrac{\\pi}{4}\right)$$ Đối chiếu với dạng $f(t) = A\\sin(t + \\varphi) \\implies A = 3\\sqrt{2}$ và $\\varphi = \\dfrac{\\pi}{4}$.<br><strong>Đáp án đúng: A.</strong>',
  },

  // CHỦ ĐỀ 3: HÀM SỐ LƯỢNG GIÁC (7 CÂU)
  {
    id: 'gk15',
    number: 15,
    type: 'mcq',
    skill: 'Tìm tập xác định của hàm số tang',
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
      '<strong>Lời giải:</strong> Hàm số $y = \\tan\\left(x - \\dfrac{\\pi}{3}\right)$ xác định khi và chỉ khi: $$x - \\dfrac{\\pi}{3} \\ne \\dfrac{\\pi}{2} + k\\pi \\iff x \\ne \\dfrac{5\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk16',
    number: 16,
    type: 'mcq',
    skill: 'Tìm tập giá trị của hàm số lượng giác dạng bậc nhất theo sin',
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
      { key: 'A', text: '$y = \\sin x$' },
      { key: 'B', text: '$y = x \\sin x$' },
      { key: 'C', text: '$y = \\tan x$' },
      { key: 'D', text: '$y = \\sin x \\cdot \\cos 2x$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Xét $f(x) = x \\sin x$ có tập xác định $D = \\mathbb{R}$. Với mọi $x \\in \\mathbb{R}$: $$f(-x) = (-x)\\sin(-x) = (-x)(-\\sin x) = x \\sin x = f(x)$$ Do đó $y = x \\sin x$ là hàm số chẵn.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'gk18',
    number: 18,
    type: 'mcq',
    skill: 'Tìm chu kỳ tuần hoàn của hàm số cos(ax+b)',
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
      { key: 'A', text: 'Đồng biến trên khoảng $\\left(0; \\dfrac{\\pi}{2}\\right)$ và nghịch biến trên khoảng $\\left(\\dfrac{\\pi}{2}; \\pi\\right)$' },
      { key: 'B', text: 'Nghịch biến trên khoảng $\\left(0; \\dfrac{\\pi}{2}\\right)$ và đồng biến trên khoảng $\\left(\\dfrac{\\pi}{2}; \\pi\\right)$' },
      { key: 'C', text: 'Đồng biến trên toàn bộ khoảng $(0; \\pi)$' },
      { key: 'D', text: 'Nghịch biến trên toàn bộ khoảng $(0; \\pi)$' },
    ],
    correct: 'A',
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
      { key: 'A', text: '$M = 4, m = -1$' },
      { key: 'B', text: '$M = 3,5, m = -1$' },
      { key: 'C', text: '$M = 3,5, m = 1$' },
      { key: 'D', text: '$M = 3, m = -1$' },
    ],
    correct: 'B',
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
    id: 'gk22',
    number: 22,
    type: 'mcq',
    skill: 'Điều kiện có nghiệm của phương trình sin x = m',
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
    id: 'gk23',
    number: 23,
    type: 'mcq',
    skill: 'Công thức nghiệm cơ bản của phương trình sin',
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
    id: 'gk25',
    number: 25,
    type: 'mcq',
    skill: 'Giải phương trình cos(ax+b) = 0',
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
    id: 'gk26',
    number: 26,
    type: 'mcq',
    skill: 'Giải phương trình sin 2x = sin x',
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
      { key: 'A', text: '$1$' },
      { key: 'B', text: '$2$' },
      { key: 'C', text: '$3$' },
      { key: 'D', text: '$4$' },
    ],
    correct: 'B',
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
    id: 'gk29',
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
      { key: 'A', text: '$-1 < m < 1$' },
      { key: 'B', text: '$-1 < m < 0$' },
      { key: 'C', text: '$0 < m < 1$' },
      { key: 'D', text: '$-1 \\le m \\le 0$' },
    ],
    correct: 'B',
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
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State lưu danh sách câu hỏi trắc nghiệm đã xáo trộn phương án (Fisher-Yates)
  const [shuffledMCQQuestions, setShuffledMCQQuestions] = useState<ShuffledQuestionMCQ[]>(() =>
    MCQ_QUESTIONS_GK1_TOAN11.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ originalKey: opt.key, text: opt.text })),
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
  const totalQuestions =
    MCQ_QUESTIONS_GK1_TOAN11.length + SHORTANS_QUESTIONS_GK1_TOAN11.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 6. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
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

    // Chấm điểm
    let calculatedScore = 0;
    let correctMCQ = 0;
    let correctShort = 0;
    const wrongSkills: string[] = [];

    // Chấm trắc nghiệm (30 câu x 0.3đ = 9.0đ)
    MCQ_QUESTIONS_GK1_TOAN11.forEach((q) => {
      const studentAns = mcqAnswers[q.id];
      if (studentAns === q.correct) {
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
      dap_an_mcq: mcqAnswers,
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

  // 7. LÀM LẠI BÀI THI (RESET & RE-SHUFFLE)
  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn làm lại bài thi từ đầu? Dữ liệu bài làm hiện tại sẽ bị xóa.')) {
      setMcqAnswers({});
      setShortAnswers({});
      setIsSubmitted(false);
      setDiemSo(0);
      setMangCauSai([]);
      setSoCauDungMCQ(0);
      setSoCauDungShort(0);
      setTimeLeft(90 * 60);
      // Xáo trộn lượt mới bằng thuật toán Fisher-Yates khi làm lại
      setShuffledMCQQuestions(
        MCQ_QUESTIONS_GK1_TOAN11.map((q) => ({
          ...q,
          options: shuffleOptions(q.options),
        }))
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 antialiased font-sans pb-16">
      {/* THẺ TITLE ĐỘNG TRÍCH XUẤT 100% TỪ LATEX */}
      <title>{`${EXAM_TITLE} - ${EXAM_SUBTITLE}`}</title>

      {/* HEADER CỐ ĐỊNH PHÍA TRÊN */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Toán 11 • Giữa kỳ 1 • GDPT 2018
            </span>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md mt-0.5">
              {EXAM_TITLE}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* ĐỒNG HỒ ĐẾM NGƯỢC */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-xs sm:text-sm shadow-inner transition ${
                timeLeft <= 300
                  ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* NÚT NỘP BÀI TRÊN HEADER */}
            {!isSubmitted ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 bg-amber-700 hover:bg-amber-800 disabled:bg-amber-400 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition transform active:scale-95 cursor-pointer"
              >
                {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition cursor-pointer"
              >
                Làm lại
              </button>
            )}
          </div>
        </div>

        {/* THANH TIẾN ĐỘ LÀM BÀI */}
        <div className="w-full bg-slate-200 h-1">
          <div
            className="bg-amber-600 h-1 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* BANNER THÔNG TIN ĐỀ THI */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="relative z-10 text-center space-y-2">
            <span className="text-xs font-bold text-amber-800 tracking-wider uppercase bg-amber-100/80 px-3 py-1 rounded-full">
              BỘ GIÁO DỤC VÀ ĐÀO TẠO — GDPT 2018
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-1">
              {EXAM_TITLE}
            </h2>
            <p className="text-sm font-bold text-amber-900">
              {EXAM_SUBTITLE}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 italic max-w-xl mx-auto">
              {EXAM_TIME_NOTE}
            </p>
          </div>

          {/* FORM ĐIỀN THÔNG TIN HỌC SINH */}
          <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Họ và tên thí sinh <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-ten"
                type="text"
                disabled={isSubmitted}
                value={tenHocSinh}
                onChange={(e) => setTenHocSinh(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 focus:bg-white transition disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mã học sinh / SBD</label>
              <input
                id="input-ma-hs"
                type="text"
                disabled={isSubmitted}
                value={maHocSinh}
                onChange={(e) => setMaHocSinh(e.target.value)}
                placeholder="HS11-GK1-001"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 focus:bg-white transition disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Lớp / Nhóm học</label>
              <input
                id="input-lop"
                type="text"
                disabled={isSubmitted}
                value={lopNhom}
                onChange={(e) => setLopNhom(e.target.value)}
                placeholder="11A1"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 focus:bg-white transition disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* THÔNG BÁO KẾT QUẢ KHI ĐÃ NỘP BÀI */}
        {isSubmitted && (
          <div className="bg-gradient-to-br from-amber-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-amber-800/40">
              <div className="text-center sm:text-left">
                <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">
                  BÁO CÁO KẾT QUẢ ĐÁNH GIÁ: {EXAM_TITLE}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black mt-1">{tenHocSinh || 'Học sinh ẩn danh'}</h3>
                <p className="text-sm text-slate-300 mt-0.5">
                  Mã: {maHocSinh || 'HS11-GK1-90P'} • Lớp: {lopNhom || 'Lớp 11'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center px-6 py-3 bg-white/10 rounded-xl backdrop-blur border border-white/10">
                  <span className="block text-xs uppercase tracking-wider text-amber-200">Điểm số</span>
                  <span className="text-4xl sm:text-5xl font-black text-amber-400">
                    {diemSo.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-300 block">/ 10.0</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-xs text-slate-300 block">Đúng Trắc nghiệm</span>
                <span className="text-lg font-bold text-white mt-1 block">
                  {soCauDungMCQ} / {MCQ_QUESTIONS_GK1_TOAN11.length}
                </span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-xs text-slate-300 block">Đúng Tự luận</span>
                <span className="text-lg font-bold text-white mt-1 block">
                  {soCauDungShort} / {SHORTANS_QUESTIONS_GK1_TOAN11.length}
                </span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-xs text-slate-300 block">Tỷ lệ chính xác</span>
                <span className="text-lg font-bold text-amber-300 mt-1 block">
                  {Math.round(
                    ((soCauDungMCQ + soCauDungShort) /
                      (MCQ_QUESTIONS_GK1_TOAN11.length + SHORTANS_QUESTIONS_GK1_TOAN11.length)) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-xs text-slate-300 block">Thời gian làm</span>
                <span className="text-lg font-bold text-white mt-1 block">
                  {Math.max(1, Math.round((90 * 60 - timeLeft) / 60))} phút
                </span>
              </div>
            </div>

            {/* NHẬN XÉT SƯ PHẠM */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-sm">
              <h4 className="font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Nhận xét sư phạm đánh giá giữa kỳ I:
              </h4>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                {diemSo >= 9.0
                  ? 'Xuất sắc! Em nắm vững toàn diện kiến thức Lượng giác lớp 11 và giải quyết rất tốt bài toán thực tế mô hình hóa cabin đu quay Sun Wheel. Điểm số thể hiện tư duy logic và kỹ năng tính toán chuẩn xác!'
                  : diemSo >= 7.0
                  ? 'Khá tốt! Em làm chủ các dạng toán cơ bản và thông hiểu. Hãy rèn luyện thêm về biến đổi công thức lượng giác nâng cao, tìm GTLN/GTNN và giải phương trình có điều kiện nghiệm để đạt điểm tuyệt đối.'
                  : diemSo >= 5.0
                  ? 'Đạt yêu cầu. Em cần củng cố lại các công thức lượng giác cơ bản, chu kỳ và tập xác định của các hàm số lượng giác để làm bài chắc chắn hơn.'
                  : 'Cần ôn tập kỹ lại! Em hãy xem lại lời giải chi tiết cho từng câu bên dưới, ghi chép lại các công thức và làm lại bài thi để củng cố nền tảng.'}
              </p>

              {mangCauSai.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <span className="text-xs text-rose-300 font-bold block mb-1">
                    Các kỹ năng / chuyên đề cần lưu ý ôn luyện thêm:
                  </span>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                    {mangCauSai.map((sk, idx) => (
                      <li key={idx}>{sk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
              >
                Làm lại đề thi này
              </button>
            </div>
          </div>
        )}

        {/* PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN */}
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b-2 border-amber-600 pb-2">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN
              </h3>
              <p className="text-xs text-slate-500">
                Gồm 30 câu hỏi (9,0 điểm) • Mỗi câu đúng được 0,3 điểm • Chọn duy nhất 1 đáp án
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
              30 câu / 9,0đ
            </span>
          </div>

          {shuffledMCQQuestions.map((q, index) => {
            const studentChoice = mcqAnswers[q.id];
            const isCorrect = studentChoice === q.correct;

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
                {/* TIÊU ĐỀ CÂU HỎI */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-md">
                      Câu {index + 1}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                      • {q.skill}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">0,3 điểm</span>
                </div>

                {/* NỘI DUNG CÂU HỎI */}
                <div
                  className="text-sm sm:text-base text-slate-800 leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: q.text }}
                />

                {/* 4 PHƯƠNG ÁN LỰA CHỌN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const optionLetter = ['A', 'B', 'C', 'D'][optIdx];
                    const isSelected = studentChoice === opt.originalKey;
                    const isTheCorrectOption = opt.originalKey === q.correct;

                    let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';

                    if (!isSubmitted) {
                      if (isSelected) {
                        btnStyle = 'bg-amber-50 border-amber-600 text-amber-900 font-medium ring-1 ring-amber-600';
                      }
                    } else {
                      if (isTheCorrectOption) {
                        btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500';
                      } else if (isSelected && !isTheCorrectOption) {
                        btnStyle = 'bg-rose-100 border-rose-500 text-rose-950 line-through';
                      } else {
                        btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-70';
                      }
                    }

                    return (
                      <button
                        key={opt.originalKey}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() =>
                          setMcqAnswers((prev) => ({
                            ...prev,
                            [q.id]: opt.originalKey,
                          }))
                        }
                        className={`text-left px-4 py-3 rounded-lg border text-xs sm:text-sm transition flex items-start gap-2.5 cursor-pointer disabled:cursor-default ${btnStyle}`}
                      >
                        <span className="font-bold shrink-0">{optionLetter}.</span>
                        <span
                          className="flex-1"
                          dangerouslySetInnerHTML={{ __html: opt.text }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* LỜI GIẢI CHI TIẾT KHI ĐÃ NỘP BÀI */}
                {isSubmitted && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-lg text-sm text-slate-700">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                      <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                      </svg>
                      Lời giải chi tiết:
                    </div>
                    <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* PHẦN II: TỰ LUẬN (1 CÂU - 1,0 ĐIỂM) */}
        <section className="space-y-5 pt-6">
          <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-2">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                PHẦN II. TỰ LUẬN ỨNG DỤNG THỰC TẾ
              </h3>
              <p className="text-xs text-slate-500">
                Gồm 01 bài toán thực tế (1,0 điểm) chia làm 2 ý • Mỗi ý đúng được 0,5 điểm
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              2 ý / 1,0đ
            </span>
          </div>

          {SHORTANS_QUESTIONS_GK1_TOAN11.map((q) => {
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
                      Câu {q.number} {q.subLabel ? `(${q.subLabel})` : ''}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                      • {q.skill}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{q.points.toFixed(1)} điểm</span>
                </div>

                <div
                  className="text-sm sm:text-base text-slate-800 leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: q.text }}
                />

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nhập kết quả hoặc số liệu:
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
