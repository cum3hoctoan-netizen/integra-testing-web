'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN ĐỀ THI ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ 1 MÔN TOÁN LỚP 10 -- ĐỀ B';
const EXAM_SUBTITLE = 'Chương trình GDPT 2018 -- Định hướng phát triển tư duy thực chất';
const EXAM_TIME_NOTE =
  'Thời gian làm bài: 45 phút • Đề thi gồm 10 câu MCQ (5,0đ), 02 câu Đúng/Sai (2,0đ) và 03 câu trả lời ngắn (3,0đ)';

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
    skill: 'Mệnh đề phủ định của mệnh đề chứa biến và tính đúng sai',
    points: 0.5,
    text: 'Cho mệnh đề chứa biến $P(x): "x^2 - 2x + 3 \\le 0"$. Mệnh đề phủ định $\\overline{P}$ và tính đúng sai của mệnh đề $\\overline{P}$ trên tập số thực $\\mathbb{R}$ là:',
    options: [
      {
        text: '$\\overline{P}: "\\forall x \\in \\mathbb{R}, x^2 - 2x + 3 > 0"$, $\\overline{P}$ là mệnh đề đúng',
        isCorrect: true,
      },
      {
        text: '$\\overline{P}: "\\forall x \\in \\mathbb{R}, x^2 - 2x + 3 \\ge 0"$, $\\overline{P}$ là mệnh đề đúng',
        isCorrect: false,
      },
      {
        text: '$\\overline{P}: "\\forall x \\in \\mathbb{R}, x^2 - 2x + 3 > 0"$, $\\overline{P}$ là mệnh đề sai',
        isCorrect: false,
      },
      {
        text: '$\\overline{P}: "\\exists x \\in \\mathbb{R}, x^2 - 2x + 3 > 0"$, $\\overline{P}$ là mệnh đề đúng',
        isCorrect: false,
      },
    ],
    explanation:
      '• Mệnh đề ban đầu mang dạng lượng từ tồn tại $P: "\\exists x \\in \\mathbb{R}, x^2 - 2x + 3 \\le 0"$.<br>• Phủ định của lượng từ $\\exists$ là $\\forall$, phủ định của phép so sánh $\\le$ là $>$.<br>Do đó $\\overline{P}: "\\forall x \\in \\mathbb{R}, x^2 - 2x + 3 > 0"$.<br>• Xét tam thức bậc hai: $x^2 - 2x + 3 = (x - 1)^2 + 2 \\ge 2 > 0, \\forall x \\in \\mathbb{R}$. Khẳng định này đúng với mọi $x \\in \\mathbb{R}$.<br>Vậy $\\overline{P}$ là một mệnh đề đúng.',
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Giao của hai tập hợp và phần bù trong tập số thực',
    points: 0.5,
    text: 'Cho hai tập hợp $A = \\{x \\in \\mathbb{R} \\mid |2x + 1| \\le 5\\}$ và $B = \\{x \\in \\mathbb{R} \\mid x^2 - 4x < 0\\}$. Tập hợp phần bù $C_{\\mathbb{R}}(A \\cap B)$ bằng:',
    options: [
      { text: '$(-\\infty; 0] \\cup (2; +\\infty)$', isCorrect: true },
      { text: '$(-\\infty; -3) \\cup (4; +\\infty)$', isCorrect: false },
      { text: '$(-\\infty; 0) \\cup [2; +\\infty)$', isCorrect: false },
      { text: '$[-3; 4)$', isCorrect: false },
    ],
    explanation:
      '• Giải điều kiện xác định tập hợp $A$: $|2x + 1| \\le 5 \\iff -5 \\le 2x + 1 \\le 5 \\iff -6 \\le 2x \\le 4 \\iff -3 \\le x \\le 2 \\implies A = [-3; 2]$.<br>• Giải điều kiện xác định tập hợp $B$: $x^2 - 4x < 0 \\iff 0 < x < 4 \\implies B = (0; 4)$.<br>• Phép toán giao hai tập hợp: $A \\cap B = [-3; 2] \\cap (0; 4) = (0; 2]$.<br>• Phần bù trong $\\mathbb{R}$: $C_{\\mathbb{R}}(A \\cap B) = \\mathbb{R} \\setminus (0; 2] = (-\\infty; 0] \\cup (2; +\\infty)$.',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Xác định điểm thuộc đường thẳng và nghiệm của hệ bất phương trình bậc nhất hai ẩn',
    points: 0.5,
    text: 'Cặp số $(x; y)$ nào sau đây thuộc đường thẳng $d: x - 2y + 2 = 0$ và thỏa mãn đồng thời hệ bất phương trình $\\begin{cases} 2x - y + 2 > 0 \\\\ x + 2y - 4 \\le 0 \\\\ y \\ge 0 \\end{cases}$?',
    options: [
      { text: '$(0; 1)$', isCorrect: true },
      { text: '$(2; 2)$', isCorrect: false },
      { text: '$(-2; 0)$', isCorrect: false },
      { text: '$(4; 3)$', isCorrect: false },
    ],
    explanation:
      '• Thay điểm $(x; y) = (0; 1)$ vào phương trình đường thẳng $d$: $0 - 2(1) + 2 = 0$ (thỏa mãn).<br>• Thay $(0; 1)$ vào hệ bất phương trình:$$\\begin{cases} 2(0) - 1 + 2 = 1 > 0 \\quad (\\text{đúng}) \\\\ 0 + 2(1) - 4 = -2 \\le 0 \\quad (\\text{đúng}) \\\\ 1 \\ge 0 \\quad (\\text{đúng}) \\end{cases}$$Do đó cặp số $(0; 1)$ thỏa mãn tất cả các điều kiện.<br>Các điểm còn lại: $(2; 2)$ có $2 - 2(2) + 2 = 0$ nhưng $2 + 2(2) - 4 = 2 > 0$ (vi phạm BPT 2); $(-2; 0)$ có $2(-2) - 0 + 2 = -2 \\ngtr 0$ (vi phạm BPT 1).',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Thiết lập hệ bất phương trình bậc nhất hai ẩn mô tả bài toán kinh tế thực tế',
    points: 0.5,
    text: 'Một xưởng chế biến thực phẩm sản xuất hai loại bánh $X$ và $Y$. Để sản xuất $1$ hộp $X$ cần $3\\text{ kg}$ bột mì và $1\\text{ kg}$ đường. Để sản xuất $1$ hộp $Y$ cần $1\\text{ kg}$ bột mì và $3\\text{ kg}$ đường. Xưởng hiện có tối đa $15\\text{ kg}$ bột mì và $15\\text{ kg}$ đường. Gọi $x, y$ lần lượt là số hộp bánh $X$ và $Y$ được sản xuất ($x \\ge 0, y \\ge 0$). Hệ bất phương trình mô tả khả năng cung ứng nguyên liệu của xưởng là:',
    options: [
      {
        text: '$\\begin{cases} 3x + y \\le 15 \\\\ x + 3y \\le 15 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$',
        isCorrect: true,
      },
      {
        text: '$\\begin{cases} x + 3y \\le 15 \\\\ 3x + y \\ge 15 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$',
        isCorrect: false,
      },
      {
        text: '$\\begin{cases} 3x + 3y \\le 15 \\\\ x + y \\le 15 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$',
        isCorrect: false,
      },
      {
        text: '$\\begin{cases} x + y \\le 15 \\\\ 3x + y \\le 15 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$',
        isCorrect: false,
      },
    ],
    explanation:
      '• Tổng lượng bột mì sử dụng: $3x + y \\le 15$.<br>• Tổng lượng đường sử dụng: $x + 3y \\le 15$.<br>• Điều kiện số lượng sản phẩm không âm: $x \\ge 0, y \\ge 0$.<br>Kết hợp các ràng buộc thu được hệ bất phương trình:$$\\begin{cases} 3x + y \\le 15 \\\\ x + 3y \\le 15 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$$',
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Tính giá trị biểu thức lượng giác của góc tù',
    points: 0.5,
    text: 'Cho góc tù $\\alpha$ thỏa mãn $\\sin \\alpha = \\dfrac{4}{5}$ ($90^\\circ < \\alpha < 180^\\circ$). Giá trị của biểu thức $Q = 3\\cos \\alpha - \\cot \\alpha$ bằng:',
    options: [
      { text: '$-\\dfrac{21}{20}$', isCorrect: true },
      { text: '$\\dfrac{21}{20}$', isCorrect: false },
      { text: '$-\\dfrac{39}{20}$', isCorrect: false },
      { text: '$-\\dfrac{9}{20}$', isCorrect: false },
    ],
    explanation:
      '• Vì $90^\\circ < \\alpha < 180^\\circ$ nên $\\cos \\alpha < 0$.<br>Ta có $\\cos \\alpha = -\\sqrt{1 - \\sin^2 \\alpha} = -\\sqrt{1 - \\left(\\dfrac{4}{5}\\right)^2} = -\\dfrac{3}{5}$.<br>• $\\cot \\alpha = \\dfrac{\\cos \\alpha}{\\sin \\alpha} = \\dfrac{-3/5}{4/5} = -\\dfrac{3}{4}$.<br>• Thay vào biểu thức $Q$:$$Q = 3\\left(-\\dfrac{3}{5}\\right) - \\left(-\\dfrac{3}{4}\\right) = -\\dfrac{9}{5} + \\dfrac{3}{4} = -\\dfrac{36}{20} + \\dfrac{15}{20} = -\\dfrac{21}{20}.$$',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Công thức tính độ dài đường trung tuyến trong tam giác',
    points: 0.5,
    text: 'Cho tam giác $ABC$ có các cạnh $a = 6$, $b = 7$, $c = 8$. Độ dài đường trung tuyến $m_b$ xuất phát từ đỉnh $B$ của tam giác $ABC$ bằng:',
    options: [
      { text: '$\\dfrac{\\sqrt{151}}{2}$', isCorrect: true },
      { text: '$7$', isCorrect: false },
      { text: '$\\sqrt{38}$', isCorrect: false },
      { text: '$\\dfrac{\\sqrt{115}}{2}$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức độ dài đường trung tuyến trong tam giác $ABC$:$$m_b^2 = \\dfrac{2(a^2 + c^2) - b^2}{4} = \\dfrac{2(6^2 + 8^2) - 7^2}{4} = \\dfrac{2(36 + 64) - 49}{4} = \\dfrac{200 - 49}{4} = \\dfrac{151}{4}.$$Suy ra $m_b = \\dfrac{\\sqrt{151}}{2}$.',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Nhận diện đẳng thức vectơ sai trong hình bình hành',
    points: 0.5,
    text: 'Cho hình bình hành $ABCD$ tâm $O$. Đẳng thức vectơ nào sau đây là \\textbf{sai}?',
    options: [
      { text: '$\\vec{AB} + \\vec{AD} = \\vec{AC}$', isCorrect: false },
      { text: '$\\vec{CB} + \\vec{CD} = \\vec{CA}$', isCorrect: false },
      { text: '$\\vec{OA} + \\vec{OC} = \\vec{0}$', isCorrect: false },
      { text: '$\\vec{AB} - \\vec{AD} = \\vec{AC}$', isCorrect: true },
    ],
    explanation:
      'Trong hình bình hành $ABCD$, theo quy tắc hiệu hai vectơ chung gốc: $\\vec{AB} - \\vec{AD} = \\vec{DB} \\neq \\vec{AC}$. Do đó đẳng thức $\\vec{AB} - \\vec{AD} = \\vec{AC}$ là sai.',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Quy tắc cộng trừ và ba điểm đối với các vectơ tự do',
    points: 0.5,
    text: 'Cho bốn điểm $A, B, C, D$ phân biệt. Khẳng định nào sau đây là đúng?',
    options: [
      { text: '$\\vec{AB} + \\vec{CD} = \\vec{AD} + \\vec{CB}$', isCorrect: true },
      { text: '$\\vec{AB} + \\vec{BC} + \\vec{CD} = \\vec{DA}$', isCorrect: false },
      { text: '$\\vec{AB} + \\vec{CD} = \\vec{AC} + \\vec{BD}$', isCorrect: false },
      { text: '$\\vec{AB} - \\vec{AD} = \\vec{BD}$', isCorrect: false },
    ],
    explanation:
      'Ta xét tính đúng sai của từng đáp án:<br>• <strong>Khẳng định A đúng:</strong> Áp dụng quy tắc ba điểm: $$\\vec{AB} + \\vec{CD} = (\\vec{AD} + \\vec{DB}) + (\\vec{CB} + \\vec{BD}) = \\vec{AD} + \\vec{CB} + (\\vec{DB} + \\vec{BD}) = \\vec{AD} + \\vec{CB} + \\vec{0} = \\vec{AD} + \\vec{CB}.$$Hoặc biến đổi tương đương: $\\vec{AB} - \\vec{AD} = \\vec{CB} - \\vec{CD} \\iff \\vec{DB} = \\vec{DB}$ (luôn đúng).<br>• <strong>Khẳng định B sai:</strong> $\\vec{AB} + \\vec{BC} + \\vec{CD} = \\vec{AC} + \\vec{CD} = \\vec{AD} \\neq \\vec{DA}$.<br>• <strong>Khẳng định C sai:</strong> $\\vec{AC} + \\vec{BD} = (\\vec{AB} + \\vec{BC}) + (\\vec{BC} + \\vec{CD}) = \\vec{AB} + \\vec{CD} + 2\\vec{BC} \\neq \\vec{AB} + \\vec{CD}$.<br>• <strong>Khẳng định D sai:</strong> $\\vec{AB} - \\vec{AD} = \\vec{DB} \\neq \\vec{BD}$.',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Tính độ dài của vectơ hiệu hai cạnh trong hình chữ nhật',
    points: 0.5,
    text: 'Cho hình chữ nhật $ABCD$ có $AB = 3a$ và $AD = 4a$. Độ dài của vectơ $\\vec{AB} - \\vec{AD}$ bằng:',
    options: [
      { text: '$5a$', isCorrect: true },
      { text: '$7a$', isCorrect: false },
      { text: '$a$', isCorrect: false },
      { text: '$25a$', isCorrect: false },
    ],
    explanation:
      'Theo quy tắc phép trừ hai vectơ có cùng điểm đầu, ta có: $\\vec{AB} - \\vec{AD} = \\vec{DB}$.<br>Suy ra độ dài của vectơ $\\vec{AB} - \\vec{AD}$ là $|\\vec{AB} - \\vec{AD}| = |\\vec{DB}| = DB$.<br>Xét tam giác $ABD$ vuông tại $A$, áp dụng định lí Pythagore:$$DB = \\sqrt{AB^2 + AD^2} = \\sqrt{(3a)^2 + (4a)^2} = \\sqrt{9a^2 + 16a^2} = \\sqrt{25a^2} = 5a.$$Vậy $|\\vec{AB} - \\vec{AD}| = 5a$.',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Các phép toán vectơ và tính chất tâm đối xứng của hình bình hành',
    points: 0.5,
    text: 'Cho hình bình hành $ABCD$ tâm $O$. Khẳng định nào sau đây là \\textbf{sai}?',
    options: [
      { text: '$\\vec{AB} + \\vec{AD} = \\vec{AC}$', isCorrect: false },
      { text: '$\\vec{AB} - \\vec{AD} = \\vec{DB}$', isCorrect: false },
      { text: '$\\vec{OA} + \\vec{OC} = \\vec{0}$', isCorrect: false },
      { text: '$\\vec{OA} - \\vec{OB} = \\vec{AB}$', isCorrect: true },
    ],
    explanation:
      'Ta xét tính đúng sai của từng phương án:<br>• <strong>A đúng:</strong> Quy tắc hình bình hành $\\vec{AB} + \\vec{AD} = \\vec{AC}$.<br>• <strong>B đúng:</strong> Theo quy tắc trừ: $\\vec{AB} - \\vec{AD} = \\vec{DB}$.<br>• <strong>C đúng:</strong> Vì $O$ là trung điểm đường chéo $AC$ nên $\\vec{OA}$ và $\\vec{OC}$ đối nhau: $\\vec{OA} + \\vec{OC} = \\vec{0}$.<br>• <strong>D sai:</strong> Theo quy tắc trừ: $\\vec{OA} - \\vec{OB} = \\vec{BA} \\neq \\vec{AB}$ (đây là hai vectơ đối nhau).',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 11,
    type: 'tf',
    skill: 'Quy hoạch tuyến tính: tối ưu hóa lợi nhuận sản xuất hai loại sản phẩm',
    text: 'Một doanh nghiệp sản xuất hai loại sản phẩm $A$ và $B$.<br>• Để sản xuất $1$ sản phẩm $A$ cần $15\\text{ triệu đồng}$ vốn và $5\\text{ công lao động}$, mang lại lợi nhuận $25\\text{ triệu đồng}$.<br>• Để sản xuất $1$ sản phẩm $B$ cần $20\\text{ triệu đồng}$ vốn và $10\\text{ công lao động}$, mang lại lợi nhuận $35\\text{ triệu đồng}$.<br>Tổng vốn tối đa là $180\\text{ triệu đồng}$ và tổng số công lao động tối đa là $70\\text{ công}$. Gọi $x, y$ ($x \\ge 0, y \\ge 0$) lần lượt là số sản phẩm $A$ và $B$.',
    items: [
      {
        key: 'a',
        text: 'Hệ bất phương trình mô tả các điều kiện ràng buộc được thu gọn về dạng $\\begin{cases} 3x + 4y \\le 36 \\\\ x + 2y \\le 14 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Miền nghiệm của hệ bất phương trình là miền tứ giác $OABC$ kể cả biên với các đỉnh $O(0;0), A(12;0), B(8;3), C(0;7)$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Nếu doanh nghiệp sản xuất $6$ sản phẩm $A$ và $5$ sản phẩm $B$ thì phương án này thỏa mãn tất cả các điều kiện ràng buộc',
        correct: false,
      },
      {
        key: 'd',
        text: 'Tổng lợi nhuận lớn nhất mà doanh nghiệp có thể thu được là $305\\text{ triệu đồng}$',
        correct: true,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Ràng buộc vốn: $15x + 20y \\le 180 \\iff 3x + 4y \\le 36$. Ràng buộc lao động: $5x + 10y \\le 70 \\iff x + 2y \\le 14$. Do đó hệ thu gọn là $\\begin{cases} 3x + 4y \\le 36 \\\\ x + 2y \\le 14 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$.<br>• <strong>b) Đúng.</strong> Các đường biên $3x + 4y = 36$ và $x + 2y = 14$ cắt nhau tại $B(8; 3)$. Giao với các trục tọa độ cho các đỉnh $O(0; 0), A(12; 0), C(0; 7)$. Miền nghiệm là miền tứ giác $OABC$ kể cả biên.<br>• <strong>c) Sai.</strong> Với $x = 6, y = 5$: $3(6) + 4(5) = 18 + 20 = 38 > 36$, vi phạm điều kiện vốn đầu tư.<br>• <strong>d) Đúng.</strong> Hàm mục tiêu lợi nhuận $F(x, y) = 25x + 35y$ (triệu đồng). Giá trị tại các đỉnh:<br>- $F(O) = 0$<br>- $F(A) = 25(12) + 0 = 300\\text{ triệu đồng}$<br>- $F(B) = 25(8) + 35(3) = 200 + 105 = 305\\text{ triệu đồng}$<br>- $F(C) = 25(0) + 35(7) = 245\\text{ triệu đồng}$<br>Lợi nhuận lớn nhất đạt được là $305\\text{ triệu đồng}$ khi sản xuất 8 sản phẩm $A$ và 3 sản phẩm $B$.',
  },
  {
    id: 'tf2',
    number: 12,
    type: 'tf',
    skill: 'Tổng hợp lực và điều kiện cân bằng của tàu thủy bằng vectơ',
    text: 'Hai tàu kéo cùng kéo một chiếc tàu thủy tại điểm gốc $O$ bằng hai dây cáp căng tạo ra hai lực kéo $\\vec{F}_1$ và $\\vec{F}_2$. Biết độ lớn $F_1 = 600\\text{ N}$, $F_2 = 1000\\text{ N}$, và góc tạo bởi hai dây kéo là $\\widehat{(\\vec{F}_1, \\vec{F}_2)} = 60^\\circ$. Gọi $\\vec{F} = \\vec{F}_1 + \\vec{F}_2$ là hợp lực tác dụng lên tàu thủy.',
    items: [
      {
        key: 'a',
        text: 'Độ lớn của vectơ hiệu $\\vec{F}_2 - \\vec{F}_1$ bằng $400\\text{ N}$',
        correct: false,
      },
      {
        key: 'b',
        text: 'Độ lớn của hợp lực kéo $\\vec{F}$ tác dụng lên tàu thủy bằng $1600\\text{ N}$',
        correct: false,
      },
      {
        key: 'c',
        text: 'Góc tạo bởi hướng của hợp lực $\\vec{F}$ và hướng của lực kéo $\\vec{F}_1$ xấp xỉ $38,2^\\circ$',
        correct: true,
      },
      {
        key: 'd',
        text: 'Để giữ tàu thủy đứng yên cân bằng tại điểm $O$, lực cản $\\vec{F}_3$ của dòng nước phải ngược hướng với hợp lực $\\vec{F}$ và có độ lớn bằng $1400\\text{ N}$',
        correct: true,
      },
    ],
    explanation:
      'Dựng hình bình hành $OACB$ sao cho $\\vec{OA} = \\vec{F}_1$ và $\\vec{OB} = \\vec{F}_2$. Theo quy tắc hình bình hành, hợp lực $\\vec{F} = \\vec{F}_1 + \\vec{F}_2 = \\vec{OC}$.<br>Ta có $OA = 600\\text{ N}$, $OB = AC = 1000\\text{ N}$, góc $\\widehat{AOB} = 60^\\circ \\implies \\widehat{OAC} = 180^\\circ - 60^\\circ = 120^\\circ$.<br><br>• <strong>a) Sai.</strong> $|\\vec{F}_2 - \\vec{F}_1| = |\\vec{OB} - \\vec{OA}| = |\\vec{AB}| = AB$.<br>Áp dụng định lí côsin trong $\\triangle OAB$: $$AB^2 = 600^2 + 1000^2 - 2 \\cdot 600 \\cdot 1000 \\cdot \\cos 60^\\circ = 360\\,000 + 1\\,000\\,000 - 600\\,000 = 760\\,000 \\implies AB = 200\\sqrt{19} \\approx 871{,}8\\text{ N} \\neq 400\\text{ N}.$$<br>• <strong>b) Sai.</strong> Áp dụng định lí côsin trong $\\triangle OAC$: $$OC^2 = OA^2 + AC^2 - 2 \\cdot OA \\cdot AC \\cdot \\cos 120^\\circ = 600^2 + 1000^2 - 2 \\cdot 600 \\cdot 1000 \\cdot \\left(-\\dfrac{1}{2}\\right) = 1\\,360\\,000 + 600\\,000 = 1\\,960\\,000$$ $$\\implies |\\vec{F}| = OC = \\sqrt{1\\,960\\,000} = 1400\\text{ N} \\neq 1600\\text{ N}.$$<br>• <strong>c) Đúng.</strong> Áp dụng định lí sin trong $\\triangle OAC$: $$\\dfrac{AC}{\\sin\\widehat{AOC}} = \\dfrac{OC}{\\sin\\widehat{OAC}} \\implies \\sin\\widehat{AOC} = \\dfrac{1000 \\cdot \\sin 120^\\circ}{1400} = \\dfrac{1000 \\cdot \\frac{\\sqrt{3}}{2}}{1400} = \\dfrac{5\\sqrt{3}}{14} \\approx 0{,}6186 \\implies \\widehat{AOC} \\approx 38{,}2^\\circ.$$<br>• <strong>d) Đúng.</strong> Điều kiện cân bằng: $\\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 = \\vec{0} \\iff \\vec{F} + \\vec{F}_3 = \\vec{0} \\iff \\vec{F}_3 = -\\vec{F}$.<br>Vậy lực cản $\\vec{F}_3$ ngược hướng với $\\vec{F}$ và có độ lớn $|\\vec{F}_3| = |\\vec{F}| = 1400\\text{ N}$.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 13,
    type: 'shortans',
    skill: 'Ứng dụng hệ thức lượng và giải tam giác tính chiều cao ngọn tháp',
    points: 1.0,
    text: 'Để xác định chiều cao $CD$ của một ngọn tháp (với $D$ là chân tháp trên mặt đất), người ta chọn hai điểm $A$ và $B$ trên mặt đất bằng phẳng sao cho $A, B, D$ thẳng hàng. Qua đo đạc thu được: khoảng cách $AB = 400\\text{ m}$, góc nâng $\\widehat{CAD} = 30^\\circ$ và góc nâng $\\widehat{CBD} = 60^\\circ$. Tính chiều cao $CD$ của ngọn tháp theo đơn vị mét (làm tròn kết quả đến hàng đơn vị).',
    placeholder: 'Nhập số nguyên chiều cao (mét, VD: 250)',
    correctDisplay: '346 (mét)',
    explanation:
      '• Trong tam giác $ABC$, ta có góc $\\widehat{ACB} = \\widehat{CBD} - \\widehat{CAD} = 60^\\circ - 30^\\circ = 30^\\circ$.<br>• Do $\\widehat{CAB} = \\widehat{ACB} = 30^\\circ$ nên tam giác $ABC$ cân tại $B \\implies BC = AB = 400\\text{ m}$.<br>• Trong tam giác vuông $BCD$ tại $D$:$$CD = BC \\cdot \\sin 60^\\circ = 400 \\cdot \\dfrac{\\sqrt{3}}{2} = 200\\sqrt{3} \\approx 346{,}41\\text{ m}.$$Làm tròn đến hàng đơn vị: chiều cao ngọn tháp xấp xỉ $346\\text{ m}$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/m|mét/gi, '').trim();
      return c === '346';
    },
  },
  {
    id: 'sa2',
    number: 14,
    type: 'shortans',
    skill: 'Công thức bao hàm và loại trừ cho ba tập hợp',
    points: 1.0,
    text: 'Một trường đại học thực hiện khảo sát $120$ sinh viên về việc học $3$ ngoại ngữ: Tiếng Anh ($A$), Tiếng Pháp ($P$), và Tiếng Đức ($D$). Kết quả khảo sát ghi nhận: $70$ sinh viên học Tiếng Anh, $50$ sinh viên học Tiếng Pháp, $40$ sinh viên học Tiếng Đức; $25$ sinh viên học cả Anh và Pháp, $15$ sinh viên học cả Pháp và Đức, $20$ sinh viên học cả Anh và Đức; $10$ sinh viên học cả $3$ ngoại ngữ. Hỏi có bao nhiêu sinh viên không học bất kỳ ngoại ngữ nào trong $3$ ngoại ngữ trên?',
    placeholder: 'Nhập số lượng sinh viên (VD: 25)',
    correctDisplay: '10 (sinh viên)',
    explanation:
      '• Áp dụng công thức bao hàm - loại trừ cho 3 tập hợp, số sinh viên học ít nhất một ngoại ngữ là:$$n(A \\cup P \\cup D) = n(A) + n(P) + n(D) - [n(A \\cap P) + n(P \\cap D) + n(A \\cap D)] + n(A \\cap P \\cap D)$$$$n(A \\cup P \\cup D) = 70 + 50 + 40 - (25 + 15 + 20) + 10 = 160 - 60 + 10 = 110\\text{ (sinh viên)}.$$• Số sinh viên không học bất kỳ ngoại ngữ nào trong 3 ngoại ngữ trên là:$$120 - 110 = 10\\text{ (sinh viên)}.$$',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/sinh viên|người/gi, '').trim();
      return c === '10';
    },
  },
  {
    id: 'sa3',
    number: 15,
    type: 'shortans',
    skill: 'Tìm giá trị nhỏ nhất của độ dài vectơ tổng bằng hình học',
    points: 1.0,
    text: 'Cho hình chữ nhật $ABCD$ có $AB = 3$ và $AD = 4$. Gọi $M$ là một điểm di động trên đường chéo $BD$. Tính giá trị nhỏ nhất của biểu thức $T = |\\vec{MB} + \\vec{AD}|$.',
    placeholder: 'Nhập giá trị số (VD: 3.5 hoặc 3,5)',
    correctDisplay: '2,4',
    explanation:
      '• Vì $ABCD$ là hình chữ nhật nên hai vectơ $\\vec{AD}$ và $\\vec{BC}$ cùng hướng và cùng độ dài $\\implies \\vec{AD} = \\vec{BC}$.<br>• Thay vào biểu thức $T$: $T = |\\vec{MB} + \\vec{BC}|$. Theo quy tắc ba điểm: $\\vec{MB} + \\vec{BC} = \\vec{MC} \\implies T = |\\vec{MC}| = MC$.<br>• Để biểu thức $T$ đạt giá trị nhỏ nhất thì độ dài đoạn thẳng $MC$ phải nhỏ nhất. Vì $M$ di động trên đường chéo $BD$ nên $MC$ nhỏ nhất khi và chỉ khi $M$ là hình chiếu vuông góc của $C$ lên đường chéo $BD$ (đường cao $CM$ của tam giác vuông $BCD$ tại $C$).<br>• Tam giác $BCD$ vuông tại $C$ có hai cạnh góc vuông $CB = AD = 4$ và $CD = AB = 3$.<br>Độ dài đường chéo $BD = \\sqrt{CB^2 + CD^2} = \\sqrt{4^2 + 3^2} = 5$.<br>Áp dụng hệ thức lượng trong tam giác vuông:$$CM = \\dfrac{CB \\cdot CD}{BD} = \\dfrac{4 \\cdot 3}{5} = \\dfrac{12}{5} = 2{,}4.$$Vậy giá trị nhỏ nhất của biểu thức $T$ là $2{,}4$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '.').trim();
      return c === '2.4' || c === '12/5';
    },
  },
];

export default function Toan10GiuaKy1DeBPage() {
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
    const ma = maHocSinh.trim() || 'HS10-GK1-DE-B';
    const lop = lopNhom.trim() || 'Lớp 10';

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

    // Chấm Phần I (10 câu MCQ, 0.50đ/câu = 5.0đ)
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
    const p3Score = p3CorrectCount * 1.0;

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
                Phần III: Trả lời ngắn (Câu 13 - 15)
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
            TOÁN 10 • KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ 1 (ĐỀ B)
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
                placeholder="Ví dụ: 10A1-08"
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
                placeholder="Ví dụ: 10A1"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS10-GK1-DE-B'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '10'}</span>
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
              0,50 điểm / câu • 4 lựa chọn (1 đáp án đúng duy nhất)
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
        {/* PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN (03 CÂU - 3,0 ĐIỂM)     */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN (03 CÂU - 3,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              1,00 điểm / câu • Học sinh tự điền kết quả vào ô trống
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
