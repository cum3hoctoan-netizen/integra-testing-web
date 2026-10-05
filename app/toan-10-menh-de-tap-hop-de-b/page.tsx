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
// DỮ LIỆU ĐỀ THI TOÁN 10 - ĐỀ B (45 PHÚT)
// CHỦ ĐỀ: MỆNH ĐỀ VÀ TẬP HỢP
// ==========================================

// PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (14 CÂU - 7,0 ĐIỂM, 0.5Đ/CÂU)
const MCQ_QUESTIONS_MENHDE_DE_B: QuestionMCQ[] = [
  {
    id: 'md1',
    number: 1,
    type: 'mcq',
    skill: 'Nhận biết mệnh đề toán học',
    points: 0.5,
    text: 'Phát biểu nào sau đây là một mệnh đề toán học?',
    options: [
      { key: 'A', text: '"Mọi số nguyên tố lớn hơn $2$ đều là số lẻ"' },
      { key: 'B', text: '"Số $x$ có phải là số chẵn hay không?"' },
      { key: 'C', text: '"Hãy giải phương trình $x^2 - 3x + 2 = 0$"' },
      { key: 'D', text: '"Môn Toán lớp 10 rất thú vị!"' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Phát biểu "Mọi số nguyên tố lớn hơn $2$ đều là số lẻ" là một khẳng định toán học có tính đúng sai rõ ràng (khẳng định đúng), do đó là một mệnh đề toán học. Các câu còn lại là câu hỏi, câu mệnh lệnh và câu cảm thán/đánh giá chủ quan nên không phải mệnh đề toán học.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'md2',
    number: 2,
    type: 'mcq',
    skill: 'Phủ định mệnh đề chứa lượng từ tồn tại',
    points: 0.5,
    text: 'Cho mệnh đề $Q: "\\exists x \\in \\mathbb{R}, x^2 + 3x + 5 \\le 0"$. Mệnh đề phủ định $\\overline{Q}$ của mệnh đề $Q$ là:',
    options: [
      { key: 'A', text: '$\\overline{Q}: "\\forall x \\in \\mathbb{R}, x^2 + 3x + 5 > 0"$' },
      { key: 'B', text: '$\\overline{Q}: "\\forall x \\in \\mathbb{R}, x^2 + 3x + 5 \\ge 0"$' },
      { key: 'C', text: '$\\overline{Q}: "\\exists x \\in \\mathbb{R}, x^2 + 3x + 5 > 0"$' },
      { key: 'D', text: '$\\overline{Q}: "\\forall x \\in \\mathbb{R}, x^2 + 3x + 5 < 0"$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Mệnh đề phủ định của "$\\exists x \\in X, A(x)$" là "$\\forall x \\in X, \\overline{A(x)}$". Phủ định của $x^2 + 3x + 5 \\le 0$ là $x^2 + 3x + 5 > 0$. Vậy $\\overline{Q}: "\\forall x \\in \\mathbb{R}, x^2 + 3x + 5 > 0"$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'md3',
    number: 3,
    type: 'mcq',
    skill: 'Xác định số phần tử của tập hợp số nguyên',
    points: 0.5,
    text: 'Cho tập hợp $B = \\{x \\in \\mathbb{Z} \\mid |x - 1| \\le 2\\}$. Số phần tử của tập hợp $B$ là:',
    options: [
      { key: 'A', text: '$5$' },
      { key: 'B', text: '$4$' },
      { key: 'C', text: '$3$' },
      { key: 'D', text: '$6$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Ta có $|x - 1| \\le 2 \\iff -2 \\le x - 1 \\le 2 \\iff -1 \\le x \\le 3$. Vì $x \\in \\mathbb{Z}$ nên $B = \\{-1; 0; 1; 2; 3\\}$. Do đó tập hợp $B$ có đúng $5$ phần tử.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'md4',
    number: 4,
    type: 'mcq',
    skill: 'Giao của hai tập hợp khoảng, nửa khoảng',
    points: 0.5,
    text: 'Cho hai tập hợp $A = [-3; 2)$ và $B = (-1; 4]$. Tập hợp $A \\cap B$ bằng:',
    options: [
      { key: 'A', text: '$(-1; 2)$' },
      { key: 'B', text: '$[-3; 4]$' },
      { key: 'C', text: '$[-3; -1]$' },
      { key: 'D', text: '$[2; 4]$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Giao của hai tập hợp: $A \\cap B = \\{x \\in \\mathbb{R} \\mid x \\in [-3; 2) \\text{ và } x \\in (-1; 4]\\} = (-1; 2)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'md5',
    number: 5,
    type: 'mcq',
    skill: 'Khái niệm điều kiện cần, điều kiện đủ',
    points: 0.5,
    text: 'Cho hai mệnh đề $P$: "Tứ giác $ABCD$ là hình vuông" và $Q$: "Tứ giác $ABCD$ là hình thoi". Phát biểu nào sau đây thể hiện đúng mối quan hệ logic giữa $P$ và $Q$?',
    options: [
      { key: 'A', text: '$P$ là điều kiện đủ để có $Q$' },
      { key: 'B', text: '$P$ là điều kiện cần để có $Q$' },
      { key: 'C', text: '$P$ và $Q$ là hai mệnh đề tương đương' },
      { key: 'D', text: '$Q$ là điều kiện đủ để có $P$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Nếu tứ giác $ABCD$ là hình vuông thì nó có 4 cạnh bằng nhau, do đó chắc chắn là hình thoi. Vì vậy mệnh đề kéo theo $P \\Rightarrow Q$ đúng, tức $P$ là điều kiện đủ để có $Q$. Ngược lại, một hình thoi chưa chắc là hình vuông nên $Q \\Rightarrow P$ sai.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'md6',
    number: 6,
    type: 'mcq',
    skill: 'Phân biệt mệnh đề tương đương và điều kiện cần và đủ',
    points: 0.5,
    text: 'Trong các phát biểu sau, phát biểu nào <strong>sai</strong>?',
    options: [
      { key: 'A', text: '"Số tự nhiên $n$ chia hết cho $10$" là điều kiện đủ để "$n$ chia hết cho $5$"' },
      { key: 'B', text: '"Tứ giác $ABCD$ có hai đường chéo vuông góc với nhau" là điều kiện cần và đủ để "Tứ giác $ABCD$ là hình thoi"' },
      { key: 'C', text: '"Tam giác $ABC$ đều" tương đương với "Tam giác $ABC$ cân và có một góc bằng $60^\\circ$"' },
      { key: 'D', text: '"Số tự nhiên $n$ có tổng các chữ số chia hết cho $9$" là điều kiện cần và đủ để "$n$ chia hết cho $9$"' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Phát biểu ở phương án thứ hai sai vì một tứ giác có hai đường chéo vuông góc với nhau chưa chắc là hình thoi (ví dụ: tứ giác có dạng diều hoặc tứ giác không phải hình bình hành). Do đó hai mệnh đề này không tương đương.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'md7',
    number: 7,
    type: 'mcq',
    skill: 'Hiệu của hai tập hợp',
    points: 0.5,
    text: 'Cho hai tập hợp $A = \\{x \\in \\mathbb{R} \\mid (x^2 - 9)(2x^2 - 7x + 5) = 0\\}$ và $B = \\{x \\in \\mathbb{N}^* \\mid x \\le 3\\}$. Tập hợp $A \\setminus B$ bằng:',
    options: [
      { key: 'A', text: '$\\left\\{-3; \\dfrac{5}{2}\\right\\}$' },
      { key: 'B', text: '$\\left\\{-3; 1; \\dfrac{5}{2}\\right\\}$' },
      { key: 'C', text: '$\\{1; 3\\}$' },
      { key: 'D', text: '$\\{-3\\}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Giải phương trình $(x^2 - 9)(2x^2 - 7x + 5) = 0 \\iff x \\in \\left\\{-3; 1; \\dfrac{5}{2}; 3\\right\\}$. Do $x \\in \\mathbb{R}$ nên $A = \\left\\{-3; 1; \\dfrac{5}{2}; 3\\right\\}$.<br>Tập hợp $B = \\{x \\in \\mathbb{N}^* \\mid x \\le 3\\} = \\{1; 2; 3\\}$.<br>Vậy $A \\setminus B = \\left\\{-3; \\dfrac{5}{2}\\right\\}$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'md8',
    number: 8,
    type: 'mcq',
    skill: 'Hợp và phần bù của tập hợp trên trục số thực',
    points: 0.5,
    text: 'Cho tập hợp $A = (-\\infty; 1]$ và $B = (-2; 3)$. Tập hợp $C_{\\mathbb{R}}(A \\cup B)$ bằng:',
    options: [
      { key: 'A', text: '$[3; +\\infty)$' },
      { key: 'B', text: '$(-\\infty; -2]$' },
      { key: 'C', text: '$(1; 3)$' },
      { key: 'D', text: '$(3; +\\infty)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Ta có $A \\cup B = (-\\infty; 1] \\cup (-2; 3) = (-\\infty; 3)$.<br>Phần bù của $A \\cup B$ trong $\\mathbb{R}$ là $C_{\\mathbb{R}}(A \\cup B) = \\mathbb{R} \\setminus (-\\infty; 3) = [3; +\\infty)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'md9',
    number: 9,
    type: 'mcq',
    skill: 'Đếm số tập con thỏa mãn điều kiện cho trước',
    points: 0.5,
    text: 'Cho tập hợp $S = \\{1; 2; 3; 4; 5\\}$. Số tập hợp con của $S$ chứa đúng $2$ phần tử và chứa phần tử $1$ là:',
    options: [
      { key: 'A', text: '$4$' },
      { key: 'B', text: '$3$' },
      { key: 'C', text: '$6$' },
      { key: 'D', text: '$5$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Tập hợp con gồm $2$ phần tử của $S$ và chứa $1$ có dạng $\\{1; x\\}$ với $x \\in \\{2; 3; 4; 5\\}$.<br>Các tập con đó là: $\\{1; 2\\}, \\{1; 3\\}, \\{1; 4\\}, \\{1; 5\\}$. Có tất cả $4$ tập hợp thỏa mãn.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'md10',
    number: 10,
    type: 'mcq',
    skill: 'Tìm điều kiện tham số để một đoạn là tập con của đoạn khác',
    points: 0.5,
    text: 'Cho hai tập hợp $A = [m - 2; m + 2]$ và $B = [-1; 6]$. Tất cả các giá trị của tham số $m$ để $A \\subset B$ là:',
    options: [
      { key: 'A', text: '$1 \\le m \\le 4$' },
      { key: 'B', text: '$1 < m < 4$' },
      { key: 'C', text: '$m \\ge 1$' },
      { key: 'D', text: '$m \\le 4$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Để $A \\subset B$, điều kiện bắt buộc là hai đầu mút của đoạn $A$ phải thuộc đoạn $B$:<br>$$\\begin{cases} m - 2 \\ge -1 \\\\ m + 2 \\le 6 \\end{cases} \\iff \\begin{cases} m \\ge 1 \\\\ m \\le 4 \\end{cases} \\iff 1 \\le m \\le 4.$$<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'md11',
    number: 11,
    type: 'mcq',
    skill: 'Tìm điều kiện tham số để giao của hai tập hợp rỗng',
    points: 0.5,
    text: 'Cho hai tập hợp $A = (-\\infty; m + 2)$ và $B = [4 - m; +\\infty)$. Tất cả các giá trị thực của $m$ để $A \\cap B = \\varnothing$ là:',
    options: [
      { key: 'A', text: '$m \\le 1$' },
      { key: 'B', text: '$m < 1$' },
      { key: 'C', text: '$m \\ge 1$' },
      { key: 'D', text: '$m > 1$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Để $A \\cap B = \\varnothing$, khoảng $A$ và nửa khoảng $B$ không được có điểm chung. Do đó đầu mút trên của $A$ phải nhỏ hơn hoặc bằng đầu mút dưới của $B$:<br>$$m + 2 \\le 4 - m \\iff 2m \\le 2 \\iff m \\le 1.$$<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'md12',
    number: 12,
    type: 'mcq',
    skill: 'Ứng dụng công thức bao hàm loại trừ cho hai tập hợp',
    points: 0.5,
    text: 'Một lớp học có $45$ học sinh, trong đó có $28$ học sinh thích môn Vật lý, $20$ học sinh thích môn Hóa học và $5$ học sinh không thích cả hai môn này. Số học sinh thích cả hai môn Vật lý và Hóa học là:',
    options: [
      { key: 'A', text: '$8$' },
      { key: 'B', text: '$10$' },
      { key: 'C', text: '$12$' },
      { key: 'D', text: '$6$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Số học sinh thích ít nhất một trong hai môn Vật lý hoặc Hóa học là: $45 - 5 = 40$ (học sinh).<br>Áp dụng công thức bao hàm - loại trừ:<br>$n(\\text{Lý} \\cup \\text{Hóa}) = n(\\text{Lý}) + n(\\text{Hóa}) - n(\\text{Lý} \\cap \\text{Hóa}) \\implies 40 = 28 + 20 - n(\\text{Lý} \\cap \\text{Hóa}) \\implies n(\\text{Lý} \\cap \\text{Hóa}) = 48 - 40 = 8$ (học sinh).<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'md13',
    number: 13,
    type: 'mcq',
    skill: 'Tìm tham số để hiệu hai tập hợp bằng rỗng (A con B)',
    points: 0.5,
    text: 'Cho hai tập hợp $A = (m - 2; 2m + 2)$ và $B = (0; 8)$. Biết $A \\neq \\varnothing$. Tất cả các giá trị thực của tham số $m$ để $A \\setminus B = \\varnothing$ là:',
    options: [
      { key: 'A', text: '$2 \\le m \\le 3$' },
      { key: 'B', text: '$2 < m \\le 3$' },
      { key: 'C', text: '$m > 2$' },
      { key: 'D', text: '$2 \\le m < 3$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Tập $A \\neq \\varnothing \\iff m - 2 < 2m + 2 \\iff m > -4$.<br>Để $A \\setminus B = \\varnothing$, toàn bộ khoảng $A$ phải nằm hoàn toàn trong khoảng $B$, tức $A \\subset B$.<br>Do $A = (m - 2; 2m + 2)$ và $B = (0; 8)$, điều kiện bao hàm là:<br>$$\\begin{cases} m - 2 \\ge 0 \\\\ 2m + 2 \\le 8 \\end{cases} \\iff \\begin{cases} m \\ge 2 \\\\ 2m \\le 6 \\end{cases} \\iff 2 \\le m \\le 3.$$<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'md14',
    number: 14,
    type: 'mcq',
    skill: 'Ứng dụng nguyên lý bao hàm loại trừ cho 3 tập hợp',
    points: 0.5,
    text: 'Trong một cuộc khảo sát $50$ học sinh đăng ký tham gia các câu lạc bộ (CLB) năng khiếu: Âm nhạc ($M$), Hội họa ($H$) và Nhảy hiện đại ($N$). Kết quả ghi nhận: $24$ học sinh đăng ký $M$, $22$ học sinh đăng ký $H$, $18$ học sinh đăng ký $N$; $9$ học sinh đăng ký cả $M$ và $H$, $7$ học sinh đăng ký cả $H$ và $N$, $6$ học sinh đăng ký cả $M$ và $N$; $4$ học sinh đăng ký cả $3$ CLB. Số học sinh không đăng ký tham gia bất kỳ CLB nào trong $3$ CLB trên là:',
    options: [
      { key: 'A', text: '$4$' },
      { key: 'B', text: '$6$' },
      { key: 'C', text: '$5$' },
      { key: 'D', text: '$3$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng công thức bao hàm - loại trừ cho 3 tập hợp, số học sinh đăng ký ít nhất một CLB là:<br>$n(M \\cup H \\cup N) = n(M) + n(H) + n(N) - [n(M \\cap H) + n(H \\cap N) + n(M \\cap N)] + n(M \\cap H \\cap N)$<br>$n(M \\cup H \\cup N) = 24 + 22 + 18 - (9 + 7 + 6) + 4 = 64 - 22 + 4 = 46$ (học sinh).<br>Số học sinh không đăng ký CLB nào là: $50 - 46 = 4$ (học sinh).<br><strong>Đáp án đúng: A.</strong>',
  },
];

// PHẦN II. TỰ LUẬN (2 CÂU - 3,0 ĐIỂM, 1.5Đ/CÂU)
const SHORTANS_QUESTIONS_MENHDE_DE_B: QuestionShortAns[] = [
  {
    id: 'md15',
    number: 15,
    type: 'shortans',
    skill: 'Các phép toán tập hợp trên tập số thực (giao, hợp, hiệu, phần bù)',
    points: 1.5,
    text: 'Cho hai tập hợp $A = \\{x \\in \\mathbb{R} \\mid |x - 2| < 4\\}$ và $B = \\{x \\in \\mathbb{R} \\mid x^2 - 6x + 5 \\le 0\\}$.<br><br><strong>a) (0,75 điểm)</strong> Biểu diễn các tập hợp $A$ và $B$ dưới dạng khoảng, đoạn trong $\\mathbb{R}$.<br><strong>b) (0,75 điểm)</strong> Tìm các tập hợp $A \\cap B$, $A \\cup B$, $A \\setminus B$ và $C_{\\mathbb{R}}A$.',
    placeholder: 'Ví dụ: A = (-2; 6), B = [1; 5]; A giao B = [1; 5], A hop B = (-2; 6)',
    correctDisplay: 'a) A = (-2; 6), B = [1; 5]; b) A ∩ B = [1; 5], A ∪ B = (-2; 6), A \\ B = (-2; 1) ∪ (5; 6), CRA = (-∞; -2] ∪ [6; +∞)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const hasA = clean.includes('(-2;6)') || clean.includes('-2;6') || clean.includes('(-2,6)');
      const hasB = clean.includes('[1;5]') || clean.includes('1;5') || clean.includes('[1,5]');
      return hasA && hasB;
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>- Ta có $|x - 2| < 4 \\iff -4 < x - 2 < 4 \\iff -2 < x < 6 \\implies A = (-2; 6)$. (0,5đ)<br>- Ta có $x^2 - 6x + 5 \\le 0 \\iff 1 \\le x \\le 5 \\implies B = [1; 5]$. (0,25đ)<br><br><strong>b) (0,75 điểm)</strong><br>- $A \\cap B = (-2; 6) \\cap [1; 5] = [1; 5]$. (0,25đ)<br>- $A \\cup B = (-2; 6) \\cup [1; 5] = (-2; 6)$. (0,25đ)<br>- $A \\setminus B = (-2; 6) \\setminus [1; 5] = (-2; 1) \\cup (5; 6)$. (0,125đ)<br>- $C_{\\mathbb{R}}A = \\mathbb{R} \\setminus (-2; 6) = (-\\infty; -2] \\cup [6; +\\infty)$. (0,125đ)',
  },
  {
    id: 'md16',
    number: 16,
    type: 'shortans',
    skill: 'Mô hình hóa bài toán thực tế bằng phương trình và tập hợp',
    points: 1.5,
    text: 'Một trung tâm công nghệ khảo sát $120$ lập trình viên về việc sử dụng hai ngôn ngữ lập trình $X$ và $Y$. Kết quả thu được như sau: Có $70$ lập trình viên sử dụng ngôn ngữ $X$; có $40$ lập trình viên sử dụng ngôn ngữ $Y$; số lập trình viên không sử dụng cả hai ngôn ngữ này gấp hai lần số lập trình viên sử dụng đồng thời cả hai ngôn ngữ $X$ và $Y$.<br><br><strong>a) (1,0 điểm)</strong> Gọi $x$ là số lập trình viên sử dụng đồng thời cả hai ngôn ngữ $X$ và $Y$. Hãy lập phương trình biểu diễn mối quan hệ giữa các dữ kiện và tìm $x$.<br><strong>b) (0,5 điểm)</strong> Tính số lập trình viên chỉ sử dụng duy nhất ngôn ngữ $X$.',
    placeholder: 'Ví dụ: a) x = 10; b) 60 lập trình viên',
    correctDisplay: 'a) 120 - 2x = 110 - x ⇔ x = 10; b) Số LTV chỉ dùng duy nhất X là 60',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const has10 = clean.includes('10') || clean.includes('x=10');
      const has60 = clean.includes('60') || clean.includes('ltv=60');
      return has10 && has60;
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (1,0 điểm)</strong><br>- Gọi $x$ là số LTV sử dụng đồng thời cả $X$ và $Y$ ($x \\in \\mathbb{N}^*, 0 \\le x \\le 40$). Số LTV không sử dụng cả hai ngôn ngữ là $2x$. (0,25đ)<br>- Số LTV sử dụng ít nhất một trong hai ngôn ngữ là: $120 - 2x$. (0,25đ)<br>- Theo nguyên lý bao hàm - loại trừ: $n(X \\cup Y) = n(X) + n(Y) - n(X \\cap Y) = 70 + 40 - x = 110 - x$. (0,25đ)<br>- Ta có phương trình: $120 - 2x = 110 - x \\iff x = 10$. Vậy có $10$ LTV sử dụng cả hai ngôn ngữ. (0,25đ)<br><br><strong>b) (0,5 điểm)</strong><br>- Số LTV chỉ sử dụng duy nhất ngôn ngữ $X$ là: $n(X \\setminus Y) = 70 - 10 = 60$ (người). (0,5đ)',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan10MenhDeTapHopDeBPage() {
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
    MCQ_QUESTIONS_MENHDE_DE_B.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ originalKey: opt.key, text: opt.text })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS_MENHDE_DE_B.map((q) => ({
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
  const totalQuestions = MCQ_QUESTIONS_MENHDE_DE_B.length + SHORTANS_QUESTIONS_MENHDE_DE_B.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 6. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS10-MENHDE-DE-B';
    const lop = lopNhom.trim() || 'Lớp 10';

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

    // Chấm Phần I (14 câu MCQ, 0.5đ/câu)
    MCQ_QUESTIONS_MENHDE_DE_B.forEach((q) => {
      const studentChoice = mcqAnswers[q.id];
      if (studentChoice === q.correct) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (2 câu Tự luận, 1.5đ/câu)
    SHORTANS_QUESTIONS_MENHDE_DE_B.forEach((q) => {
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
      bai_thi: 'ĐỀ KIỂM TRA ĐỊNH KỲ TOÁN 10 - MỆNH ĐỀ VÀ TẬP HỢP [ĐỀ B]',
      diem: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS_MENHDE_DE_B.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_MENHDE_DE_B.length}`,
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
        Task_ID: 'KIEM_TRA_MENH_DE_TAP_HOP_TOAN_10_DE_B',
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
          bai_thi: 'ĐỀ KIỂM TRA TOÁN 10 - MỆNH ĐỀ VÀ TẬP HỢP [ĐỀ B]',
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
        MCQ_QUESTIONS_MENHDE_DE_B.map((q) => ({
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
              Hệ thống khảo sát trực tuyến Integra &bull; Toán 10
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ MÔN TOÁN LỚP 10 -- ĐỀ B
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
              Chủ đề: Mệnh đề và Tập hợp (Thời gian làm bài: 45 phút)
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
                placeholder="HS10-MD01"
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
                placeholder="10A1"
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
                  Kết quả bài thi: {tenHocSinh || 'Học sinh'} ({lopNhom || 'Lớp 10'})
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Đúng {soCauDungMCQ}/14 câu Trắc nghiệm &bull; Đúng {soCauDungShort}/2 câu Tự luận
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
              I. PHẦN TRẮC NGHIỆM (7,0 ĐIỂM – 14 CÂU, 0,5 Đ/CÂU)
            </h2>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-md font-medium">
              14 Câu hỏi
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
                  <span className="text-xs font-semibold text-slate-400">0,5 đ</span>
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
              II. PHẦN TỰ LUẬN (3,0 ĐIỂM – 2 CÂU, 1,5 Đ/CÂU)
            </h2>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-md font-medium">
              2 Câu hỏi
            </span>
          </div>

          {SHORTANS_QUESTIONS_MENHDE_DE_B.map((q) => {
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
                  <span className="text-xs font-semibold text-slate-400">1,5 đ</span>
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
