'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA MÔN TOÁN LỚP 11 - 45 PHÚT';
const EXAM_SUBTITLE = 'CHỦ ĐỀ: DÃY SỐ';
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
    id: 'ds1',
    number: 1,
    type: 'mcq',
    skill: 'Tính số hạng của dãy số cho bởi công thức tổng quát',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ cho bởi công thức số hạng tổng quát $u_n = \\dfrac{3n - 1}{n + 2}$. Giá trị của số hạng $u_4$ bằng:',
    options: [
      { text: '$\\dfrac{11}{6}$', isCorrect: true },
      { text: '$\\dfrac{5}{3}$', isCorrect: false },
      { text: '$\\dfrac{11}{4}$', isCorrect: false },
      { text: '$\\dfrac{7}{6}$', isCorrect: false },
    ],
    explanation:
      'Thay $n = 4$ vào công thức số hạng tổng quát của dãy số:<br>$$u_4 = \\dfrac{3(4) - 1}{4 + 2} = \\dfrac{11}{6}.$$',
  },
  {
    id: 'ds2',
    number: 2,
    type: 'mcq',
    skill: 'Nhận biết tính tăng, giảm của dãy số',
    points: 0.5,
    text: 'Trong các dãy số $(u_n)$ cho bởi công thức số hạng tổng quát sau đây, dãy số nào là dãy số giảm trên $\\mathbb{N}^*$?',
    options: [
      { text: '$u_n = \\dfrac{2n + 1}{n + 1}$', isCorrect: false },
      { text: '$u_n = \\dfrac{1}{3^n}$', isCorrect: true },
      { text: '$u_n = n^2 + 1$', isCorrect: false },
      { text: '$u_n = (-1)^n \\cdot n$', isCorrect: false },
    ],
    explanation:
      'Xét dãy số $u_n = \\dfrac{1}{3^n}$. Với mọi $n \\in \\mathbb{N}^*$, ta có:<br>$$u_{n+1} - u_n = \\dfrac{1}{3^{n+1}} - \\dfrac{1}{3^n} = \\dfrac{1 - 3}{3^{n+1}} = -\\dfrac{2}{3^{n+1}} < 0.$$<br>Do đó $(u_n)$ là dãy số giảm trên $\\mathbb{N}^*$.',
  },
  {
    id: 'ds3',
    number: 3,
    type: 'mcq',
    skill: 'Định nghĩa dãy số bị chặn',
    points: 0.5,
    text: 'Khẳng định nào sau đây là **đúng** về khái niệm dãy số bị chặn?',
    options: [
      {
        text: 'Dãy số $(u_n)$ được gọi là bị chặn nếu nó vừa bị chặn trên vừa bị chặn dưới.',
        isCorrect: true,
      },
      {
        text: 'Dãy số $(u_n)$ được gọi là bị chặn nếu tồn tại số thực $M$ sao cho $u_n \\ge M$ với mọi $n \\in \\mathbb{N}^*$.',
        isCorrect: false,
      },
      {
        text: 'Dãy số $(u_n)$ được gọi là bị chặn nếu nó là một dãy số tăng.',
        isCorrect: false,
      },
      {
        text: 'Dãy số $(u_n)$ được gọi là bị chặn nếu tất cả các số hạng của nó đều là số dương.',
        isCorrect: false,
      },
    ],
    explanation:
      'Theo định nghĩa, dãy số $(u_n)$ được gọi là bị chặn nếu nó vừa bị chặn trên vừa bị chặn dưới, tức là tồn tại các số thực $m, M$ sao cho $m \\le u_n \\le M$ với mọi $n \\in \\mathbb{N}^*$.',
  },
  {
    id: 'ds4',
    number: 4,
    type: 'mcq',
    skill: 'Tìm số hạng của dãy số xác định bằng hệ thức truy hồi',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ xác định bởi $u_1 = 2$ và $u_{n+1} = u_n + 2n + 1$ với mọi $n \\ge 1$. Giá trị của số hạng $u_4$ bằng:',
    options: [
      { text: '$12$', isCorrect: false },
      { text: '$17$', isCorrect: true },
      { text: '$26$', isCorrect: false },
      { text: '$15$', isCorrect: false },
    ],
    explanation:
      'Tính lần lượt các số hạng đầu của dãy số:<br>• $u_1 = 2$<br>• $u_2 = u_1 + 2(1) + 1 = 2 + 3 = 5$<br>• $u_3 = u_2 + 2(2) + 1 = 5 + 5 = 10$<br>• $u_4 = u_3 + 2(3) + 1 = 10 + 7 = 17$.',
  },
  {
    id: 'ds5',
    number: 5,
    type: 'mcq',
    skill: 'Xét tính tăng, giảm của dãy số phân thức bậc nhất',
    points: 0.5,
    text: 'Xét tính tăng, giảm của dãy số $(u_n)$ với $u_n = \\dfrac{2n - 3}{n + 1}$. Khẳng định nào sau đây **đúng**?',
    options: [
      { text: 'Dãy số $(u_n)$ là dãy số giảm.', isCorrect: false },
      { text: 'Dãy số $(u_n)$ là dãy số tăng.', isCorrect: true },
      { text: 'Dãy số $(u_n)$ không tăng, không giảm.', isCorrect: false },
      { text: 'Dãy số $(u_n)$ giảm khi $n$ chẵn và tăng khi $n$ lẻ.', isCorrect: false },
    ],
    explanation:
      'Xét hiệu $u_{n+1} - u_n$:<br>$$u_{n+1} - u_n = \\dfrac{2(n+1) - 3}{(n+1) + 1} - \\dfrac{2n - 3}{n + 1} = \\dfrac{2n - 1}{n + 2} - \\dfrac{2n - 3}{n + 1}$$<br>$$= \\dfrac{(2n - 1)(n + 1) - (2n - 3)(n + 2)}{(n + 2)(n + 1)} = \\dfrac{(2n^2 + n - 1) - (2n^2 + n - 6)}{(n + 2)(n + 1)} = \\dfrac{5}{(n + 2)(n + 1)}.$$<br>Vì $n \\ge 1$ nên $(n+2)(n+1) > 0 \\Rightarrow u_{n+1} - u_n > 0$ với mọi $n \\in \\mathbb{N}^*$.<br>Do đó dãy số $(u_n)$ là dãy số tăng.',
  },
  {
    id: 'ds6',
    number: 6,
    type: 'mcq',
    skill: 'Xét tính bị chặn của dãy số phân thức bậc hai',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{n^2 + 1}{2n^2 + 3}$. Mệnh đề nào sau đây **đúng**?',
    options: [
      {
        text: 'Dãy số $(u_n)$ bị chặn trên bởi $\\dfrac{1}{2}$ và bị chặn dưới bởi $0$.',
        isCorrect: false,
      },
      {
        text: 'Dãy số $(u_n)$ bị chặn vì $0 < u_n < \\dfrac{1}{2}$ với mọi $n \\in \\mathbb{N}^*$.',
        isCorrect: true,
      },
      {
        text: 'Dãy số $(u_n)$ chỉ bị chặn dưới, không bị chặn trên.',
        isCorrect: false,
      },
      {
        text: 'Dãy số $(u_n)$ không bị chặn.',
        isCorrect: false,
      },
    ],
    explanation:
      'Với mọi $n \\in \\mathbb{N}^*$:<br>• Do $n^2 + 1 > 0$ và $2n^2 + 3 > 0$ nên $u_n > 0$.<br>• Biến đổi $u_n = \\dfrac{\\frac{1}{2}(2n^2 + 3) - \\frac{1}{2}}{2n^2 + 3} = \\dfrac{1}{2} - \\dfrac{1}{2(2n^2 + 3)} < \\dfrac{1}{2}$.<br>Do $0 < u_n < \\dfrac{1}{2}$ với mọi $n \\in \\mathbb{N}^*$ nên dãy số $(u_n)$ bị chặn.',
  },
  {
    id: 'ds7',
    number: 7,
    type: 'mcq',
    skill: 'Mô hình hóa bài toán lương tăng trưởng định kỳ theo dãy số',
    points: 0.5,
    text: 'Một kĩ sư phần mềm nhận mức lương khởi điểm năm đầu tiên là $180$ triệu đồng/năm. Từ năm thứ hai trở đi, mỗi năm tiền lương của kĩ sư đó được tăng thêm $8\\%$ so với tiền lương của năm ngay trước đó. Gọi $u_n$ (triệu đồng) là tiền lương của kĩ sư ở năm thứ $n$. Công thức số hạng tổng quát $u_n$ là:',
    options: [
      { text: '$u_n = 180 + 0{,}08(n-1)$', isCorrect: false },
      { text: '$u_n = 180 \\cdot (1{,}08)^{n-1}$', isCorrect: true },
      { text: '$u_n = 180 \\cdot (1{,}08)^n$', isCorrect: false },
      { text: '$u_n = 180 \\cdot (0{,}08)^{n-1}$', isCorrect: false },
    ],
    explanation:
      'Tiền lương năm thứ nhất: $u_1 = 180$ triệu đồng.<br>Tiền lương năm thứ hai: $u_2 = u_1(1 + 0{,}08) = 180 \\cdot 1{,}08$ triệu đồng.<br>Tiền lương năm thứ ba: $u_3 = u_2(1 + 0{,}08) = 180 \\cdot (1{,}08)^2$ triệu đồng.<br>Bằng phương pháp quy nạp, tiền lương của kĩ sư ở năm thứ $n$ là:<br>$$u_n = 180 \\cdot (1{,}08)^{n-1}\\text{ (triệu đồng)}.$$',
  },
  {
    id: 'ds8',
    number: 8,
    type: 'mcq',
    skill: 'Ứng dụng dãy số trong mô hình y học (nồng độ thuốc trong máu)',
    points: 0.5,
    text: 'Nồng độ một loại thuốc thử trong máu của bệnh nhân sau $t$ giờ tiêm ($t \\in \\mathbb{N}^*$) được mô hình hóa bởi dãy số $C_t = \\dfrac{8t}{t^2 + 4}$ (mg/L). Khẳng định nào sau đây mô tả đúng xu hướng thay đổi của nồng độ thuốc trong máu kể từ giờ thứ $2$ trở đi ($t \\ge 2$)?',
    options: [
      { text: 'Nồng độ thuốc tăng liên tục từ giờ thứ $2$ trở đi.', isCorrect: false },
      { text: 'Nồng độ thuốc giảm liên tục từ giờ thứ $2$ trở đi.', isCorrect: true },
      { text: 'Nồng độ thuốc giữ nguyên không đổi.', isCorrect: false },
      {
        text: 'Nồng độ thuốc giảm trong khoảng từ $t = 2$ đến $t = 4$ rồi tăng lại.',
        isCorrect: false,
      },
    ],
    explanation:
      'Xét hiệu $C_{t+1} - C_t$:<br>$$C_{t+1} - C_t = \\dfrac{8(t+1)}{(t+1)^2 + 4} - \\dfrac{8t}{t^2 + 4} = \\dfrac{8(t+1)(t^2 + 4) - 8t(t^2 + 2t + 5)}{((t+1)^2 + 4)(t^2 + 4)}$$<br>$$= \\dfrac{8(t^3 + t^2 + 4t + 4 - t^3 - 2t^2 - 5t)}{((t+1)^2 + 4)(t^2 + 4)} = \\dfrac{8(4 - t - t^2)}{((t+1)^2 + 4)(t^2 + 4)}.$$<br>Với mọi $t \\ge 2$, ta có $4 - t - t^2 \\le 4 - 2 - 4 = -2 < 0$.<br>Do đó $C_{t+1} - C_t < 0$ với mọi $t \\ge 2$. Vậy kể từ giờ thứ 2 trở đi, nồng độ thuốc giảm liên tục.',
  },
  {
    id: 'ds9',
    number: 9,
    type: 'mcq',
    skill: 'Tìm tham số để dãy số đơn điệu',
    points: 0.5,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{n + a}{2n + 1}$ ($a$ là tham số thực). Có bao nhiêu giá trị nguyên của $a \\in [-5; 10]$ để $(u_n)$ là một dãy số tăng trên $\\mathbb{N}^*$?',
    options: [
      { text: '$5$', isCorrect: false },
      { text: '$10$', isCorrect: false },
      { text: '$6$', isCorrect: true },
      { text: '$11$', isCorrect: false },
    ],
    explanation:
      'Xét hiệu $u_{n+1} - u_n$:<br>$$u_{n+1} - u_n = \\dfrac{(n+1) + a}{2(n+1) + 1} - \\dfrac{n + a}{2n + 1} = \\dfrac{n + a + 1}{2n + 3} - \\dfrac{n + a}{2n + 1}$$<br>$$= \\dfrac{(n + a + 1)(2n + 1) - (n + a)(2n + 3)}{(2n + 3)(2n + 1)} = \\dfrac{1 - 2a}{(2n + 3)(2n + 1)}.$$<br>Để $(u_n)$ là dãy số tăng thì $u_{n+1} - u_n > 0 \\quad \\forall n \\ge 1 \\Leftrightarrow 1 - 2a > 0 \\Leftrightarrow a < \\dfrac{1}{2}$.<br>Các giá trị nguyên $a \\in [-5; 10]$ thỏa mãn $a < \\dfrac{1}{2}$ là $a \\in \\{-5; -4; -3; -2; -1; 0\\}$. Có $6$ giá trị nguyên thỏa mãn.',
  },
  {
    id: 'ds10',
    number: 10,
    type: 'mcq',
    skill: 'Ứng dụng dãy số trong bài toán tiết kiệm lãi kép định kỳ',
    points: 0.5,
    text: 'Một cá nhân lập kế hoạch tích lũy tài chính: đầu mỗi tháng gửi $5$ triệu đồng vào tài khoản tiết kiệm với lãi suất $0{,}5\\%$/tháng theo hình thức lãi kép. Gọi $S_n$ (triệu đồng) là tổng số tiền tích lũy có trong tài khoản ngay sau khi gửi khoản tiền ở đầu tháng thứ $n$. Bắt đầu từ tháng thứ mấy thì tổng số tiền tích lũy trong tài khoản vượt quá $100$ triệu đồng?',
    options: [
      { text: 'Tháng thứ $18$', isCorrect: false },
      { text: 'Tháng thứ $19$', isCorrect: false },
      { text: 'Tháng thứ $20$', isCorrect: true },
      { text: 'Tháng thứ $21$', isCorrect: false },
    ],
    explanation:
      'Gọi $A = 5$ (triệu đồng), $r = 0{,}5\\% = 0{,}005$.<br>Số tiền tích lũy ngay sau khi gửi tiền ở đầu tháng thứ $n$ là:<br>$$S_n = A(1+r)^n + A(1+r)^{n-1} + \\dots + A(1+r) = A(1+r) \\cdot \\dfrac{(1+r)^n - 1}{r}.$$<br>Thay $A = 5, r = 0{,}005$:<br>$$S_n = 5 \\times 1{,}005 \\times \\dfrac{(1{,}005)^n - 1}{0{,}005} = 1005 \\times \\left[(1{,}005)^n - 1\\right].$$<br>Yêu cầu $S_n > 100 \\Leftrightarrow 1005 \\left[(1{,}005)^n - 1\\right] > 100 \\Leftrightarrow (1{,}005)^n > 1 + \\dfrac{100}{1005} = \\dfrac{221}{201}$$<br>$$\\Leftrightarrow n > \\log_{1{,}005}\\left(\\dfrac{221}{201}\\right) \\approx 19{,}017.$$<br>Vì $n \\in \\mathbb{N}^*$ nên giá trị nhỏ nhất của $n$ thỏa mãn là $n = 20$. Vậy bắt đầu từ tháng thứ $20$ thì tổng số tiền tích lũy vượt quá $100$ triệu đồng.',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'dstf1',
    number: 11,
    type: 'tf',
    skill: 'Khảo sát dãy số truy hồi dạng sai phân',
    text: 'Cho dãy số $(u_n)$ xác định bởi hệ thức truy hồi $u_1 = 1$ và $u_{n+1} = u_n + 3n - 1$ với mọi $n \\ge 1$. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Số hạng $u_2 = 3$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Số hạng $u_3 = 9$.',
        correct: false,
      },
      {
        key: 'c',
        text: 'Số hạng tổng quát của dãy số là $u_n = \\dfrac{3n^2 - 5n + 4}{2}$ với mọi $n \\ge 1$.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Dãy số $(u_n)$ là một dãy số bị chặn trên.',
        correct: false,
      },
    ],
    explanation:
      'a) **Đúng**. $u_2 = u_1 + 3(1) - 1 = 1 + 2 = 3$.<br>b) **Sai**. $u_3 = u_2 + 3(2) - 1 = 3 + 5 = 8 \\ne 9$.<br>c) **Đúng**. Ta có $u_{k+1} - u_k = 3k - 1$. Do đó:<br>$$u_n = u_1 + \\sum_{k=1}^{n-1} (3k - 1) = 1 + 3 \\cdot \\dfrac{(n-1)n}{2} - (n-1) = \\dfrac{3n^2 - 5n + 4}{2}.$$<br>d) **Sai**. Vì $u_n = \\dfrac{3n^2 - 5n + 4}{2} \\to +\\infty$ khi $n \\to +\\infty$ nên dãy số không bị chặn trên.',
  },
  {
    id: 'dstf2',
    number: 12,
    type: 'tf',
    skill: 'Mô hình hóa cước phí giảm theo cấp số nhân lùi vô hạn',
    text: 'Một công ty viễn thông đưa ra gói cước dữ liệu di động: tháng đầu tiên cước phí là $100$ nghìn đồng. Từ tháng thứ hai trở đi, cước phí tháng sau giảm $10\\%$ so với cước phí tháng ngay trước đó. Gọi $u_n$ (nghìn đồng) là cước phí dữ liệu ở tháng thứ $n$. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Dãy số $(u_n)$ là một cấp số nhân lùi với số hạng đầu $u_1 = 100$ và công bội $q = 0{,}9$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Cước phí dữ liệu ở tháng thứ $4$ là $70$ nghìn đồng.',
        correct: false,
      },
      {
        key: 'c',
        text: 'Dãy số $(u_n)$ là dãy số giảm và bị chặn dưới bởi $0$.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Tổng toàn bộ cước phí dữ liệu mà khách hàng phải trả sau $12$ tháng sử dụng vượt quá $800$ nghìn đồng.',
        correct: false,
      },
    ],
    explanation:
      'a) **Đúng**. Cước phí tháng thứ $n$ thỏa mãn $u_1 = 100$ và $u_n = u_{n-1}(1 - 0{,}1) = 0{,}9 u_{n-1}$ nên $(u_n)$ là cấp số nhân lùi với $u_1 = 100, q = 0{,}9$.<br>b) **Sai**. Cước phí tháng thứ 4 là $u_4 = u_1 \\cdot q^3 = 100 \\cdot (0{,}9)^3 = 72{,}9$ nghìn đồng $\\ne 70$.<br>c) **Đúng**. Vì $u_1 = 100 > 0$ và $0 < q = 0{,}9 < 1$ nên $u_n = 100 \\cdot (0{,}9)^{n-1} > 0$ với mọi $n \\ge 1$ (bị chặn dưới bởi 0) và $u_{n+1} - u_n = 100 \\cdot (0{,}9)^{n-1}(0{,}9 - 1) < 0$ (dãy số giảm).<br>d) **Sai**. Tổng cước phí sau 12 tháng là:<br>$$S_{12} = u_1 \\cdot \\dfrac{1 - q^{12}}{1 - q} = 100 \\cdot \\dfrac{1 - (0{,}9)^{12}}{1 - 0{,}9} = 1000 \\cdot (1 - (0{,}9)^{12}) \\approx 717{,}57\\text{ nghìn đồng} < 800\\text{ nghìn đồng}.$$',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'dssa1',
    number: 13,
    type: 'shortans',
    skill: 'Tính số hạng của dãy số từ hệ thức truy hồi tuyến tính',
    points: 1.0,
    text: 'Cho dãy số $(u_n)$ xác định bởi hệ thức truy hồi $u_1 = 1$ và $u_{n+1} = 2u_n + 3$ với mọi $n \\ge 1$. Tính giá trị của số hạng $u_5$.',
    placeholder: 'Nhập giá trị số nguyên (VD: 25)',
    correctDisplay: '61',
    explanation:
      'Tính lần lượt từng số hạng của dãy số:<br>• $u_1 = 1$<br>• $u_2 = 2(1) + 3 = 5$<br>• $u_3 = 2(5) + 3 = 13$<br>• $u_4 = 2(13) + 3 = 29$<br>• $u_5 = 2(29) + 3 = 61$.',
    validator: (val: string) => val.trim() === '61',
  },
  {
    id: 'dssa2',
    number: 14,
    type: 'shortans',
    skill: 'Tìm giá trị lớn nhất của số hạng dãy số bằng bất đẳng thức Cauchy',
    points: 1.0,
    text: 'Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\dfrac{6n}{n^2 + 9}$. Tìm giá trị lớn nhất $M$ của số hạng trong dãy số $(u_n)$.',
    placeholder: 'Nhập giá trị số (VD: 5)',
    correctDisplay: '1',
    explanation:
      'Áp dụng bất đẳng thức Cauchy cho hai số dương $n$ và $\\dfrac{9}{n}$:<br>$$n^2 + 9 \\ge 2\\sqrt{n^2 \\cdot 9} = 6n.$$<br>Do đó:<br>$$u_n = \\dfrac{6n}{n^2 + 9} \\le \\dfrac{6n}{6n} = 1.$$<br>Đẳng thức xảy ra khi $n^2 = 9 \\Leftrightarrow n = 3$ (do $n \\in \\mathbb{N}^*$).<br>Vậy giá trị lớn nhất $M$ của số hạng trong dãy số bằng $1$, đạt được khi $n = 3$.',
    validator: (val: string) => val.trim() === '1',
  },
  {
    id: 'dssa3',
    number: 15,
    type: 'shortans',
    skill: 'Bài toán trả góp ngân hàng dư nợ giảm dần',
    points: 1.0,
    text: 'Ông An vay ngân hàng $200$ triệu đồng để mua xe ô tô với lãi suất $1\\%$/tháng. Bắt đầu từ tháng thứ nhất sau khi vay, cuối mỗi tháng ông An trả cho ngân hàng một số tiền cố định là $m$ triệu đồng (bao gồm cả gốc lẫn lãi). Biết rằng sau đúng $24$ tháng thì ông An trả hết nợ. Tính số tiền $m$ mà ông An phải trả hàng tháng (làm tròn kết quả đến hàng phần trăm, đơn vị: triệu đồng).',
    placeholder: 'Nhập kết quả (triệu đồng, VD: 12.35 hoặc 12,35)',
    correctDisplay: '9,41',
    explanation:
      'Gọi $A = 200$ (triệu đồng) là số tiền vay ban đầu, $r = 1\\% = 0{,}01$ là lãi suất hàng tháng.<br>• Số tiền nợ cuối tháng thứ 1 sau khi trả $m$ triệu: $N_1 = A(1+r) - m$.<br>• Số tiền nợ cuối tháng thứ 2 sau khi trả $m$ triệu: $N_2 = N_1(1+r) - m = A(1+r)^2 - m(1+r) - m$.<br>• Số tiền nợ cuối tháng thứ $n$:<br>$$N_n = A(1+r)^n - m \\cdot \\dfrac{(1+r)^n - 1}{r}.$$<br>Để ông An trả hết nợ sau $24$ tháng thì $N_{24} = 0$:<br>$$A(1+r)^{24} - m \\cdot \\dfrac{(1+r)^{24} - 1}{r} = 0 \\Leftrightarrow m = A \\cdot r \\cdot \\dfrac{(1+r)^{24}}{(1+r)^{24} - 1}.$$<br>Thay $A = 200, r = 0{,}01$:<br>$$m = 200 \\times 0{,}01 \\times \\dfrac{(1{,}01)^{24}}{(1{,}01)^{24} - 1} = 2 \\times \\dfrac{1{,}269735}{0{,}269735} \\approx 9{,}4147\\text{ (triệu đồng)}.$$<br>Làm tròn đến hàng phần trăm, ta được $m = 9{,}41$ triệu đồng.',
    validator: (val: string) => {
      const clean = val.trim().replace(',', '.').replace(/triệu( đồng)?/gi, '').trim();
      return clean === '9.41';
    },
  },
];

export default function Toan11DaySoPage() {
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
    const ma = maHocSinh.trim() || 'HS11-DS-01';
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
            TOÁN 11 • DÃY SỐ
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
                placeholder="VD: HS11-DS-001"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS11-DS-01'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '11'}</span>
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
