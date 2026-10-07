'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_HEADER = 'SỞ GIÁO DỤC VÀ ĐÀO TẠO KIỂM TRA GIỮA KỲ I NĂM HỌC 2026 - 2027';
const EXAM_TITLE = 'ĐỀ THI MÔN: TOÁN LỚP 11 - THỜI GIAN: 90 PHÚT';
const EXAM_SUBTITLE = 'KIỂM TRA GIỮA KỲ I NĂM HỌC 2026 - 2027';
const EXAM_TIME_NOTE = '(Đề thi gồm 30 câu hỏi trắc nghiệm và 01 câu hỏi tự luận • Thời gian làm bài: 90 phút)';

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
  explanation: string; // Chỉ chứa nội dung giải toán học, TUYỆT ĐỐI KHÔNG hardcode chữ cái đáp án
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
// DỮ LIỆU ĐỀ THI GỐC (PARSE TỪ MÃ LATEX)
// isCorrect được xác định chính xác từ thẻ \True của mã nguồn
// ==========================================

const RAW_MCQ_QUESTIONS_GK1_2026: QuestionMCQ[] = [
  // CHỦ ĐỀ 1: GIÁ TRỊ LƯỢNG GIÁC CỦA GÓC LƯỢNG GIÁC (8 CÂU)
  {
    id: 'cau1',
    number: 1,
    type: 'mcq',
    skill: 'Đổi đơn vị đo góc từ độ sang rađian',
    points: 0.3,
    text: 'Góc có số đo $108^\\circ$ đổi sang đơn vị rađian bằng',
    options: [
      { text: '$\\dfrac{3\\pi}{5}$', isCorrect: true },
      { text: '$\\dfrac{2\\pi}{5}$', isCorrect: false },
      { text: '$\\dfrac{3\\pi}{10}$', isCorrect: false },
      { text: '$\\dfrac{4\\pi}{5}$', isCorrect: false },
    ],
    explanation:
      'Ta có $108^\\circ = 108 \\cdot \\dfrac{\\pi}{180} = \\dfrac{3\\pi}{5}\\text{ (rad)}$.',
  },
  {
    id: 'cau2',
    number: 2,
    type: 'mcq',
    skill: 'Xác định góc phần tư của điểm biểu diễn góc lượng giác trên đường tròn đơn vị',
    points: 0.3,
    text: 'Góc lượng giác có số đo $-\\dfrac{3\\pi}{4}\\text{ (rad)}$ có điểm biểu diễn trên đường tròn lượng giác thuộc góc phần tư thứ mấy?',
    options: [
      { text: 'Góc phần tư I', isCorrect: false },
      { text: 'Góc phần tư II', isCorrect: false },
      { text: 'Góc phần tư III', isCorrect: true },
      { text: 'Góc phần tư IV', isCorrect: false },
    ],
    explanation:
      'Vì $-\\pi < -\\dfrac{3\\pi}{4} < -\\dfrac{\\pi}{2}$ nên điểm biểu diễn của góc lượng giác có số đo $-\\dfrac{3\\pi}{4}$ nằm ở góc phần tư thứ III.',
  },
  {
    id: 'cau3',
    number: 3,
    type: 'mcq',
    skill: 'Nhận biết các hệ thức lượng giác cơ bản',
    points: 0.3,
    text: 'Khẳng định nào sau đây là <strong>ĐÚNG</strong> với mọi góc lượng giác $\\alpha$?',
    options: [
      { text: '$\\sin^2\\alpha + \\cos^2\\alpha = 1$', isCorrect: true },
      { text: '$\\sin\\alpha + \\cos\\alpha = 1$', isCorrect: false },
      { text: '$\\tan\\alpha \\cdot \\cot\\alpha = -1$', isCorrect: false },
      { text: '$1 + \\tan^2\\alpha = \\dfrac{1}{\\sin^2\\alpha}$', isCorrect: false },
    ],
    explanation:
      'Theo đẳng thức lượng giác cơ bản, với mọi $\\alpha \\in \\mathbb{R}$ ta luôn có $\\sin^2\\alpha + \\cos^2\\alpha = 1$.',
  },
  {
    id: 'cau4',
    number: 4,
    type: 'mcq',
    skill: 'Xét dấu các giá trị lượng giác theo góc phần tư thứ II',
    points: 0.3,
    text: 'Cho góc $\\alpha$ thỏa mãn $\\dfrac{\\pi}{2} < \\alpha < \\pi$. Khẳng định nào sau đây <strong>ĐÚNG</strong>?',
    options: [
      { text: '$\\sin\\alpha > 0$ và $\\cos\\alpha < 0$', isCorrect: true },
      { text: '$\\sin\\alpha < 0$ và $\\cos\\alpha < 0$', isCorrect: false },
      { text: '$\\sin\\alpha > 0$ và $\\cos\\alpha > 0$', isCorrect: false },
      { text: '$\\sin\\alpha < 0$ và $\\cos\\alpha > 0$', isCorrect: false },
    ],
    explanation:
      'Khi $\\dfrac{\\pi}{2} < \\alpha < \\pi$, điểm biểu diễn góc $\\alpha$ nằm ở góc phần tư thứ II, do đó tung độ $\\sin\\alpha > 0$ và hoành độ $\\cos\\alpha < 0$.',
  },
  {
    id: 'cau5',
    number: 5,
    type: 'mcq',
    skill: 'Tính giá trị biểu thức sử dụng công thức hai góc bù nhau',
    points: 0.3,
    text: 'Giá trị của biểu thức $P = \\cos 10^\\circ + \\cos 40^\\circ + \\cos 140^\\circ + \\cos 170^\\circ$ bằng',
    options: [
      { text: '$0$', isCorrect: true },
      { text: '$1$', isCorrect: false },
      { text: '$2$', isCorrect: false },
      { text: '$-1$', isCorrect: false },
    ],
    explanation:
      'Sử dụng công thức hai góc bù nhau: $\\cos 170^\\circ = -\\cos 10^\\circ$ và $\\cos 140^\\circ = -\\cos 40^\\circ$. Do đó $P = \\cos 10^\\circ + \\cos 40^\\circ - \\cos 40^\\circ - \\cos 10^\\circ = 0$.',
  },
  {
    id: 'cau6',
    number: 6,
    type: 'mcq',
    skill: 'Tính giá trị lượng giác khi biết một giá trị lượng giác và khoảng của góc',
    points: 0.3,
    text: 'Cho $\\sin\\alpha = \\dfrac{3}{5}$ với $\\dfrac{\\pi}{2} < \\alpha < \\pi$. Giá trị của $\\cos\\alpha$ bằng',
    options: [
      { text: '$-\\dfrac{4}{5}$', isCorrect: true },
      { text: '$\\dfrac{4}{5}$', isCorrect: false },
      { text: '$-\\dfrac{16}{25}$', isCorrect: false },
      { text: '$\\dfrac{16}{25}$', isCorrect: false },
    ],
    explanation:
      'Ta có $\\cos^2\\alpha = 1 - \\sin^2\\alpha = 1 - \\left(\\dfrac{3}{5}\\right)^2 = \\dfrac{16}{25}$. Vì $\\dfrac{\\pi}{2} < \\alpha < \\pi \\implies \\cos\\alpha < 0$, nên $\\cos\\alpha = -\\sqrt{\\dfrac{16}{25}} = -\\dfrac{4}{5}$.',
  },
  {
    id: 'cau7',
    number: 7,
    type: 'mcq',
    skill: 'Tính giá trị phân thức lượng giác thuần nhất bậc nhất',
    points: 0.3,
    text: 'Biết $\\tan\\alpha = 2$. Giá trị của biểu thức $A = \\dfrac{2\\sin\\alpha - 3\\cos\\alpha}{4\\sin\\alpha + 5\\cos\\alpha}$ bằng',
    options: [
      { text: '$\\dfrac{1}{13}$', isCorrect: true },
      { text: '$\\dfrac{1}{9}$', isCorrect: false },
      { text: '$-\\dfrac{1}{13}$', isCorrect: false },
      { text: '$\\dfrac{7}{13}$', isCorrect: false },
    ],
    explanation:
      'Chia cả tử và mẫu của biểu thức $A$ cho $\\cos\\alpha \\ne 0$: $$A = \\dfrac{2\\tan\\alpha - 3}{4\\tan\\alpha + 5} = \\dfrac{2(2) - 3}{4(2) + 5} = \\dfrac{1}{13}.$$',
  },
  {
    id: 'cau8',
    number: 8,
    type: 'mcq',
    skill: 'Tính độ dài cung tròn trên vành bánh xe',
    points: 0.3,
    text: 'Một bánh xe ô tô có bán kính $R = 40\\text{ cm}$ quay được một góc lượng giác $\\alpha = \\dfrac{7\\pi}{3}\\text{ (rad)}$. Độ dài quãng đường mà một điểm trên vành bánh xe di chuyển được xấp xỉ bằng',
    options: [
      { text: '$\\dfrac{280\\pi}{3}\\text{ cm}$', isCorrect: true },
      { text: '$\\dfrac{140\\pi}{3}\\text{ cm}$', isCorrect: false },
      { text: '$\\dfrac{70\\pi}{3}\\text{ cm}$', isCorrect: false },
      { text: '$280\\pi\\text{ cm}$', isCorrect: false },
    ],
    explanation:
      'Độ dài cung tròn tương ứng với góc lượng giác $\\alpha$ là: $$s = R \\cdot |\\alpha| = 40 \\cdot \\dfrac{7\\pi}{3} = \\dfrac{280\\pi}{3}\\text{ (cm)} \\approx 293{,}22\\text{ cm}.$$',
  },

  // CHỦ ĐỀ 2: CÔNG THỨC LƯỢNG GIÁC (6 CÂU)
  {
    id: 'cau9',
    number: 9,
    type: 'mcq',
    skill: 'Nhận biết công thức cộng cho cosin',
    points: 0.3,
    text: 'Khẳng định nào sau đây là đẳng thức <strong>ĐÚNG</strong>?',
    options: [
      { text: '$\\cos(a+b) = \\cos a \\cos b - \\sin a \\sin b$', isCorrect: true },
      { text: '$\\cos(a+b) = \\cos a \\cos b + \\sin a \\sin b$', isCorrect: false },
      { text: '$\\cos(a+b) = \\sin a \\cos b - \\cos a \\sin b$', isCorrect: false },
      { text: '$\\cos(a+b) = \\sin a \\cos b + \\cos a \\sin b$', isCorrect: false },
    ],
    explanation:
      'Theo công thức cộng đối với cosin: $\\cos(a+b) = \\cos a \\cos b - \\sin a \\sin b$.',
  },
  {
    id: 'cau10',
    number: 10,
    type: 'mcq',
    skill: 'Nhận biết công thức nhân đôi của hàm sin',
    points: 0.3,
    text: 'Công thức nhân đôi nào sau đây là <strong>ĐÚNG</strong>?',
    options: [
      { text: '$\\sin 2x = 2\\sin x \\cos x$', isCorrect: true },
      { text: '$\\sin 2x = \\sin x \\cos x$', isCorrect: false },
      { text: '$\\sin 2x = \\cos^2 x - \\sin^2 x$', isCorrect: false },
      { text: '$\\sin 2x = 2\\cos^2 x - 1$', isCorrect: false },
    ],
    explanation:
      'Công thức nhân đôi của hàm số sin là $\\sin 2x = 2\\sin x \\cos x$.',
  },
  {
    id: 'cau11',
    number: 11,
    type: 'mcq',
    skill: 'Tính giá trị sin 15 độ bằng công thức cộng',
    points: 0.3,
    text: 'Giá trị của biểu thức $M = \\sin 15^\\circ$ bằng',
    options: [
      { text: '$\\dfrac{\\sqrt{6} - \\sqrt{2}}{4}$', isCorrect: true },
      { text: '$\\dfrac{\\sqrt{6} + \\sqrt{2}}{4}$', isCorrect: false },
      { text: '$\\dfrac{\\sqrt{2} - \\sqrt{6}}{4}$', isCorrect: false },
      { text: '$\\dfrac{\\sqrt{3} - 1}{2}$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức cộng: $$\\sin 15^\\circ = \\sin(45^\\circ - 30^\\circ) = \\sin 45^\\circ \\cos 30^\\circ - \\cos 45^\\circ \\sin 30^\\circ = \\dfrac{\\sqrt{2}}{2} \\cdot \\dfrac{\\sqrt{3}}{2} - \\dfrac{\\sqrt{2}}{2} \\cdot \\dfrac{1}{2} = \\dfrac{\\sqrt{6} - \\sqrt{2}}{4}.$$',
  },
  {
    id: 'cau12',
    number: 12,
    type: 'mcq',
    skill: 'Rút gọn biểu thức lượng giác bằng công thức biến đổi tổng thành tích',
    points: 0.3,
    text: 'Rút gọn biểu thức $P = \\dfrac{\\sin 3x + \\sin x}{\\cos 3x + \\cos x}$ (khi các biểu thức có nghĩa) thu được kết quả là',
    options: [
      { text: '$\\tan 2x$', isCorrect: true },
      { text: '$\\cot 2x$', isCorrect: false },
      { text: '$\\tan x$', isCorrect: false },
      { text: '$\\cot x$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức biến đổi tổng thành tích: $$\\sin 3x + \\sin x = 2\\sin 2x \\cos x; \\quad \\cos 3x + \\cos x = 2\\cos 2x \\cos x.$$ Do đó $P = \\dfrac{2\\sin 2x \\cos x}{2\\cos 2x \\cos x} = \\dfrac{\\sin 2x}{\\cos 2x} = \\tan 2x$.',
  },
  {
    id: 'cau13',
    number: 13,
    type: 'mcq',
    skill: 'Tính giá trị biểu thức cos 2x + cos 4x theo cos x',
    points: 0.3,
    text: 'Cho $\\cos x = \\dfrac{1}{3}$. Giá trị của biểu thức $Q = \\cos 2x + \\cos 4x$ bằng',
    options: [
      { text: '$-\\dfrac{46}{81}$', isCorrect: true },
      { text: '$-\\dfrac{2}{9}$', isCorrect: false },
      { text: '$\\dfrac{17}{81}$', isCorrect: false },
      { text: '$-\\dfrac{38}{81}$', isCorrect: false },
    ],
    explanation:
      'Ta có $\\cos 2x = 2\\cos^2 x - 1 = 2\\left(\\dfrac{1}{3}\right)^2 - 1 = -\\dfrac{7}{9}$.<br>Mặt khác, $\\cos 4x = 2\\cos^2 2x - 1 = 2\\left(-\\dfrac{7}{9}\right)^2 - 1 = 2 \\cdot \\dfrac{49}{81} - 1 = \\dfrac{17}{81}$.<br>Vậy $Q = \\cos 2x + \\cos 4x = -\\dfrac{7}{9} + \\dfrac{17}{81} = \\dfrac{-63 + 17}{81} = -\\dfrac{46}{81}$.',
  },
  {
    id: 'cau14',
    number: 14,
    type: 'mcq',
    skill: 'Đẳng thức lượng giác trong tam giác ABC',
    points: 0.3,
    text: 'Trong mọi tam giác $ABC$, khẳng định nào sau đây luôn <strong>ĐÚNG</strong>?',
    options: [
      { text: '$\\sin A + \\sin B + \\sin C = 4\\cos\\dfrac{A}{2}\\cos\\dfrac{B}{2}\\cos\\dfrac{C}{2}$', isCorrect: true },
      { text: '$\\sin A + \\sin B + \\sin C = 4\\sin\\dfrac{A}{2}\\sin\\dfrac{B}{2}\\sin\\dfrac{C}{2}$', isCorrect: false },
      { text: '$\\cos A + \\cos B + \\cos C = 4\\sin\\dfrac{A}{2}\\sin\\dfrac{B}{2}\\sin\\dfrac{C}{2}$', isCorrect: false },
      { text: '$\\sin 2A + \\sin 2B + \\sin 2C = 2\\sin A \\sin B \\sin C$', isCorrect: false },
    ],
    explanation:
      'Ta có $\\sin A + \\sin B = 2\\sin\\dfrac{A+B}{2}\\cos\\dfrac{A-B}{2} = 2\\cos\\dfrac{C}{2}\\cos\\dfrac{A-B}{2}$.<br>Và $\\sin C = 2\\sin\\dfrac{C}{2}\\cos\\dfrac{C}{2}$.<br>Nên $\\sin A + \\sin B + \\sin C = 2\\cos\\dfrac{C}{2}\\left[\\cos\\dfrac{A-B}{2} + \\cos\\dfrac{A+B}{2}\right] = 2\\cos\\dfrac{C}{2} \\cdot 2\\cos\\dfrac{A}{2}\\cos\\dfrac{B}{2} = 4\\cos\\dfrac{A}{2}\\cos\\dfrac{B}{2}\\cos\\dfrac{C}{2}$.',
  },

  // CHỦ ĐỀ 3: HÀM SỐ LƯỢNG GIÁC (7 CÂU)
  {
    id: 'cau15',
    number: 15,
    type: 'mcq',
    skill: 'Tìm tập xác định của hàm số y = tan x',
    points: 0.3,
    text: 'Tập xác định $D$ của hàm số $y = \\tan x$ là',
    options: [
      { text: '$D = \\mathbb{R} \\setminus \\left\\{\\dfrac{\\pi}{2} + k\\pi, k \\in \\mathbb{Z}\\right\\}$', isCorrect: true },
      { text: '$D = \\mathbb{R} \\setminus \\{k\\pi, k \\in \\mathbb{Z}\\}$', isCorrect: false },
      { text: '$D = \\mathbb{R}$', isCorrect: false },
      { text: '$D = [-1; 1]$', isCorrect: false },
    ],
    explanation:
      'Hàm số $y = \\tan x = \\dfrac{\\sin x}{\\cos x}$ xác định khi $\\cos x \\ne 0 \\iff x \\ne \\dfrac{\\pi}{2} + k\\pi\\text{ }(k \\in \\mathbb{Z})$.',
  },
  {
    id: 'cau16',
    number: 16,
    type: 'mcq',
    skill: 'Nhận biết hàm số chẵn trong các hàm số lượng giác cơ bản',
    points: 0.3,
    text: 'Hàm số nào sau đây là hàm số chẵn trên tập xác định của nó?',
    options: [
      { text: '$y = \\cos x$', isCorrect: true },
      { text: '$y = \\sin x$', isCorrect: false },
      { text: '$y = \\tan x$', isCorrect: false },
      { text: '$y = \\cot x$', isCorrect: false },
    ],
    explanation:
      'Hàm số $y = \\cos x$ có tập xác định $D = \\mathbb{R}$ và $\\cos(-x) = \\cos x, \\forall x \\in \\mathbb{R}$ nên là hàm số chẵn. Các hàm số $\\sin x, \\tan x, \\cot x$ đều là hàm số lẻ.',
  },
  {
    id: 'cau17',
    number: 17,
    type: 'mcq',
    skill: 'Tìm chu kỳ tuần hoàn của hàm số sin omega x',
    points: 0.3,
    text: 'Chu kỳ tuần hoàn $T$ của hàm số $y = \\sin 3x$ bằng',
    options: [
      { text: '$T = \\dfrac{2\\pi}{3}$', isCorrect: true },
      { text: '$T = 2\\pi$', isCorrect: false },
      { text: '$T = \\pi$', isCorrect: false },
      { text: '$T = 6\\pi$', isCorrect: false },
    ],
    explanation:
      'Hàm số $y = \\sin(\\omega x + \\varphi)$ với $\\omega = 3 > 0$ có chu kỳ tuần hoàn $T = \\dfrac{2\\pi}{\\omega} = \\dfrac{2\\pi}{3}$.',
  },
  {
    id: 'cau18',
    number: 18,
    type: 'mcq',
    skill: 'Tìm giá trị lớn nhất và nhỏ nhất của hàm số a cos(u) + b',
    points: 0.3,
    text: 'Giá trị lớn nhất $M$ và giá trị nhỏ nhất $m$ của hàm số $y = 3\\cos\\left(2x - \\dfrac{\\pi}{4}\\right) + 1$ lần lượt là',
    options: [
      { text: '$M = 4, m = -2$', isCorrect: true },
      { text: '$M = 3, m = -3$', isCorrect: false },
      { text: '$M = 4, m = 1$', isCorrect: false },
      { text: '$M = 2, m = -2$', isCorrect: false },
    ],
    explanation:
      'Vì $-1 \\le \\cos\\left(2x - \\dfrac{\\pi}{4}\\right) \\le 1, \\forall x \\in \\mathbb{R}$ nên: $$-3 + 1 \\le y \\le 3 + 1 \\iff -2 \\le y \\le 4.$$ Do đó $M = 4$ và $m = -2$.',
  },
  {
    id: 'cau19',
    number: 19,
    type: 'mcq',
    skill: 'Xét tính đơn điệu của hàm số sin x trên khoảng con',
    points: 0.3,
    text: 'Hàm số $y = \\sin x$ đồng biến trên khoảng nào sau đây?',
    options: [
      { text: '$\\left(0; \\dfrac{\\pi}{2}\\right)$', isCorrect: true },
      { text: '$\\left(\\dfrac{\\pi}{2}; \\pi\\right)$', isCorrect: false },
      { text: '$\\left(\\pi; \\dfrac{3\\pi}{2}\\right)$', isCorrect: false },
      { text: '$(0; \\pi)$', isCorrect: false },
    ],
    explanation:
      'Hàm số $y = \\sin x$ đồng biến trên mỗi khoảng $\\left(-\\dfrac{\\pi}{2} + k2\\pi; \\dfrac{\\pi}{2} + k2\\pi\\right)$. Với $k=0$, hàm số đồng biến trên $\\left(-\\dfrac{\\pi}{2}; \\dfrac{\\pi}{2}\\right)$, do đó đồng biến trên khoảng con $\\left(0; \\dfrac{\\pi}{2}\\right)$.',
  },
  {
    id: 'cau20',
    number: 20,
    type: 'mcq',
    skill: 'Mô hình hóa cực trị độ cao mực nước theo thời gian trong ngày',
    points: 0.3,
    text: 'Độ cao mực nước tại một cảng biển theo thời gian $t$ (giờ, $0 \\le t \\le 24$) trong ngày được mô hình hóa bởi hàm số $h(t) = 3\\cos\\left(\\dfrac{\\pi t}{6}\\right) + 8$ (mét). Mực nước đạt độ cao lớn nhất bằng bao nhiêu mét và vào những thời điểm nào?',
    options: [
      { text: '$11\\text{ m}$ vào các thời điểm $t = 0\\text{ h}, t = 12\\text{ h}, t = 24\\text{ h}$', isCorrect: true },
      { text: '$11\\text{ m}$ vào các thời điểm $t = 6\\text{ h}, t = 18\\text{ h}$', isCorrect: false },
      { text: '$8\\text{ m}$ vào các thời điểm $t = 3\\text{ h}, t = 9\\text{ h}$', isCorrect: false },
      { text: '$5\\text{ m}$ vào các thời điểm $t = 6\\text{ h}, t = 18\\text{ h}$', isCorrect: false },
    ],
    explanation:
      'Vì $\\cos\\left(\\dfrac{\\pi t}{6}\\right) \\le 1 \\implies h(t) \\le 3(1) + 8 = 11\\text{ (m)}$.<br>Mực nước đạt cực đại $11\\text{ m}$ khi $\\cos\\left(\\dfrac{\\pi t}{6}\\right) = 1 \\iff \\dfrac{\\pi t}{6} = k2\\pi \\iff t = 12k\\text{ }(k \\in \\mathbb{Z})$.<br>Do $0 \\le t \\le 24 \\implies t \\in \\{0; 12; 24\\}$.',
  },
  {
    id: 'cau21',
    number: 21,
    type: 'mcq',
    skill: 'Tìm tham số m để hàm số chứa căn thức xác định trên R',
    points: 0.3,
    text: 'Tìm tất cả các giá trị của tham số $m$ để hàm số $y = \\sqrt{2\\sin x - m + 1}$ xác định với mọi $x \\in \\mathbb{R}$.',
    options: [
      { text: '$m \\le -1$', isCorrect: true },
      { text: '$m \\ge 3$', isCorrect: false },
      { text: '$m \\le 3$', isCorrect: false },
      { text: '$-1 \\le m \\le 3$', isCorrect: false },
    ],
    explanation:
      'Hàm số xác định với mọi $x \\in \\mathbb{R} \\iff 2\\sin x - m + 1 \\ge 0, \\forall x \\in \\mathbb{R}$<br>$\\iff m \\le 2\\sin x + 1, \\forall x \\in \\mathbb{R} \\iff m \\le \\min_{x \\in \\mathbb{R}} (2\\sin x + 1)$.<br>Vì $\\min_{x \\in \\mathbb{R}} (2\\sin x + 1) = 2(-1) + 1 = -1$, nên $m \\le -1$.',
  },

  // CHỦ ĐỀ 4: PHƯƠNG TRÌNH LƯỢNG GIÁC CƠ BẢN (9 CÂU)
  {
    id: 'cau22',
    number: 22,
    type: 'mcq',
    skill: 'Công thức nghiệm phương trình sin x = sin alpha',
    points: 0.3,
    text: 'Nghiệm của phương trình $\\sin x = \\sin\\alpha$ là',
    options: [
      { text: '$\\left[\\begin{array}{l} x = \\alpha + k2\\pi \\\\ x = \\pi - \\alpha + k2\\pi \\end{array}\\right. (k \\in \\mathbb{Z})$', isCorrect: true },
      { text: '$\\left[\\begin{array}{l} x = \\alpha + k2\\pi \\\\ x = -\\alpha + k2\\pi \\end{array}\\right. (k \\in \\mathbb{Z})$', isCorrect: false },
      { text: '$\\left[\\begin{array}{l} x = \\alpha + k\\pi \\\\ x = \\pi - \\alpha + k\\pi \\end{array}\\right. (k \\in \\mathbb{Z})$', isCorrect: false },
      { text: '$x = \\alpha + k\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: false },
    ],
    explanation:
      'Theo công thức nghiệm của phương trình lượng giác cơ bản đối với hàm sin: $\\sin x = \\sin\\alpha \\iff \\left[\\begin{array}{l} x = \\alpha + k2\\pi \\\\ x = \\pi - \\alpha + k2\\pi \\end{array}\\right. (k \\in \\mathbb{Z})$.',
  },
  {
    id: 'cau23',
    number: 23,
    type: 'mcq',
    skill: 'Giải phương trình cos x = 1/2',
    points: 0.3,
    text: 'Nghiệm của phương trình $\\cos x = \\dfrac{1}{2}$ là',
    options: [
      { text: '$x = \\pm \\dfrac{\\pi}{3} + k2\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: true },
      { text: '$x = \\pm \\dfrac{\\pi}{6} + k2\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: false },
      { text: '$x = \\dfrac{\\pi}{3} + k\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: false },
      { text: '$x = \\pm \\dfrac{2\\pi}{3} + k2\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: false },
    ],
    explanation:
      'Ta có $\\cos x = \\dfrac{1}{2} = \\cos\\dfrac{\\pi}{3} \\iff x = \\pm \\dfrac{\\pi}{3} + k2\\pi\\text{ }(k \\in \\mathbb{Z})$.',
  },
  {
    id: 'cau24',
    number: 24,
    type: 'mcq',
    skill: 'Giải phương trình tan x = sqrt(3)',
    points: 0.3,
    text: 'Phương trình $\\tan x = \\sqrt{3}$ có họ nghiệm là',
    options: [
      { text: '$x = \\dfrac{\\pi}{3} + k\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: true },
      { text: '$x = \\dfrac{\\pi}{6} + k\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: false },
      { text: '$x = \\dfrac{\\pi}{3} + k2\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: false },
      { text: '$x = -\\dfrac{\\pi}{3} + k\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: false },
    ],
    explanation:
      'Ta có $\\tan x = \\sqrt{3} = \\tan\\dfrac{\\pi}{3} \\iff x = \\dfrac{\\pi}{3} + k\\pi\\text{ }(k \\in \\mathbb{Z})$.',
  },
  {
    id: 'cau25',
    number: 25,
    type: 'mcq',
    skill: 'Giải phương trình cos 2x = cos(x + pi/4)',
    points: 0.3,
    text: 'Nghiệm của phương trình $\\cos 2x = \\cos\\left(x + \\dfrac{\\pi}{4}\\right)$ là',
    options: [
      { text: '$\\left[\\begin{array}{l} x = \\dfrac{\\pi}{4} + k2\\pi \\\\ x = -\\dfrac{\\pi}{12} + \\dfrac{k2\\pi}{3} \\end{array}\\right. (k \\in \\mathbb{Z})$', isCorrect: true },
      { text: '$\\left[\\begin{array}{l} x = \\dfrac{\\pi}{4} + k2\\pi \\\\ x = \\dfrac{\\pi}{12} + k2\\pi \\end{array}\\right. (k \\in \\mathbb{Z})$', isCorrect: false },
      { text: '$\\left[\\begin{array}{l} x = \\dfrac{\\pi}{4} + k\\pi \\\\ x = -\\dfrac{\\pi}{12} + k\\pi \\end{array}\\right. (k \\in \\mathbb{Z})$', isCorrect: false },
      { text: '$\\left[\\begin{array}{l} x = -\\dfrac{\\pi}{4} + k2\\pi \\\\ x = \\dfrac{\\pi}{12} + \\dfrac{k2\\pi}{3} \\end{array}\\right. (k \\in \\mathbb{Z})$', isCorrect: false },
    ],
    explanation:
      'Phương trình tương đương với: $$\\left[\\begin{array}{l} 2x = x + \\dfrac{\\pi}{4} + k2\\pi \\\\ 2x = -\\left(x + \\dfrac{\\pi}{4}\\right) + k2\\pi \\end{array}\\right. \\iff \\left[\\begin{array}{l} x = \\dfrac{\\pi}{4} + k2\\pi \\\\ 3x = -\\dfrac{\\pi}{4} + k2\\pi \\end{array}\\right. \\iff \\left[\\begin{array}{l} x = \\dfrac{\\pi}{4} + k2\\pi \\\\ x = -\\dfrac{\\pi}{12} + \\dfrac{k2\\pi}{3} \\end{array}\\right. (k \\in \\mathbb{Z}).$$',
  },
  {
    id: 'cau26',
    number: 26,
    type: 'mcq',
    skill: 'Tìm số nghiệm của phương trình sin trên đoạn cho trước',
    points: 0.3,
    text: 'Số nghiệm của phương trình $\\sin\\left(x - \\dfrac{\\pi}{3}\\right) = 0$ trên đoạn $[0; 2\\pi]$ là',
    options: [
      { text: '$2$', isCorrect: true },
      { text: '$1$', isCorrect: false },
      { text: '$3$', isCorrect: false },
      { text: '$4$', isCorrect: false },
    ],
    explanation:
      'Ta có $\\sin\\left(x - \\dfrac{\\pi}{3}\\right) = 0 \\iff x - \\dfrac{\\pi}{3} = k\\pi \\iff x = \\dfrac{\\pi}{3} + k\\pi\\text{ }(k \\in \\mathbb{Z})$.<br>Xét $0 \\le \\dfrac{\\pi}{3} + k\\pi \\le 2\\pi \\iff -\\dfrac{1}{3} \\le k \\le \\dfrac{5}{3} \\implies k \\in \\{0; 1\\}$.<br>Tương ứng ta có 2 nghiệm: $x_1 = \\dfrac{\\pi}{3}$ và $x_2 = \\dfrac{4\\pi}{3}$.',
  },
  {
    id: 'cau27',
    number: 27,
    type: 'mcq',
    skill: 'Tính tổng các nghiệm của phương trình cos x = 0 trên đoạn',
    points: 0.3,
    text: 'Tổng tất cả các nghiệm của phương trình $\\cos x = 0$ trên đoạn $[0; 2\\pi]$ bằng',
    options: [
      { text: '$2\\pi$', isCorrect: true },
      { text: '$\\pi$', isCorrect: false },
      { text: '$3\\pi$', isCorrect: false },
      { text: '$\\dfrac{5\\pi}{2}$', isCorrect: false },
    ],
    explanation:
      'Ta có $\\cos x = 0 \\iff x = \\dfrac{\\pi}{2} + k\\pi\\text{ }(k \\in \\mathbb{Z})$.<br>Trên $[0; 2\\pi]$, các nghiệm là $x_1 = \\dfrac{\\pi}{2}$ và $x_2 = \\dfrac{3\\pi}{2}$.<br>Tổng các nghiệm $S = \\dfrac{\\pi}{2} + \\dfrac{3\\pi}{2} = 2\\pi$.',
  },
  {
    id: 'cau28',
    number: 28,
    type: 'mcq',
    skill: 'Giải phương trình bậc hai đối với một hàm số lượng giác',
    points: 0.3,
    text: 'Tập nghiệm của phương trình $2\\cos^2 x - 3\\cos x + 1 = 0$ là',
    options: [
      { text: '$x = k2\\pi, x = \\pm \\dfrac{\\pi}{3} + k2\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: true },
      { text: '$x = k\\pi, x = \\pm \\dfrac{\\pi}{6} + k2\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: false },
      { text: '$x = k2\\pi, x = \\dfrac{\\pi}{3} + k\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: false },
      { text: '$x = \\pm \\dfrac{\\pi}{3} + k2\\pi\\text{ }(k \\in \\mathbb{Z})$', isCorrect: false },
    ],
    explanation:
      'Đặt $t = \\cos x\\text{ }(|t| \\le 1)$, phương trình trở thành: $2t^2 - 3t + 1 = 0 \\iff \\left[\\begin{array}{l} t = 1 \\\\ t = \\dfrac{1}{2} \\end{array}\\right.$.<br>- Với $\\cos x = 1 \\iff x = k2\\pi\\text{ }(k \\in \\mathbb{Z})$.<br>- Với $\\cos x = \\dfrac{1}{2} \\iff x = \\pm \\dfrac{\\pi}{3} + k2\\pi\\text{ }(k \\in \\mathbb{Z})$.',
  },
  {
    id: 'cau29',
    number: 29,
    type: 'mcq',
    skill: 'Bài toán thực tế tìm thời điểm đạt độ cao mực nước biển trong ngày',
    points: 0.3,
    text: 'Chiều cao mực nước biển tại một trạm đo sau $t$ giờ kể từ nửa đêm được cho bởi công thức $h(t) = 4\\sin\\left(\\dfrac{\\pi t}{6} - \\dfrac{\\pi}{2}\\right) + 5$ (mét) với $0 \\le t \\le 24$. Trong một ngày, mực nước biển đạt độ cao $7\\text{ m}$ vào các thời điểm nào?',
    options: [
      { text: '$t = 4\\text{ h}, t = 8\\text{ h}, t = 16\\text{ h}, t = 20\\text{ h}$', isCorrect: true },
      { text: '$t = 2\\text{ h}, t = 10\\text{ h}, t = 14\\text{ h}, t = 22\\text{ h}$', isCorrect: false },
      { text: '$t = 6\\text{ h}, t = 18\\text{ h}$', isCorrect: false },
      { text: '$t = 3\\text{ h}, t = 9\\text{ h}, t = 15\\text{ h}, t = 21\\text{ h}$', isCorrect: false },
    ],
    explanation:
      'Yêu cầu bài toán $\\iff 4\\sin\\left(\\dfrac{\\pi t}{6} - \\dfrac{\\pi}{2}\\right) + 5 = 7 \\iff \\sin\\left(\\dfrac{\\pi t}{6} - \\dfrac{\\pi}{2}\\right) = \\dfrac{1}{2}$.<br>$$\\iff \\left[\\begin{array}{l} \\dfrac{\\pi t}{6} - \\dfrac{\\pi}{2} = \\dfrac{\\pi}{6} + k2\\pi \\\\ \\dfrac{\\pi t}{6} - \\dfrac{\\pi}{2} = \\dfrac{5\\pi}{6} + k2\\pi \\end{array}\\right. \\iff \\left[\\begin{array}{l} t = 4 + 12k \\\\ t = 8 + 12k \\end{array}\\right. (k \\in \\mathbb{Z})$$<br>Vì $0 \\le t \\le 24$:<br>- Khi $k=0 \\implies t = 4\\text{ h}$ hoặc $t = 8\\text{ h}$.<br>- Khi $k=1 \\implies t = 16\\text{ h}$ hoặc $t = 20\\text{ h}$.<br>Vậy mực nước đạt $7\\text{ m}$ vào các thời điểm $4\\text{ h}, 8\\text{ h}, 16\\text{ h}, 20\\text{ h}$.',
  },
  {
    id: 'cau30',
    number: 30,
    type: 'mcq',
    skill: 'Tìm giá trị nguyên của tham số m để phương trình asin x + bcos x = c có nghiệm',
    points: 0.3,
    text: 'Có bao nhiêu giá trị nguyên của tham số $m \\in [-5; 5]$ để phương trình $(m - 1)\\sin x + \\cos x = 2$ có nghiệm?',
    options: [
      { text: '$8$', isCorrect: true },
      { text: '$7$', isCorrect: false },
      { text: '$9$', isCorrect: false },
      { text: '$6$', isCorrect: false },
    ],
    explanation:
      'Phương trình $(m - 1)\\sin x + \\cos x = 2$ có dạng $a\\sin x + b\\cos x = c$ với $a = m - 1, b = 1, c = 2$.<br>Điều kiện có nghiệm là $a^2 + b^2 \\ge c^2$: $$(m - 1)^2 + 1^2 \\ge 2^2 \\iff (m - 1)^2 \\ge 3 \\iff \\left[\\begin{array}{l} m \\ge 1 + \\sqrt{3} \\approx 2{,}732 \\\\ m \\le 1 - \\sqrt{3} \\approx -0{,}732 \\end{array}\\right.$$<br>Vì $m \\in \\mathbb{Z}$ và $m \\in [-5; 5]$:<br>- $m \\le -0{,}732 \\implies m \\in \\{-5; -4; -3; -2; -1\\}$ (có 5 giá trị).<br>- $m \\ge 2{,}732 \\implies m \\in \\{3; 4; 5\\}$ (có 3 giá trị).<br>Vậy có tổng cộng $5 + 3 = 8$ giá trị nguyên của $m$.',
  },
];

// PHẦN II. TỰ LUẬN (1 CÂU GỒM 2 Ý: a & b - TỔNG 1,0 ĐIỂM)
const SHORTANS_QUESTIONS_GK1_2026: QuestionShortAns[] = [
  {
    id: 'cau31a',
    number: 31,
    subLabel: 'Ý a',
    type: 'shortans',
    skill: 'Tìm cực trị vận tốc gió theo mô hình hàm số lượng giác',
    points: 0.5,
    text: '<strong>Bài toán mô hình hóa khí tượng hải văn:</strong><br>Vận tốc gió $v$ (đơn vị: km/h) tại một trạm quan trắc khí tượng bờ biển theo thời gian $t$ (giờ, $0 \\le t \\le 24$) trong một ngày được mô hình hóa bằng hàm số lượng giác: $$v(t) = 10\\sin\\left(\\dfrac{\\pi t}{12} - \\dfrac{\\pi}{3}\\right) + 25.$$<br><strong>Ý a) (0,5 điểm):</strong> Tìm vận tốc gió lớn nhất và vận tốc gió nhỏ nhất trong ngày, cùng các thời điểm tương ứng xảy ra cực trị đó.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'Max: 35 km/h lúc 10h; Min: 15 km/h lúc 22h',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('35') && clean.includes('15') && clean.includes('10') && clean.includes('22');
    },
    explanation:
      '<strong>Lời giải chi tiết Ý a (0,5 điểm):</strong><br>- Với mọi $0 \\le t \\le 24$, ta có $-1 \\le \\sin\\left(\\dfrac{\\pi t}{12} - \\dfrac{\\pi}{3}\\right) \\le 1 \\implies 15 \\le v(t) \\le 35\\text{ (km/h)}$.<br>- Vận tốc gió lớn nhất $\\max v(t) = 35\\text{ km/h}$ khi $\\sin\\left(\\dfrac{\\pi t}{12} - \\dfrac{\\pi}{3}\\right) = 1 \\iff \\dfrac{\\pi t}{12} - \\dfrac{\\pi}{3} = \\dfrac{\\pi}{2} + k2\\pi \\iff t = 10 + 24k$. Do $0 \\le t \\le 24 \\implies t = 10\\text{ (giờ)}$. (0,25đ)<br>- Vận tốc gió nhỏ nhất $\\min v(t) = 15\\text{ km/h}$ khi $\\sin\\left(\\dfrac{\\pi t}{12} - \\dfrac{\\pi}{3}\\right) = -1 \\iff \\dfrac{\\pi t}{12} - \\dfrac{\\pi}{3} = -\\dfrac{\\pi}{2} + k2\\pi \\iff t = -2 + 24k$. Với $0 \\le t \\le 24 \\implies k = 1 \\implies t = 22\\text{ (giờ)}$. (0,25đ)',
  },
  {
    id: 'cau31b',
    number: 31,
    subLabel: 'Ý b',
    type: 'shortans',
    skill: 'Giải bất phương trình lượng giác tìm khoảng thời gian vận tốc gió vượt mức',
    points: 0.5,
    text: '<strong>Ý b) (0,5 điểm):</strong> Xác định tất cả các khoảng thời gian trong ngày mà vận tốc gió $v(t)$ vượt quá $30\\text{ km/h}$.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'Khoảng thời gian: từ 6 giờ đến 14 giờ (hoặc 6 < t < 14)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return (clean.includes('6') && clean.includes('14')) || clean.includes('(6;14)') || clean.includes('[6;14]');
    },
    explanation:
      '<strong>Lời giải chi tiết Ý b (0,5 điểm):</strong><br>- Vận tốc gió vượt quá $30\\text{ km/h} \\iff v(t) > 30 \\iff 10\\sin\\left(\\dfrac{\\pi t}{12} - \\dfrac{\\pi}{3}\\right) + 25 > 30 \\iff \\sin\\left(\\dfrac{\\pi t}{12} - \\dfrac{\\pi}{3}\\right) > \\dfrac{1}{2}$. (0,25đ)<br>- Đặt $X = \\dfrac{\\pi t}{12} - \\dfrac{\\pi}{3}$. Vì $0 \\le t \\le 24 \\implies -\\dfrac{\\pi}{3} \\le X \\le \\dfrac{5\\pi}{3}$.<br>- Trên đoạn $\\left[-\\dfrac{\\pi}{3}; \\dfrac{5\\pi}{3}\\right]$, bất phương trình $\\sin X > \\dfrac{1}{2} \\iff \\dfrac{\\pi}{6} < X < \\dfrac{5\\pi}{6} \\iff \\dfrac{\\pi}{6} < \\dfrac{\\pi t}{12} - \\dfrac{\\pi}{3} < \\dfrac{5\\pi}{6} \\iff \\dfrac{\\pi}{2} < \\dfrac{\\pi t}{12} < \\dfrac{7\\pi}{6} \\iff 6 < t < 14$.<br>Vậy trong khoảng thời gian từ $6\\text{ giờ}$ đến $14\\text{ giờ}$ (tức từ $6\\text{h}$ sáng đến $14\\text{h}$ chiều), vận tốc gió tại trạm vượt quá $30\\text{ km/h}$. (0,25đ)',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan11GiuaKy120262027Page() {
  // 1. STATE THÔNG TIN HỌC SINH
  const [tenHocSinh, setTenHocSinh] = useState<string>('');
  const [maHocSinh, setMaHocSinh] = useState<string>('');
  const [lopNhom, setLopNhom] = useState<string>('');

  // 2. STATE LÀM BÀI & TRẢ LỜI
  // mcqAnswers lưu index (0, 1, 2, 3) mà học sinh chọn TRÊN MẢNG SHUFFLED HIỆN TẠI
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State lưu danh sách câu hỏi trắc nghiệm đã xáo trộn phương án (Fisher-Yates)
  // Mỗi câu hỏi chứa options dạng Object [{ text, isCorrect }]
  const [shuffledMCQQuestions, setShuffledMCQQuestions] = useState<QuestionMCQ[]>(() =>
    RAW_MCQ_QUESTIONS_GK1_2026.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ ...opt })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) chạy trong useEffect trên client
  useEffect(() => {
    const shuffled = RAW_MCQ_QUESTIONS_GK1_2026.map((q) => ({
      ...q,
      options: shuffleOptions(q.options),
    }));
    setShuffledMCQQuestions(shuffled);
  }, []);

  // CẬP NHẬT TIÊU ĐỀ TRÌNH DUYỆT (DOCUMENT.TITLE) ĐỘNG TỪ MÃ NGUỒN LATEX
  useEffect(() => {
    document.title = `${EXAM_HEADER} - ${EXAM_TITLE}`;
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
    shuffledMCQQuestions.length + SHORTANS_QUESTIONS_GK1_2026.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 5. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  // LOGIC CHẤM ĐIỂM ĐỘNG: KIỂM TRA CHÍNH XÁC option.isCorrect === true TỪ LỰA CHỌN CỦA HỌC SINH
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS11-GK1-2026';
    const lop = lopNhom.trim() || 'Lớp 11';

    if (!tenHocSinh.trim()) {
      const confirmAnonymous = window.confirm(
        'Bạn chưa nhập Họ và tên. Bạn có muốn nộp bài với tên "Học sinh ẩn danh" không?'
      );
      if (!confirmAnonymous) return;
    }

    setIsSubmitting(true);

    let calculatedScore = 0;
    let correctMCQ = 0;
    let correctShort = 0;
    const wrongSkills: string[] = [];

    // Chấm trắc nghiệm: Kiểm tra option.isCorrect === true dựa trên lựa chọn hiện tại
    shuffledMCQQuestions.forEach((q) => {
      const chosenIndex = mcqAnswers[q.id];
      if (chosenIndex !== undefined) {
        const chosenOption = q.options[chosenIndex];
        if (chosenOption && chosenOption.isCorrect === true) {
          calculatedScore += q.points;
          correctMCQ += 1;
        } else {
          wrongSkills.push(q.skill);
        }
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm tự luận (2 ý x 0.5đ = 1.0đ)
    SHORTANS_QUESTIONS_GK1_2026.forEach((q) => {
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
      de_thi: `${EXAM_HEADER} - ${EXAM_TITLE}`,
      diem_so: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${shuffledMCQQuestions.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_GK1_2026.length}`,
      thoi_gian_lam_phut: thoiGianLamPhut,
      thoi_gian_nop: new Date().toLocaleString('vi-VN'),
      ky_nang_sai: uniqueWrongSkills,
      dap_an_mcq_selected: mcqAnswers,
      dap_an_tu_luan: shortAnswers,
    };

    const webhookGASPayload = {
      action: 'submit_test',
      data: {
        Student_ID: ma,
        Task_ID: 'KIEM_TRA_GIUA_KY_1_TOAN_11_2026_2027_90P',
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

      const reshuffled = RAW_MCQ_QUESTIONS_GK1_2026.map((q) => ({
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
              {EXAM_HEADER}
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
                placeholder="VD: HS11-003"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS11-GK1-2026'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '11'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Trắc nghiệm: <strong>{soCauDungMCQ}/{shuffledMCQQuestions.length}</strong> câu đúng</span>
                  <span>Tự luận: <strong>{soCauDungShort}/{SHORTANS_QUESTIONS_GK1_2026.length}</strong> ý đúng</span>
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
              A. PHẦN TRẮC NGHIỆM (30 CÂU - 9,0 ĐIỂM)
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
              B. PHẦN TỰ LUẬN (1 CÂU - 1,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              Gồm 2 ý: a) (0,5 điểm) và b) (0,5 điểm)
            </span>
          </div>

          <div className="space-y-4">
            {SHORTANS_QUESTIONS_GK1_2026.map((q) => {
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
