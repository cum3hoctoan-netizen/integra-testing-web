'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ 1 MÔN TOÁN LỚP 10';
const EXAM_SUBTITLE = 'Chương trình GDPT 2018 - Môn Toán 10';
const EXAM_TIME_NOTE =
  'Thời gian làm bài: 45 phút • Đề thi gồm 10 câu trắc nghiệm ABCD (4,0đ), 02 câu trắc nghiệm Đúng/Sai (4,0đ) và 02 câu trả lời ngắn (2,0đ)';

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

// Thang điểm Bộ GD&ĐT 2025 cho phần Đúng/Sai (tối đa 2.0 điểm/câu, tổng 4.0 điểm)
function calculateTFPoints(correctCount: number): number {
  if (correctCount === 1) return 0.2;
  if (correctCount === 2) return 0.5;
  if (correctCount === 3) return 1.0;
  if (correctCount === 4) return 2.0;
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
    skill: 'Nhận biết mệnh đề toán học',
    points: 0.4,
    text: 'Phát biểu nào sau đây là một mệnh đề toán học?',
    options: [
      { text: 'Phương trình $x^2 - 4 = 0$ có nghiệm hay không?', isCorrect: false },
      { text: 'Với mọi số thực $x$, ta luôn có $x^2 + 1 > 0$', isCorrect: true },
      { text: 'Hãy tính giá trị của biểu thức $P = \\sin 30^\\circ + \\cos 60^\\circ$', isCorrect: false },
      { text: 'Môn Toán lớp 10 rất hay và bổ ích!', isCorrect: false },
    ],
    explanation:
      'Phát biểu "Với mọi số thực $x$, ta luôn có $x^2 + 1 > 0$" là một khẳng định toán học có tính đúng sai rõ ràng (khẳng định đúng), do đó là một mệnh đề toán học. Các câu còn lại là câu hỏi, câu mệnh lệnh và câu cảm thán.',
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Giao của hai tập hợp số (khoảng, nửa khoảng)',
    points: 0.4,
    text: 'Cho hai tập hợp $A = (-3; 2]$ và $B = (0; 5)$. Tập hợp $A \\cap B$ bằng:',
    options: [
      { text: '$(-3; 5)$', isCorrect: false },
      { text: '$(0; 2]$', isCorrect: true },
      { text: '$(-3; 0]$', isCorrect: false },
      { text: '$[2; 5)$', isCorrect: false },
    ],
    explanation:
      'Tập hợp $A \\cap B = \\{x \\in \\mathbb{R} \\mid x \\in (-3; 2] \\text{ và } x \\in (0; 5)\\} = (0; 2]$.',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Kiểm tra nghiệm của bất phương trình bậc nhất hai ẩn',
    points: 0.4,
    text: 'Cặp số $(x; y) = (1; -2)$ là một nghiệm của bất phương trình nào sau đây?',
    options: [
      { text: '$2x + y - 1 > 0$', isCorrect: false },
      { text: '$x - 2y - 3 > 0$', isCorrect: true },
      { text: '$3x + y + 1 < 0$', isCorrect: false },
      { text: '$-x + 3y + 5 > 0$', isCorrect: false },
    ],
    explanation:
      'Thay $(x; y) = (1; -2)$ vào bất phương trình $x - 2y - 3 > 0$, ta được: $1 - 2(-2) - 3 = 2 > 0$ (mệnh đề đúng). Do đó $(1; -2)$ là một nghiệm của bất phương trình $x - 2y - 3 > 0$.',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Biểu diễn hình học miền nghiệm của hệ bất phương trình bậc nhất hai ẩn',
    points: 0.4,
    text: 'Miền nghiệm của hệ bất phương trình $\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ x + y \\le 4 \\end{cases}$ trên mặt phẳng tọa độ $Oxy$ là miền hình phẳng nào?',
    options: [
      { text: 'Miền tam giác bao gồm cả ba cạnh', isCorrect: true },
      { text: 'Miền hình chữ nhật', isCorrect: false },
      { text: 'Miền tứ giác không vuông', isCorrect: false },
      { text: 'Nửa mặt phẳng không chứa gốc tọa độ $O$', isCorrect: false },
    ],
    explanation:
      'Điều kiện $x \\ge 0, y \\ge 0$ giới hạn miền nghiệm thuộc góc phần tư thứ nhất. Đường thẳng $x + y = 4$ cắt $Ox$ tại $(4;0)$ và $Oy$ tại $(0;4)$. Miền nghiệm là hình tam giác vuông $OAB$ với ba đỉnh $O(0;0)$, $A(4;0)$, $B(0;4)$ bao gồm cả các đường biên.',
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Dấu của các giá trị lượng giác của một góc tù',
    points: 0.4,
    text: 'Với góc tù $\\alpha$ ($90^\\circ < \\alpha < 180^\\circ$), khẳng định nào sau đây là **đúng**?',
    options: [
      { text: '$\\sin \\alpha > 0$ và $\\cos \\alpha < 0$', isCorrect: true },
      { text: '$\\sin \\alpha < 0$ và $\\cos \\alpha < 0$', isCorrect: false },
      { text: '$\\sin \\alpha > 0$ và $\\cos \\alpha > 0$', isCorrect: false },
      { text: '$\\sin \\alpha < 0$ và $\\cos \\alpha > 0$', isCorrect: false },
    ],
    explanation:
      'Với góc tù $\\alpha \\in (90^\\circ; 180^\\circ)$, điểm biểu diễn $M(x_0; y_0)$ trên nửa đường tròn đơn vị thuộc góc phần tư thứ II, do đó hoành độ $x_0 = \\cos \\alpha < 0$ và tung độ $y_0 = \\sin \\alpha > 0$.',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Định lý côsin tính độ dài cạnh trong tam giác',
    points: 0.4,
    text: 'Cho tam giác $ABC$ có $b = 8$, $c = 5$ và góc $\\widehat{A} = 60^\\circ$. Độ dài cạnh $a$ bằng:',
    options: [
      { text: '$\\sqrt{129}$', isCorrect: false },
      { text: '$7$', isCorrect: true },
      { text: '$89$', isCorrect: false },
      { text: '$\\sqrt{39}$', isCorrect: false },
    ],
    explanation:
      'Áp dụng Định lý Côsin trong tam giác $ABC$:<br>$$a^2 = b^2 + c^2 - 2bc \\cos A = 8^2 + 5^2 - 2 \\cdot 8 \\cdot 5 \\cdot \\cos 60^\\circ = 64 + 25 - 80 \\cdot \\dfrac{1}{2} = 49.$$<br>Suy ra $a = \\sqrt{49} = 7$.',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Hai vectơ bằng nhau trong hình bình hành',
    points: 0.4,
    text: 'Cho hình bình hành $ABCD$. Vectơ nào sau đây bằng với vectơ $\\vec{AB}$?',
    options: [
      { text: '$\\vec{BA}$', isCorrect: false },
      { text: '$\\vec{CD}$', isCorrect: false },
      { text: '$\\vec{DC}$', isCorrect: true },
      { text: '$\\vec{AC}$', isCorrect: false },
    ],
    explanation:
      'Trong hình bình hành $ABCD$, hai đoạn thẳng $AB$ và $DC$ song song và bằng nhau. Hai vectơ $\\vec{AB}$ và $\\vec{DC}$ cùng hướng và cùng độ dài, do đó $\\vec{AB} = \\vec{DC}$.',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Quy tắc hình bình hành và tính độ dài vectơ tổng',
    points: 0.4,
    text: 'Cho tam giác $ABC$ vuông tại $A$ có $AB = 3$ và $AC = 4$. Độ dài của vectơ tổng $\\vec{AB} + \\vec{AC}$ bằng:',
    options: [
      { text: '$7$', isCorrect: false },
      { text: '$5$', isCorrect: true },
      { text: '$1$', isCorrect: false },
      { text: '$25$', isCorrect: false },
    ],
    explanation:
      'Dựng hình bình hành $ABDC$. Vì $\\widehat{BAC} = 90^\\circ$ nên $ABDC$ là hình chữ nhật.<br>Theo quy tắc hình bình hành: $\\vec{AB} + \\vec{AC} = \\vec{AD}$.<br>Độ dài $|\\vec{AB} + \\vec{AC}| = |\\vec{AD}| = AD = \\sqrt{AB^2 + AC^2} = \\sqrt{3^2 + 4^2} = 5$.',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Phân tích vectơ qua trọng tâm tam giác',
    points: 0.4,
    text: 'Cho tam giác $ABC$ có $G$ là trọng tâm và $M$ là trung điểm của $BC$. Phân tích vectơ $\\vec{AG}$ theo hai vectơ $\\vec{AB}$ và $\\vec{AC}$ ta được:',
    options: [
      { text: '$\\vec{AG} = \\dfrac{1}{2}\\vec{AB} + \\dfrac{1}{2}\\vec{AC}$', isCorrect: false },
      { text: '$\\vec{AG} = \\dfrac{1}{3}\\vec{AB} + \\dfrac{1}{3}\\vec{AC}$', isCorrect: true },
      { text: '$\\vec{AG} = \\vec{AB} + \\vec{AC}$', isCorrect: false },
      { text: '$\\vec{AG} = \\dfrac{2}{3}\\vec{AB} + \\dfrac{2}{3}\\vec{AC}$', isCorrect: false },
    ],
    explanation:
      'Vì $M$ là trung điểm của $BC$ nên $\\vec{AM} = \\dfrac{1}{2}(\\vec{AB} + \\vec{AC})$.<br>Do $G$ là trọng tâm tam giác $ABC$ nên $\\vec{AG} = \\dfrac{2}{3}\\vec{AM} = \\dfrac{2}{3} \\cdot \\dfrac{1}{2}(\\vec{AB} + \\vec{AC}) = \\dfrac{1}{3}\\vec{AB} + \\dfrac{1}{3}\\vec{AC}$.',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Biểu thức tọa độ của tích vô hướng hai vectơ',
    points: 0.4,
    text: 'Trong mặt phẳng tọa độ $Oxy$, cho hai vectơ $\\vec{u} = (2; -1)$ và $\\vec{v} = (3; 4)$. Tích vô hướng $\\vec{u} \\cdot \\vec{v}$ bằng:',
    options: [
      { text: '$10$', isCorrect: false },
      { text: '$2$', isCorrect: true },
      { text: '$-2$', isCorrect: false },
      { text: '$11$', isCorrect: false },
    ],
    explanation:
      'Áp dụng biểu thức tọa độ của tích vô hướng:<br>$$\\vec{u} \\cdot \\vec{v} = x_1 x_2 + y_1 y_2 = 2 \\cdot 3 + (-1) \\cdot 4 = 6 - 4 = 2.$$',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 11,
    type: 'tf',
    skill: 'Quy hoạch tuyến tính: bài toán tối ưu hóa lợi nhuận xưởng may',
    text: 'Một xưởng may sản xuất hai loại sản phẩm $A$ và $B$.<br>• Để sản xuất $1$ sản phẩm loại $A$ cần $2$ giờ may và $1$ giờ hoàn thiện, mang lại lợi nhuận $200.000$ đồng.<br>• Để sản xuất $1$ sản phẩm loại $B$ cần $1$ giờ may và $2$ giờ hoàn thiện, mang lại lợi nhuận $300.000$ đồng.<br>Xưởng có quỹ thời gian tối đa mỗi ngày là $8$ giờ may và $10$ giờ hoàn thiện. Gọi $x, y$ ($x \\ge 0, y \\ge 0$) lần lượt là số sản phẩm $A$ và $B$ xưởng sản xuất trong một ngày. Xét tính đúng/sai của các phát biểu sau:',
    items: [
      {
        key: 'a',
        text: 'Hệ bất phương trình mô tả các điều kiện ràng buộc về thời gian của xưởng là $\\begin{cases} 2x + y \\le 8 \\\\ x + 2y \\le 10 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Miền nghiệm của hệ bất phương trình là miền tứ giác $OABC$ kể cả biên với các đỉnh $O(0;0)$, $A(4;0)$, $B(2;4)$, $C(0;5)$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Nếu xưởng sản xuất $3$ sản phẩm loại $A$ và $2$ sản phẩm loại $B$ trong một ngày thì phương án này không thỏa mãn quy định thời gian của xưởng',
        correct: false,
      },
      {
        key: 'd',
        text: 'Tổng lợi nhuận lớn nhất xưởng có thể đạt được trong một ngày là $1.600.000$ đồng',
        correct: true,
      },
    ],
    explanation:
      '• **a) Đúng.** Ràng buộc thời gian may: $2x + y \\le 8$; thời gian hoàn thiện: $x + 2y \\le 10$; số lượng $x \\ge 0, y \\ge 0$.<br>• **b) Đúng.** Vẽ các đường biên $d_1: 2x + y = 8$ và $d_2: x + 2y = 10$. Giao điểm của $d_1$ và $d_2$ là $B(2;4)$. Miền nghiệm là tứ giác $OABC$ với $O(0;0)$, $A(4;0)$, $B(2;4)$, $C(0;5)$.<br>• **c) Sai.** Với $x = 3, y = 2$: $2(3) + 2 = 8 \\le 8$ và $3 + 2(2) = 7 \\le 10$. Điểm $(3;2)$ thuộc miền nghiệm nên thỏa mãn điều kiện thời gian.<br>• **d) Đúng.** Hàm lợi nhuận $F(x, y) = 200x + 300y$ (nghìn đồng). Tính giá trị tại các đỉnh:<br>$F(O) = 0$; $F(A) = 200(4) = 800$; $F(B) = 200(2) + 300(4) = 1.600$; $F(C) = 300(5) = 1.500$.<br>Vậy lợi nhuận lớn nhất bằng $1.600.000$ đồng khi sản xuất $2$ sản phẩm $A$ và $4$ sản phẩm $B$.',
  },
  {
    id: 'tf2',
    number: 12,
    type: 'tf',
    skill: 'Ứng dụng vectơ và tích vô hướng trong cơ học và tính công',
    text: 'Hai lực $\\vec{F}_1$ và $\\vec{F}_2$ cùng tác dụng vào một vật đặt tại điểm $O$ làm vật chuyển động. Biết độ lớn $F_1 = 60\\text{ N}$, $F_2 = 80\\text{ N}$ và góc tạo bởi hai lực là $\\widehat{(\\vec{F}_1, \\vec{F}_2)} = 90^\\circ$. Gọi $\\vec{F} = \\vec{F}_1 + \\vec{F}_2$ là hợp lực tác dụng lên vật. Xét tính đúng/sai của các khẳng định sau:',
    items: [
      {
        key: 'a',
        text: 'Tích vô hướng của hai lực $\\vec{F}_1 \\cdot \\vec{F}_2 = 0$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Độ lớn của hợp lực $\\vec{F}$ bằng $140\\text{ N}$',
        correct: false,
      },
      {
        key: 'c',
        text: 'Nếu vật dịch chuyển một đoạn $d = 5\\text{ m}$ theo hướng của hợp lực $\\vec{F}$ thì công sinh ra bởi hợp lực $\\vec{F}$ bằng $500\\text{ J}$',
        correct: true,
      },
      {
        key: 'd',
        text: 'Để giữ vật đứng yên ở trạng thái cân bằng, cần tác dụng thêm một lực $\\vec{F}_3$ thỏa mãn $\\vec{F}_3 = \\vec{F}_1 + \\vec{F}_2$',
        correct: false,
      },
    ],
    explanation:
      '• **a) Đúng.** Do $\\vec{F}_1 \\perp \\vec{F}_2 \\implies \\cos 90^\\circ = 0 \\implies \\vec{F}_1 \\cdot \\vec{F}_2 = 0$.<br>• **b) Sai.** Do $\\vec{F}_1 \\perp \\vec{F}_2$ nên $|\\vec{F}| = \\sqrt{F_1^2 + F_2^2} = \\sqrt{60^2 + 80^2} = 100\\text{ N}$.<br>• **c) Đúng.** Công sinh ra bởi hợp lực $A = F \\cdot d \\cdot \\cos 0^\\circ = 100 \\cdot 5 \\cdot 1 = 500\\text{ J}$.<br>• **d) Sai.** Để vật cân bằng thì $\\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 = \\vec{0} \\iff \\vec{F} + \\vec{F}_3 = \\vec{0} \\iff \\vec{F}_3 = -\\vec{F} = -(\\vec{F}_1 + \\vec{F}_2)$. Do đó lực $\\vec{F}_3$ phải ngược hướng với hợp lực $\\vec{F}$.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 13,
    type: 'shortans',
    skill: 'Quy hoạch tuyến tính: tối ưu hóa lợi nhuận nông nghiệp',
    points: 1.0,
    text: 'Một hộ nông dân dự định trồng ngô và đậu xanh trên diện tích tối đa $8\\text{ ha}$. Chi phí trồng $1\\text{ ha}$ ngô là $3\\text{ triệu đồng}$, $1\\text{ ha}$ đậu xanh là $2\\text{ triệu đồng}$. Tổng số vốn dành cho việc trồng trọt tối đa là $18\\text{ triệu đồng}$. Biết lợi nhuận thu được từ $1\\text{ ha}$ ngô là $10\\text{ triệu đồng}$ và từ $1\\text{ ha}$ đậu xanh là $8\\text{ triệu đồng}$. Lợi nhuận lớn nhất mà hộ nông dân có thể thu được bằng bao nhiêu triệu đồng?',
    placeholder: 'Nhập giá trị lợi nhuận (triệu đồng, VD: 54)',
    correctDisplay: '68',
    explanation:
      'Gọi $x, y$ ($x \\ge 0, y \\ge 0$) lần lượt là diện tích (ha) trồng ngô và đậu xanh.<br>Hệ bất phương trình ràng buộc:<br>$$\\begin{cases} x + y \\le 8 \\\\ 3x + 2y \\le 18 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$$<br>Miền nghiệm là tứ giác $OABC$ với $O(0;0)$, $A(6;0)$, $B(2;6)$, $C(0;8)$.<br>Hàm lợi nhuận $F(x, y) = 10x + 8y$ (triệu đồng).<br>Tính giá trị $F(x,y)$ tại 4 đỉnh miền nghiệm:<br>• $F(0,0) = 0$<br>• $F(6,0) = 10(6) + 8(0) = 60$<br>• $F(2,6) = 10(2) + 8(6) = 68$<br>• $F(0,8) = 10(0) + 8(8) = 64$<br>Vậy lợi nhuận lớn nhất hộ nông dân thu được là $68\\text{ triệu đồng}$ khi trồng $2\\text{ ha}$ ngô và $6\\text{ ha}$ đậu xanh.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/triệu( đồng)?/gi, '').trim();
      return c === '68';
    },
  },
  {
    id: 'sa2',
    number: 14,
    type: 'shortans',
    skill: 'Ứng dụng định lý côsin đo khoảng cách không thể trực tiếp tiếp cận',
    points: 1.0,
    text: 'Để xác định khoảng cách giữa hai điểm $A$ và $B$ bị ngăn cách bởi một đầm lầy, người ta chọn một điểm $C$ sao cho từ $C$ có thể quan sát được cả $A$ và $B$. Qua đo đạc thu được kết quả: $CA = 60\\text{ m}$, $CB = 100\\text{ m}$ và góc $\\widehat{ACB} = 120^\\circ$. Khoảng cách $AB$ giữa hai điểm bằng bao nhiêu mét?',
    placeholder: 'Nhập khoảng cách số (mét, VD: 85)',
    correctDisplay: '140',
    explanation:
      'Áp dụng Định lý Côsin trong tam giác $ABC$:<br>$$AB^2 = CA^2 + CB^2 - 2 \\cdot CA \\cdot CB \\cdot \\cos \\widehat{ACB}$$<br>$$AB^2 = 60^2 + 100^2 - 2 \\cdot 60 \\cdot 100 \\cdot \\cos 120^\\circ$$<br>$$AB^2 = 3600 + 10000 - 12000 \\cdot \\left(-\\dfrac{1}{2}\\right) = 13600 + 6000 = 19600.$$<br>Suy ra khoảng cách $AB = \\sqrt{19600} = 140\\text{ m}$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/m|mét$/, '').trim();
      return c === '140';
    },
  },
];

export default function Toan10GiuaHocKy1Page() {
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
    const ma = maHocSinh.trim() || 'HS10-GK1-01';
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

    // Chấm Phần I (10 câu MCQ, 0.4đ/câu = 4.0đ)
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

    // Chấm Phần II (2 bài Đúng/Sai, tối đa 2.0đ/bài = 4.0đ)
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

    // Chấm Phần III (2 câu ngắn, 1.0đ/câu = 2.0đ)
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
              10
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

      {/* DANH SÁCH ĐIỀU HƯỚNG CÂU HỎI (FLOATING PALETTE) */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <details className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm cursor-pointer group">
          <summary className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              Bảng điều hướng câu hỏi ({totalAnswered}/{totalItems} câu đã làm)
            </span>
            <span className="text-xs text-sky-600 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-3 cursor-default">
            {/* Phần I */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase">
                Phần I: Trắc nghiệm 4 lựa chọn (Câu 1 - 10)
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
                  const subCount = ['a', 'b', 'c', 'd'].filter(
                    (k) => subs[k] !== undefined && subs[k] !== null
                  ).length;
                  return (
                    <a
                      key={q.id}
                      href={`#cau-${q.number}`}
                      className={`px-2.5 h-7 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition border ${
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
                Phần III: Trả lời ngắn (Câu 13 - 14)
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
            TOÁN 10 • ĐỀ KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ 1
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
                placeholder="VD: HS10-GK1-001"
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
                placeholder="VD: 10A1"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS10-GK1-01'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '10'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Phần I: <strong>{diemPhan1.toFixed(2)}/4.0đ</strong> ({soCauDungMCQ}/10 câu đúng)</span>
                  <span>Phần II: <strong>{diemPhan2.toFixed(2)}/4.0đ</strong></span>
                  <span>Phần III: <strong>{diemPhan3.toFixed(2)}/2.0đ</strong></span>
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
                        {isStudentCorrect ? `✓ Đúng (+${q.points}đ)` : '✕ Sai (+0.0đ)'}
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
        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (2 BÀI - 4,0 ĐIỂM)          */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-emerald-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (2 BÀI - 4,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-emerald-800/80 px-3 py-1 rounded-full text-emerald-200 font-medium">
              Tối đa 2,0 điểm / bài • 1 ý: 0.2đ | 2 ý: 0.5đ | 3 ý: 1.0đ | 4 ý: 2.0đ
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
                      ? earnedPoints === 2.0
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
                        Tối đa 2.0 điểm
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
        {/* PHẦN III: TRẢ LỜI NGẮN (2 CÂU - 2,0 ĐIỂM)                 */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẢ LỜI NGẮN (2 CÂU - 2,0 ĐIỂM)
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
