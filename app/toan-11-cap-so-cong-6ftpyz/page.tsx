'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA MÔN TOÁN LỚP 11 - 45 PHÚT';
const EXAM_SUBTITLE = 'CHỦ ĐỀ: CẤP SỐ CỘNG';
const EXAM_TIME_NOTE =
  '(Thời gian làm bài: 45 phút - Chương trình Giáo dục phổ thông 2018 • 10 câu trắc nghiệm + 2 bài Đúng/Sai + 3 câu trả lời ngắn)';

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
    id: 'csc1',
    number: 1,
    type: 'mcq',
    skill: 'Tìm số hạng thứ n của cấp số cộng từ số hạng đầu và công sai',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = -5$ và công sai $d = 3$. Giá trị của số hạng thứ $8$ ($u_8$) bằng:',
    options: [
      { text: '$19$', isCorrect: false },
      { text: '$16$', isCorrect: true },
      { text: '$18$', isCorrect: false },
      { text: '$-29$', isCorrect: false },
    ],
    explanation:
      'Sử dụng công thức xác định số hạng tổng quát của cấp số cộng $u_n = u_1 + (n - 1)d$:<br>$$u_8 = u_1 + 7d = -5 + 7 \\times 3 = -5 + 21 = 16.$$',
  },
  {
    id: 'csc2',
    number: 2,
    type: 'mcq',
    skill: 'Nhận biết cấp số cộng trong mô hình thực tế cuộn dây cáp',
    points: 0.5,
    text: 'Một cuộn dây cáp điện công nghiệp được quấn thành nhiều lớp tròn đồng tâm trên kệ lưu trữ. Lớp ngoài cùng có $36$ vòng cáp, mỗi lớp tiếp theo phía bên trong có ít hơn lớp ngay trước nó $2$ vòng cáp. Gọi $u_n$ là số vòng cáp ở lớp thứ $n$ (tính từ ngoài vào trong). Khẳng định nào sau đây **đúng**?',
    options: [
      {
        text: 'Dãy số $(u_n)$ là một cấp số cộng với số hạng đầu $u_1 = 36$ và công sai $d = 2$.',
        isCorrect: false,
      },
      {
        text: 'Dãy số $(u_n)$ là một cấp số cộng với số hạng đầu $u_1 = 36$ và công sai $d = -2$.',
        isCorrect: true,
      },
      {
        text: 'Dãy số $(u_n)$ là một cấp số cộng với số hạng đầu $u_1 = 34$ và công sai $d = -2$.',
        isCorrect: false,
      },
      {
        text: 'Dãy số $(u_n)$ không phải là một cấp số cộng vì số vòng cáp giảm dần.',
        isCorrect: false,
      },
    ],
    explanation:
      'Theo giả thiết, lớp thứ nhất $u_1 = 36$. Kể từ lớp thứ hai, mỗi lớp ít hơn lớp trước $2$ vòng nên $u_n = u_{n-1} - 2$, tương đương $u_n - u_{n-1} = -2$.<br>Do đó, dãy số $(u_n)$ lập thành một cấp số cộng có $u_1 = 36$ và công sai $d = -2$.',
  },
  {
    id: 'csc3',
    number: 3,
    type: 'mcq',
    skill: 'Thiết lập công thức tổng n số hạng đầu tiên của cấp số cộng',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ có hai số hạng đầu tiên lần lượt là $u_1 = 4$ và $u_2 = 9$. Công thức tính tổng $n$ số hạng đầu tiên $S_n$ của cấp số cộng đó là:',
    options: [
      { text: '$S_n = \\dfrac{5n^2 + 8n}{2}$', isCorrect: false },
      { text: '$S_n = \\dfrac{5n^2 + 3n}{2}$', isCorrect: true },
      { text: '$S_n = 5n^2 + 3n$', isCorrect: false },
      { text: '$S_n = \\dfrac{9n^2 - 1}{2}$', isCorrect: false },
    ],
    explanation:
      'Công sai của cấp số cộng là $d = u_2 - u_1 = 9 - 4 = 5$.<br>Áp dụng công thức tính tổng $n$ số hạng đầu tiên của cấp số cộng:<br>$$S_n = \\dfrac{n[2u_1 + (n - 1)d]}{2} = \\dfrac{n[2(4) + (n - 1)5]}{2} = \\dfrac{n(8 + 5n - 5)}{2} = \\dfrac{5n^2 + 3n}{2}.$$',
  },
  {
    id: 'csc4',
    number: 4,
    type: 'mcq',
    skill: 'Tìm công sai của cấp số cộng từ hệ phương trình tuyến tính',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ thỏa mãn hệ phương trình $\\begin{cases} u_1 + u_4 = 14 \\\\ u_3 + u_6 = 22 \\end{cases}$. Công sai $d$ của cấp số cộng bằng:',
    options: [
      { text: '$d = 3$', isCorrect: false },
      { text: '$d = 2$', isCorrect: true },
      { text: '$d = 4$', isCorrect: false },
      { text: '$d = 1$', isCorrect: false },
    ],
    explanation:
      'Biểu diễn các số hạng qua $u_1$ và $d$:<br>$$\\begin{cases} u_1 + (u_1 + 3d) = 14 \\\\ (u_1 + 2d) + (u_1 + 5d) = 22 \\end{cases} \\Leftrightarrow \\begin{cases} 2u_1 + 3d = 14 \\quad (1) \\\\ 2u_1 + 7d = 22 \\quad (2) \\end{cases}$$<br>Trừ vế theo vế phương trình $(2)$ cho phương trình $(1)$:<br>$$4d = 8 \\Leftrightarrow d = 2.$$<br>Thay $d = 2$ vào $(1)$ ta được $2u_1 + 6 = 14 \\Rightarrow u_1 = 4$. Vậy $d = 2$.',
  },
  {
    id: 'csc5',
    number: 5,
    type: 'mcq',
    skill: 'Ứng dụng cấp số cộng tính tổng số ghế khán đài nhà thi đấu',
    points: 0.5,
    text: 'Một khán đài nhà thi đấu thể thao được thiết kế gồm $25$ hàng ghế hình bán nguyệt. Hàng ghế đầu tiên sát sân thi đấu có $20$ ghế, các hàng ghế tiếp theo mỗi hàng có nhiều hơn hàng ngay trước nó $3$ ghế. Tổng số ghế của toàn bộ khán đài đó bằng:',
    options: [
      { text: '$1350$ ghế', isCorrect: false },
      { text: '$1400$ ghế', isCorrect: true },
      { text: '$1450$ ghế', isCorrect: false },
      { text: '$1200$ ghế', isCorrect: false },
    ],
    explanation:
      'Số ghế ở mỗi hàng lập thành một cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 20$, công sai $d = 3$ và số số hạng $n = 25$.<br>Tổng số ghế trên khán đài là tổng $25$ số hạng đầu của cấp số cộng:<br>$$S_{25} = \\dfrac{25}{2}[2u_1 + (25 - 1)d] = \\dfrac{25}{2}[2(20) + 24(3)] = \\dfrac{25}{2}(40 + 72) = \\dfrac{25}{2} \\times 112 = 1400\\text{ (ghế)}.$$',
  },
  {
    id: 'csc6',
    number: 6,
    type: 'mcq',
    skill: 'Tìm số số hạng n khi biết tổng Sn của cấp số cộng',
    points: 0.5,
    text: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 3$ và công sai $d = 4$. Biết tổng $n$ số hạng đầu tiên của cấp số cộng bằng $210$. Giá trị của $n$ bằng:',
    options: [
      { text: '$n = 10$', isCorrect: true },
      { text: '$n = 12$', isCorrect: false },
      { text: '$n = 9$', isCorrect: false },
      { text: '$n = 11$', isCorrect: false },
    ],
    explanation:
      'Ta có $S_n = \\dfrac{n[2u_1 + (n - 1)d]}{2} = 210$.<br>Thay $u_1 = 3, d = 4$ vào phương trình:<br>$$\\dfrac{n[2(3) + (n - 1)4]}{2} = 210 \\Leftrightarrow \\dfrac{n(6 + 4n - 4)}{2} = 210 \\Leftrightarrow \\dfrac{n(4n + 2)}{2} = 210 \\Leftrightarrow n(2n + 1) = 210$$<br>$$\\Leftrightarrow 2n^2 + n - 210 = 0 \\Leftrightarrow \\left[\\begin{array}{l} n = 10\\text{ (thỏa mãn } n \\in \\mathbb{N}^*) \\\\ n = -10{,}5\\text{ (loại)} \\end{array}\\right.$$<br>Vậy $n = 10$.',
  },
  {
    id: 'csc7',
    number: 7,
    type: 'mcq',
    skill: 'Bài toán thực tế chi phí đào giếng theo cấp số cộng',
    points: 0.5,
    text: 'Một chủ nhà thuê thợ đào một cái giếng sâu $20\\text{ m}$. Hợp đồng thi công quy định: giá của mét đào đầu tiên là $120.000$ đồng, và kể từ mét đào thứ hai, giá của mỗi mét đào sau tăng thêm $30.000$ đồng so với giá của mét đào ngay trước đó. Tổng chi phí mà chủ nhà phải trả để hoàn thành cái giếng $20\\text{ m}$ này bằng:',
    options: [
      { text: '$7.800.000$ đồng', isCorrect: false },
      { text: '$8.100.000$ đồng', isCorrect: true },
      { text: '$8.400.000$ đồng', isCorrect: false },
      { text: '$6.900.000$ đồng', isCorrect: false },
    ],
    explanation:
      'Chi phí đào từng mét giếng từ mét thứ $1$ đến mét thứ $20$ lập thành một cấp số cộng $(u_n)$ với $u_1 = 120.000$ đồng, công sai $d = 30.000$ đồng và $n = 20$.<br>Tổng chi phí đào giếng là:<br>$$S_{20} = \\dfrac{20}{2}[2u_1 + (20 - 1)d] = 10 \\times [2(120.000) + 19(30.000)] = 10 \\times (240.000 + 570.000) = 8.100.000\\text{ (đồng)}.$$',
  },
  {
    id: 'csc8',
    number: 8,
    type: 'mcq',
    skill: 'Xác định số hàng và tổng số gạch xây tường hoa',
    points: 0.5,
    text: 'Người ta xếp các viên gạch thẻ hình chữ nhật để xây một trang trí tường hoa. Hàng dưới cùng có $15$ viên gạch, các hàng phía trên mỗi hàng nhiều hơn hàng ngay dưới nó $2$ viên gạch. Biết hàng trên cùng có $53$ viên gạch. Bức tường hoa đó gồm bao nhiêu hàng gạch và dùng tổng cộng bao nhiêu viên gạch?',
    options: [
      { text: '$19$ hàng gạch và $646$ viên gạch', isCorrect: false },
      { text: '$20$ hàng gạch và $680$ viên gạch', isCorrect: true },
      { text: '$20$ hàng gạch và $710$ viên gạch', isCorrect: false },
      { text: '$21$ hàng gạch và $714$ viên gạch', isCorrect: false },
    ],
    explanation:
      'Số gạch ở các hàng lập thành cấp số cộng với $u_1 = 15$, $d = 2$, số hạng cuối $u_n = 53$.<br>Số hàng gạch $n$ thỏa mãn:<br>$$u_n = u_1 + (n - 1)d \\Leftrightarrow 53 = 15 + (n - 1)2 \\Leftrightarrow 2(n - 1) = 38 \\Leftrightarrow n - 1 = 19 \\Leftrightarrow n = 20\\text{ (hàng)}.$$<br>Tổng số viên gạch sử dụng là:<br>$$S_{20} = \\dfrac{20(u_1 + u_{20})}{2} = 10(15 + 53) = 680\\text{ (viên)}.$$',
  },
  {
    id: 'csc9',
    number: 9,
    type: 'mcq',
    skill: 'Mô hình vật lý chuyển động chậm dần đều theo cấp số cộng',
    points: 0.5,
    text: 'Một vật bắt đầu chuyển động chậm dần đều với quãng đường đi được trong giây đầu tiên là $28\\text{ m}$. Cứ mỗi giây tiếp theo, quãng đường vật di chuyển được giảm đi $2\\text{ m}$ so với giây ngay trước đó cho đến khi vật dừng lại hẳn. Tổng quãng đường vật di chuyển được kể từ lúc bắt đầu chậm dần đến khi dừng hẳn bằng:',
    options: [
      { text: '$196\\text{ m}$', isCorrect: false },
      { text: '$210\\text{ m}$', isCorrect: true },
      { text: '$225\\text{ m}$', isCorrect: false },
      { text: '$180\\text{ m}$', isCorrect: false },
    ],
    explanation:
      'Gọi $u_n$ là quãng đường vật đi được trong giây thứ $n$. Dãy số $(u_n)$ là cấp số cộng có $u_1 = 28$ và $d = -2$.<br>Vật dừng lại hẳn khi quãng đường đi được trong giây thứ $n$ giảm về $0$:<br>$$u_n = u_1 + (n - 1)d = 0 \\Leftrightarrow 28 + (n - 1)(-2) = 0 \\Leftrightarrow 2(n - 1) = 28 \\Leftrightarrow n = 15\\text{ (giây)}.$$<br>Tổng quãng đường vật di chuyển được sau $15$ giây là:<br>$$S_{15} = \\dfrac{15(u_1 + u_{15})}{2} = \\dfrac{15(28 + 0)}{2} = 210\\text{ (m)}.$$',
  },
  {
    id: 'csc10',
    number: 10,
    type: 'mcq',
    skill: 'Tính diện tích mảnh đất tam giác vuông có cạnh lập thành cấp số cộng',
    points: 0.5,
    text: 'Một mảnh đất quy hoạch hình tam giác vuông có chu vi bằng $72\\text{ m}$. Biết độ dài ba cạnh của mảnh đất đó theo thứ tự lập thành một cấp số cộng. Diện tích của mảnh đất hình tam giác vuông đó bằng:',
    options: [
      { text: '$180\\text{ m}^2$', isCorrect: false },
      { text: '$216\\text{ m}^2$', isCorrect: true },
      { text: '$288\\text{ m}^2$', isCorrect: false },
      { text: '$432\\text{ m}^2$', isCorrect: false },
    ],
    explanation:
      'Gọi độ dài ba cạnh tam giác vuông lần lượt là $a - d, a, a + d$ với $a > d > 0$.<br>Cạnh huyền là $a + d$. Theo định lý Pythagore:<br>$$(a + d)^2 = a^2 + (a - d)^2 \\Leftrightarrow a^2 + 2ad + d^2 = 2a^2 - 2ad + d^2 \\Leftrightarrow a^2 = 4ad \\Leftrightarrow a = 4d\\text{ (vì } a > 0).$$<br>Theo giả thiết chu vi mảnh đất bằng $72\\text{ m}$:<br>$$(a - d) + a + (a + d) = 72 \\Leftrightarrow 3a = 72 \\Leftrightarrow a = 24\\text{ (m)}.$$<br>Suy ra $d = \\dfrac{a}{4} = 6\\text{ (m)}$.<br>Độ dài hai cạnh góc vuông của tam giác là: $a - d = 24 - 6 = 18\\text{ (m)}$ và $a = 24\\text{ (m)}$.<br>Diện tích mảnh đất là: $S = \\dfrac{1}{2} \\times 18 \\times 24 = 216\\text{ (m}^2\\text{)}.$',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'csctf1',
    number: 11,
    type: 'tf',
    skill: 'Khảo sát cấp số cộng quãng đường chạy bộ tăng đều theo ngày',
    text: 'Bác Sơn tham gia một chương trình rèn luyện sức khỏe chạy bộ chuẩn bị cho giải Marathon. Ngày đầu tiên bác chạy $3\\text{ km}$. Từ ngày thứ hai trở đi, mỗi ngày bác chạy tăng thêm $0{,}5\\text{ km}$ so với ngày ngay trước đó. Kí hiệu $u_n$ ($\\text{km}$) là quãng đường bác Sơn chạy được trong ngày thứ $n$ của chương trình. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Dãy số $(u_n)$ lập thành một cấp số cộng có số hạng đầu $u_1 = 3$ và công sai $d = 0{,}5$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Ở ngày thứ $10$ của chương trình, quãng đường bác Sơn chạy được trong ngày đó là $8\\text{ km}$.',
        correct: false,
      },
      {
        key: 'c',
        text: 'Tính đến hết ngày thứ $14$, tổng quãng đường bác Sơn đã chạy trong toàn bộ chương trình là $87{,}5\\text{ km}$.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Bắt đầu từ ngày thứ $20$, quãng đường bác Sơn chạy trong ngày đó đạt vượt quá $13\\text{ km}$.',
        correct: false,
      },
    ],
    explanation:
      'a) **Đúng**. Do quãng đường mỗi ngày tăng đều $0{,}5\\text{ km}$ nên $(u_n)$ là cấp số cộng có $u_1 = 3$ và $d = 0{,}5$.<br>b) **Sai**. Số km chạy trong ngày thứ 10 là $u_{10} = u_1 + 9d = 3 + 9(0{,}5) = 7{,}5\\text{ km} \\ne 8\\text{ km}$.<br>c) **Đúng**. Tổng quãng đường đến hết ngày thứ 14 là:<br>$$S_{14} = \\dfrac{14[2u_1 + (14 - 1)d]}{2} = 7 \\times [2(3) + 13(0{,}5)] = 7 \\times (6 + 6{,}5) = 87{,}5\\text{ (km)}.$$<br>d) **Sai**. Quãng đường trong ngày vượt quá $13\\text{ km} \\Leftrightarrow u_n > 13 \\Leftrightarrow 3 + (n - 1)(0{,}5) > 13 \\Leftrightarrow (n - 1)(0{,}5) > 10 \\Leftrightarrow n - 1 > 20 \\Leftrightarrow n > 21$. Vì $n \\in \\mathbb{N}^*$ nên phải bắt đầu từ ngày thứ 22.',
  },
  {
    id: 'csctf2',
    number: 12,
    type: 'tf',
    skill: 'Mô hình tiền lãi vay ngân hàng trả gốc đều hàng tháng',
    text: 'Anh Hùng vay ngân hàng $120$ triệu đồng để đầu tư kinh doanh sản xuất nông nghiệp với phương thức trả nợ dư nợ giảm dần: Tiền nợ gốc trả đều hàng tháng trong đúng $12$ tháng (mỗi tháng trả $10$ triệu đồng tiền gốc). Tiền lãi hàng tháng được tính theo lãi suất $1\\%$/tháng trên tổng dư nợ thực tế của đầu tháng đó. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Số tiền nợ gốc anh Hùng còn nợ ngân hàng ở đầu tháng thứ $n$ ($1 \\le n \\le 12$) là $120 - 10(n - 1)$ (triệu đồng).',
        correct: true,
      },
      {
        key: 'b',
        text: 'Số tiền lãi anh Hùng phải trả ngân hàng ở tháng thứ $n$ ($1 \\le n \\le 12$) lập thành một cấp số cộng giảm có số hạng đầu $u_1 = 1{,}2$ triệu đồng và công sai $d = -0{,}1$ triệu đồng.',
        correct: true,
      },
      {
        key: 'c',
        text: 'Tổng số tiền lãi anh Hùng phải trả cho ngân hàng sau toàn bộ $12$ tháng là $8{,}4$ triệu đồng.',
        correct: false,
      },
      {
        key: 'd',
        text: 'Tổng số tiền (bao gồm cả gốc và lãi) anh Hùng đã trả ngân hàng sau $12$ tháng là $127{,}8$ triệu đồng.',
        correct: true,
      },
    ],
    explanation:
      'a) **Đúng**. Đầu tháng 1 nợ 120 triệu; đầu tháng 2 nợ 110 triệu; đầu tháng $n$ nợ $120 - 10(n - 1)$ triệu đồng.<br>b) **Đúng**. Tiền lãi tháng thứ $n$ là: $u_n = [120 - 10(n - 1)] \\times 1\\% = 1{,}2 - 0{,}1(n - 1)$ (triệu đồng). Do đó $(u_n)$ là cấp số cộng có $u_1 = 1{,}2$ triệu đồng và công sai $d = -0{,}1$ triệu đồng.<br>c) **Sai**. Tổng số tiền lãi trả sau 12 tháng là:<br>$$S_{12} = \\dfrac{12(u_1 + u_{12})}{2} = 6 \\times (1{,}2 + [1{,}2 - 0{,}1(11)]) = 6 \\times (1{,}2 + 0{,}1) = 7{,}8\\text{ (triệu đồng)} \\ne 8{,}4\\text{ triệu đồng}.$$<br>d) **Đúng**. Tổng số tiền đã trả sau 12 tháng = Tổng nợ gốc + Tổng tiền lãi = $120 + 7{,}8 = 127{,}8$ triệu đồng.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'cscsa1',
    number: 13,
    type: 'shortans',
    skill: 'Tính tổng 20 số hạng đầu tiên của cấp số cộng',
    points: 1.0,
    text: 'Cho dãy số $(u_n)$ xác định bởi hệ thức truy hồi $u_1 = 5$ và $u_{n+1} = u_n + 4$ với mọi $n \\ge 1$. Tính tổng $20$ số hạng đầu tiên $S_{20} = u_1 + u_2 + \\dots + u_{20}$ của dãy số đó.',
    placeholder: 'Nhập giá trị số (VD: 450)',
    correctDisplay: '860',
    explanation:
      'Từ hệ thức $u_{n+1} - u_n = 4$ với mọi $n \\ge 1$, suy ra dãy số $(u_n)$ là một cấp số cộng có số hạng đầu $u_1 = 5$ và công sai $d = 4$.<br>Tổng $20$ số hạng đầu tiên của cấp số cộng là:<br>$$S_{20} = \\dfrac{20[2u_1 + (20 - 1)d]}{2} = 10 \\times [2(5) + 19(4)] = 10 \\times (10 + 76) = 860.$$',
    validator: (val: string) => val.trim() === '860',
  },
  {
    id: 'cscsa2',
    number: 14,
    type: 'shortans',
    skill: 'Tính tổng số bộ giàn giáo cho công trình 15 tầng theo cấp số cộng',
    points: 1.0,
    text: 'Một công trình nhà cao tầng có $15$ tầng. Số lượng bộ giàn giáo thi công tiêu chuẩn cần lắp đặt ở tầng $1$ là $100$ bộ. Do kết cấu tải trọng giảm dần lên cao, kể từ tầng thứ $2$ trở lên, số lượng bộ giàn giáo cần ở mỗi tầng ít hơn tầng ngay bên dưới $4$ bộ. Tính tổng số bộ giàn giáo cần chuẩn bị để lắp đặt đủ cho cả $15$ tầng của công trình.',
    placeholder: 'Nhập số bộ giàn giáo (VD: 650)',
    correctDisplay: '1080',
    explanation:
      'Số giàn giáo ở các tầng từ tầng 1 đến tầng 15 lập thành một cấp số cộng $(u_n)$ với $u_1 = 100$, công sai $d = -4$ và $n = 15$.<br>Tổng số bộ giàn giáo cho $15$ tầng là:<br>$$S_{15} = \\dfrac{15[2u_1 + (15 - 1)d]}{2} = \\dfrac{15[2(100) + 14(-4)]}{2} = \\dfrac{15(200 - 56)}{2} = 15 \\times 72 = 1080\\text{ (bộ)}.$$',
    validator: (val: string) => val.trim().replace(/bộ/gi, '').trim() === '1080',
  },
  {
    id: 'cscsa3',
    number: 15,
    type: 'shortans',
    skill: 'Tìm số tiền thưởng của đội hạng nhất trong bài toán cấp số cộng 5 đội',
    points: 1.0,
    text: 'Trong một đợt tổng kết thi đua, một doanh nghiệp trích quỹ $90$ triệu đồng để thưởng cho $5$ đội sản xuất xuất sắc. Số tiền thưởng của $5$ đội theo thứ tự xếp hạng từ thấp lên cao (từ đội hạng 5 đến đội hạng 1) lập thành một cấp số cộng. Biết rằng tổng số tiền thưởng của hai đội xếp hạng cao nhất (hạng 1 và hạng 2) bằng $1{,}5$ lần tổng số tiền thưởng của ba đội còn lại (hạng 3, hạng 4, hạng 5). Hỏi đội xếp hạng nhất (tiền thưởng lớn nhất) nhận được bao nhiêu triệu đồng?',
    placeholder: 'Nhập số tiền thưởng (triệu đồng, VD: 15)',
    correctDisplay: '30',
    explanation:
      'Gọi số tiền thưởng (triệu đồng) của 5 đội xếp từ hạng 5 đến hạng 1 lần lượt là $u_1, u_2, u_3, u_4, u_5$ ($u_1 < u_2 < u_3 < u_4 < u_5$), lập thành cấp số cộng với công sai $d > 0$.<br>Tổng số tiền thưởng của 5 đội là:<br>$$S_5 = u_1 + u_2 + u_3 + u_4 + u_5 = 5u_3 = 90 \\Rightarrow u_3 = 18\\text{ (triệu đồng)}.$$<br>Theo bài ra, tổng tiền thưởng của hai đội hạng nhất và nhì bằng $1{,}5$ lần tổng tiền thưởng của ba đội còn lại:<br>$$u_4 + u_5 = 1{,}5(u_1 + u_2 + u_3).$$<br>Mặt khác: $(u_1 + u_2 + u_3) + (u_4 + u_5) = 90 \\Rightarrow (u_1 + u_2 + u_3) + 1{,}5(u_1 + u_2 + u_3) = 90$<br>$$\\Rightarrow 2{,}5(u_1 + u_2 + u_3) = 90 \\Rightarrow u_1 + u_2 + u_3 = 36.$$<br>Mà $u_1 + u_2 + u_3 = 3u_2 \\Rightarrow 3u_2 = 36 \\Rightarrow u_2 = 12\\text{ (triệu đồng)}$.<br>Công sai của cấp số cộng là: $d = u_3 - u_2 = 18 - 12 = 6\\text{ (triệu đồng)}$.<br>Vậy số tiền thưởng đội xếp hạng nhất ($u_5$) nhận được là:<br>$$u_5 = u_3 + 2d = 18 + 2(6) = 30\\text{ (triệu đồng)}.$$',
    validator: (val: string) => val.trim().replace(/triệu( đồng)?/gi, '').trim() === '30',
  },
];

export default function Toan11CapSoCongPage() {
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
    const ma = maHocSinh.trim() || 'HS11-CSC-01';
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
            TOÁN 11 • CẤP SỐ CỘNG
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
                placeholder="VD: HS11-CSC-001"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS11-CSC-01'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '11'}</span>
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
