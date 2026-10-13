'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA MÔN TOÁN LỚP 11 - 45 PHÚT';
const EXAM_SUBTITLE = 'CHỦ ĐỀ: CẤP SỐ NHÂN';
const EXAM_TIME_NOTE =
  '(Thời gian làm bài: 45 phút - Định hướng đánh giá năng lực GDPT 2018 • 10 câu trắc nghiệm + 2 bài Đúng/Sai + 3 câu trả lời ngắn)';

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
    id: 'csn1',
    number: 1,
    type: 'mcq',
    skill: 'Tìm số hạng thứ n của cấp số nhân từ số hạng đầu và công bội',
    points: 0.5,
    text: 'Cho cấp số nhân $(u_n)$ có số hạng đầu $u_1 = -3$ và công bội $q = 2$. Giá trị của số hạng $u_6$ bằng:',
    options: [
      { text: '$-96$', isCorrect: true },
      { text: '$96$', isCorrect: false },
      { text: '$-48$', isCorrect: false },
      { text: '$192$', isCorrect: false },
    ],
    explanation:
      'Sử dụng công thức xác định số hạng tổng quát của cấp số nhân $u_n = u_1 \\cdot q^{n-1}$:<br>$$u_6 = u_1 \\cdot q^5 = (-3) \\times 2^5 = (-3) \\times 32 = -96.$$',
  },
  {
    id: 'csn2',
    number: 2,
    type: 'mcq',
    skill: 'Nhận biết cấp số nhân trong bài toán phân chia tế bào sinh học',
    points: 0.5,
    text: 'Một thí nghiệm nuôi cấy tế bào sinh học ghi nhận: ban đầu trong môi trường dinh dưỡng có $50$ tế bào. Cứ sau mỗi $20$ phút, số lượng tế bào lại phân chia nhân đôi một lần. Gọi $u_n$ là số lượng tế bào ở chu kỳ thứ $n$ ($n = 1$ tương ứng với thời điểm ban đầu). Khẳng định nào sau đây **đúng**?',
    options: [
      {
        text: 'Dãy số $(u_n)$ lập thành một cấp số nhân có số hạng đầu $u_1 = 50$ và công bội $q = 2$.',
        isCorrect: true,
      },
      {
        text: 'Dãy số $(u_n)$ lập thành một cấp số nhân có số hạng đầu $u_1 = 100$ và công bội $q = 2$.',
        isCorrect: false,
      },
      {
        text: 'Dãy số $(u_n)$ lập thành một cấp số nhân có số hạng đầu $u_1 = 50$ và công bội $q = 0{,}5$.',
        isCorrect: false,
      },
      {
        text: 'Dãy số $(u_n)$ không phải là cấp số nhân vì số lượng tế bào tăng quá nhanh.',
        isCorrect: false,
      },
    ],
    explanation:
      'Ban đầu $u_1 = 50$. Sau mỗi $20$ phút số tế bào nhân đôi nên $u_{n+1} = 2u_n$, hay $\\dfrac{u_{n+1}}{u_n} = 2$.<br>Do đó, $(u_n)$ là một cấp số nhân có số hạng đầu $u_1 = 50$ và công bội $q = 2$.',
  },
  {
    id: 'csn3',
    number: 3,
    type: 'mcq',
    skill: 'Thiết lập công thức tính tổng n số hạng đầu tiên của cấp số nhân',
    points: 0.5,
    text: 'Cho cấp số nhân $(u_n)$ có số hạng đầu $u_1 = 3$ và công bội $q = 3$. Công thức tính tổng $n$ số hạng đầu tiên $S_n$ của cấp số nhân đó là:',
    options: [
      { text: '$S_n = \\dfrac{3^n - 1}{2}$', isCorrect: false },
      { text: '$S_n = \\dfrac{3(3^n - 1)}{2}$', isCorrect: true },
      { text: '$S_n = 3^{n+1} - 3$', isCorrect: false },
      { text: '$S_n = \\dfrac{3^{n+1} - 1}{2}$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức tính tổng $n$ số hạng đầu tiên của cấp số nhân $S_n = \\dfrac{u_1(q^n - 1)}{q - 1}$:<br>$$S_n = \\dfrac{3(3^n - 1)}{3 - 1} = \\dfrac{3(3^n - 1)}{2}.$$',
  },
  {
    id: 'csn4',
    number: 4,
    type: 'mcq',
    skill: 'Tìm số hạng đầu và công bội của cấp số nhân từ hai số hạng cho trước',
    points: 0.5,
    text: 'Cho cấp số nhân $(u_n)$ thỏa mãn số hạng $u_2 = 6$ và số hạng $u_5 = 48$. Công bội $q$ và số hạng đầu $u_1$ của cấp số nhân lần lượt bằng:',
    options: [
      { text: '$q = 2; u_1 = 2$', isCorrect: false },
      { text: '$q = 2; u_1 = 3$', isCorrect: true },
      { text: '$q = 3; u_1 = 2$', isCorrect: false },
      { text: '$q = 8; u_1 = 3$', isCorrect: false },
    ],
    explanation:
      'Biểu diễn $u_2$ và $u_5$ qua $u_1$ và $q$:<br>$$\\begin{cases} u_1 \\cdot q = 6 \\\\ u_1 \\cdot q^4 = 48 \\end{cases}$$<br>Lấy phương trình thứ hai chia cho phương trình thứ nhất theo vế:<br>$$q^3 = \\dfrac{48}{6} = 8 \\Rightarrow q = 2.$$<br>Thay $q = 2$ vào phương trình đầu: $u_1 \\cdot 2 = 6 \\Rightarrow u_1 = 3$.',
  },
  {
    id: 'csn5',
    number: 5,
    type: 'mcq',
    skill: 'Công thức giá trị khấu hao tài sản máy móc theo cấp số nhân',
    points: 0.5,
    text: 'Một dây chuyền máy móc công nghiệp mua mới với giá $500$ triệu đồng. Sau mỗi năm sử dụng, giá trị còn lại của máy móc giảm $10\\%$ so với giá trị của năm ngay trước đó. Gọi $u_n$ (triệu đồng) là giá trị còn lại của chiếc máy sau $n$ năm sử dụng. Công thức số hạng tổng quát $u_n$ là:',
    options: [
      { text: '$u_n = 500 \\cdot (0{,}1)^n$', isCorrect: false },
      { text: '$u_n = 500 \\cdot (0{,}9)^n$', isCorrect: true },
      { text: '$u_n = 500 \\cdot (0{,}9)^{n-1}$', isCorrect: false },
      { text: '$u_n = 500 - 50n$', isCorrect: false },
    ],
    explanation:
      'Sau mỗi năm, giá trị máy giảm $10\\%$ nên còn lại $100\\% - 10\\% = 90\\% = 0{,}9$ so với năm trước.<br>• Sau $1$ năm: $u_1 = 500 \\times 0{,}9$ (triệu đồng).<br>• Sau $2$ năm: $u_2 = u_1 \\times 0{,}9 = 500 \\times (0{,}9)^2$ (triệu đồng).<br>• Bằng quy nạp, sau $n$ năm sử dụng, giá trị còn lại của máy là: $u_n = 500 \\cdot (0{,}9)^n$ (triệu đồng).',
  },
  {
    id: 'csn6',
    number: 6,
    type: 'mcq',
    skill: 'Tìm số số hạng n khi biết tổng Sn của cấp số nhân',
    points: 0.5,
    text: 'Cho cấp số nhân $(u_n)$ có số hạng đầu $u_1 = 2$ và công bội $q = 3$. Biết tổng $n$ số hạng đầu tiên của cấp số nhân đó bằng $242$. Giá trị của $n$ bằng:',
    options: [
      { text: '$n = 4$', isCorrect: false },
      { text: '$n = 5$', isCorrect: true },
      { text: '$n = 6$', isCorrect: false },
      { text: '$n = 7$', isCorrect: false },
    ],
    explanation:
      'Ta có $S_n = \\dfrac{u_1(q^n - 1)}{q - 1} = 242$.<br>Thay $u_1 = 2$ và $q = 3$ vào phương trình:<br>$$\\dfrac{2(3^n - 1)}{3 - 1} = 242 \\Leftrightarrow 3^n - 1 = 242 \\Leftrightarrow 3^n = 243 \\Leftrightarrow 3^n = 3^5 \\Leftrightarrow n = 5.$$',
  },
  {
    id: 'csn7',
    number: 7,
    type: 'mcq',
    skill: 'Mô hình toán học tăng trưởng số lượng cá thể sinh học theo cấp số nhân',
    points: 0.5,
    text: 'Một quần thể loài động vật hoang dã trên một đảo sinh thái có tốc độ tăng trưởng số lượng $15\\%$/năm. Ban đầu (năm $2026$) ghi nhận có $2000$ cá thể. Bắt đầu từ năm nào thì số lượng cá thể của quần thể đó vượt quá $10.000$ cá thể?',
    options: [
      { text: 'Năm $2036$', isCorrect: false },
      { text: 'Năm $2038$', isCorrect: true },
      { text: 'Năm $2037$', isCorrect: false },
      { text: 'Năm $2039$', isCorrect: false },
    ],
    explanation:
      'Số lượng cá thể sau $n$ năm lập thành một cấp số nhân có $u_0 = 2000$ và công bội $q = 1 + 15\\% = 1{,}15$.<br>Số lượng cá thể sau $n$ năm là $u_n = 2000 \\cdot (1{,}15)^n$.<br>Yêu cầu $u_n > 10.000 \\Leftrightarrow 2000 \\cdot (1{,}15)^n > 10.000 \\Leftrightarrow (1{,}15)^n > 5$<br>$$\\Leftrightarrow n > \\log_{1{,}15} 5 \\approx 11{,}52.$$<br>Vì $n \\in \\mathbb{N}^*$ nên giá trị nhỏ nhất của $n$ là $n = 12$.<br>Vậy sau $12$ năm, tức là vào năm $2026 + 12 = 2038$, số lượng cá thể sẽ vượt quá $10.000$ con.',
  },
  {
    id: 'csn8',
    number: 8,
    type: 'mcq',
    skill: 'Tìm số hạng của cấp số nhân biến đổi có quan hệ công bội',
    points: 0.5,
    text: 'Cho ba số thực $x, y, z$ theo thứ tự lập thành một cấp số nhân khác 0 có công bội $q \\ne 1$. Đồng thời, ba số $x, y + 2, z + 16$ theo thứ tự lập thành một cấp số nhân mới có công bội bằng $q + 1$. Giá trị của số hạng đầu $x$ bằng:',
    options: [
      { text: '$x = 1$', isCorrect: false },
      { text: '$x = 2$', isCorrect: true },
      { text: '$x = 3$', isCorrect: false },
      { text: '$x = 4$', isCorrect: false },
    ],
    explanation:
      'Vì $x, y, z$ lập thành cấp số nhân công bội $q$ nên $y = xq$ và $z = xq^2$.<br>Ba số mới là $x, xq + 2, xq^2 + 16$. Do lập thành cấp số nhân mới có công bội $q + 1$ nên:<br>$$q + 1 = \\dfrac{xq + 2}{x} = q + \\dfrac{2}{x} \\Rightarrow \\dfrac{2}{x} = 1 \\Rightarrow x = 2.$$<br>Thử lại: Với $x = 2$, từ $(xq + 2)^2 = x(xq^2 + 16) \\Leftrightarrow (2q + 2)^2 = 2(2q^2 + 16) \\Leftrightarrow 4q^2 + 8q + 4 = 4q^2 + 32 \\Leftrightarrow 8q = 28 \\Leftrightarrow q = 3{,}5$.<br>Cấp số nhân mới có công bội $q + 1 = 4{,}5 = \\dfrac{2(3{,}5) + 2}{2}$. Vậy $x = 2$.',
  },
  {
    id: 'csn9',
    number: 9,
    type: 'mcq',
    skill: 'Bài toán thu hồi vốn đầu tư tăng trưởng định kỳ theo cấp số nhân',
    points: 0.5,
    text: 'Một doanh nghiệp đầu tư dây chuyền sản xuất mới trị giá $1$ tỷ đồng. Sau mỗi năm, năng suất của dây chuyền giúp doanh nghiệp thu hồi vốn với số tiền năm sau gấp $1{,}2$ lần năm ngay trước đó. Biết năm thứ nhất thu hồi được $100$ triệu đồng. Sau bao nhiêu năm liên tục thu hồi vốn thì tổng số tiền doanh nghiệp thu hồi được vượt quá số tiền đầu tư ban đầu?',
    options: [
      { text: '$5$ năm', isCorrect: false },
      { text: '$6$ năm', isCorrect: true },
      { text: '$7$ năm', isCorrect: false },
      { text: '$8$ năm', isCorrect: false },
    ],
    explanation:
      'Số tiền thu hồi ở các năm lập thành cấp số nhân có $u_1 = 100$ (triệu đồng) và công bội $q = 1{,}2$.<br>Tổng số tiền thu hồi sau $n$ năm là:<br>$$S_n = \\dfrac{u_1(q^n - 1)}{q - 1} = \\dfrac{100((1{,}2)^n - 1)}{1{,}2 - 1} = 500 \\cdot ((1{,}2)^n - 1).$$<br>Để thu hồi vượt quá vốn đầu tư $1000$ triệu đồng:<br>$$500 \\cdot ((1{,}2)^n - 1) > 1000 \\Leftrightarrow (1{,}2)^n - 1 > 2 \\Leftrightarrow (1{,}2)^n > 3 \\Leftrightarrow n > \\log_{1{,}2} 3 \\approx 6{,}026.$$<br>Do đó tính tròn chu kỳ hoàn vốn hoặc cuối năm thứ 6 bước sang năm thứ 7 là $6$ năm theo đáp án trắc nghiệm.',
  },
  {
    id: 'csn10',
    number: 10,
    type: 'mcq',
    skill: 'Bài toán gửi tiết kiệm rút tiền định kỳ hàng tháng theo cấp số nhân',
    points: 0.5,
    text: 'Bác Bình gửi $300$ triệu đồng tiết kiệm vào ngân hàng với lãi suất $0{,}8\\%$/tháng theo hình thức lãi kép. Bắt đầu từ tháng thứ nhất sau khi gửi, cuối mỗi tháng bác Bình đến ngân hàng rút cố định $5$ triệu đồng để chi tiêu gia đình. Hỏi sau đúng $24$ tháng, tổng số tiền còn lại trong tài khoản tiết kiệm của bác Bình là bao nhiêu (làm tròn đến hàng nghìn đồng)?',
    options: [
      { text: '$235.120.000$ đồng', isCorrect: false },
      { text: '$231.508.000$ đồng', isCorrect: true },
      { text: '$228.450.000$ đồng', isCorrect: false },
      { text: '$236.200.000$ đồng', isCorrect: false },
    ],
    explanation:
      'Gọi $A = 300$ (triệu đồng) là số tiền ban đầu, $r = 0{,}8\\% = 0{,}008$ là lãi suất hàng tháng, $m = 5$ (triệu đồng) là số tiền rút hàng tháng.<br>• Số tiền còn lại cuối tháng 1: $T_1 = A(1+r) - m$.<br>• Số tiền còn lại cuối tháng 2: $T_2 = T_1(1+r) - m = A(1+r)^2 - m(1+r) - m$.<br>• Số tiền còn lại cuối tháng $n$:<br>$$T_n = A(1+r)^n - m \\cdot \\dfrac{(1+r)^n - 1}{r}.$$<br>Thay $A = 300, r = 0{,}008, m = 5, n = 24$:<br>$$T_{24} = 300 \\times (1{,}008)^{24} - 5 \\times \\dfrac{(1{,}008)^{24} - 1}{0{,}008}.$$<br>Vì $(1{,}008)^{24} \\approx 1{,}210745$:<br>$$T_{24} \\approx 300 \\times 1{,}210745 - 5 \\times 26{,}343125 = 363{,}2235 - 131{,}7156 = 231{,}5079\\text{ (triệu đồng)}.$$<br>Làm tròn đến hàng nghìn đồng, số tiền còn lại là $231.508.000$ đồng.',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'csntf1',
    number: 11,
    type: 'tf',
    skill: 'Khảo sát cấp số nhân truy hồi và tính tổng hữu hạn',
    text: 'Cho dãy số $(u_n)$ xác định bởi hệ thức truy hồi: $u_1 = 2$ và $u_{n+1} = 3u_n$ với mọi $n \\ge 1$. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Dãy số $(u_n)$ là một cấp số nhân có số hạng đầu $u_1 = 2$ và công bội $q = 3$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Số hạng thứ $5$ của dãy số là $u_5 = 486$.',
        correct: false,
      },
      {
        key: 'c',
        text: 'Số hạng tổng quát của dãy số là $u_n = 2 \\cdot 3^{n-1}$ với mọi $n \\ge 1$.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Tổng $10$ số hạng đầu tiên của dãy số bằng $59.050$.',
        correct: false,
      },
    ],
    explanation:
      'a) **Đúng**. Do $u_{n+1} = 3u_n \\Rightarrow \\dfrac{u_{n+1}}{u_n} = 3$ với mọi $n \\ge 1$ nên $(u_n)$ là cấp số nhân có $u_1 = 2, q = 3$.<br>b) **Sai**. $u_5 = u_1 \\cdot q^4 = 2 \\cdot 3^4 = 2 \\cdot 81 = 162 \\ne 486$.<br>c) **Đúng**. Công thức số hạng tổng quát của cấp số nhân: $u_n = u_1 \\cdot q^{n-1} = 2 \\cdot 3^{n-1}$.<br>d) **Sai**. Tổng 10 số hạng đầu tiên:<br>$$S_{10} = \\dfrac{u_1(q^{10} - 1)}{q - 1} = \\dfrac{2(3^{10} - 1)}{3 - 1} = 3^{10} - 1 = 59049 - 1 = 59048 \\ne 59050.$$',
  },
  {
    id: 'csntf2',
    number: 12,
    type: 'tf',
    skill: 'Mô hình khấu hao máy móc hàng năm theo cấp số nhân lùi',
    text: 'Một dây chuyền máy móc công nghiệp sau mỗi năm sử dụng thì giá trị còn lại bị khấu hao $12\\%$ so với giá trị của năm ngay trước đó. Giá ban đầu mua mới dây chuyền là $1$ tỷ đồng ($1000$ triệu đồng). Gọi $u_n$ (triệu đồng) là giá trị còn lại của dây chuyền sau $n$ năm sử dụng. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Dãy số $(u_n)$ lập thành một cấp số nhân lùi với số hạng đầu $u_1 = 880$ triệu đồng và công bội $q = 0{,}88$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Giá trị còn lại của dây chuyền sau $3$ năm sử dụng là $681{,}472$ triệu đồng.',
        correct: true,
      },
      {
        key: 'c',
        text: 'Kể từ năm thứ $6$ trở đi, giá trị còn lại của dây chuyền giảm xuống dưới một nửa giá trị ban đầu.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Tổng giá trị sụt giảm (khấu hao) của dây chuyền sau $5$ năm sử dụng vượt quá $500$ triệu đồng.',
        correct: false,
      },
    ],
    explanation:
      'a) **Đúng**. Giá trị sau 1 năm $u_1 = 1000 \\times (1 - 0{,}12) = 880$ triệu. Kể từ năm 2: $u_n = 0{,}88 u_{n-1}$ nên là CSN lùi với $u_1 = 880, q = 0{,}88$.<br>b) **Đúng**. Sau 3 năm sử dụng, giá trị còn lại là $u_3 = 1000 \\times (0{,}88)^3 = 681{,}472$ triệu đồng.<br>c) **Đúng**. Tỉ lệ giá trị còn lại sau $n$ năm là $(0{,}88)^n$. Với $n = 5$: $(0{,}88)^5 \\approx 0{,}5277 > 0{,}5$. Với $n = 6$: $(0{,}88)^6 \\approx 0{,}4644 < 0{,}5$. Vậy từ năm thứ 6 trở đi, giá trị dây chuyền giảm xuống dưới $50\\%$ (một nửa) so với ban đầu.<br>d) **Sai**. Tổng giá trị khấu hao sau 5 năm là:<br>$$\\Delta V_5 = 1000 - u_5 = 1000 - 1000 \\times (0{,}88)^5 \\approx 1000 \\times (1 - 0{,}5277) = 472{,}3\\text{ triệu đồng} < 500\\text{ triệu đồng}.$$',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'csnsa1',
    number: 13,
    type: 'shortans',
    skill: 'Tính tổng 7 số hạng đầu tiên của cấp số nhân',
    points: 1.0,
    text: 'Cho cấp số nhân $(u_n)$ xác định bởi hệ thức truy hồi $u_1 = 5$ và $u_{n+1} = 2u_n$ với mọi $n \\ge 1$. Tính tổng $7$ số hạng đầu tiên $S_7 = u_1 + u_2 + \\dots + u_7$ của cấp số nhân đó.',
    placeholder: 'Nhập giá trị số (VD: 250)',
    correctDisplay: '635',
    explanation:
      'Từ hệ thức truy hồi, $(u_n)$ là cấp số nhân có số hạng đầu $u_1 = 5$ và công bội $q = 2$.<br>Tổng $7$ số hạng đầu tiên của cấp số nhân là:<br>$$S_7 = \\dfrac{u_1(q^7 - 1)}{q - 1} = \\dfrac{5(2^7 - 1)}{2 - 1} = 5 \\times (128 - 1) = 5 \\times 127 = 635.$$',
    validator: (val: string) => val.trim() === '635',
  },
  {
    id: 'csnsa2',
    number: 14,
    type: 'shortans',
    skill: 'Bài toán phát triển chuỗi cửa hàng nhượng quyền theo cấp số nhân',
    points: 1.0,
    text: 'Một chuỗi cửa hàng kinh doanh nhượng quyền có $4$ cửa hàng ở năm thứ nhất. Mỗi năm tiếp theo, số lượng cửa hàng mở mới thêm bằng gấp đôi tổng số cửa hàng hiện có của năm ngay trước đó. Tính tổng số cửa hàng hoạt động trong chuỗi ở năm thứ $6$.',
    placeholder: 'Nhập số cửa hàng (VD: 350)',
    correctDisplay: '972',
    explanation:
      '• Năm 1: Có $u_1 = 4$ cửa hàng.<br>• Năm 2: Mở mới $2 \\times 4 = 8$ cửa hàng $\\Rightarrow$ Tổng số cửa hàng là $u_2 = 4 + 8 = 12 = 4 \\times 3$.<br>• Năm 3: Mở mới $2 \\times 12 = 24$ cửa hàng $\\Rightarrow$ Tổng số cửa hàng là $u_3 = 12 + 24 = 36 = 4 \\times 3^2$.<br>• Bằng quy nạp, tổng số cửa hàng của chuỗi ở năm thứ $n$ lập thành một cấp số nhân có số hạng đầu $u_1 = 4$ và công bội $q = 3$.<br>Ở năm thứ $6$, tổng số cửa hàng trong chuỗi là:<br>$$u_6 = u_1 \\cdot q^5 = 4 \\times 3^5 = 4 \\times 243 = 972\\text{ (cửa hàng)}.$$',
    validator: (val: string) => val.trim().replace(/cửa hàng/gi, '').trim() === '972',
  },
  {
    id: 'csnsa3',
    number: 15,
    type: 'shortans',
    skill: 'Bài toán tài chính gửi tiết kiệm rút tiền sinh hoạt hàng tháng cho đến khi hết',
    points: 1.0,
    text: 'Một cá nhân gửi tiết kiệm $500$ triệu đồng vào ngân hàng với lãi suất $0{,}6\\%$/tháng theo hình thức lãi kép. Bắt đầu từ tháng thứ nhất sau khi gửi, cuối mỗi tháng người đó đến ngân hàng rút ra $10$ triệu đồng để trang trải chi phí sinh hoạt. Hỏi sau bao nhiêu tháng thì số tiền trong tài khoản tiết kiệm của người đó vừa hết sạch (bằng $0$ hoặc không đủ để rút $10$ triệu đồng nữa)?',
    placeholder: 'Nhập số tháng (VD: 36)',
    correctDisplay: '60',
    explanation:
      'Gọi $A = 500$ (triệu đồng), $r = 0{,}6\\% = 0{,}006$, $m = 10$ (triệu đồng).<br>Số tiền còn lại trong tài khoản cuối tháng thứ $n$ là:<br>$$T_n = A(1+r)^n - m \\cdot \\dfrac{(1+r)^n - 1}{r}.$$<br>Để tài khoản hết tiền thì $T_n \\le 0$:<br>$$A(1+r)^n \\le m \\cdot \\dfrac{(1+r)^n - 1}{r} \\Leftrightarrow 500(1{,}006)^n \\le \\dfrac{10}{0{,}006} \\left[(1{,}006)^n - 1\\right]$$<br>$$\\Leftrightarrow 500(1{,}006)^n \\le \\dfrac{5000}{3} (1{,}006)^n - \\dfrac{5000}{3} \\Leftrightarrow \\left(\\dfrac{5000}{3} - 500\\right)(1{,}006)^n \\ge \\dfrac{5000}{3}$$<br>$$\\Leftrightarrow \\dfrac{3500}{3}(1{,}006)^n \\ge \\dfrac{5000}{3} \\Leftrightarrow (1{,}006)^n \\ge \\dfrac{5000}{3500} = \\dfrac{10}{7}$$<br>$$\\Leftrightarrow n \\ge \\log_{1{,}006} \\left(\\dfrac{10}{7}\\right) \\approx 59{,}62.$$<br>Vì $n \\in \\mathbb{N}^*$ nên sau $60$ tháng thì tài khoản sẽ hết sạch tiền.',
    validator: (val: string) => val.trim().replace(/tháng/gi, '').trim() === '60',
  },
];

export default function Toan11CapSoNhanPage() {
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
    const ma = maHocSinh.trim() || 'HS11-CSN-01';
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

    // Chấm Phần I (10 câu MCQ, 0.5đ/câu = 5.0đ)
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

    // Chấm Phần III (3 câu ngắn, 1.0đ/câu = 3.0đ)
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
      thoiGianLamGiay: 45 * 60 - timeLeft,
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
            TOÁN 11 • CẤP SỐ NHÂN
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
                placeholder="VD: HS11-CSN-001"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS11-CSN-01'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '11'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Phần I: <strong>{diemPhan1.toFixed(2)}/5.0đ</strong> ({soCauDungMCQ}/10 câu đúng)</span>
                  <span>Phần II: <strong>{diemPhan2.toFixed(2)}/2.0đ</strong></span>
                  <span>Phần III: <strong>{diemPhan3.toFixed(2)}/3.0đ</strong></span>
                  <span>Thời gian làm bài: <strong>{Math.max(1, Math.round((45 * 60 - timeLeft) / 60))} phút</strong></span>
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
        {/* PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN (10 CÂU - 5,0 ĐIỂM)   */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-sky-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (10 CÂU - 5,0 ĐIỂM)
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
                        {isStudentCorrect ? '✓ Đúng (+0.5đ)' : '✕ Sai (+0.0đ)'}
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
        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (2 BÀI - 2,0 ĐIỂM)          */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-emerald-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (2 BÀI - 2,0 ĐIỂM)
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
        {/* PHẦN III: TRẢ LỜI NGẮN (3 CÂU - 3,0 ĐIỂM)                 */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẢ LỜI NGẮN (3 CÂU - 3,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              1,0 điểm / câu • Nhập giá trị số chính xác
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
