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
// CHỦ ĐỀ: VECTƠ TRONG MẶT PHẲNG TỌA ĐỘ - TÍCH VÔ HƯỚNG
// ==========================================

// PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (14 CÂU - 7,0 ĐIỂM, 0.5Đ/CÂU)
const MCQ_QUESTIONS_TOADO_DE_B: QuestionMCQ[] = [
  {
    id: 'td1',
    number: 1,
    type: 'mcq',
    skill: 'Tọa độ của vectơ qua biểu diễn vectơ đơn vị',
    points: 0.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho vectơ $\\vec{u} = -4\\vec{i} + 3\\vec{j}$ (với $\\vec{i}, \\vec{j}$ là các vectơ đơn vị lần lượt trên trục $Ox, Oy$). Tọa độ của vectơ $\\vec{u}$ là:',
    options: [
      { key: 'A', text: '$(-4; 3)$' },
      { key: 'B', text: '$(3; -4)$' },
      { key: 'C', text: '$(4; 3)$' },
      { key: 'D', text: '$(-3; -4)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Theo định nghĩa tọa độ của vectơ: Nếu $\\vec{u} = x\\vec{i} + y\\vec{j}$ thì tọa độ của $\\vec{u}$ là $(x; y)$.<br>Do đó với $\\vec{u} = -4\\vec{i} + 3\\vec{j}$ thì tọa độ của $\\vec{u}$ là $(-4; 3)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td2',
    number: 2,
    type: 'mcq',
    skill: 'Tính tọa độ vectơ biết tọa độ hai đầu mút',
    points: 0.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho hai điểm $M(2; 5)$ và $N(6; 1)$. Tọa độ của vectơ $\\vec{MN}$ là:',
    options: [
      { key: 'A', text: '$(4; -4)$' },
      { key: 'B', text: '$(-4; 4)$' },
      { key: 'C', text: '$(8; 6)$' },
      { key: 'D', text: '$(4; 6)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Tọa độ của vectơ $\\vec{MN} = (x_N - x_M; y_N - y_M) = (6 - 2; 1 - 5) = (4; -4)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td3',
    number: 3,
    type: 'mcq',
    skill: 'Điều kiện vuông góc của hai vectơ bằng tọa độ',
    points: 0.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho hai vectơ $\\vec{u} = (x_1; y_1)$ và $\\vec{v} = (x_2; y_2)$ đều khác $\\vec{0}$. Điều kiện cần và đủ để hai vectơ $\\vec{u}$ và $\\vec{v}$ vuông góc với nhau là:',
    options: [
      { key: 'A', text: '$x_1 x_2 + y_1 y_2 = 0$' },
      { key: 'B', text: '$x_1 y_2 - x_2 y_1 = 0$' },
      { key: 'C', text: '$x_1 x_2 - y_1 y_2 = 0$' },
      { key: 'D', text: '$x_1 y_1 + x_2 y_2 = 0$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Theo biểu thức tọa độ của tích vô hướng: $\\vec{u} \\perp \\vec{v} \\iff \\vec{u} \\cdot \\vec{v} = 0 \\iff x_1 x_2 + y_1 y_2 = 0$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td4',
    number: 4,
    type: 'mcq',
    skill: 'Tính độ dài của vectơ bằng tọa độ',
    points: 0.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho vectơ $\\vec{v} = (6; -8)$. Độ dài của vectơ $\\vec{v}$ bằng:',
    options: [
      { key: 'A', text: '$10$' },
      { key: 'B', text: '$100$' },
      { key: 'C', text: '$2$' },
      { key: 'D', text: '$14$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Độ dài của vectơ $\\vec{v} = (x; y)$ được tính theo công thức: $|\\vec{v}| = \\sqrt{x^2 + y^2} = \\sqrt{6^2 + (-8)^2} = \\sqrt{36 + 64} = 10$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td5',
    number: 5,
    type: 'mcq',
    skill: 'Tọa độ trọng tâm tam giác',
    points: 0.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho ba điểm $A(2; 1)$, $B(-1; 4)$, $C(5; 1)$. Tọa độ trọng tâm $G$ của tam giác $ABC$ là:',
    options: [
      { key: 'A', text: '$(2; 2)$' },
      { key: 'B', text: '$(6; 6)$' },
      { key: 'C', text: '$(3; 3)$' },
      { key: 'D', text: '$(2; 3)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Tọa độ trọng tâm $G(x_G; y_G)$ của tam giác $ABC$:<br>$x_G = \\dfrac{2 + (-1) + 5}{3} = 2$, $y_G = \\dfrac{1 + 4 + 1}{3} = 2$.<br>Vậy tọa độ trọng tâm $G$ là $(2; 2)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td6',
    number: 6,
    type: 'mcq',
    skill: 'Tìm tọa độ đỉnh thứ tư của hình bình hành',
    points: 0.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho ba điểm $A(2; 3)$, $B(5; 4)$, $C(3; 7)$. Tọa độ điểm $D$ để tứ giác $ABCD$ là hình bình hành là:',
    options: [
      { key: 'A', text: '$(0; 6)$' },
      { key: 'B', text: '$(6; 8)$' },
      { key: 'C', text: '$(0; 8)$' },
      { key: 'D', text: '$(6; 6)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Tứ giác $ABCD$ là hình bình hành $\\iff \\vec{AB} = \\vec{DC}$.<br>Ta có $\\vec{AB} = (5 - 2; 4 - 3) = (3; 1)$.<br>Gọi $D(x; y)$, ta có $\\vec{DC} = (3 - x; 7 - y)$.<br>Do đó: $\\begin{cases} 3 - x = 3 \\\\ 7 - y = 1 \\end{cases} \\iff \\begin{cases} x = 0 \\\\ y = 6 \\end{cases}$. Tọa độ điểm $D$ là $(0; 6)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td7',
    number: 7,
    type: 'mcq',
    skill: 'Tính góc giữa hai vectơ qua tích vô hướng',
    points: 0.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho hai vectơ $\\vec{a} = (3; 1)$ và $\\vec{b} = (2; -1)$. Góc $\\theta$ giữa hai vectơ $\\vec{a}$ và $\\vec{b}$ bằng:',
    options: [
      { key: 'A', text: '$45^\\circ$' },
      { key: 'B', text: '$30^\\circ$' },
      { key: 'C', text: '$60^\\circ$' },
      { key: 'D', text: '$135^\\circ$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Ta có $\\vec{a} \\cdot \\vec{b} = 3 \\cdot 2 + 1 \\cdot (-1) = 5$.<br>$|\\vec{a}| = \\sqrt{3^2 + 1^2} = \\sqrt{10}$, $|\\vec{b}| = \\sqrt{2^2 + (-1)^2} = \\sqrt{5}$.<br>$\\cos \\theta = \\dfrac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}| \\cdot |\\vec{b}|} = \\dfrac{5}{\\sqrt{10} \\cdot \\sqrt{5}} = \\dfrac{5}{5\\sqrt{2}} = \\dfrac{\\sqrt{2}}{2} \\implies \\theta = 45^\\circ$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td8',
    number: 8,
    type: 'mcq',
    skill: 'Tìm tham số để hai vectơ vuông góc',
    points: 0.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho hai vectơ $\\vec{u} = (m; -3)$ và $\\vec{v} = (4; 2)$. Giá trị của tham số $m$ để hai vectơ $\\vec{u}$ và $\\vec{v}$ vuông góc với nhau là:',
    options: [
      { key: 'A', text: '$m = \\dfrac{3}{2}$' },
      { key: 'B', text: '$m = -\\dfrac{3}{2}$' },
      { key: 'C', text: '$m = \\dfrac{2}{3}$' },
      { key: 'D', text: '$m = 6$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Hai vectơ $\\vec{u} \\perp \\vec{v} \\iff \\vec{u} \\cdot \\vec{v} = 0 \\iff 4m + (-3) \\cdot 2 = 0 \\iff 4m = 6 \\iff m = \\dfrac{3}{2}$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td9',
    number: 9,
    type: 'mcq',
    skill: 'Tính tích vô hướng theo định nghĩa góc và độ dài',
    points: 0.5,
    text: 'Cho hai vectơ $\\vec{a}$ và $\\vec{b}$ thỏa mãn $|\\vec{a}| = 4$, $|\\vec{b}| = 5$ và góc giữa hai vectơ $(\\vec{a}, \\vec{b}) = 150^\\circ$. Giá trị của tích vô hướng $\\vec{a} \\cdot \\vec{b}$ bằng:',
    options: [
      { key: 'A', text: '$-10\\sqrt{3}$' },
      { key: 'B', text: '$10\\sqrt{3}$' },
      { key: 'C', text: '$-10$' },
      { key: 'D', text: '$10$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> $\\vec{a} \\cdot \\vec{b} = |\\vec{a}| \\cdot |\\vec{b}| \\cdot \\cos(\\vec{a}, \\vec{b}) = 4 \\cdot 5 \\cdot \\cos 150^\\circ = 20 \\cdot \\left(-\\dfrac{\\sqrt{3}}{2}\\right) = -10\\sqrt{3}$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td10',
    number: 10,
    type: 'mcq',
    skill: 'Tìm điểm trên trục tọa độ tạo tam giác vuông bằng tích vô hướng',
    points: 0.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho hai điểm $A(2; 3)$ và $B(8; 3)$. Tọa độ điểm $M$ thuộc trục hoành $Ox$ sao cho tam giác $MAB$ vuông tại $M$ là:',
    options: [
      { key: 'A', text: '$(5; 0)$' },
      { key: 'B', text: '$(3; 0)$' },
      { key: 'C', text: '$(4; 0)$' },
      { key: 'D', text: '$(2; 0)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> $M \\in Ox \\implies M(x; 0)$.<br>$\\vec{MA} = (2 - x; 3)$, $\\vec{MB} = (8 - x; 3)$.<br>Tam giác vuông tại $M \\iff \\vec{MA} \\cdot \\vec{MB} = 0 \\iff (2 - x)(8 - x) + 9 = 0 \\iff x^2 - 10x + 25 = 0 \\iff (x - 5)^2 = 0 \\iff x = 5$.<br>Vậy $M(5; 0)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td11',
    number: 11,
    type: 'mcq',
    skill: 'Phân tích một vectơ theo hai vectơ không cùng phương trong hệ tọa độ',
    points: 0.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho ba vectơ $\\vec{a} = (1; 2)$, $\\vec{b} = (3; -1)$ và $\\vec{c} = (7; 7)$. Biểu diễn vectơ $\\vec{c}$ theo hai vectơ $\\vec{a}$ và $\\vec{b}$ là:',
    options: [
      { key: 'A', text: '$\\vec{c} = 4\\vec{a} + \\vec{b}$' },
      { key: 'B', text: '$\\vec{c} = 2\\vec{a} + 3\\vec{b}$' },
      { key: 'C', text: '$\\vec{c} = 3\\vec{a} + 2\\vec{b}$' },
      { key: 'D', text: '$\\vec{c} = 4\\vec{a} - \\vec{b}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Đặt $\\vec{c} = k\\vec{a} + h\\vec{b} \\iff \\begin{cases} k + 3h = 7 \\\\ 2k - h = 7 \\end{cases} \\iff \\begin{cases} k = 4 \\\\ h = 1 \\end{cases}$.<br>Vậy $\\vec{c} = 4\\vec{a} + \\vec{b}$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td12',
    number: 12,
    type: 'mcq',
    skill: 'Ứng dụng tích vô hướng tính công của lực trong vật lý',
    points: 0.5,
    text: 'Một lực $\\vec{F} = (40; 20)$ (đơn vị: N) tác dụng vào một vật làm vật dịch chuyển từ vị trí $O(0;0)$ đến vị trí $A$ theo vectơ độ dịch chuyển $\\vec{d} = (5; 4)$ (đơn vị: m). Công $A$ sinh ra bởi lực $\\vec{F}$ bằng:',
    options: [
      { key: 'A', text: '$280\\text{ J}$' },
      { key: 'B', text: '$200\\text{ J}$' },
      { key: 'C', text: '$160\\text{ J}$' },
      { key: 'D', text: '$320\\text{ J}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Công $A = \\vec{F} \\cdot \\vec{d} = 40 \\cdot 5 + 20 \\cdot 4 = 200 + 80 = 280\\text{ J}$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td13',
    number: 13,
    type: 'mcq',
    skill: 'Tìm tham số để góc giữa hai vectơ bằng số đo cho trước',
    points: 0.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho hai vectơ $\\vec{u} = (m; 1)$ và $\\vec{v} = (1; 2)$. Tất cả các giá trị của $m$ để góc giữa hai vectơ $\\vec{u}$ và $\\vec{v}$ bằng $45^\\circ$ là:',
    options: [
      { key: 'A', text: '$m = 3$ hoặc $m = -\\dfrac{1}{3}$' },
      { key: 'B', text: '$m = 3$' },
      { key: 'C', text: '$m = -\\dfrac{1}{3}$' },
      { key: 'D', text: '$m = -3$ hoặc $m = \\dfrac{1}{3}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> $\\cos 45^\\circ = \\dfrac{\\vec{u} \\cdot \\vec{v}}{|\\vec{u}| \\cdot |\\vec{v}|} \\iff \\dfrac{\\sqrt{2}}{2} = \\dfrac{m + 2}{\\sqrt{5(m^2 + 1)}}$.<br>Bình phương hai vế (với $m > -2$): $2(m+2)^2 = 5(m^2+1) \\iff 3m^2 - 8m - 3 = 0 \\iff m = 3$ hoặc $m = -\\dfrac{1}{3}$ (thỏa mãn).<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'td14',
    number: 14,
    type: 'mcq',
    skill: 'Tìm tọa độ trực tâm của tam giác bằng tích vô hướng',
    points: 0.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho tam giác $ABC$ có các đỉnh $A(2; 1)$, $B(6; 1)$ và $C(3; 4)$. Tọa độ trực tâm $H$ của tam giác $ABC$ là:',
    options: [
      { key: 'A', text: '$(3; 2)$' },
      { key: 'B', text: '$(2; 3)$' },
      { key: 'C', text: '$(3; 3)$' },
      { key: 'D', text: '$(2; 2)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Gọi $H(x; y)$. Trực tâm $H$ thỏa mãn:<br>$\\begin{cases} \\vec{AH} \\cdot \\vec{BC} = 0 \\\\ \\vec{BH} \\cdot \\vec{AC} = 0 \\end{cases} \\iff \\begin{cases} -3(x - 2) + 3(y - 1) = 0 \\\\ 1(x - 6) + 3(y - 1) = 0 \\end{cases} \\iff \\begin{cases} -x + y = -1 \\\\ x + 3y = 9 \\end{cases} \\iff \\begin{cases} x = 3 \\\\ y = 2 \\end{cases}$.<br>Vậy trực tâm $H(3; 2)$.<br><strong>Đáp án đúng: A.</strong>',
  },
];

// PHẦN II. TỰ LUẬN (2 CÂU - 3,0 ĐIỂM, 1.5Đ/CÂU)
const SHORTANS_QUESTIONS_TOADO_DE_B: QuestionShortAns[] = [
  {
    id: 'td15',
    number: 15,
    type: 'shortans',
    skill: 'Chứng minh tam giác vuông cân và tìm tọa độ đỉnh hình vuông',
    points: 1.5,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho ba điểm $A(-2; 1)$, $B(2; 3)$ và $C(0; -3)$.<br><br><strong>a) (0,75 điểm)</strong> Tính tọa độ các vectơ $\\vec{AB}, \\vec{AC}$. Chứng minh rằng tam giác $ABC$ vuông cân tại $A$.<br><strong>b) (0,75 điểm)</strong> Tìm tọa độ điểm $D$ sao cho tứ giác $ABDC$ là hình vuông.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'Tam giác ABC vuông cân tại A (AB = AC = 2√5, AB ⊥ AC); D(4; -1)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const hasD = clean.includes('(4;-1)') || clean.includes('4;-1') || clean.includes('d(4,-1)') || clean.includes('d(4;-1)');
      const hasVuongCan = clean.includes('vuongcan') || clean.includes('vuôngcân') || clean.includes('vuong') || clean.includes('vuông');
      return hasD || (hasVuongCan && clean.includes('4'));
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>- $\\vec{AB} = (4; 2)$, $\\vec{AC} = (2; -4)$. (0,25đ)<br>- $\\vec{AB} \\cdot \\vec{AC} = 4(2) + 2(-4) = 0 \\implies \\vec{AB} \\perp \\vec{AC} \\implies \\widehat{A} = 90^\\circ$. (0,25đ)<br>- Độ dài: $AB = \\sqrt{4^2 + 2^2} = 2\\sqrt{5}$, $AC = \\sqrt{2^2 + (-4)^2} = 2\\sqrt{5}$. Suy ra tam giác $ABC$ vuông cân tại $A$. (0,25đ)<br><br><strong>b) (0,75 điểm)</strong><br>- Tứ giác $ABDC$ là hình vuông $\\iff \\vec{AD} = \\vec{AB} + \\vec{AC} = (6; -2)$. (0,25đ)<br>- Với $D(x_D; y_D) \\implies \\vec{AD} = (x_D + 2; y_D - 1)$. (0,25đ)<br>- Do đó $\\begin{cases} x_D + 2 = 6 \\\\ y_D - 1 = -2 \\end{cases} \\iff \\begin{cases} x_D = 4 \\\\ y_D = -1 \\end{cases} \\implies D(4; -1)$. (0,25đ)',
  },
  {
    id: 'td16',
    number: 16,
    type: 'shortans',
    skill: 'Ứng dụng vectơ tính hợp lực hai tàu kéo và tìm điểm trên trục tọa độ tạo góc vuông',
    points: 1.5,
    text: '<strong>a) (0,75 điểm)</strong> Hai tàu kéo cùng kéo một chiếc xà lan từ điểm gốc $O$ theo hai hướng tạo với nhau một góc $60^\\circ$. Lực kéo của tàu thứ nhất có độ lớn $F_1 = 6000\\text{ N}$, lực kéo của tàu thứ hai có độ lớn $F_2 = 4000\\text{ N}$. Tính độ lớn của hợp lực $\\vec{F} = \\vec{F}_1 + \\vec{F}_2$ tác dụng lên xà lan (làm tròn kết quả đến hàng đơn vị của Newton).<br><br><strong>b) (0,75 điểm)</strong> Trong mặt phẳng tọa độ $Oxy$, cho hai điểm $A(2; 5)$ và $B(8; 1)$. Tìm tọa độ điểm $M$ thuộc trục hoành $Ox$ sao cho góc $\\widehat{AMB} = 90^\\circ$.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'a) F ≈ 8718 N; b) M(3; 0) hoặc M(7; 0)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const hasForce = clean.includes('8718') || clean.includes('8717');
      const hasM = (clean.includes('3') && clean.includes('7')) || clean.includes('(3;0)') || clean.includes('(7;0)');
      return hasForce || hasM;
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>- Ta có $|\\vec{F}|^2 = F_1^2 + F_2^2 + 2F_1 F_2 \\cos 60^\\circ$. (0,25đ)<br>- Thay số: $6000^2 + 4000^2 + 2(6000)(4000)(0{,}5) = 76.000.000$. (0,25đ)<br>- Suy ra $|\\vec{F}| = \\sqrt{76.000.000} \\approx 8718\\text{ N}$. (0,25đ)<br><br><strong>b) (0,75 điểm)</strong><br>- Điểm $M \\in Ox \\implies M(x; 0)$. (0,25đ)<br>- $\\vec{MA} = (2 - x; 5)$, $\\vec{MB} = (8 - x; 1)$.<br>- $\\widehat{AMB} = 90^\\circ \\iff \\vec{MA} \\cdot \\vec{MB} = 0 \\iff (2 - x)(8 - x) + 5 = 0 \\iff x^2 - 10x + 21 = 0$. (0,25đ)<br>- Giải ra $x = 3$ hoặc $x = 7$. Vậy có hai điểm thỏa mãn: $M_1(3; 0)$ và $M_2(7; 0)$. (0,25đ)',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan10ToaDoDeBPage() {
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
    MCQ_QUESTIONS_TOADO_DE_B.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ originalKey: opt.key, text: opt.text })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS_TOADO_DE_B.map((q) => ({
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
  const totalQuestions = MCQ_QUESTIONS_TOADO_DE_B.length + SHORTANS_QUESTIONS_TOADO_DE_B.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 6. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS10-TOADO-DE-B';
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
    MCQ_QUESTIONS_TOADO_DE_B.forEach((q) => {
      const studentChoice = mcqAnswers[q.id];
      if (studentChoice === q.correct) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (2 câu Tự luận, 1.5đ/câu)
    SHORTANS_QUESTIONS_TOADO_DE_B.forEach((q) => {
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
      bai_thi: 'ĐỀ KIỂM TRA ĐỊNH KỲ TOÁN 10 - TỌA ĐỘ VECTƠ VÀ TÍCH VÔ HƯỚNG [ĐỀ B]',
      diem: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS_TOADO_DE_B.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_TOADO_DE_B.length}`,
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
        Task_ID: 'KIEM_TRA_TOA_DO_TICH_VO_HUONG_TOAN_10_DE_B',
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
          bai_thi: 'ĐỀ KIỂM TRA TOÁN 10 - TỌA ĐỘ VÀ TÍCH VÔ HƯỚNG [ĐỀ B]',
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
        MCQ_QUESTIONS_TOADO_DE_B.map((q) => ({
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
            <span className="inline-block px-3 py-1 bg-cyan-50 text-cyan-800 text-xs font-semibold uppercase tracking-wider rounded-full mb-2">
              Hệ thống khảo sát trực tuyến Integra &bull; Toán 10
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ MÔN TOÁN LỚP 10 -- ĐỀ B
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
              Chủ đề: Vectơ trong mặt phẳng tọa độ, Tích vô hướng của hai vectơ
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 disabled:bg-slate-100"
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
                placeholder="HS10-TD01"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 disabled:bg-slate-100"
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 disabled:bg-slate-100"
              />
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-cyan-50/80 border border-cyan-200 rounded-xl">
              <span className="text-xs font-medium text-cyan-800">Thời gian còn lại</span>
              <span
                className={`text-xl font-bold font-mono ${
                  timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-cyan-950'
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
                className="h-full bg-cyan-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        {/* KẾT QUẢ SAU KHI NỘP BÀI */}
        {isSubmitted && (
          <section className="bg-white rounded-2xl shadow-md border-2 border-cyan-600 p-6 sm:p-8 animate-fade-in">
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
              <div className="text-center sm:text-right bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-200 min-w-[140px]">
                <span className="text-xs uppercase text-slate-500 font-semibold block">Điểm số</span>
                <span className="text-4xl font-extrabold text-cyan-700">{diemSo}</span>
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
          <div className="bg-cyan-800 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
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
                    <span className="px-2.5 py-1 bg-cyan-100 text-cyan-900 text-xs font-bold rounded-md">
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
                        'border-cyan-600 bg-cyan-50/80 text-cyan-950 font-semibold ring-2 ring-cyan-500/20';
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
                              ? 'bg-cyan-600 text-white'
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
                    <div className="flex items-center gap-1.5 font-bold text-cyan-900 mb-1">
                      <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
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

          {SHORTANS_QUESTIONS_TOADO_DE_B.map((q) => {
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
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 disabled:bg-slate-100"
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
                    <div className="flex items-center gap-1.5 font-bold text-cyan-900 mb-1">
                      <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
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
              className="w-full sm:w-80 py-4 px-6 bg-cyan-700 hover:bg-cyan-800 disabled:bg-cyan-400 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-cyan-600/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
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
