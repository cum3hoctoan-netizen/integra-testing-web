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
// DỮ LIỆU ĐỀ THI TOÁN 10 - ĐỀ A (45 PHÚT)
// CHỦ ĐỀ: MỆNH ĐỀ VÀ TẬP HỢP
// ==========================================

// PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (14 CÂU - 7,0 ĐIỂM, 0.5Đ/CÂU)
const MCQ_QUESTIONS_MENHDE_DE_A: QuestionMCQ[] = [
  {
    id: 'mda1',
    number: 1,
    type: 'mcq',
    skill: 'Nhận biết mệnh đề toán học',
    points: 0.5,
    text: 'Phát biểu nào sau đây là một mệnh đề toán học?',
    options: [
      { key: 'A', text: '$x^2 + 2x + 5 > 0$ với mọi $x \\in \\mathbb{R}$' },
      { key: 'B', text: 'Phương trình $x^2 - 4 = 0$ có nghiệm hay không?' },
      { key: 'C', text: 'Hãy liệt kê tất cả các phần tử của tập hợp số tự nhiên' },
      { key: 'D', text: 'Toán học là môn học vô cùng thú vị!' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Phát biểu "$x^2 + 2x + 5 > 0$ với mọi $x \\in \\mathbb{R}$" là một khẳng định toán học có tính đúng sai rõ ràng (khẳng định đúng vì $\\Delta\' = -4 < 0, a = 1 > 0$), do đó là một mệnh đề toán học. Các phương án còn lại là câu hỏi, câu mệnh lệnh và câu cảm thán nên không phải là mệnh đề.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'mda2',
    number: 2,
    type: 'mcq',
    skill: 'Phủ định mệnh đề chứa lượng từ với mọi',
    points: 0.5,
    text: 'Cho mệnh đề $P: "\\forall x \\in \\mathbb{R}, x^2 - 3x + 2 \\ge 0"$. Mệnh đề phủ định $\\overline{P}$ của mệnh đề $P$ là:',
    options: [
      { key: 'A', text: '$\\overline{P}: "\\exists x \\in \\mathbb{R}, x^2 - 3x + 2 < 0"$' },
      { key: 'B', text: '$\\overline{P}: "\\exists x \\in \\mathbb{R}, x^2 - 3x + 2 \\le 0"$' },
      { key: 'C', text: '$\\overline{P}: "\\forall x \\in \\mathbb{R}, x^2 - 3x + 2 < 0"$' },
      { key: 'D', text: '$\\overline{P}: "\\exists x \\in \\mathbb{R}, x^2 - 3x + 2 > 0"$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Mệnh đề phủ định của "$\\forall x \\in X, A(x)$" là "$\\exists x \\in X, \\overline{A(x)}$". Phủ định của $x^2 - 3x + 2 \\ge 0$ là $x^2 - 3x + 2 < 0$. Vậy $\\overline{P}: "\\exists x \\in \\mathbb{R}, x^2 - 3x + 2 < 0"$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'mda3',
    number: 3,
    type: 'mcq',
    skill: 'Xác định số phần tử của tập hợp số nguyên',
    points: 0.5,
    text: 'Cho tập hợp $A = \\{x \\in \\mathbb{Z} \\mid (x^2 - 9)(2x + 1) = 0\\}$. Số phần tử của tập hợp $A$ là:',
    options: [
      { key: 'A', text: '$2$' },
      { key: 'B', text: '$3$' },
      { key: 'C', text: '$1$' },
      { key: 'D', text: '$4$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Giải phương trình $(x^2 - 9)(2x + 1) = 0 \\iff \\left[\\begin{array}{l} x = 3 \\\\ x = -3 \\\\ x = -\\dfrac{1}{2} \\end{array}\\right.$. Vì $x \\in \\mathbb{Z}$ nên $x = -\\dfrac{1}{2}$ bị loại. Do đó $A = \\{-3; 3\\}$ có đúng $2$ phần tử.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'mda4',
    number: 4,
    type: 'mcq',
    skill: 'Giao của hai nửa khoảng trên tập số thực',
    points: 0.5,
    text: 'Cho hai tập hợp $A = (-4; 2]$ và $B = [-1; 5)$. Tập hợp $A \\cap B$ bằng:',
    options: [
      { key: 'A', text: '$[-1; 2]$' },
      { key: 'B', text: '$(-4; 5)$' },
      { key: 'C', text: '$(-4; -1)$' },
      { key: 'D', text: '$(2; 5)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Tập hợp $A \\cap B = \\{x \\in \\mathbb{R} \\mid x \\in (-4; 2] \\text{ và } x \\in [-1; 5)\\} = [-1; 2]$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'mda5',
    number: 5,
    type: 'mcq',
    skill: 'Khái niệm điều kiện đủ trong mệnh đề kéo theo',
    points: 0.5,
    text: 'Cho hai mệnh đề $P$: "Tứ giác $ABCD$ là hình thoi có hai đường chéo bằng nhau" và $Q$: "Tứ giác $ABCD$ là hình vuông". Phát biểu nào sau đây thể hiện đúng mối quan hệ logic giữa $P$ và $Q$?',
    options: [
      { key: 'A', text: '$P$ là điều kiện đủ để có $Q$' },
      { key: 'B', text: '$P$ là điều kiện cần để có $Q$' },
      { key: 'C', text: '$P$ và $Q$ là hai mệnh đề không có quan hệ kéo theo' },
      { key: 'D', text: '$Q$ là điều kiện đủ để có $P$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Hình thoi có hai đường chéo bằng nhau là hình vuông, do đó $P \\Rightarrow Q$ đúng, tức $P$ là điều kiện đủ để có $Q$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'mda6',
    number: 6,
    type: 'mcq',
    skill: 'Nhận biết phát biểu sai về điều kiện cần và đủ',
    points: 0.5,
    text: 'Trong các phát biểu sau, phát biểu nào <strong>sai</strong>?',
    options: [
      { key: 'A', text: '"Số tự nhiên $n$ có tổng các chữ số chia hết cho $3$" là điều kiện cần và đủ để "$n$ chia hết cho $3$"' },
      { key: 'B', text: '"Tứ giác $ABCD$ có hai đường chéo vuông góc với nhau" là điều kiện cần và đủ để "Tứ giác $ABCD$ là hình thoi"' },
      { key: 'C', text: '"Tam giác $ABC$ cân và có một góc bằng $60^\\circ$" tương đương với "Tam giác $ABC$ đều"' },
      { key: 'D', text: '"Số tự nhiên $n$ chia hết cho $6$" là điều kiện đủ để "$n$ chia hết cho $2$"' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Phát biểu ở phương án B sai vì một tứ giác có hai đường chéo vuông góc với nhau chưa chắc là hình thoi (ví dụ: tứ giác có dạng diều hoặc tứ giác có hai đường chéo vuông góc nhưng không cắt nhau tại trung điểm mỗi đường).<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'mda7',
    number: 7,
    type: 'mcq',
    skill: 'Hiệu của hai tập hợp',
    points: 0.5,
    text: 'Cho hai tập hợp $A = \\{x \\in \\mathbb{R} \\mid (x^2 - 1)(x^2 - 4x + 3) = 0\\}$ và $B = \\{x \\in \\mathbb{N} \\mid x \\le 2\\}$. Tập hợp $A \\setminus B$ bằng:',
    options: [
      { key: 'A', text: '$\\{-1; 3\\}$' },
      { key: 'B', text: '$\\{1\\}$' },
      { key: 'C', text: '$\\{0; 2\\}$' },
      { key: 'D', text: '$\\{-1; 1; 3\\}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Giải phương trình $(x^2 - 1)(x^2 - 4x + 3) = 0 \\iff x \\in \\{-1; 1; 3\\} \\implies A = \\{-1; 1; 3\\}$. Tập hợp $B = \\{x \\in \\mathbb{N} \\mid x \\le 2\\} = \\{0; 1; 2\\}$. Vậy $A \\setminus B = \\{-1; 3\\}$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'mda8',
    number: 8,
    type: 'mcq',
    skill: 'Hợp và phần bù của tập hợp trên trục số thực',
    points: 0.5,
    text: 'Cho tập hợp $A = (-\\infty; 3]$ và $B = (1; 6)$. Tập hợp $C_{\\mathbb{R}}(A \\cup B)$ bằng:',
    options: [
      { key: 'A', text: '$[6; +\\infty)$' },
      { key: 'B', text: '$(-\\infty; 1]$' },
      { key: 'C', text: '$(3; 6)$' },
      { key: 'D', text: '$(6; +\\infty)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Ta có $A \\cup B = (-\\infty; 3] \\cup (1; 6) = (-\\infty; 6)$. Phần bù của $A \\cup B$ trong $\\mathbb{R}$ là $C_{\\mathbb{R}}(A \\cup B) = \\mathbb{R} \\setminus (-\\infty; 6) = [6; +\\infty)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'mda9',
    number: 9,
    type: 'mcq',
    skill: 'Đếm số tập con của một tập hợp theo điều kiện',
    points: 0.5,
    text: 'Cho tập hợp $S = \\{1; 2; 3; 4; 5\\}$. Số tập hợp con của $S$ chứa đúng $2$ phần tử và không chứa phần tử $5$ là:',
    options: [
      { key: 'A', text: '$6$' },
      { key: 'B', text: '$10$' },
      { key: 'C', text: '$4$' },
      { key: 'D', text: '$5$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Tập hợp con gồm $2$ phần tử của $S$ và không chứa $5$ được lập bằng cách chọn $2$ phần tử bất kỳ từ tập $\\{1; 2; 3; 4\\}$. Số tập hợp con thỏa mãn là $C_4^2 = 6$ (gồm: $\\{1; 2\\}, \\{1; 3\\}, \\{1; 4\\}, \\{2; 3\\}, \\{2; 4\\}, \\{3; 4\\}$).<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'mda10',
    number: 10,
    type: 'mcq',
    skill: 'Ứng dụng giao của hai tập hợp thời gian trong thực tế',
    points: 0.5,
    text: 'Hai tổng đài chăm sóc khách hàng $A$ và $B$ quy định khung giờ nhận cuộc gọi tư vấn trong ngày như sau: Tổng đài $A$ nhận cuộc gọi từ $8$ giờ đến $17$ giờ (khoảng thời gian $[8; 17]$), Tổng đài $B$ nhận cuộc gọi từ $12$ giờ đến $20$ giờ (khoảng thời gian $[12; 20]$). Khoảng thời gian trong ngày mà <strong>cả hai tổng đài cùng đồng thời nhận cuộc gọi</strong> là:',
    options: [
      { key: 'A', text: '$[12; 17]$' },
      { key: 'B', text: '$[8; 20]$' },
      { key: 'C', text: '$[8; 12)$' },
      { key: 'D', text: '$(17; 20]$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Khoảng thời gian cả hai tổng đài cùng đồng thời làm việc là giao của hai tập hợp thời gian: $[8; 17] \\cap [12; 20] = [12; 17]$ (tức từ $12$ giờ đến $17$ giờ).<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'mda11',
    number: 11,
    type: 'mcq',
    skill: 'Ứng dụng hiệu của hai tập hợp dải nhiệt độ trong thực tế',
    points: 0.5,
    text: 'Hai dây chuyền đóng gói tự động $A$ và $B$ trong một nhà máy có dải nhiệt độ vận hành an toàn lần lượt là $T_A = [15^\\circ\\text{C}; 45^\\circ\\text{C}]$ và $T_B = [30^\\circ\\text{C}; 60^\\circ\\text{C}]$. Dải nhiệt độ mà dây chuyền $A$ vận hành an toàn nhưng dây chuyền $B$ <strong>không</strong> vận hành an toàn là:',
    options: [
      { key: 'A', text: '$[15^\\circ\\text{C}; 30^\\circ\\text{C})$' },
      { key: 'B', text: '$(30^\\circ\\text{C}; 45^\\circ\\text{C}]$' },
      { key: 'C', text: '$(45^\\circ\\text{C}; 60^\\circ\\text{C}]$' },
      { key: 'D', text: '$[15^\\circ\\text{C}; 60^\\circ\\text{C}]$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Dải nhiệt độ dây chuyền $A$ vận hành an toàn nhưng dây chuyền $B$ không vận hành an toàn chính là hiệu của hai tập hợp $T_A \\setminus T_B = [15; 45] \\setminus [30; 60] = [15; 30)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'mda12',
    number: 12,
    type: 'mcq',
    skill: 'Ứng dụng công thức bao hàm loại trừ cho hai tập hợp',
    points: 0.5,
    text: 'Một lớp học có $40$ học sinh, trong đó có $24$ học sinh thích môn Bóng đá, $18$ học sinh thích môn Bóng rổ và $5$ học sinh không thích cả hai môn này. Số học sinh thích cả hai môn Bóng đá và Bóng rổ là:',
    options: [
      { key: 'A', text: '$7$' },
      { key: 'B', text: '$10$' },
      { key: 'C', text: '$12$' },
      { key: 'D', text: '$8$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Số học sinh thích ít nhất một trong hai môn: $40 - 5 = 35$ (học sinh).<br>Áp dụng công thức: $n(\\text{Đá} \\cup \\text{Rổ}) = n(\\text{Đá}) + n(\\text{Rổ}) - n(\\text{Đá} \\cap \\text{Rổ}) \\implies 35 = 24 + 18 - n(\\text{Đá} \\cap \\text{Rổ}) \\implies n(\\text{Đá} \\cap \\text{Rổ}) = 42 - 35 = 7$ (học sinh).<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'mda13',
    number: 13,
    type: 'mcq',
    skill: 'Ứng dụng giao của hai tập hợp nhiệt độ bảo quản',
    points: 0.5,
    text: 'Một xe container lạnh vận chuyển hai loại hải sản $A$ và $B$. Hạn mức nhiệt độ an toàn cho loại $A$ là $T_A = (-10^\\circ\\text{C}; 5^\\circ\\text{C})$, hạn mức nhiệt độ an toàn cho loại $B$ là $T_B = [2^\\circ\\text{C}; 12^\\circ\\text{C})$. Khoảng nhiệt độ để thùng xe có thể bảo quản <strong>đồng thời</strong> cả hai loại hải sản $A$ và $B$ là:',
    options: [
      { key: 'A', text: '$[2^\\circ\\text{C}; 5^\\circ\\text{C})$' },
      { key: 'B', text: '$(-10^\\circ\\text{C}; 12^\\circ\\text{C})$' },
      { key: 'C', text: '$(-10^\\circ\\text{C}; 2^\\circ\\text{C})$' },
      { key: 'D', text: '$[5^\\circ\\text{C}; 12^\\circ\\text{C})$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Khoảng nhiệt độ bảo quản đồng thời cả hai loại hải sản là giao của hai tập hợp $T_A \\cap T_B = (-10; 5) \\cap [2; 12) = [2; 5)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'mda14',
    number: 14,
    type: 'mcq',
    skill: 'Ứng dụng nguyên lý bao hàm loại trừ cho 3 tập hợp',
    points: 0.5,
    text: 'Trong một cuộc khảo sát $50$ học sinh đăng ký tham gia các câu lạc bộ (CLB) năng khiếu: Mỹ thuật ($M$), Âm nhạc ($N$) và Võ thuật ($V$). Kết quả ghi nhận: $22$ học sinh đăng ký $M$, $25$ học sinh đăng ký $N$, $18$ học sinh đăng ký $V$; $8$ học sinh đăng ký cả $M$ và $N$, $7$ học sinh đăng ký cả $N$ và $V$, $6$ học sinh đăng ký cả $M$ và $V$; $3$ học sinh đăng ký cả $3$ CLB. Số học sinh không đăng ký tham gia bất kỳ CLB nào trong $3$ CLB trên là:',
    options: [
      { key: 'A', text: '$3$' },
      { key: 'B', text: '$5$' },
      { key: 'C', text: '$7$' },
      { key: 'D', text: '$2$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Số học sinh đăng ký ít nhất một CLB là:<br>$n(M \\cup N \\cup V) = 22 + 25 + 18 - (8 + 7 + 6) + 3 = 65 - 21 + 3 = 47$ (học sinh).<br>Số học sinh không đăng ký CLB nào là: $50 - 47 = 3$ (học sinh).<br><strong>Đáp án đúng: A.</strong>',
  },
];

// PHẦN II. TỰ LUẬN (2 CÂU - 3,0 ĐIỂM, 1.5Đ/CÂU)
const SHORTANS_QUESTIONS_MENHDE_DE_A: QuestionShortAns[] = [
  {
    id: 'mda15',
    number: 15,
    type: 'shortans',
    skill: 'Các phép toán tập hợp trên tập số thực (giao, hợp, hiệu, phần bù)',
    points: 1.5,
    text: 'Cho hai tập hợp $A = \\{x \\in \\mathbb{R} \\mid |x - 3| \\le 2\\}$ và $B = \\{x \\in \\mathbb{R} \\mid x^2 - 7x + 10 < 0\\}$.<br><br><strong>a) (0,75 điểm)</strong> Biểu diễn các tập hợp $A$ và $B$ dưới dạng khoảng, đoạn trong $\\mathbb{R}$.<br><strong>b) (0,75 điểm)</strong> Tìm các tập hợp $A \\cap B$, $A \\cup B$, $A \\setminus B$ và $C_{\\mathbb{R}}A$.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'a) A = [1; 5], B = (2; 5); b) A ∩ B = (2; 5), A ∪ B = [1; 5], A \\ B = [1; 2] ∪ {5}, CRA = (-∞; 1) ∪ (5; +∞)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const hasA = clean.includes('[1;5]') || clean.includes('1;5') || clean.includes('[1,5]');
      const hasB = clean.includes('(2;5)') || clean.includes('2;5') || clean.includes('(2,5)');
      return hasA && hasB;
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>- Ta có $|x - 3| \\le 2 \\iff -2 \\le x - 3 \\le 2 \\iff 1 \\le x \\le 5 \\implies A = [1; 5]$. (0,5đ)<br>- Ta có $x^2 - 7x + 10 < 0 \\iff 2 < x < 5 \\implies B = (2; 5)$. (0,25đ)<br><br><strong>b) (0,75 điểm)</strong><br>- $A \\cap B = [1; 5] \\cap (2; 5) = (2; 5)$. (0,25đ)<br>- $A \\cup B = [1; 5] \\cup (2; 5) = [1; 5]$. (0,25đ)<br>- $A \\setminus B = [1; 5] \\setminus (2; 5) = [1; 2] \\cup \\{5\\}$. (0,125đ)<br>- $C_{\\mathbb{R}}A = \\mathbb{R} \\setminus [1; 5] = (-\\infty; 1) \\cup (5; +\\infty)$. (0,125đ)',
  },
  {
    id: 'mda16',
    number: 16,
    type: 'shortans',
    skill: 'Mô hình hóa bài toán thực tế bằng phương trình và tập hợp',
    points: 1.5,
    text: 'Một công ty viễn thông khảo sát $150$ hộ gia đình về việc sử dụng hai dịch vụ: Truyền hình số ($T$) và Internet cáp quang ($I$). Kết quả cho thấy có $95$ hộ gia đình sử dụng dịch vụ $T$; có $80$ hộ gia đình sử dụng dịch vụ $I$; số hộ gia đình không sử dụng cả hai dịch vụ bằng một nửa số hộ gia đình sử dụng đồng thời cả hai dịch vụ $T$ và $I$.<br><br><strong>a) (1,0 điểm)</strong> Gọi $x$ là số hộ gia đình sử dụng đồng thời cả hai dịch vụ $T$ và $I$ ($x \\in \\mathbb{N}^*$). Lập phương trình biểu diễn mối quan hệ giữa các dữ kiện và tìm $x$.<br><strong>b) (0,5 điểm)</strong> Tính số hộ gia đình chỉ sử dụng duy nhất dịch vụ Internet cáp quang $I$.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'a) 150 - 0.5x = 175 - x ⇔ x = 50; b) Số hộ chỉ dùng duy nhất I là 30',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const has50 = clean.includes('50') || clean.includes('x=50');
      const has30 = clean.includes('30') || clean.includes('ho=30');
      return has50 && has30;
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (1,0 điểm)</strong><br>- Gọi $x$ là số hộ gia đình sử dụng đồng thời cả hai dịch vụ $T$ và $I$ ($x \\in \\mathbb{N}^*, 0 \\le x \\le 80$). Theo giả thiết, số hộ không sử dụng cả hai dịch vụ là $0,5x$. (0,25đ)<br>- Số hộ sử dụng ít nhất một trong hai dịch vụ là: $150 - 0,5x$. (0,25đ)<br>- Theo nguyên lý bao hàm - loại trừ: $n(T \\cup I) = n(T) + n(I) - n(T \\cap I) = 95 + 80 - x = 175 - x$. (0,25đ)<br>- Ta có phương trình: $150 - 0,5x = 175 - x \\iff 0,5x = 25 \\iff x = 50$ (thỏa mãn). Vậy có $50$ hộ sử dụng đồng thời cả hai dịch vụ. (0,25đ)<br><br><strong>b) (0,5 điểm)</strong><br>- Số hộ gia đình chỉ sử dụng duy nhất dịch vụ Internet cáp quang $I$ là: $n(I \\setminus T) = n(I) - n(T \\cap I) = 80 - 50 = 30$ (hộ gia đình). (0,5đ)',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan10MenhDeTapHopDeAPage() {
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
    MCQ_QUESTIONS_MENHDE_DE_A.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ originalKey: opt.key, text: opt.text })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS_MENHDE_DE_A.map((q) => ({
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
  const totalQuestions = MCQ_QUESTIONS_MENHDE_DE_A.length + SHORTANS_QUESTIONS_MENHDE_DE_A.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 6. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS10-MENHDE-DE-A';
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
    MCQ_QUESTIONS_MENHDE_DE_A.forEach((q) => {
      const studentChoice = mcqAnswers[q.id];
      if (studentChoice === q.correct) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (2 câu Tự luận, 1.5đ/câu)
    SHORTANS_QUESTIONS_MENHDE_DE_A.forEach((q) => {
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
      bai_thi: 'ĐỀ KIỂM TRA ĐỊNH KỲ TOÁN 10 - MỆNH ĐỀ VÀ TẬP HỢP [ĐỀ A]',
      diem: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS_MENHDE_DE_A.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_MENHDE_DE_A.length}`,
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
        Task_ID: 'KIEM_TRA_MENH_DE_TAP_HOP_TOAN_10_DE_A',
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
          bai_thi: 'ĐỀ KIỂM TRA TOÁN 10 - MỆNH ĐỀ VÀ TẬP HỢP [ĐỀ A]',
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
        MCQ_QUESTIONS_MENHDE_DE_A.map((q) => ({
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
              ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ MÔN TOÁN LỚP 10 -- ĐỀ A
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
                placeholder="HS10-MDA01"
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

          {SHORTANS_QUESTIONS_MENHDE_DE_A.map((q) => {
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
