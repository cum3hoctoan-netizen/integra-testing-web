'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA MÔN TOÁN LỚP 11 - 90 PHÚT';
const EXAM_SUBTITLE = 'CHỦ ĐỀ: DÃY SỐ - CẤP SỐ CỘNG - CẤP SỐ NHÂN';
const EXAM_TIME_NOTE =
  'Thời gian làm bài: 90 phút • Định hướng đánh giá năng lực GDPT 2018 (12 câu trắc nghiệm 3,0đ + 4 bài Đúng/Sai 4,0đ + 6 câu trả lời ngắn 3,0đ)';

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
    skill: 'Tính số hạng của dãy số từ công thức số hạng tổng quát',
    points: 0.25,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{2n + 3}{n + 1}$. Giá trị của số hạng $u_5$ bằng:',
    options: [
      { text: '$\\dfrac{13}{6}$', isCorrect: true },
      { text: '$\\dfrac{11}{5}$', isCorrect: false },
      { text: '$\\dfrac{13}{5}$', isCorrect: false },
      { text: '$\\dfrac{2}{3}$', isCorrect: false },
    ],
    explanation:
      'Thay $n = 5$ vào công thức số hạng tổng quát của dãy số:<br>$$u_5 = \\dfrac{2(5) + 3}{5 + 1} = \\dfrac{13}{6}.$$',
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Tính số hạng của cấp số cộng từ u1 và công sai d',
    points: 0.25,
    text: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = -2$ và công sai $d = 5$. Giá trị của số hạng $u_8$ bằng:',
    options: [
      { text: '$33$', isCorrect: true },
      { text: '$38$', isCorrect: false },
      { text: '$28$', isCorrect: false },
      { text: '$-37$', isCorrect: false },
    ],
    explanation:
      'Số hạng tổng quát của cấp số cộng:<br>$$u_8 = u_1 + 7d = -2 + 7(5) = 33.$$',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Xác định số hạng đầu và công bội của cấp số nhân',
    points: 0.25,
    text: 'Cho cấp số nhân $(u_n)$ thỏa mãn số hạng $u_2 = 6$ và số hạng $u_5 = 48$. Công bội $q$ và số hạng đầu $u_1$ của cấp số nhân bằng:',
    options: [
      { text: '$u_1 = 3, q = 2$', isCorrect: true },
      { text: '$u_1 = 2, q = 3$', isCorrect: false },
      { text: '$u_1 = 3, q = 8$', isCorrect: false },
      { text: '$u_1 = 6, q = 2$', isCorrect: false },
    ],
    explanation:
      'Biểu diễn theo $u_1$ và $q$:<br>$$\\begin{cases} u_1 q = 6 \\\\ u_1 q^4 = 48 \\end{cases} \\implies \\dfrac{u_1 q^4}{u_1 q} = \\dfrac{48}{6} \\implies q^3 = 8 \\implies q = 2.$$<br>Thay $q = 2$ vào phương trình đầu: $u_1 \\cdot 2 = 6 \\implies u_1 = 3$.',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Xét tính tăng, giảm và bị chặn của dãy số phân thức',
    points: 0.25,
    text: 'Cho dãy số $(u_n)$ với $u_n = \\dfrac{3n - 1}{n + 2}$. Khẳng định nào sau đây **đúng**?',
    options: [
      { text: 'Dãy số $(u_n)$ là dãy số giảm và bị chặn', isCorrect: false },
      { text: 'Dãy số $(u_n)$ là dãy số tăng và bị chặn', isCorrect: true },
      { text: 'Dãy số $(u_n)$ là dãy số tăng và không bị chặn', isCorrect: false },
      { text: 'Dãy số $(u_n)$ không tăng, không giảm', isCorrect: false },
    ],
    explanation:
      'Xét hiệu $u_{n+1} - u_n$:<br>$$u_{n+1} - u_n = \\dfrac{3(n+1) - 1}{(n+1) + 2} - \\dfrac{3n - 1}{n + 2} = \\dfrac{3n + 2}{n + 3} - \\dfrac{3n - 1}{n + 2} = \\dfrac{7}{(n+3)(n+2)} > 0 \\quad (\\forall n \\ge 1).$$<br>Do đó $(u_n)$ là dãy số tăng.<br>Mặt khác, $0 < u_n = 3 - \\dfrac{7}{n+2} < 3$ với mọi $n \\ge 1$ nên dãy số bị chặn.',
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Giải hệ phương trình xác định số hạng đầu và công sai của cấp số cộng',
    points: 0.25,
    text: 'Cho cấp số cộng $(u_n)$ thỏa mãn hệ phương trình $\\begin{cases} u_2 + u_5 = 19 \\\\ u_3 + u_7 = 25 \\end{cases}$. Số hạng đầu $u_1$ và công sai $d$ của cấp số cộng lần lượt bằng:',
    options: [
      { text: '$u_1 = 2, d = 3$', isCorrect: true },
      { text: '$u_1 = 3, d = 2$', isCorrect: false },
      { text: '$u_1 = 1, d = 4$', isCorrect: false },
      { text: '$u_1 = 4, d = 3$', isCorrect: false },
    ],
    explanation:
      'Biểu diễn các số hạng qua $u_1$ và $d$:<br>$$\\begin{cases} (u_1 + d) + (u_1 + 4d) = 19 \\\\ (u_1 + 2d) + (u_1 + 6d) = 25 \\end{cases} \\iff \\begin{cases} 2u_1 + 5d = 19 \\\\ 2u_1 + 8d = 25 \\end{cases} \\iff \\begin{cases} 3d = 6 \\\\ 2u_1 + 5d = 19 \\end{cases} \\iff \\begin{cases} d = 3 \\\\ u_1 = 2 \\end{cases}.$$',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Mô hình hóa khấu hao tài sản bằng cấp số nhân',
    points: 0.25,
    text: 'Một chiếc máy vi tính mua mới với giá $400$ triệu đồng. Sau mỗi năm sử dụng, giá trị còn lại của chiếc máy giảm $10\\%$ so với giá trị của năm ngay trước đó. Công thức số hạng tổng quát $u_n$ (triệu đồng) tính giá trị còn lại của máy sau $n$ năm sử dụng là:',
    options: [
      { text: '$u_n = 400 - 40n$', isCorrect: false },
      { text: '$u_n = 400 \\cdot (0,9)^n$', isCorrect: true },
      { text: '$u_n = 400 \\cdot (0,1)^n$', isCorrect: false },
      { text: '$u_n = 400 \\cdot (0,9)^{n-1}$', isCorrect: false },
    ],
    explanation:
      'Sau mỗi năm, giá trị máy giảm $10\\%$ nên còn lại $100\\% - 10\\% = 90\\% = 0,9$ so với năm trước.<br>Sau $n$ năm, giá trị còn lại của máy là: $u_n = 400 \\cdot (0,9)^n$ (triệu đồng).',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Khảo sát tính đơn điệu của dãy số mô tả nồng độ thuốc trong y học',
    points: 0.25,
    text: 'Nồng độ một loại thuốc thử trong máu bệnh nhân sau $t$ giờ tiêm ($t \\in \\mathbb{N}^*$) được mô hình hóa bởi dãy số $C_t = \\dfrac{10t}{t^2 + 9}$ (mg/L). Khẳng định nào sau đây mô tả đúng xu hướng thay đổi của nồng độ thuốc trong máu kể từ giờ thứ $3$ trở đi ($t \\ge 3$)?',
    options: [
      { text: 'Nồng độ thuốc tăng liên tục từ giờ thứ $3$ trở đi.', isCorrect: false },
      { text: 'Nồng độ thuốc giảm liên tục từ giờ thứ $3$ trở đi.', isCorrect: true },
      { text: 'Nồng độ thuốc không đổi.', isCorrect: false },
      { text: 'Nồng độ thuốc giảm từ giờ thứ $3$ đến giờ thứ $5$ rồi tăng trở lại.', isCorrect: false },
    ],
    explanation:
      'Xét hiệu $C_{t+1} - C_t$:<br>$$C_{t+1} - C_t = \\dfrac{10(t+1)}{(t+1)^2 + 9} - \\dfrac{10t}{t^2 + 9} = \\dfrac{10(9 - t - t^2)}{((t+1)^2 + 9)(t^2 + 9)}.$$<br>Với mọi $t \\ge 3$, ta có $9 - t - t^2 \\le 9 - 3 - 9 = -3 < 0 \\implies C_{t+1} - C_t < 0$.<br>Do đó nồng độ thuốc giảm liên tục từ giờ thứ $3$ trở đi.',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Ứng dụng tổng n số hạng cấp số cộng trong thiết kế khán đài',
    points: 0.25,
    text: 'Một khán đài nhà thi đấu được thiết kế gồm $22$ hàng ghế hình bán nguyệt. Hàng ghế đầu tiên sát sân thi đấu có $18$ ghế, mỗi hàng ghế tiếp theo có nhiều hơn hàng ngay trước nó $3$ ghế. Tổng số ghế của toàn bộ khán đài đó bằng:',
    options: [
      { text: '$1050$ ghế', isCorrect: false },
      { text: '$1089$ ghế', isCorrect: true },
      { text: '$1122$ ghế', isCorrect: false },
      { text: '$990$ ghế', isCorrect: false },
    ],
    explanation:
      'Số ghế ở mỗi hàng lập thành một cấp số cộng $(u_n)$ có $u_1 = 18, d = 3$ và $n = 22$.<br>Tổng số ghế trên khán đài là:<br>$$S_{22} = \\dfrac{22}{2}[2u_1 + (22 - 1)d] = 11[2(18) + 21(3)] = 11(36 + 63) = 11 \\times 99 = 1089 \\text{ ghế}.$$',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Bài toán phân chia vi khuẩn theo cấp số nhân',
    points: 0.25,
    text: 'Thí nghiệm nuôi cấy vi khuẩn ghi nhận: ban đầu trong môi trường có $80$ tế bào, cứ sau mỗi $15$ phút số tế bào lại phân chia nhân đôi một lần. Hỏi sau ít nhất bao nhiêu phút thì số lượng tế bào vi khuẩn vượt quá $10.000$ tế bào?',
    options: [
      { text: '$90$ phút', isCorrect: false },
      { text: '$105$ phút', isCorrect: true },
      { text: '$120$ phút', isCorrect: false },
      { text: '$75$ phút', isCorrect: false },
    ],
    explanation:
      'Số tế bào sau $n$ chu kỳ phân chia ($15$ phút/chu kỳ) là $u_n = 80 \\cdot 2^n$.<br>Yêu cầu $u_n > 10.000 \\iff 80 \\cdot 2^n > 10.000 \\iff 2^n > 125$.<br>Vì $2^6 = 64 < 125$ và $2^7 = 128 > 125$ nên $n = 7$ chu kỳ.<br>Thời gian tối thiểu: $7 \\times 15 = 105$ phút.',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Tìm tham số để dãy số phân thức tăng trên tập số nguyên dương',
    points: 0.25,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{n + a}{2n + 1}$ ($a$ là tham số thực). Có bao nhiêu giá trị nguyên của $a \\in [-6; 8]$ để $(u_n)$ là một dãy số tăng trên $\\mathbb{N}^*$?',
    options: [
      { text: '$6$', isCorrect: false },
      { text: '$7$', isCorrect: true },
      { text: '$8$', isCorrect: false },
      { text: '$15$', isCorrect: false },
    ],
    explanation:
      'Xét hiệu $u_{n+1} - u_n$:<br>$$u_{n+1} - u_n = \\dfrac{(n+1) + a}{2(n+1) + 1} - \\dfrac{n + a}{2n + 1} = \\dfrac{1 - 2a}{(2n + 3)(2n + 1)}.$$<br>Để $(u_n)$ là dãy số tăng thì $u_{n+1} - u_n > 0 \\quad \\forall n \\ge 1 \\iff 1 - 2a > 0 \\iff a < \\dfrac{1}{2}$.<br>Các giá trị nguyên $a \\in [-6; 8]$ thỏa mãn $a < \\dfrac{1}{2}$ là $a \\in \\{-6; -5; -4; -3; -2; -1; 0\\}$. Có $7$ giá trị nguyên.',
  },
  {
    id: 'mcq11',
    number: 11,
    type: 'mcq',
    skill: 'Bài toán gửi tiết kiệm định kỳ hàng tháng (lãi kép và tổng cấp số nhân)',
    points: 0.25,
    text: 'Một cá nhân lập kế hoạch tích lũy tài chính: đầu tháng thứ nhất gửi $100$ triệu đồng vào tài khoản tiết kiệm với lãi suất $0,6\\%$/tháng theo hình thức lãi kép. Đầu mỗi tháng tiếp theo, người đó gửi thêm vào tài khoản $10$ triệu đồng. Ngay sau khi gửi khoản tiền ở đầu tháng thứ $15$, tổng số tiền tích lũy có trong tài khoản xấp xỉ bằng giá trị nào sau đây?',
    options: [
      { text: '$245.300.000$ đồng', isCorrect: false },
      { text: '$254.230.000$ đồng', isCorrect: true },
      { text: '$260.100.000$ đồng', isCorrect: false },
      { text: '$250.000.000$ đồng', isCorrect: false },
    ],
    explanation:
      'Gọi $r = 0,6\\% = 0,006$.<br>Đầu tháng $15$, tổng số tiền trong tài khoản ngay sau khi gửi khoản $10$ triệu là:<br>$$T_{15} = 100(1+r)^{14} + 10(1+r)^{13} + 10(1+r)^{12} + \\dots + 10 = 100(1+r)^{14} + 10 \\cdot \\dfrac{(1+r)^{14} - 1}{r}.$$<br>Thay $r = 0,006$:<br>$$T_{15} = 100(1,006)^{14} + 10 \\cdot \\dfrac{(1,006)^{14} - 1}{0,006} \\approx 108,731 + 145,51 = 254,241 \\text{ triệu đồng} \\approx 254.230.000 \\text{ đồng}.$$',
  },
  {
    id: 'mcq12',
    number: 12,
    type: 'mcq',
    skill: 'Mối liên hệ giữa cấp số cộng và cấp số nhân qua tính chất số hạng',
    points: 0.25,
    text: 'Cho ba số thực dương $x, y, z$ theo thứ tự lập thành một cấp số nhân có công bội $q \\ne 1$. Đồng thời ba số $x, 2y, 3z$ theo thứ tự lập thành một cấp số cộng. Giá trị của công bội $q$ bằng:',
    options: [
      { text: '$q = 3$', isCorrect: false },
      { text: '$q = \\dfrac{1}{3}$', isCorrect: true },
      { text: '$q = \\dfrac{1}{2}$', isCorrect: false },
      { text: '$q = 2$', isCorrect: false },
    ],
    explanation:
      'Do $x, y, z$ lập thành CSN công bội $q$ nên $y = xq$ và $z = xq^2$.<br>Do $x, 2y, 3z$ lập thành CSC nên:<br>$$x + 3z = 2(2y) \\iff x + 3xq^2 = 4xq \\iff x(3q^2 - 4q + 1) = 0.$$<br>Vì $x > 0$ nên $3q^2 - 4q + 1 = 0 \\iff \\left[\\begin{array}{l} q = 1 \\text{ (loại)} \\\\ q = \\dfrac{1}{3} \\text{ (thỏa mãn)} \\end{array}\\right.$.',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 13,
    type: 'tf',
    skill: 'Công thức truy hồi và số hạng tổng quát của dãy số',
    text: 'Cho dãy số $(u_n)$ xác định bởi công thức truy hồi: $u_1 = 3$ và $u_{n+1} = u_n + 3n + 2$ với mọi $n \\ge 1$. Xét tính đúng/sai của các khẳng định sau:',
    items: [
      {
        key: 'a',
        text: 'Số hạng $u_2 = 8$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Số hạng $u_3 = 15$.',
        correct: false,
      },
      {
        key: 'c',
        text: 'Số hạng tổng quát của dãy số là $u_n = \\dfrac{3n^2 + n + 2}{2}$ với mọi $n \\ge 1$.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Dãy số $(u_n)$ là một dãy số bị chặn trên.',
        correct: false,
      },
    ],
    explanation:
      '• **a) Đúng.** $u_2 = u_1 + 3(1) + 2 = 3 + 5 = 8$.<br>• **b) Sai.** $u_3 = u_2 + 3(2) + 2 = 8 + 8 = 16 \\ne 15$.<br>• **c) Đúng.** $u_n = u_1 + \\sum_{k=1}^{n-1}(3k+2) = 3 + 3\\dfrac{(n-1)n}{2} + 2(n-1) = \\dfrac{3n^2 + n + 2}{2}$.<br>• **d) Sai.** Vì $u_n \\to +\\infty$ khi $n \\to +\\infty$ nên dãy số không bị chặn trên.',
  },
  {
    id: 'tf2',
    number: 14,
    type: 'tf',
    skill: 'Mô hình hóa xếp hàng nông sản bằng cấp số cộng và tính cước vận chuyển',
    text: 'Một xe tải vận chuyển các thùng hàng nông sản đóng gói theo mô hình tầng: hàng dưới cùng có $60$ thùng, các hàng phía trên mỗi hàng có ít hơn hàng ngay dưới nó $4$ thùng. Xe tải được xếp tất cả $12$ hàng thùng hàng. Xét tính đúng/sai của các khẳng định sau:',
    items: [
      {
        key: 'a',
        text: 'Số thùng hàng ở các hàng lập thành một cấp số cộng với $u_1 = 60$ và công sai $d = -4$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Hàng trên cùng (hàng thứ 12) có đúng 16 thùng hàng.',
        correct: true,
      },
      {
        key: 'c',
        text: 'Tổng số thùng hàng nông sản xếp trên xe là 456 thùng.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Nếu giá cước vận chuyển tính 50.000 đồng/thùng cho 200 thùng đầu tiên và 40.000 đồng/thùng cho các thùng còn lại thì tổng cước vận chuyển của xe là 22,8 triệu đồng.',
        correct: false,
      },
    ],
    explanation:
      '• **a) Đúng.** Do số thùng giảm đều $4$ thùng/hàng nên $(u_n)$ là CSC có $u_1 = 60, d = -4$.<br>• **b) Đúng.** Số thùng ở hàng thứ 12 là $u_{12} = u_1 + 11d = 60 + 11(-4) = 16$ thùng.<br>• **c) Đúng.** Tổng số thùng hàng: $S_{12} = \\dfrac{12(u_1 + u_{12})}{2} = 6(60 + 16) = 456$ thùng.<br>• **d) Sai.** Cước vận chuyển $= 200 \\times 50.000 + (456 - 200) \\times 40.000 = 10.000.000 + 10.240.000 = 20,24$ triệu đồng $\\ne 22,8$ triệu đồng.',
  },
  {
    id: 'tf3',
    number: 15,
    type: 'tf',
    skill: 'Khấu hao dây chuyền sản xuất theo cấp số nhân lùi vô hạn',
    text: 'Một dây chuyền sản xuất tự động mua mới với giá $600$ triệu đồng. Sau mỗi năm sử dụng, giá trị còn lại của dây chuyền bị khấu hao $12\\%$ so với giá trị của năm ngay trước đó. Kí hiệu $u_n$ (triệu đồng) là giá trị còn lại của dây chuyền sau $n$ năm sử dụng. Xét tính đúng/sai của các khẳng định sau:',
    items: [
      {
        key: 'a',
        text: 'Giá trị còn lại của dây chuyền sau $1$ năm sử dụng $u_1 = 528$ triệu đồng và dãy số $(u_n)$ là một cấp số nhân lùi với công bội $q = 0,88$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Giá trị còn lại của dây chuyền sau $3$ năm sử dụng xấp xỉ $408,883$ triệu đồng.',
        correct: true,
      },
      {
        key: 'c',
        text: 'Kể từ năm thứ $6$ trở đi, giá trị còn lại của dây chuyền giảm xuống dưới một nửa so với giá trị mua mới ban đầu.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Tổng giá trị đã bị khấu hao của dây chuyền sau $4$ năm sử dụng vượt quá $300$ triệu đồng.',
        correct: false,
      },
    ],
    explanation:
      '• **a) Đúng.** $u_1 = 600 \\times 0,88 = 528$ triệu đồng và $u_n = 528 \\cdot (0,88)^{n-1} \\implies q = 0,88$.<br>• **b) Đúng.** Sau 3 năm, giá trị còn lại là $u_3 = 600 \\times (0,88)^3 = 408,8832$ triệu đồng.<br>• **c) Đúng.** Ta có $(0,88)^5 \\approx 0,5277 > 0,5$ và $(0,88)^6 \\approx 0,4644 < 0,5$, do đó từ năm thứ 6 giá trị giảm quá $50\\%$.<br>• **d) Sai.** Tổng giá trị khấu hao sau 4 năm là $\\Delta V_4 = 600 - 600 \\times (0,88)^4 \\approx 240,18$ triệu đồng $< 300$ triệu.',
  },
  {
    id: 'tf4',
    number: 16,
    type: 'tf',
    skill: 'Bài toán kết hợp cấp số cộng và cấp số nhân với điều kiện công sai âm và dương',
    text: 'Cho ba số thực $a, b, c$ theo thứ tự lập thành một cấp số cộng có tổng bằng $24$. Nếu giữ nguyên $a$, cộng thêm $2$ vào $b$ và cộng thêm $13$ vào $c$ thì ba số mới $(a, b+2, c+13)$ theo thứ tự lập thành một cấp số nhân. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Số hạng $b = 8$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Nếu công sai của cấp số cộng $d > 0$ thì $a = 4$ và $c = 12$.',
        correct: true,
      },
      {
        key: 'c',
        text: 'Với công sai $d > 0$, cấp số nhân mới có công bội $q = 2$.',
        correct: false,
      },
      {
        key: 'd',
        text: 'Với công sai $d < 0$, giá trị $a = 25$ và $c = -9$.',
        correct: true,
      },
    ],
    explanation:
      'Do $a, b, c$ lập thành CSC có $a + b + c = 24 \\implies 3b = 24 \\implies b = 8$. Vậy a) Đúng.<br>Gọi $d$ là công sai của CSC $\\implies a = 8 - d, c = 8 + d$.<br>Ba số mới là $8 - d, 10, 21 + d$. Do lập thành CSN nên:<br>$$10^2 = (8 - d)(21 + d) \\iff 100 = 168 - 13d - d^2 \\iff d^2 + 13d - 68 = 0 \\iff \\left[\\begin{array}{l} d = 4 \\\\ d = -17 \\end{array}\\right.$$<br>• Với $d = 4 > 0 \\implies a = 4, c = 12$. Ba số mới là $4, 10, 25 \\implies q = 2,5 \\ne 2$. Vậy b) Đúng, c) Sai.<br>• Với $d = -17 < 0 \\implies a = 25, c = -9$. Vậy d) Đúng.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 17,
    type: 'shortans',
    skill: 'Tính số hạng dãy số xác định bởi hệ thức truy hồi bậc nhất',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ xác định bởi hệ thức truy hồi $u_1 = 2$ và $u_{n+1} = 3u_n - 1$ với mọi $n \\ge 1$. Tính số hạng $u_5$.',
    placeholder: 'Nhập số nguyên (VD: 85)',
    correctDisplay: '122',
    explanation:
      'Tính lần lượt từng số hạng của dãy số:<br>• $u_1 = 2$<br>• $u_2 = 3(2) - 1 = 5$<br>• $u_3 = 3(5) - 1 = 14$<br>• $u_4 = 3(14) - 1 = 41$<br>• $u_5 = 3(41) - 1 = 122$.',
    validator: (val: string) => val.trim() === '122',
  },
  {
    id: 'sa2',
    number: 18,
    type: 'shortans',
    skill: 'Tính tổng chi phí thi công đào giếng theo cấp số cộng',
    points: 0.5,
    text: 'Một hợp đồng thi công đào giếng nước sâu $30\\text{ m}$ quy định: giá của mét đào đầu tiên là $100.000$ đồng, và kể từ mét đào thứ hai, giá của mỗi mét đào sau tăng thêm $25.000$ đồng so với giá của mét đào ngay trước đó. Tính tổng chi phí đào xong cái giếng $30\\text{ m}$ này (đơn vị: đồng).',
    placeholder: 'Nhập chi phí số (đồng, VD: 15200000)',
    correctDisplay: '13.875.000',
    explanation:
      'Chi phí đào từng mét giếng lập thành một cấp số cộng có $u_1 = 100.000$ đồng, công sai $d = 25.000$ đồng và $n = 30$.<br>Tổng chi phí đào giếng là:<br>$$S_{30} = \\dfrac{30}{2}[2u_1 + 29d] = 15[2(100.000) + 29(25.000)] = 15(200.000 + 725.000) = 13.875.000 \\text{ đồng}.$$',
    validator: (val: string) => {
      const c = val.trim().replace(/[.,\s]/g, '').replace(/đồng/gi, '');
      return c === '13875000';
    },
  },
  {
    id: 'sa3',
    number: 19,
    type: 'shortans',
    skill: 'Tăng trưởng mạng lưới chuỗi cửa hàng theo cấp số nhân',
    points: 0.5,
    text: 'Một chuỗi cửa hàng nhượng quyền thương hiệu có $5$ cửa hàng ở năm thứ nhất. Mỗi năm tiếp theo, số lượng cửa hàng mở mới thêm bằng gấp đôi tổng số cửa hàng hiện có của năm ngay trước đó. Tính tổng số cửa hàng hoạt động trong chuỗi ở năm thứ $6$.',
    placeholder: 'Nhập số lượng cửa hàng (VD: 840)',
    correctDisplay: '1215',
    explanation:
      'Năm 1 có $u_1 = 5$ cửa hàng.<br>Năm 2 mở mới $2 \\times 5 = 10 \\implies u_2 = 15 = 5 \\times 3$.<br>Bằng quy nạp, tổng số cửa hàng ở năm thứ $n$ lập thành một cấp số nhân có $u_1 = 5$ và công bội $q = 3$.<br>Ở năm thứ $6$, số cửa hàng là: $u_6 = u_1 \\cdot q^5 = 5 \\times 3^5 = 5 \\times 243 = 1215$ cửa hàng.',
    validator: (val: string) => {
      const c = val.trim().replace(/cửa hàng/gi, '').trim();
      return c === '1215';
    },
  },
  {
    id: 'sa4',
    number: 20,
    type: 'shortans',
    skill: 'Bài toán trả nợ vay ngân hàng theo phương thức dư nợ giảm dần',
    points: 0.5,
    text: 'Một hộ kinh doanh vay ngân hàng $240$ triệu đồng để mở rộng xưởng sản xuất theo phương thức trả nợ dư nợ giảm dần: Tiền nợ gốc trả đều hàng tháng trong đúng $24$ tháng (mỗi tháng trả $10$ triệu đồng tiền gốc). Tiền lãi hàng tháng tính theo lãi suất $1\\%$/tháng trên dư nợ thực tế của đầu tháng đó. Tính tổng số tiền lãi hộ kinh doanh phải trả sau $24$ tháng (đơn vị: triệu đồng).',
    placeholder: 'Nhập tiền lãi số (triệu đồng, VD: 24)',
    correctDisplay: '30',
    explanation:
      'Tiền lãi ở tháng thứ $k$ ($1 \\le k \\le 24$) là: $L_k = [240 - 10(k-1)] \\times 1\\%$.<br>Dãy tiền lãi $(L_k)$ lập thành cấp số cộng giảm gồm $24$ số hạng với $L_1 = 2,4$ triệu đồng và $L_{24} = 0,1$ triệu đồng.<br>Tổng tiền lãi sau $24$ tháng là:<br>$$S_{24} = \\dfrac{24(L_1 + L_{24})}{2} = 12(2,4 + 0,1) = 12 \\times 2,5 = 30 \\text{ triệu đồng}.$$',
    validator: (val: string) => {
      const c = val.trim().replace(/triệu( đồng)?/gi, '').trim();
      return c === '30';
    },
  },
  {
    id: 'sa5',
    number: 21,
    type: 'shortans',
    skill: 'Bài toán rút tiền chi tiêu định kỳ từ tài khoản tiết kiệm lãi kép',
    points: 0.5,
    text: 'Một cá nhân gửi tiết kiệm $400$ triệu đồng vào ngân hàng với lãi suất $0,5\\%$/tháng theo hình thức lãi kép. Bắt đầu từ tháng thứ nhất sau khi gửi, cuối mỗi tháng người đó đến ngân hàng rút ra cố định $10$ triệu đồng để chi tiêu. Hỏi sau bao nhiêu tháng thì tài khoản tiết kiệm đó vừa hết sạch tiền (bằng $0$ hoặc không đủ để rút $10$ triệu đồng nữa)?',
    placeholder: 'Nhập số tháng (VD: 36)',
    correctDisplay: '45',
    explanation:
      'Gọi $A = 400$ (triệu đồng), $r = 0,5\\% = 0,005$, $m = 10$ (triệu đồng).<br>Số tiền còn lại trong tài khoản cuối tháng $n$ là:<br>$$T_n = A(1+r)^n - m \\cdot \\dfrac{(1+r)^n - 1}{r}.$$<br>Yêu cầu $T_n \\le 0 \\iff 400(1,005)^n \\le \\dfrac{10}{0,005}\\left[(1,005)^n - 1\\right] \\iff 1600(1,005)^n \\ge 2000$<br>$$\\iff (1,005)^n \\ge 1,25 \\iff n \\ge \\log_{1,005}(1,25) \\approx 44,74.$$<br>Vì $n \\in \\mathbb{N}^*$ nên sau $45$ tháng thì tài khoản sẽ hết sạch tiền.',
    validator: (val: string) => {
      const c = val.trim().replace(/tháng/gi, '').trim();
      return c === '45';
    },
  },
  {
    id: 'sa6',
    number: 22,
    type: 'shortans',
    skill: 'Tìm giá trị lớn nhất của số hạng dãy số bằng bất đẳng thức Cauchy',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{12n}{n^2 + 36}$. Tìm giá trị lớn nhất $M$ của số hạng trong dãy số $(u_n)$.',
    placeholder: 'Nhập giá trị lớn nhất M (VD: 2)',
    correctDisplay: '1',
    explanation:
      'Áp dụng bất đẳng thức Cauchy cho hai số dương $n$ và $\\dfrac{36}{n}$:<br>$$n^2 + 36 \\ge 2\\sqrt{n^2 \\cdot 36} = 12n \\implies u_n = \\dfrac{12n}{n^2 + 36} \\le \\dfrac{12n}{12n} = 1.$$<br>Đẳng thức xảy ra khi $n^2 = 36 \\iff n = 6$ (do $n \\in \\mathbb{N}^*$).<br>Vậy giá trị lớn nhất $M$ của số hạng trong dãy số bằng $1$.',
    validator: (val: string) => {
      const c = val.trim().replace(/m\s*=\s*/gi, '').trim();
      return c === '1';
    },
  },
];

export default function Toan11DaySoCSCCSNPage() {
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
    const ma = maHocSinh.trim() || 'HS11-DAYSO-01';
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
    const p3Score = p3CorrectCount * 0.5;

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
                Phần I: Trắc nghiệm ABCD (Câu 1 - 12)
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
                Phần II: Đúng/Sai (Câu 13 - 16)
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
                Phần III: Trả lời ngắn (Câu 17 - 22)
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
            TOÁN 11 • KIỂM TRA ĐỊNH HƯỚNG ĐÁNH GIÁ NĂNG LỰC
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS11-DAYSO-01'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '11'}</span>
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
        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (04 CÂU - 4,0 ĐIỂM)          */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-emerald-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (04 CÂU - 4,0 ĐIỂM)
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
        {/* PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN (06 CÂU - 3,0 ĐIỂM)     */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN (06 CÂU - 3,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              0,50 điểm / câu • Học sinh tự điền kết quả vào ô trống
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
