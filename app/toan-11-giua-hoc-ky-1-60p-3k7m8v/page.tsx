'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN ĐỀ THI ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ 1 MÔN TOÁN LỚP 11';
const EXAM_SUBTITLE = 'CHƯƠNG TRÌNH GDPT 2018 -- THỜI GIAN LÀM BÀI: 60 PHÚT';
const EXAM_TIME_NOTE =
  'Thời gian làm bài: 60 phút • Đề thi gồm 10 câu trắc nghiệm ABCD (4,0đ), 02 câu Đúng/Sai (2,0đ) và 05 câu trả lời ngắn (4,0đ)';

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
    id: 'mcq1',
    number: 1,
    type: 'mcq',
    skill: 'Công thức nhân đôi của hàm số lượng giác cosin',
    points: 0.4,
    text: 'Khẳng định nào sau đây là đúng với mọi số thực $a$?',
    options: [
      { text: '$\\cos 2a = 2\\cos^2 a + 1$', isCorrect: false },
      { text: '$\\cos 2a = 2\\cos^2 a - 1$', isCorrect: true },
      { text: '$\\cos 2a = 1 - 2\\cos^2 a$', isCorrect: false },
      { text: '$\\cos 2a = \\cos^2 a + \\sin^2 a$', isCorrect: false },
    ],
    explanation:
      'Theo công thức nhân đôi của hàm số cosin: $$\\cos 2a = \\cos^2 a - \\sin^2 a = 2\\cos^2 a - 1 = 1 - 2\\sin^2 a.$$',
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Tìm tập giá trị của hàm số lượng giác bậc nhất đối với sin',
    points: 0.4,
    text: 'Tập giá trị của hàm số lượng giác $y = 3\\sin x - 2$ là đoạn nào dưới đây?',
    options: [
      { text: '$[-3; 3]$', isCorrect: false },
      { text: '$[-1; 5]$', isCorrect: false },
      { text: '$[-5; 1]$', isCorrect: true },
      { text: '$[-2; 1]$', isCorrect: false },
    ],
    explanation:
      'Với mọi số thực $x$, ta luôn có $-1 \\le \\sin x \\le 1$. Nhân cả ba vế với $3$ và trừ đi $2$: $$-3 - 2 \\le 3\\sin x - 2 \\le 3 - 2 \\iff -5 \\le y \\le 1.$$ Vậy tập giá trị của hàm số là $[-5; 1]$.',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Tính chất đơn điệu và tính bị chặn của dãy số',
    points: 0.4,
    text: 'Cho dãy số $(u_n)$ xác định bởi công thức số hạng tổng quát $u_n = \\dfrac{1}{n}$ với mọi $n \\in \\mathbb{N}^*$. Khẳng định nào sau đây là đúng?',
    options: [
      { text: 'Dãy số $(u_n)$ là dãy số tăng và bị chặn dưới bởi $0$', isCorrect: false },
      { text: 'Dãy số $(u_n)$ là dãy số giảm và bị chặn', isCorrect: true },
      { text: 'Dãy số $(u_n)$ là dãy số tăng và không bị chặn', isCorrect: false },
      { text: 'Dãy số $(u_n)$ không tăng, không giảm', isCorrect: false },
    ],
    explanation:
      'Xét hiệu $u_{n+1} - u_n = \\dfrac{1}{n+1} - \\dfrac{1}{n} = \\dfrac{-1}{n(n+1)} < 0$ với mọi $n \\ge 1$. Do đó dãy số $(u_n)$ là dãy số giảm.<br>Mặt khác, với mọi $n \\ge 1$, ta có $0 < \\dfrac{1}{n} \\le 1 \\implies 0 < u_n \\le 1$.<br>Vậy dãy số $(u_n)$ vừa bị chặn dưới bởi $0$, vừa bị chặn trên bởi $1$, tức là bị chặn.',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Số nghiệm của phương trình lượng giác cơ bản cos(x) = 0 trên đoạn cho trước',
    points: 0.4,
    text: 'Số nghiệm của phương trình lượng giác $\\cos x = 0$ trên đoạn $[0; 2\\pi]$ là:',
    options: [
      { text: '$1$', isCorrect: false },
      { text: '$2$', isCorrect: true },
      { text: '$3$', isCorrect: false },
      { text: '$4$', isCorrect: false },
    ],
    explanation:
      'Phương trình $\\cos x = 0 \\iff x = \\dfrac{\\pi}{2} + k\\pi \\ (k \\in \\mathbb{Z})$.<br>Để $x \\in [0; 2\\pi]$, ta có: $$0 \\le \\dfrac{\\pi}{2} + k\\pi \\le 2\\pi \\iff -\\dfrac{1}{2} \\le k \\le \\dfrac{3}{2} \\implies k \\in \\{0; 1\\}.$$<br>• Với $k = 0 \\implies x = \\dfrac{\\pi}{2}$<br>• Với $k = 1 \\implies x = \\dfrac{3\\pi}{2}$.<br>Vậy phương trình có đúng $2$ nghiệm trên đoạn đã cho.',
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Tính số hạng của cấp số nhân từ số hạng đầu và công bội âm',
    points: 0.4,
    text: 'Cho cấp số nhân $(u_n)$ có số hạng đầu $u_1 = 3$ và công bội $q = -2$. Giá trị của số hạng thứ năm $u_5$ bằng:',
    options: [
      { text: '$-48$', isCorrect: false },
      { text: '$48$', isCorrect: true },
      { text: '$96$', isCorrect: false },
      { text: '$-96$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức số hạng tổng quát của cấp số nhân: $$u_5 = u_1 \\cdot q^{5-1} = 3 \\cdot (-2)^4 = 3 \\cdot 16 = 48.$$',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Xác định nhóm chứa mốt từ bảng tần số ghép nhóm',
    points: 0.4,
    text: 'Khảo sát thời gian tự học ở nhà của một nhóm học sinh được ghi lại ở bảng tần số ghép nhóm dưới đây:<br><br><div class="overflow-x-auto my-2"><table class="min-w-full text-center border-collapse border border-slate-300"><thead class="bg-slate-100"><tr><th class="border border-slate-300 px-3 py-1.5 font-bold">Thời gian (giờ)</th><th class="border border-slate-300 px-3 py-1.5 font-bold">$[1; 3)$</th><th class="border border-slate-300 px-3 py-1.5 font-bold">$[3; 5)$</th><th class="border border-slate-300 px-3 py-1.5 font-bold">$[5; 7)$</th><th class="border border-slate-300 px-3 py-1.5 font-bold">$[7; 9)$</th></tr></thead><tbody><tr><td class="border border-slate-300 px-3 py-1.5 font-semibold">Số học sinh</td><td class="border border-slate-300 px-3 py-1.5">5</td><td class="border border-slate-300 px-3 py-1.5">12</td><td class="border border-slate-300 px-3 py-1.5 font-bold text-sky-700">18</td><td class="border border-slate-300 px-3 py-1.5">5</td></tr></tbody></table></div><br>Nhóm chứa mốt của mẫu số liệu ghép nhóm trên là:',
    options: [
      { text: '$[1; 3)$', isCorrect: false },
      { text: '$[3; 5)$', isCorrect: false },
      { text: '$[5; 7)$', isCorrect: true },
      { text: '$[7; 9)$', isCorrect: false },
    ],
    explanation:
      'Tần số lớn nhất trong bảng là $18$, tương ứng với nhóm $[5; 7)$. Do đó, nhóm chứa mốt của mẫu số liệu ghép nhóm là $[5; 7)$.',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Ứng dụng cấp số cộng vào bài toán tập luyện thể thao tăng tiến',
    points: 0.4,
    text: 'Để rèn luyện sức bền nâng cao thể lực, bác Hưng tham gia một chương trình tập bơi: ngày đầu tiên bác bơi liên tục trong $10$ phút; kể từ ngày thứ hai trở đi, mỗi ngày bác bơi tăng thêm $2$ phút so với ngày liền trước. Hỏi vào ngày thứ bao nhiêu của chương trình thì bác Hưng đạt được thời gian bơi là $40$ phút trong ngày?',
    options: [
      { text: 'Ngày thứ $15$', isCorrect: false },
      { text: 'Ngày thứ $16$', isCorrect: true },
      { text: 'Ngày thứ $17$', isCorrect: false },
      { text: 'Ngày thứ $20$', isCorrect: false },
    ],
    explanation:
      'Thời gian bơi mỗi ngày của bác Hưng lập thành một cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 10\\text{ (phút)}$ và công sai $d = 2\\text{ (phút)}$.<br>Thời gian bơi ở ngày thứ $n$ được xác định bởi công thức: $$u_n = u_1 + (n - 1)d \\iff 10 + (n - 1) \\cdot 2 = 40 \\iff 2(n - 1) = 30 \\iff n - 1 = 15 \\iff n = 16.$$ Vậy vào ngày thứ $16$ của kế hoạch thì bác Hưng đạt thời gian bơi $40$ phút.',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Bài toán thực tế tính tổng số cây gỗ xếp dạng hình thang bằng cấp số cộng',
    points: 0.4,
    text: 'Một kho bãi xếp các cây gỗ tròn thành một đống dạng hình thang: lớp dưới cùng nằm sát mặt đất có $30$ cây gỗ, và cứ mỗi lớp kế tiếp phía trên có ít hơn lớp ngay dưới nó đúng $2$ cây gỗ, lớp trên cùng có $12$ cây gỗ. Tổng số cây gỗ có trong đống đó là:',
    options: [
      { text: '$200\\text{ cây}$', isCorrect: false },
      { text: '$210\\text{ cây}$', isCorrect: true },
      { text: '$220\\text{ cây}$', isCorrect: false },
      { text: '$240\\text{ cây}$', isCorrect: false },
    ],
    explanation:
      'Số cây gỗ ở mỗi lớp từ dưới lên trên lập thành một cấp số cộng $(u_n)$ với $u_1 = 30$, công sai $d = -2$ và số hạng cuối $u_n = 12$.<br>Số lớp gỗ $n$ được xác định từ: $$u_n = u_1 + (n - 1)d \\iff 12 = 30 + (n - 1)(-2) \\iff 2(n - 1) = 18 \\iff n - 1 = 9 \\iff n = 10.$$<br>Tổng số cây gỗ là tổng của $10$ số hạng đầu: $$S_{10} = \\dfrac{10(u_1 + u_{10})}{2} = 5(30 + 12) = 5 \\cdot 42 = 210\\text{ (cây)}.$$',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Ứng dụng cấp số cộng tính tổng doanh thu bán vé rạp chiếu phim',
    points: 0.4,
    text: 'Một rạp chiếu phim được thiết kế có $20$ hàng ghế. Hàng ghế đầu tiên có $20$ chỗ ngồi, và kể từ hàng thứ hai trở đi, mỗi hàng kế tiếp có nhiều hơn hàng ngay trước nó đúng $1$ chỗ ngồi. Biết rằng một buổi chiếu phim đã bán hết toàn bộ số vé với giá cố định mỗi vé là $60\\,000$ đồng. Tổng số tiền bán vé thu được của buổi chiếu đó là:',
    options: [
      { text: '$34\\,200\\,000\\text{ đồng}$', isCorrect: false },
      { text: '$35\\,400\\,000\\text{ đồng}$', isCorrect: true },
      { text: '$36\\,000\\,000\\text{ đồng}$', isCorrect: false },
      { text: '$35\\,800\\,000\\text{ đồng}$', isCorrect: false },
    ],
    explanation:
      'Số chỗ ngồi của các hàng ghế lập thành cấp số cộng $(u_n)$ có $u_1 = 20$, $d = 1$ và $n = 20$.<br>Tổng số chỗ ngồi trong rạp là: $$S_{20} = \\dfrac{20[2u_1 + 19d]}{2} = 10[2(20) + 19(1)] = 10(40 + 19) = 590\\text{ (chỗ ngồi)}.$$<br>Vì rạp bán hết toàn bộ vé nên tổng doanh thu là: $$590 \\cdot 60\\,000 = 35\\,400\\,000\\text{ (đồng)}.$$',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Tính số hạng thứ n của cấp số cộng từ số hạng đầu và công sai',
    points: 0.4,
    text: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 2$ và công sai $d = 5$. Giá trị của số hạng thứ ba $u_3$ bằng:',
    options: [
      { text: '$7$', isCorrect: false },
      { text: '$10$', isCorrect: false },
      { text: '$12$', isCorrect: true },
      { text: '$17$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức số hạng tổng quát: $$u_3 = u_1 + 2d = 2 + 2 \\cdot 5 = 12.$$',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 11,
    type: 'tf',
    skill: 'Bài toán thực tế tăng trưởng tiền lương hàng năm theo cấp số cộng',
    text: 'Một kỹ sư ký hợp đồng lao động thời hạn $10$ năm với một công ty xây dựng. Mức lương năm đầu tiên là $120$ triệu đồng. Kể từ năm thứ hai trở đi, mỗi năm mức lương của kỹ sư được tăng thêm đúng $18$ triệu đồng so với năm trước đó.',
    items: [
      {
        key: 'a',
        text: 'Số tiền lương nhận được ở mỗi năm từ năm thứ nhất đến năm thứ mười lập thành một cấp số cộng với số hạng đầu $u_1 = 120$ và công sai $d = 18$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Vào năm thứ năm của hợp đồng, tiền lương mà kỹ sư nhận được trong năm đó là $192$ triệu đồng',
        correct: true,
      },
      {
        key: 'c',
        text: 'Tổng thu nhập tiền lương mà kỹ sư nhận được sau khi hoàn thành trọn vẹn $10$ năm hợp đồng là $2\\,010$ triệu đồng',
        correct: true,
      },
      {
        key: 'd',
        text: 'Sau $n$ năm làm việc, nếu tổng số tiền lương tích lũy kỹ sư nhận được đạt đúng $870$ triệu đồng thì $n = 5$',
        correct: false,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Do mức lương mỗi năm tăng đều một khoản cố định $18$ triệu đồng so với năm trước nên số tiền lương hàng năm lập thành cấp số cộng có $u_1 = 120$ và $d = 18$.<br>• <strong>b) Đúng.</strong> Tiền lương năm thứ năm là: $$u_5 = u_1 + 4d = 120 + 4(18) = 120 + 72 = 192\\text{ (triệu đồng)}.$$<br>• <strong>c) Đúng.</strong> Tổng số tiền lương sau $10$ năm làm việc là: $$S_{10} = \\dfrac{10[2u_1 + 9d]}{2} = 5[2(120) + 9(18)] = 5(240 + 162) = 5 \\cdot 402 = 2\\,010\\text{ (triệu đồng)}.$$<br>• <strong>d) Sai.</strong> Tổng tiền lương sau $n$ năm làm việc là: $$S_n = \\dfrac{n[2(120) + (n - 1)18]}{2} = n[120 + 9(n - 1)] = 9n^2 + 111n\\text{ (triệu đồng)}.$$ Với $n = 5 \\implies S_5 = 9(5^2) + 111(5) = 225 + 555 = 780\\text{ (triệu đồng)} \\ne 870\\text{ (triệu đồng)}$.<br>Với $n = 6 \\implies S_6 = 9(6^2) + 111(6) = 324 + 666 = 990\\text{ (triệu đồng)}$. Do đó không tồn tại số nguyên dương $n$ để tổng lương đúng bằng $870$ triệu đồng.',
  },
  {
    id: 'tf2',
    number: 12,
    type: 'tf',
    skill: 'Mô hình hóa chuyển động tuần hoàn của cabin vòng quay Mặt Trời bằng hàm lượng giác',
    text: 'Một cabin của vòng quay Mặt Trời (Sun Wheel) có bán kính quay $R = 30\\text{ m}$, tâm của vòng quay nằm ở độ cao $35\\text{ m}$ so với mặt đất. Vòng quay quay đều với chu kì $12$ phút. Tại thời điểm ban đầu ($t = 0$), cabin nằm ở vị trí thấp nhất. Độ cao $h(t)$ (tính bằng mét) của cabin so với mặt đất sau $t$ phút ($0 \\le t \\le 12$) được mô hình hóa bởi hàm số: $$h(t) = 35 - 30\\cos\\left(\\dfrac{\\pi}{6}t\\right).$$',
    items: [
      {
        key: 'a',
        text: 'Tại thời điểm bắt đầu quay ($t = 0$), cabin ở độ cao cách mặt đất đúng $5\\text{ m}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Chu kì biến thiên tuần hoàn của độ cao cabin là $12$ phút',
        correct: true,
      },
      {
        key: 'c',
        text: 'Độ cao lớn nhất so với mặt đất mà cabin có thể đạt được trong quá trình quay là $65\\text{ m}$',
        correct: true,
      },
      {
        key: 'd',
        text: 'Trong khoảng thời gian $12$ phút của một vòng quay trọn vẹn, có đúng $1$ thời điểm cabin đạt độ cao $50\\text{ m}$',
        correct: false,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Tại thời điểm $t = 0$: $h(0) = 35 - 30\\cos(0) = 35 - 30(1) = 5\\text{ (m)}$.<br>• <strong>b) Đúng.</strong> Hàm số có tần số góc $\\omega = \\dfrac{\\pi}{6}$, chu kì biến thiên là $T = \\dfrac{2\\pi}{\\omega} = \\dfrac{2\\pi}{\\frac{\\pi}{6}} = 12\\text{ (phút)}$.<br>• <strong>c) Đúng.</strong> Vì $-1 \\le \\cos\\left(\\dfrac{\\pi}{6}t\\right) \\le 1$ nên giá trị lớn nhất của $h(t)$ đạt được khi $\\cos\\left(\\dfrac{\\pi}{6}t\\right) = -1$: $$h_{\\max} = 35 - 30(-1) = 65\\text{ (m)}.$$<br>• <strong>d) Sai.</strong> Xét phương trình độ cao $h(t) = 50$: $$35 - 30\\cos\\left(\\dfrac{\\pi}{6}t\\right) = 50 \\iff \\cos\\left(\\dfrac{\\pi}{6}t\\right) = -\\dfrac{1}{2} = \\cos\\left(\\dfrac{2\\pi}{3}\\right) \\iff \\dfrac{\\pi}{6}t = \\pm \\dfrac{2\\pi}{3} + k2\\pi \\iff t = \\pm 4 + 12k \\quad (k \\in \\mathbb{Z}).$$ Trong khoảng thời gian một vòng quay ($0 \\le t \\le 12$):<br>- Với $t = 4 + 12k$: cho $k = 0 \\implies t = 4\\text{ (phút)}$.<br>- Với $t = -4 + 12k$: cho $k = 1 \\implies t = 8\\text{ (phút)}$.<br>Như vậy trong một vòng quay có đúng $2$ thời điểm (lúc 4 phút khi đi lên và 8 phút khi đi xuống) cabin ở độ cao $50\\text{ m}$. Phát biểu nói có đúng 1 thời điểm là sai.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 13,
    type: 'shortans',
    skill: 'Ứng dụng cấp số cộng tính tổng chi phí khoan giếng nước',
    points: 0.8,
    text: 'Một hộ gia đình thuê thợ khoan một cái giếng nước sâu $20\\text{ m}$. Đơn vị khoan giếng báo giá như sau: giá của mét khoan đầu tiên là $100\\,000$ đồng, và kể từ mét thứ hai trở đi, giá của mỗi mét khoan sau tăng thêm $20\\,000$ đồng so với mét liền trước nó. Tính tổng chi phí (đơn vị: nghìn đồng) mà hộ gia đình phải trả để hoàn thành việc khoan giếng.',
    placeholder: 'Nhập chi phí số (nghìn đồng, VD: 4200)',
    correctDisplay: '5800 (nghìn đồng)',
    explanation:
      'Chi phí khoan từng mét giếng từ mét thứ $1$ đến mét thứ $20$ lập thành cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 100\\text{ (nghìn đồng)}$, công sai $d = 20\\text{ (nghìn đồng)}$ và số số hạng $n = 20$.<br>Tổng chi phí là tổng của $20$ số hạng đầu: $$S_{20} = \\dfrac{20[2u_1 + 19d]}{2} = 10[2(100) + 19(20)] = 10[200 + 380] = 10 \\cdot 580 = 5\\,800\\text{ (nghìn đồng)}.$$ (Tức $5\\,800\\,000$ đồng).',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '').replace(/\./g, '');
      return c === '5800' || c === '5800nghìn' || c === '5800000';
    },
  },
  {
    id: 'sa2',
    number: 14,
    type: 'shortans',
    skill: 'Tìm số tầng của khối ống thép xếp theo cấp số cộng',
    points: 0.8,
    text: 'Một phân xưởng cơ khí xếp các ống thép tròn thành một khối hình thang cân theo các tầng thẳng đứng: tầng trên cùng có đúng $15$ ống thép, và mỗi tầng kế tiếp liền dưới có nhiều hơn tầng ngay phía trên nó đúng $1$ ống thép. Sau khi hoàn thành, khối ống thép đó có tổng cộng $330$ ống. Hỏi khối ống thép đó được xếp thành tất cả bao nhiêu tầng?',
    placeholder: 'Nhập số tầng (VD: 12)',
    correctDisplay: '15 (tầng)',
    explanation:
      'Số ống thép ở mỗi tầng từ trên xuống dưới lập thành cấp số cộng $(u_n)$ với số hạng đầu $u_1 = 15$ và công sai $d = 1$. Gọi $n$ ($n \\in \\mathbb{N}^*$) là số tầng của khối ống thép. Tổng số ống thép là $S_n = 330$.<br>Áp dụng công thức tổng cấp số cộng: $$S_n = \\dfrac{n[2u_1 + (n - 1)d]}{2} = 330 \\iff \\dfrac{n[2(15) + (n - 1) \\cdot 1]}{2} = 330 \\iff n(n + 29) = 660.$$ Khai triển ta được phương trình bậc hai: $$n^2 + 29n - 660 = 0.$$ Biệt thức $\\Delta = 29^2 - 4(1)(-660) = 841 + 2\\,640 = 3\\,481 = 59^2$. Phương trình có hai nghiệm: $$n_1 = \\dfrac{-29 + 59}{2} = 15\\text{ (nhận)},\\quad n_2 = \\dfrac{-29 - 59}{2} = -44\\text{ (loại)}.$$ Vậy khối ống thép được xếp thành đúng $15$ tầng.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '');
      return c === '15' || c === '15tầng' || c === 'n=15';
    },
  },
  {
    id: 'sa3',
    number: 15,
    type: 'shortans',
    skill: 'Tìm số nghiệm phân biệt của phương trình lượng giác tích trên khoảng',
    points: 0.8,
    text: 'Tìm số nghiệm phân biệt của phương trình lượng giác $\\sin 2x - \\cos x = 0$ trên khoảng $(0; 2\\pi)$.',
    placeholder: 'Nhập số lượng nghiệm (VD: 3)',
    correctDisplay: '4 (nghiệm)',
    explanation:
      'Biến đổi phương trình: $$\\sin 2x - \\cos x = 0 \\iff 2\\sin x \\cos x - \\cos x = 0 \\iff \\cos x (2\\sin x - 1) = 0 \\iff \\left[\\begin{aligned} \\cos x &= 0 \\\\ \\sin x &= \\dfrac{1}{2} \\end{aligned}\\right.$$<br>• Với $\\cos x = 0 \\iff x = \\dfrac{\\pi}{2} + k\\pi \\ (k \\in \\mathbb{Z})$. Trong khoảng $(0; 2\\pi)$, ta nhận được 2 nghiệm: $x = \\dfrac{\\pi}{2}$ (khi $k = 0$) và $x = \\dfrac{3\\pi}{2}$ (khi $k = 1$).<br>• Với $\\sin x = \\dfrac{1}{2} \\iff \\left[\\begin{aligned} x &= \\dfrac{\\pi}{6} + k2\\pi \\\\ x &= \\dfrac{5\\pi}{6} + k2\\pi \\end{aligned}\\right. \\ (k \\in \\mathbb{Z})$. Trong khoảng $(0; 2\\pi)$, ta nhận được 2 nghiệm: $x = \\dfrac{\\pi}{6}$ và $x = \\dfrac{5\\pi}{6}$.<br>Bốn nghiệm tìm được $\\left\\{\\dfrac{\\pi}{6}; \\dfrac{\\pi}{2}; \\dfrac{5\\pi}{6}; \\dfrac{3\\pi}{2}\\right\\}$ đôi một khác nhau và đều thuộc khoảng $(0; 2\\pi)$. Vậy phương trình có đúng $4$ nghiệm phân biệt.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '');
      return c === '4' || c === '4nghiệm' || c === '4nghiem';
    },
  },
  {
    id: 'sa4',
    number: 16,
    type: 'shortans',
    skill: 'Ứng dụng tổng của cấp số nhân lùi vô hạn tính tổng diện tích các hình vuông lồng nhau',
    points: 0.8,
    text: 'Cho một hình vuông $C_1$ có cạnh bằng $2\\text{ cm}$. Người ta nối trung điểm các cạnh liên tiếp của $C_1$ để được hình vuông $C_2$, tiếp tục nối trung điểm các cạnh liên tiếp của $C_2$ để được hình vuông $C_3$, và cứ tiếp tục quá trình đó vô hạn lần. Tính tổng diện tích của tất cả các hình vuông $C_1, C_2, C_3, \\dots$ (đơn vị: $\\text{cm}^2$).',
    placeholder: 'Nhập diện tích số (cm², VD: 16)',
    correctDisplay: '8 (cm²)',
    explanation:
      'Hình vuông ban đầu $C_1$ có diện tích $S_1 = 2^2 = 4\\text{ (cm}^2\\text{)}$.<br>Khi nối trung điểm các cạnh của hình vuông, cạnh của hình vuông mới bằng $\\dfrac{\\sqrt{2}}{2}$ lần cạnh của hình vuông trước nó, do đó diện tích của hình vuông mới bằng $\\left(\\dfrac{\\sqrt{2}}{2}\\right)^2 = \\dfrac{1}{2}$ diện tích hình vuông ngay trước.<br>Do đó, diện tích các hình vuông $S_1, S_2, S_3, \\dots$ lập thành một cấp số nhân lùi vô hạn có số hạng đầu $S_1 = 4$ và công bội $q = \\dfrac{1}{2}$ ($|q| < 1$).<br>Tổng diện tích của tất cả các hình vuông là: $$S = \\dfrac{S_1}{1 - q} = \\dfrac{4}{1 - \\dfrac{1}{2}} = \\dfrac{4}{\\dfrac{1}{2}} = 8\\text{ (cm}^2\\text{)}.$$',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '');
      return c === '8' || c === '8cm2' || c === '8cm^2' || c === 's=8';
    },
  },
  {
    id: 'sa5',
    number: 17,
    type: 'shortans',
    skill: 'Tìm các yếu tố của cấp số cộng từ hệ phương trình tổng và tổng bình phương',
    points: 0.8,
    text: 'Cho cấp số cộng $(u_n)$ có công sai $d > 0$ thỏa mãn hệ điều kiện: $\\begin{cases} u_1 + u_2 + u_3 = 9 \\\\ u_1^2 + u_2^2 + u_3^2 = 35 \\end{cases}$. Tìm giá trị của số hạng đầu $u_1$.',
    placeholder: 'Nhập giá trị số hạng đầu (VD: 2)',
    correctDisplay: '1',
    explanation:
      'Biểu diễn $u_1$ và $u_3$ qua $u_2$ và công sai $d$: $u_1 = u_2 - d$ và $u_3 = u_2 + d$.<br>Từ phương trình thứ nhất: $$u_1 + u_2 + u_3 = (u_2 - d) + u_2 + (u_2 + d) = 3u_2 = 9 \\implies u_2 = 3.$$ Khi đó $u_1 = 3 - d$ và $u_3 = 3 + d$. Thay vào phương trình thứ hai: $$(3 - d)^2 + 3^2 + (3 + d)^2 = 35 \\iff (9 - 6d + d^2) + 9 + (9 + 6d + d^2) = 35 \\iff 2d^2 + 27 = 35.$$ $$\\iff 2d^2 = 8 \\iff d^2 = 4 \\implies d = 2 \\quad (\\text{do } d > 0).$$ Vậy số hạng đầu tiên của cấp số cộng là: $$u_1 = 3 - d = 3 - 2 = 1.$$',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '');
      return c === '1' || c === 'u1=1' || c === 'u_1=1';
    },
  },
];

export default function Toan11GiuaKy1De260PPage() {
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

  // 4. ĐỒNG HỒ ĐẾM NGƯỢC (60 PHÚT = 3600 GIÂY)
  const [timeLeft, setTimeLeft] = useState<number>(60 * 60);

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
    const ma = maHocSinh.trim() || 'HS11-GK1-60P';
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

    // Chấm Phần I (10 câu MCQ, 0.40đ/câu = 4.0đ)
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

    // Chấm Phần III (5 câu ngắn, 0.8đ/câu = 4.0đ)
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
    const p3Score = p3CorrectCount * 0.8;

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
      thoiGianLamGiay: 60 * 60 - timeLeft,
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
                Phần I: Trắc nghiệm ABCD (Câu 1 - 10)
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
                Phần II: Đúng/Sai (Câu 11 - 12)
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
                Phần III: Trả lời ngắn (Câu 13 - 17)
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
            TOÁN 11 • KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ 1
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS11-GK1-60P'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '11'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Phần I: <strong>{diemPhan1.toFixed(2)}/4.0đ</strong> ({soCauDungMCQ}/10 câu đúng)</span>
                  <span>Phần II: <strong>{diemPhan2.toFixed(2)}/2.0đ</strong></span>
                  <span>Phần III: <strong>{diemPhan3.toFixed(2)}/4.0đ</strong></span>
                  <span>Thời gian làm bài: <strong>{Math.max(1, Math.round((60 * 60 - timeLeft) / 60))} phút</strong></span>
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
        {/* PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN (10 CÂU - 4,0 ĐIỂM)   */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-sky-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (10 CÂU - 4,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-sky-800/80 px-3 py-1 rounded-full text-sky-200 font-medium">
              0,40 điểm / câu • 4 lựa chọn (1 đáp án đúng duy nhất)
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
        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (02 CÂU - 2,0 ĐIỂM)          */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-emerald-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (02 CÂU - 2,0 ĐIỂM)
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
        {/* PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN (05 CÂU - 4,0 ĐIỂM)     */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN (05 CÂU - 4,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              0,80 điểm / câu • Học sinh tự điền kết quả vào ô trống
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
