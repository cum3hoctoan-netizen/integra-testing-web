'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_HEADER = 'SỞ GIÁO DỤC VÀ ĐÀO TẠO KIỂM TRA ĐỊNH KỲ (45 PHÚT) - MÔN TOÁN LỚP 11';
const EXAM_TITLE = 'ĐỀ KIỂM TRA ĐỊNH KỲ (45 PHÚT) - MÔN TOÁN LỚP 11';
const EXAM_SUBTITLE = 'CHỦ ĐỀ: CẤP SỐ CỘNG';
const EXAM_TIME_NOTE = '(Thời gian làm bài: 45 phút • 14 câu trắc nghiệm 7,0 điểm + 02 câu tự luận 3,0 điểm)';

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
  explanation: string; // Nội dung lời giải toán học thuần túy, TUYỆT ĐỐI không hardcode chữ cái đáp án
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
// ==========================================

const RAW_MCQ_QUESTIONS_CSC: QuestionMCQ[] = [
  // Câu 1 - Nhận biết
  {
    id: 'csc_cau1',
    number: 1,
    type: 'mcq',
    skill: 'Nhận biết dãy số là một cấp số cộng',
    points: 0.5,
    text: 'Dãy số nào sau đây là một cấp số cộng?',
    options: [
      { text: '$u_n = 2^n$', isCorrect: false },
      { text: '$u_n = 3n + 1$', isCorrect: true },
      { text: '$u_n = n^2$', isCorrect: false },
      { text: '$u_n = \\dfrac{1}{n}$', isCorrect: false },
    ],
    explanation:
      'Xét hiệu $u_{n+1} - u_n = [3(n+1) + 1] - (3n + 1) = 3$ (hằng số không đổi với mọi $n \\ge 1$).<br>Do đó dãy số $u_n = 3n + 1$ là một cấp số cộng với công sai $d = 3$.',
  },
  // Câu 2 - Nhận biết
  {
    id: 'csc_cau2',
    number: 2,
    type: 'mcq',
    skill: 'Công thức số hạng tổng quát của cấp số cộng',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1$ và công sai $d$. Công thức tính số hạng tổng quát $u_n$ ($n \\ge 2$) là',
    options: [
      { text: '$u_n = u_1 + nd$', isCorrect: false },
      { text: '$u_n = u_1 + (n-1)d$', isCorrect: true },
      { text: '$u_n = u_1 \\cdot d^{n-1}$', isCorrect: false },
      { text: '$u_n = u_1 - (n-1)d$', isCorrect: false },
    ],
    explanation:
      'Theo định nghĩa và tính chất của cấp số cộng, số hạng tổng quát thứ $n$ được tính bởi công thức $u_n = u_1 + (n-1)d$.',
  },
  // Câu 3 - Nhận biết
  {
    id: 'csc_cau3',
    number: 3,
    type: 'mcq',
    skill: 'Tìm công sai d của cấp số cộng từ hai số hạng đầu',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ có $u_1 = 3$ và $u_2 = 7$. Công sai $d$ của cấp số cộng đó bằng',
    options: [
      { text: '$d = 4$', isCorrect: true },
      { text: '$d = -4$', isCorrect: false },
      { text: '$d = 10$', isCorrect: false },
      { text: '$d = \\dfrac{7}{3}$', isCorrect: false },
    ],
    explanation:
      'Công sai của cấp số cộng là $d = u_2 - u_1 = 7 - 3 = 4$.',
  },
  // Câu 4 - Nhận biết
  {
    id: 'csc_cau4',
    number: 4,
    type: 'mcq',
    skill: 'Công thức tính tổng n số hạng đầu tiên của cấp số cộng',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1$ và số hạng thứ $n$ là $u_n$. Tổng $n$ số hạng đầu tiên $S_n$ của cấp số cộng được tính theo công thức nào sau đây?',
    options: [
      { text: '$S_n = \\dfrac{n(u_1 + u_n)}{2}$', isCorrect: true },
      { text: '$S_n = n(u_1 + u_n)$', isCorrect: false },
      { text: '$S_n = \\dfrac{u_1 + u_n}{2n}$', isCorrect: false },
      { text: '$S_n = \\dfrac{n(u_1 - u_n)}{2}$', isCorrect: false },
    ],
    explanation:
      'Công thức tính tổng $n$ số hạng đầu tiên của một cấp số cộng là $S_n = \\dfrac{n(u_1 + u_n)}{2}$.',
  },
  // Câu 5 - Thông hiểu
  {
    id: 'csc_cau5',
    number: 5,
    type: 'mcq',
    skill: 'Tính giá trị số hạng thứ n khi biết u1 và d',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ với $u_1 = -2$ và công sai $d = 3$. Giá trị của số hạng $u_{10}$ bằng',
    options: [
      { text: '$u_{10} = 28$', isCorrect: false },
      { text: '$u_{10} = 25$', isCorrect: true },
      { text: '$u_{10} = 27$', isCorrect: false },
      { text: '$u_{10} = 30$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức số hạng tổng quát:<br>$$u_{10} = u_1 + 9d = -2 + 9 \\cdot 3 = 25.$$',
  },
  // Câu 6 - Thông hiểu
  {
    id: 'csc_cau6',
    number: 6,
    type: 'mcq',
    skill: 'Xác định thứ tự của một số hạng trong cấp số cộng',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ có $u_1 = 5$ và công sai $d = 4$. Số $41$ là số hạng thứ mấy của cấp số cộng?',
    options: [
      { text: 'Thứ 9', isCorrect: false },
      { text: 'Thứ 10', isCorrect: true },
      { text: 'Thứ 11', isCorrect: false },
      { text: 'Thứ 8', isCorrect: false },
    ],
    explanation:
      'Giả sử $u_n = 41$. Ta có:<br>$$u_1 + (n-1)d = 41 \\Leftrightarrow 5 + (n-1) \\cdot 4 = 41 \\Leftrightarrow 4(n-1) = 36 \\Leftrightarrow n - 1 = 9 \\Leftrightarrow n = 10.$$<br>Vậy 41 là số hạng thứ 10 của cấp số cộng.',
  },
  // Câu 7 - Thông hiểu
  {
    id: 'csc_cau7',
    number: 7,
    type: 'mcq',
    skill: 'Điều kiện để ba số lập thành cấp số cộng',
    points: 0.5,
    text: 'Tìm tất cả các giá trị của $x$ để ba số $x - 1; 2x + 1; 4x - 1$ theo thứ tự đó lập thành một cấp số cộng.',
    options: [
      { text: '$x = 2$', isCorrect: false },
      { text: '$x = 4$', isCorrect: true },
      { text: '$x = -2$', isCorrect: false },
      { text: '$x = 3$', isCorrect: false },
    ],
    explanation:
      'Ba số $a, b, c$ theo thứ tự lập thành cấp số cộng khi và chỉ khi $2b = a + c$.<br>$$2(2x + 1) = (x - 1) + (4x - 1) \\Leftrightarrow 4x + 2 = 5x - 2 \\Leftrightarrow x = 4.$$',
  },
  // Câu 8 - Thông hiểu
  {
    id: 'csc_cau8',
    number: 8,
    type: 'mcq',
    skill: 'Tìm số hạng đầu u1 và công sai d từ hệ 2 số hạng',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ thỏa mãn $u_3 = 8$ và $u_7 = 20$. Số hạng đầu $u_1$ và công sai $d$ của cấp số cộng lần lượt là',
    options: [
      { text: '$u_1 = 2; d = 3$', isCorrect: true },
      { text: '$u_1 = 1; d = 3$', isCorrect: false },
      { text: '$u_1 = 2; d = 4$', isCorrect: false },
      { text: '$u_1 = 3; d = 2$', isCorrect: false },
    ],
    explanation:
      'Ta có hệ phương trình:<br>$$\\begin{cases} u_1 + 2d = 8 \\\\ u_1 + 6d = 20 \\end{cases} \\Leftrightarrow \\begin{cases} 4d = 12 \\\\ u_1 = 8 - 2d \\end{cases} \\Leftrightarrow \\begin{cases} d = 3 \\\\ u_1 = 2 \\end{cases}.$$',
  },
  // Câu 9 - Thông hiểu
  {
    id: 'csc_cau9',
    number: 9,
    type: 'mcq',
    skill: 'Tính tổng 20 số hạng đầu tiên của cấp số cộng',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ có $u_1 = 4$ và công sai $d = 3$. Tổng $20$ số hạng đầu tiên $S_{20}$ của cấp số cộng bằng',
    options: [
      { text: '$S_{20} = 650$', isCorrect: true },
      { text: '$S_{20} = 620$', isCorrect: false },
      { text: '$S_{20} = 680$', isCorrect: false },
      { text: '$S_{20} = 1300$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức tổng $n$ số hạng đầu tiên:<br>$$S_{20} = \\dfrac{20 \\cdot [2u_1 + 19d]}{2} = 10 \\cdot [2(4) + 19(3)] = 10 \\cdot (8 + 57) = 650.$$',
  },
  // Câu 10 - Vận dụng
  {
    id: 'csc_cau10',
    number: 10,
    type: 'mcq',
    skill: 'Tìm số lượng số hạng n khi biết u1, d và tổng Sn',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ có $u_1 = 3$ và công sai $d = 2$. Biết tổng $n$ số hạng đầu tiên là $S_n = 120$. Giá trị của $n$ bằng',
    options: [
      { text: '$n = 10$', isCorrect: true },
      { text: '$n = 12$', isCorrect: false },
      { text: '$n = 8$', isCorrect: false },
      { text: '$n = 15$', isCorrect: false },
    ],
    explanation:
      'Ta có $S_n = \\dfrac{n[2u_1 + (n-1)d]}{2} = 120 \\Leftrightarrow \\dfrac{n[2(3) + (n-1)2]}{2} = 120$<br>$\\Leftrightarrow \\dfrac{n(2n + 4)}{2} = 120 \\Leftrightarrow n(n + 2) = 120 \\Leftrightarrow n^2 + 2n - 120 = 0$.<br>Giải phương trình bậc hai ta được $n = 10$ (thỏa mãn $n \\in \\mathbb{N}^*$) hoặc $n = -12$ (loại).',
  },
  // Câu 11 - Vận dụng thực tế
  {
    id: 'csc_cau11',
    number: 11,
    type: 'mcq',
    skill: 'Toán thực tế: Tính tổng số ghế trong hội trường',
    points: 0.5,
    text: 'Một hội trường có 20 hàng ghế. Hàng ghế đầu tiên có 15 ghế, mỗi hàng ghế sau có nhiều hơn hàng ghế ngay trước nó 2 ghế. Tổng số ghế có trong hội trường đó là',
    options: [
      { text: '680 ghế', isCorrect: true },
      { text: '640 ghế', isCorrect: false },
      { text: '700 ghế', isCorrect: false },
      { text: '340 ghế', isCorrect: false },
    ],
    explanation:
      'Số lượng ghế ở mỗi hàng lập thành một cấp số cộng $(u_n)$ với $u_1 = 15$, $d = 2$ và số số hạng $n = 20$.<br>Tổng số ghế trong hội trường chính là tổng 20 số hạng đầu của cấp số cộng:<br>$$S_{20} = \\dfrac{20 \\cdot [2(15) + (20-1)2]}{2} = 10 \\cdot (30 + 38) = 680\\text{ (ghế)}.$$',
  },
  // Câu 12 - Vận dụng thực tế
  {
    id: 'csc_cau12',
    number: 12,
    type: 'mcq',
    skill: 'Toán thực tế: Tính tổng tiền lương theo cấp số cộng',
    points: 0.5,
    text: 'Anh Nam ký hợp đồng lao động 10 năm với một công ty. Mức lương năm đầu tiên của anh Nam là 120 triệu đồng. Kể từ năm thứ hai, mỗi năm mức lương của anh được tăng thêm 10 triệu đồng. Tổng số tiền lương anh Nam nhận được sau 10 năm làm việc là',
    options: [
      { text: '1 tỷ 650 triệu đồng', isCorrect: true },
      { text: '1 tỷ 200 triệu đồng', isCorrect: false },
      { text: '1 tỷ 750 triệu đồng', isCorrect: false },
      { text: '1 tỷ 500 triệu đồng', isCorrect: false },
    ],
    explanation:
      'Số tiền lương anh Nam nhận mỗi năm lập thành một cấp số cộng $(u_n)$ với $u_1 = 120$ (triệu đồng), công sai $d = 10$ (triệu đồng) và $n = 10$ (năm).<br>Tổng tiền lương sau 10 năm là:<br>$$S_{10} = \\dfrac{10 \\cdot [2(120) + (10-1)10]}{2} = 5 \\cdot (240 + 90) = 1650\\text{ (triệu đồng)} = 1\\text{ tỷ }650\\text{ triệu đồng}.$$',
  },
  // Câu 13 - Vận dụng cao thực tế
  {
    id: 'csc_cau13',
    number: 13,
    type: 'mcq',
    skill: 'Toán thực tế: Tính độ sâu giếng khoan theo cấp số cộng',
    points: 0.5,
    text: 'Một dịch vụ khoan giếng quy định giá của mét khoan đầu tiên là $80.000\\text{ đồng}$. Kể từ mét khoan thứ hai, giá của mỗi mét khoan tăng thêm $10.000\\text{ đồng}$ so với mét khoan liền trước. Chủ nhà đã thanh toán tổng cộng $2.250.000\\text{ đồng}$ cho toàn bộ hợp đồng khoan giếng. Độ sâu của giếng khoan đó là',
    options: [
      { text: '$15\\text{ m}$', isCorrect: true },
      { text: '$12\\text{ m}$', isCorrect: false },
      { text: '$18\\text{ m}$', isCorrect: false },
      { text: '$20\\text{ m}$', isCorrect: false },
    ],
    explanation:
      'Đơn vị tính: nghìn đồng.<br>Giá tiền khoan mét thứ $n$ lập thành một cấp số cộng $(u_n)$ với $u_1 = 80$ và $d = 10$.<br>Tổng chi phí khoan $n$ mét giếng là $S_n = 2250$ (nghìn đồng).<br>Ta có:<br>$$S_n = \\dfrac{n[2(80) + (n-1)10]}{2} = 2250 \\Leftrightarrow n(10n + 150) = 4500 \\Leftrightarrow 10n^2 + 150n - 4500 = 0$$<br>$$\\Leftrightarrow n^2 + 15n - 450 = 0 \\Leftrightarrow \\left[\\begin{array}{l} n = 15\\text{ (thỏa mãn)} \\\\ n = -30\\text{ (loại)} \\end{array}\\right..$$<br>Vậy giếng khoan có độ sâu là $15\\text{ m}$.',
  },
  // Câu 14 - Vận dụng cao toán học
  {
    id: 'csc_cau14',
    number: 14,
    type: 'mcq',
    skill: 'Tìm tham số m để phương trình bậc 3 có 3 nghiệm lập thành cấp số cộng',
    points: 0.5,
    text: 'Tìm tất cả các giá trị thực của tham số $m$ để phương trình $x^3 - 3x^2 - 9x + m = 0$ có ba nghiệm phân biệt $x_1, x_2, x_3$ lập thành một cấp số cộng.',
    options: [
      { text: '$m = 11$', isCorrect: true },
      { text: '$m = -11$', isCorrect: false },
      { text: '$m = 9$', isCorrect: false },
      { text: '$m = -9$', isCorrect: false },
    ],
    explanation:
      'Giả sử phương trình có 3 nghiệm phân biệt $x_1, x_2, x_3$ lập thành cấp số cộng $\\Rightarrow x_1 + x_3 = 2x_2$.<br>Theo định lý Vi-ét cho phương trình bậc ba $x^3 - 3x^2 - 9x + m = 0$, ta có:<br>$$x_1 + x_2 + x_3 = 3 \\Rightarrow 3x_2 = 3 \\Rightarrow x_2 = 1.$$<br>Thay $x = 1$ vào phương trình ban đầu:<br>$$1^3 - 3(1)^2 - 9(1) + m = 0 \\Leftrightarrow m = 11.$$<br>Thử lại với $m = 11$: phương trình trở thành $x^3 - 3x^2 - 9x + 11 = 0 \\Leftrightarrow (x - 1)(x^2 - 2x - 11) = 0$.<br>Có 3 nghiệm: $x_2 = 1, x_1 = 1 - 2\\sqrt{3}, x_3 = 1 + 2\\sqrt{3}$.<br>Ba nghiệm này phân biệt và lập thành cấp số cộng với công sai $d = 2\\sqrt{3}$. Vậy $m = 11$ là giá trị thỏa mãn.',
  },
];

// PHẦN II. TỰ LUẬN (2 CÂU GỒM 4 Ý: 15a, 15b, 16a, 16b - TỔNG 3,0 ĐIỂM)
const RAW_SHORTANS_QUESTIONS_CSC: QuestionShortAns[] = [
  {
    id: 'csc_cau15a',
    number: 15,
    subLabel: 'Ý a (1,0 điểm)',
    type: 'shortans',
    skill: 'Xác định số hạng đầu u1 và công sai d từ hệ phương trình cấp số cộng',
    points: 1.0,
    text: 'Cho cấp số cộng $(u_n)$ thỏa mãn hệ phương trình:<br>$$\\begin{cases} u_2 + u_5 - u_3 = 10 \\\\ u_4 + u_6 = 26 \\end{cases}$$<br><strong>Ý a) (1,0 điểm):</strong> Tìm số hạng đầu $u_1$ và công sai $d$ của cấp số cộng $(u_n)$.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'u1 = 1; d = 3 (hoặc 1; 3)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('1') && clean.includes('3');
    },
    explanation:
      '<strong>a) Tìm $u_1$ và $d$ (1,0 điểm):</strong><br>Biểu diễn các số hạng qua $u_1$ và $d$:<br>$$\\begin{cases} (u_1 + d) + (u_1 + 4d) - (u_1 + 2d) = 10 \\\\ (u_1 + 3d) + (u_1 + 5d) = 26 \\end{cases} \\quad \\text{(0,25 điểm)}$$<br>$$\\Leftrightarrow \\begin{cases} u_1 + 3d = 10 \\\\ 2u_1 + 8d = 26 \\end{cases} \\Leftrightarrow \\begin{cases} u_1 + 3d = 10 \\\\ u_1 + 4d = 13 \\end{cases} \\quad \\text{(0,25 điểm)}$$<br>Lấy phương trình sau trừ phương trình trước: $d = 3$. <em>(0,25 điểm)</em><br>Thay $d = 3$ vào $u_1 + 3(3) = 10 \\Rightarrow u_1 = 1$. <em>(0,25 điểm)</em><br>Kết luận: Số hạng đầu $u_1 = 1$ và công sai $d = 3$.',
  },
  {
    id: 'csc_cau15b',
    number: 15,
    subLabel: 'Ý b (0,5 điểm)',
    type: 'shortans',
    skill: 'Tính tổng 20 số hạng đầu tiên S20 của cấp số cộng',
    points: 0.5,
    text: '<strong>Ý b) (0,5 điểm):</strong> Tính tổng 20 số hạng đầu tiên $S_{20}$ của cấp số cộng đó.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'S20 = 590',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('590');
    },
    explanation:
      '<strong>b) Tính tổng 20 số hạng đầu $S_{20}$ (0,5 điểm):</strong><br>Áp dụng công thức tổng $n$ số hạng đầu của cấp số cộng:<br>$$S_{20} = \\dfrac{20 \\cdot [2u_1 + 19d]}{2} \\quad \\text{(0,25 điểm)}$$<br>$$S_{20} = 10 \\cdot [2(1) + 19(3)] = 10 \\cdot (2 + 57) = 590. \\quad \\text{(0,25 điểm)}$$',
  },
  {
    id: 'csc_cau16a',
    number: 16,
    subLabel: 'Ý a (0,75 điểm)',
    type: 'shortans',
    skill: 'Toán thực tế: Tính số gạch ở hàng thứ 20',
    points: 0.75,
    text: 'Một xưởng sản xuất gạch gốm mỹ nghệ xếp các viên gạch thành một đống hình tháp phẳng. Hàng trên cùng (hàng thứ 1) có 3 viên gạch, hàng thứ hai có 7 viên gạch, hàng thứ ba có 11 viên gạch, và cứ như thế hàng phía dưới liền kề luôn nhiều hơn hàng ngay trên nó 4 viên gạch.<br><strong>Ý a) (0,75 điểm):</strong> Hỏi hàng thứ 20 có bao nhiêu viên gạch?',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'u20 = 79 viên gạch',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('79');
    },
    explanation:
      '<strong>a) Tính số viên gạch ở hàng thứ 20 (0,75 điểm):</strong><br>Số viên gạch ở mỗi hàng lập thành một cấp số cộng $(u_n)$ với $u_1 = 3$ và công sai $d = 4$. <em>(0,25 điểm)</em><br>Số viên gạch ở hàng thứ 20 là số hạng thứ 20 của cấp số cộng:<br>$$u_{20} = u_1 + 19d \\quad \\text{(0,25 điểm)}$$<br>$$u_{20} = 3 + 19 \\cdot 4 = 3 + 76 = 79\\text{ (viên gạch)}. \\quad \\text{(0,25 điểm)}$$',
  },
  {
    id: 'csc_cau16b',
    number: 16,
    subLabel: 'Ý b (0,75 điểm)',
    type: 'shortans',
    skill: 'Toán thực tế: Tính số hàng của đống tháp gạch khi biết tổng số gạch',
    points: 0.75,
    text: '<strong>Ý b) (0,75 điểm):</strong> Xưởng sản xuất sử dụng tổng cộng 1275 viên gạch để dựng thành đống tháp đó. Hỏi đống tháp gạch có tất cả bao nhiêu hàng?',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'n = 25 hàng',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('25');
    },
    explanation:
      '<strong>b) Tính số hàng của đống tháp gạch (0,75 điểm):</strong><br>Gọi $n$ là số hàng của đống tháp gạch ($n \\in \\mathbb{N}^*$).<br>Tổng số viên gạch của $n$ hàng là $S_n = 1275$. <em>(0,25 điểm)</em><br>Ta có công thức:<br>$$S_n = \\dfrac{n[2u_1 + (n-1)d]}{2} \\Leftrightarrow \\dfrac{n[2(3) + (n-1)4]}{2} = 1275 \\Leftrightarrow n(2n + 1) = 1275$$<br>$$\\Leftrightarrow 2n^2 + n - 1275 = 0. \\quad \\text{(0,25 điểm)}$$<br>Giải phương trình bậc hai:<br>$$\\Delta = 1^2 - 4(2)(-1275) = 10201 = 101^2 \\Rightarrow \\left[\\begin{array}{l} n = \\dfrac{-1 + 101}{4} = 25\\text{ (thỏa mãn)} \\\\ n = \\dfrac{-1 - 101}{4} = -25{,}5\\text{ (loại)} \\end{array}\\right..$$<br>Vậy đống tháp gạch đó có tất cả 25 hàng. <em>(0,25 điểm)</em>',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan11CapSoCong45pPage() {
  // 1. STATE THÔNG TIN HỌC SINH
  const [tenHocSinh, setTenHocSinh] = useState<string>('');
  const [maHocSinh, setMaHocSinh] = useState<string>('');
  const [lopNhom, setLopNhom] = useState<string>('');

  // 2. STATE LÀM BÀI & TRẢ LỜI
  // mcqAnswers lưu optIndex (vị trí người dùng bấm trên mảng hiển thị)
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State lưu danh sách câu hỏi trắc nghiệm đã xáo trộn phương án (Fisher-Yates)
  const [shuffledMCQQuestions, setShuffledMCQQuestions] = useState<QuestionMCQ[]>(() =>
    RAW_MCQ_QUESTIONS_CSC.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ ...opt })),
    }))
  );

  // Xáo trộn phương án khi component được mount (Fisher-Yates)
  useEffect(() => {
    const shuffled = RAW_MCQ_QUESTIONS_CSC.map((q) => ({
      ...q,
      options: shuffleOptions(q.options),
    }));
    setShuffledMCQQuestions(shuffled);
  }, []);

  // CẬP NHẬT TIÊU ĐỀ TRÌNH DUYỆT (DOCUMENT.TITLE) ĐỘNG THEO YÊU CẦU
  useEffect(() => {
    document.title = `${EXAM_HEADER} - ${EXAM_SUBTITLE}`;
  }, []);

  // 3. STATE KẾT QUẢ & ĐIỂM SỐ
  const [diemSo, setDiemSo] = useState<number>(0);
  const [soCauDungMCQ, setSoCauDungMCQ] = useState<number>(0);
  const [soCauDungShort, setSoCauDungShort] = useState<number>(0);
  const [mangCauSai, setMangCauSai] = useState<string[]>([]);

  // 4. ĐỒNG HỒ ĐẾM NGƯỢC (45 PHÚT = 2700 GIÂY)
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60);

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
  const totalQuestions = RAW_MCQ_QUESTIONS_CSC.length + RAW_SHORTANS_QUESTIONS_CSC.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 5. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS11-CSC-45P';
    const lop = lopNhom.trim() || 'Lớp 11';

    if (!tenHocSinh.trim()) {
      const confirmAnonymous = window.confirm(
        'Bạn chưa nhập Họ và tên. Bạn có muốn nộp bài với tên "Học sinh ẩn danh" không?'
      );
      if (!confirmAnonymous) return;
    }

    setIsSubmitting(true);

    // Chấm điểm trắc nghiệm dựa trực tiếp vào thuộc tính isCorrect của Option được chọn
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

    // Chấm tự luận (4 ý: 1.0đ + 0.5đ + 0.75đ + 0.75đ = 3.0đ)
    RAW_SHORTANS_QUESTIONS_CSC.forEach((q) => {
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

    const thoiGianLamPhut = Math.max(1, Math.round((45 * 60 - timeLeft) / 60));

    const chiTietPhanHoiObj = {
      ho_ten: ten,
      ma_so: ma,
      lop: lop,
      de_thi: `${EXAM_TITLE} - ${EXAM_SUBTITLE}`,
      diem_so: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${RAW_MCQ_QUESTIONS_CSC.length}`,
      so_cau_dung_short: `${correctShort}/${RAW_SHORTANS_QUESTIONS_CSC.length}`,
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
        Task_ID: 'KIEM_TRA_DINH_KY_TOAN_11_CAP_SO_CONG_45P',
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
    } catch (err) {
      console.warn('Lỗi gửi Webhook Google Apps Script:', err);
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
    } catch (err) {
      console.warn('Lỗi gửi Webhook n8n:', err);
    }

    setIsSubmitted(true);
    setIsSubmitting(false);

    // Cuộn mượt lên đầu trang để xem điểm
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Làm lại bài thi
  const handleReset = () => {
    if (!window.confirm('Bạn có chắc chắn muốn làm lại bài thi từ đầu?')) return;
    setMcqAnswers({});
    setShortAnswers({});
    setIsSubmitted(false);
    setTimeLeft(45 * 60);
    setDiemSo(0);
    setSoCauDungMCQ(0);
    setSoCauDungShort(0);
    setMangCauSai([]);

    // Xáo trộn mới lại mảng trắc nghiệm
    const reshuffled = RAW_MCQ_QUESTIONS_CSC.map((q) => ({
      ...q,
      options: shuffleOptions(q.options),
    }));
    setShuffledMCQQuestions(reshuffled);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 selection:bg-sky-500 selection:text-white">
      {/* HEADER CỐ ĐỊNH PHÍA TRÊN */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md shadow-sky-500/20">
              11
            </span>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-snug">
                {EXAM_TITLE}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {EXAM_SUBTITLE} • {EXAM_TIME_NOTE}
              </p>
            </div>
          </div>

          {/* ĐỒNG HỒ ĐẾM NGƯỢC & NÚT NỘP BÀI */}
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

        {/* THANH TIẾN ĐỘ LÀM BÀI */}
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
                placeholder="VD: HS11-CSC-001"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS11-CSC-45P'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '11'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Trắc nghiệm: <strong>{soCauDungMCQ}/{shuffledMCQQuestions.length}</strong> câu đúng</span>
                  <span>Tự luận: <strong>{soCauDungShort}/{RAW_SHORTANS_QUESTIONS_CSC.length}</strong> ý đúng</span>
                  <span>Thời gian làm bài: <strong>{Math.max(1, Math.round((45 * 60 - timeLeft) / 60))} phút</strong></span>
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

            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition border border-white/20 cursor-pointer"
              >
                🖨️ In bài làm / Lưu PDF
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-xs font-bold transition shadow cursor-pointer"
              >
                🔄 Làm lại bài thi
              </button>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* PHẦN I: TRẮC NGHIỆM (14 CÂU - 7,0 ĐIỂM)                 */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-sky-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              A. PHẦN TRẮC NGHIỆM (14 CÂU - 7,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-sky-800/80 px-3 py-1 rounded-full text-sky-200 font-medium">
              0,5 điểm / câu • 4 lựa chọn (1 đáp án đúng duy nhất)
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
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        • {q.skill}
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
                        {isStudentCorrect ? '✓ Đúng (+0.5đ)' : '✕ Sai (+0.0đ)'}
                      </span>
                    )}
                  </div>

                  {/* Nội dung câu hỏi */}
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
        {/* PHẦN II: TỰ LUẬN (2 CÂU GỒM 4 Ý - 3,0 ĐIỂM)             */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              B. PHẦN TỰ LUẬN (2 CÂU - 3,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              Tự luận ngắn • Điền kết quả trực tiếp & Chấm điểm tự động
            </span>
          </div>

          <div className="space-y-4">
            {RAW_SHORTANS_QUESTIONS_CSC.map((q) => {
              const currentVal = shortAnswers[q.id] || '';
              const isCorrect = isSubmitted ? q.validator(currentVal) : false;

              return (
                <div
                  key={q.id}
                  id={`cau-${q.number}-${q.subLabel}`}
                  className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : currentVal.trim()
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-amber-300 bg-amber-50/20'
                      : currentVal.trim()
                      ? 'border-indigo-300 shadow-indigo-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-800 font-bold text-xs">
                        Câu {q.number} {q.subLabel ? `• ${q.subLabel}` : ''}
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
                        {isCorrect
                          ? `✓ Đúng (+${q.points}đ)`
                          : `✕ Chưa chính xác (+0.0đ)`}
                      </span>
                    )}
                  </div>

                  {/* Nội dung đề bài */}
                  <MathContent
                    content={q.text}
                    className="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mb-4"
                  />

                  {/* Ô nhập câu trả lời */}
                  <div className="space-y-2">
                    <label
                      htmlFor={`input-${q.id}`}
                      className="block text-xs font-bold text-slate-700"
                    >
                      Kết quả / Đáp số của bạn:
                    </label>
                    <div className="flex items-center gap-2">
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
                        className={`w-full max-w-md px-4 py-2.5 text-sm rounded-xl border transition focus:outline-none ${
                          isSubmitted
                            ? isCorrect
                              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold'
                              : 'border-rose-400 bg-rose-50/50 text-rose-900 line-through'
                            : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Lời giải & Đáp án chi tiết khi nộp */}
                  {isSubmitted && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm bg-slate-50/80 p-4 rounded-xl text-slate-700 overflow-x-auto whitespace-pre-wrap break-words">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md text-xs">
                          Đáp số chuẩn: {q.correctDisplay}
                        </span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <span className="text-indigo-600">📝</span> Hướng dẫn chấm & biểu điểm chi tiết:
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

        {/* NÚT NỘP BÀI CUỐI TRANG */}
        {!isSubmitted && (
          <div className="pt-6 pb-12 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-base rounded-2xl shadow-lg transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Đang chấm điểm & lưu...' : 'Hoàn thành và Nộp bài thi'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
