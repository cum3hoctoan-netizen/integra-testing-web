'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN ĐỀ THI ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA GIỮA HỌC KỲ I - TOÁN 10 (ĐỀ A)';
const EXAM_SUBTITLE = 'Chương trình GDPT 2018 -- Định hướng phát triển tư duy thực chất';
const EXAM_TIME_NOTE =
  'Thời gian làm bài: 90 phút • Đề thi gồm 20 câu trắc nghiệm ABCD (4,0đ), 08 câu Đúng/Sai (4,0đ) và 03 câu trả lời ngắn (2,0đ)';

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
  points: number;
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

// Thang điểm Bộ GD&ĐT cho phần Đúng/Sai (tối đa 0.50 điểm/câu, tổng 8 câu = 4.0 điểm)
function calculateTFPoints(correctCount: number): number {
  if (correctCount === 1) return 0.05;
  if (correctCount === 2) return 0.125;
  if (correctCount === 3) return 0.25;
  if (correctCount === 4) return 0.5;
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
    skill: 'Mệnh đề phủ định của mệnh đề chứa lượng từ với mọi',
    points: 0.2,
    text: 'Một trạm kiểm soát giao thông đường thủy trên sông Tiền theo dõi vận tốc dòng chảy $v(t)$ (km/h) theo thời gian $t$ (giờ) trong ngày. Xét mệnh đề dự báo thủy văn: $P\\colon ``\\forall t \\in [0; 24], v(t) \\ge 3\'\'$. Mệnh đề phủ định $\\overline{P}$ của mệnh đề $P$ là:',
    options: [
      { text: '$\\exists t \\in [0; 24], v(t) \\le 3$', isCorrect: false },
      { text: '$\\forall t \\in [0; 24], v(t) < 3$', isCorrect: false },
      { text: '$\\exists t \\in [0; 24], v(t) < 3$', isCorrect: true },
      { text: '$\\exists t \\in [0; 24], v(t) > 3$', isCorrect: false },
    ],
    explanation:
      'Mệnh đề phủ định của mệnh đề chứa lượng từ $``\\forall t \\in X, P(t)\'\'$ là $``\\exists t \\in X, \\overline{P(t)}\'\'$.<br>Phủ định của bất đẳng thức $v(t) \\ge 3$ là $v(t) < 3$.<br>Do đó, $\\overline{P}\\colon ``\\exists t \\in [0; 24], v(t) < 3\'\'$.',
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Số phần tử của tập hợp số tự nhiên thỏa mãn phương trình tích',
    points: 0.2,
    text: 'Một bộ vi xử lý IoT lưu trữ các chỉ số thời gian kích hoạt cảm biến độ ẩm đất dưới dạng tập hợp số nguyên $A = \\{t \\in \\mathbb{N} \\mid (3t - 7)(t^2 - 16) = 0\\}$. Số phần tử của tập hợp $A$ là:',
    options: [
      { text: '$3$', isCorrect: false },
      { text: '$1$', isCorrect: true },
      { text: '$2$', isCorrect: false },
      { text: '$0$', isCorrect: false },
    ],
    explanation:
      'Xét phương trình tích trên tập số thực: $$(3t - 7)(t^2 - 16) = 0 \\iff \\left[\\begin{array}{l} 3t - 7 = 0 \\\\ t^2 - 16 = 0 \\end{array}\\right. \\iff \\left[\\begin{array}{l} t = \\dfrac{7}{3} \\\\ t = 4 \\\\ t = -4. \\end{array}\\right.$$ Do điều kiện $t \\in \\mathbb{N}$ (số tự nhiên) nên chỉ có nghiệm $t = 4$ thỏa mãn ($t = \\dfrac{7}{3} \\notin \\mathbb{N}$ và $t = -4 \\notin \\mathbb{N}$).<br>Vậy $A = \\{4\\}$, số phần tử của tập hợp $A$ là $1$.',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Giao của hai tập hợp số thực dạng khoảng - nửa khoảng',
    points: 0.2,
    text: 'Cho hai tập hợp $X = (-3; 5]$ và $Y = [1; 8)$. Tập hợp $X \\cap Y$ bằng:',
    options: [
      { text: '$(-3; 8)$', isCorrect: false },
      { text: '$[1; 5]$', isCorrect: true },
      { text: '$(1; 5]$', isCorrect: false },
      { text: '$[1; 5)$', isCorrect: false },
    ],
    explanation:
      'Giao của hai tập hợp $X$ và $Y$ gồm các phần tử vừa thuộc $X$ vừa thuộc $Y$: $$X \\cap Y = \\{x \\in \\mathbb{R} \\mid -3 < x \\le 5 \\text{ và } 1 \\le x < 8\\} = [1; 5].$$',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Hợp của hai tập hợp số thực bù nhau',
    points: 0.2,
    text: 'Cho tập hợp $E = \\{x \\in \\mathbb{R} \\mid x \\le 4\\}$ và $F = \\{x \\in \\mathbb{R} \\mid x > -1\\}$. Tập hợp $E \\cup F$ là:',
    options: [
      { text: '$(-1; 4]$', isCorrect: false },
      { text: '$(-\\infty; -1)$', isCorrect: false },
      { text: '$\\mathbb{R}$', isCorrect: true },
      { text: '$(4; +\\infty)$', isCorrect: false },
    ],
    explanation:
      'Ta có $E = (-\\infty; 4]$ và $F = (-1; +\\infty)$.<br>Hợp của hai tập hợp là: $$E \\cup F = (-\\infty; 4] \\cup (-1; +\\infty) = (-\\infty; +\\infty) = \\mathbb{R}.$$',
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Xác định điểm thuộc miền nghiệm bất phương trình bậc nhất hai ẩn',
    points: 0.2,
    text: 'Một thiết bị bay tự hành nông nghiệp chỉ được phép hoạt động trong vùng bay an toàn trên mặt phẳng định vị $Oxy$ thỏa mãn bất phương trình bậc nhất hai ẩn $3x - 2y + 6 \\le 0$. Tọa độ nào sau đây là vị trí an toàn cho thiết bị?',
    options: [
      { text: '$(0; 2)$', isCorrect: false },
      { text: '$(1; 3)$', isCorrect: false },
      { text: '$(-1; 1)$', isCorrect: false },
      { text: '$(-3; 0)$', isCorrect: true },
    ],
    explanation:
      'Thay tọa độ từng vị trí vào biểu thức $f(x, y) = 3x - 2y + 6$:<br>• Với $(0; 2)$: $3(0) - 2(2) + 6 = 2 \\nleq 0$ (loại).<br>• Với $(1; 3)$: $3(1) - 2(3) + 6 = 3 \\nleq 0$ (loại).<br>• Với $(-1; 1)$: $3(-1) - 2(1) + 6 = 1 \\nleq 0$ (loại).<br>• Với $(-3; 0)$: $3(-3) - 2(0) + 6 = -3 \\le 0$ (thỏa mãn vùng an toàn).',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Mô tả hình học miền nghiệm của bất phương trình bậc nhất hai ẩn',
    points: 0.2,
    text: 'Trên mặt phẳng tọa độ $Oxy$, miền nghiệm của bất phương trình $2x - 3y \\ge -6$ là nửa mặt phẳng:',
    options: [
      { text: 'Không tính bờ và chứa gốc tọa độ $O(0; 0)$', isCorrect: false },
      {
        text: 'Tính cả bờ là đường thẳng $2x - 3y = -6$ và chứa gốc tọa độ $O(0; 0)$',
        isCorrect: true,
      },
      { text: 'Tính cả bờ và không chứa gốc tọa độ $O(0; 0)$', isCorrect: false },
      { text: 'Không tính bờ và chứa điểm $M(-4; 0)$', isCorrect: false },
    ],
    explanation:
      'Thay tọa độ gốc $O(0; 0)$ vào bất phương trình: $2(0) - 3(0) = 0 \\ge -6$ (mệnh đề đúng).<br>Bất phương trình có dấu $\\ge$ nên miền nghiệm tính cả bờ là đường thẳng $d\\colon 2x - 3y = -6$.<br>Do đó miền nghiệm là nửa mặt phẳng có bờ là đường thẳng $2x - 3y = -6$ và chứa gốc tọa độ $O(0; 0)$.',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Nhận diện hệ bất phương trình bậc nhất hai ẩn',
    points: 0.2,
    text: 'Trong việc phân tích luồng dữ liệu mạng, hệ điều kiện nào sau đây mô tả một hệ bất phương trình bậc nhất hai ẩn đối với hai biến lưu lượng $x$ và $y$?',
    options: [
      { text: '$\\begin{cases} 2x + 3y \\le 6 \\\\ x^2 - y > 0 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} 4x - y \\ge 1 \\\\ 3xy + 5 \\le 0 \\end{cases}$', isCorrect: false },
      {
        text: '$\\begin{cases} 2x - 5y + 10 \\ge 0 \\\\ 3x + y - 6 < 0 \\end{cases}$',
        isCorrect: true,
      },
      { text: '$\\begin{cases} x - \\dfrac{2}{y} < 4 \\\\ 5x + y \\ge 2 \\end{cases}$', isCorrect: false },
    ],
    explanation:
      'Hệ bất phương trình bậc nhất hai ẩn là hệ gồm hai hay nhiều bất phương trình bậc nhất hai ẩn đối với hai biến $x, y$, mỗi bất phương trình có bậc cao nhất của từng biến là 1, không chứa tích của hai biến và không chứa biến dưới mẫu thức.<br>Do đó chỉ có hệ $\\begin{cases} 2x - 5y + 10 \\ge 0 \\\\ 3x + y - 6 < 0 \\end{cases}$ thỏa mãn định nghĩa.',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Tính diện tích miền nghiệm của hệ bất phương trình',
    points: 0.2,
    text: 'Miền nghiệm của hệ bất phương trình $\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ 2x + y \\le 6 \\end{cases}$ trên mặt phẳng tọa độ $Oxy$ là một miền đa giác có diện tích bằng:',
    options: [
      { text: '$18$', isCorrect: false },
      { text: '$9$', isCorrect: true },
      { text: '$6$', isCorrect: false },
      { text: '$12$', isCorrect: false },
    ],
    explanation:
      'Miền nghiệm là tam giác vuông $OAB$ giới hạn bởi trục hoành $Ox$ ($y = 0$), trục tung $Oy$ ($x = 0$) và đường thẳng $2x + y = 6$.<br>Giao điểm với trục hoành: $y = 0 \\implies 2x = 6 \\implies x = 3 \\implies A(3; 0)$.<br>Giao điểm với trục tung: $x = 0 \\implies y = 6 \\implies B(0; 6)$.<br>Diện tích tam giác vuông là: $$S = \\dfrac{1}{2} \\cdot OA \\cdot OB = \\dfrac{1}{2} \\cdot 3 \\cdot 6 = 9.$$',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Giá trị lượng giác của hai góc bù nhau',
    points: 0.2,
    text: 'Cho góc nhọn $\\alpha$ thỏa mãn $0^\\circ < \\alpha < 90^\\circ$. Đẳng thức lượng giác nào sau đây là khẳng định sai?',
    options: [
      { text: '$\\sin(180^\\circ - \\alpha) = \\sin \\alpha$', isCorrect: false },
      { text: '$\\cos(180^\\circ - \\alpha) = -\\cos \\alpha$', isCorrect: false },
      { text: '$\\tan(180^\\circ - \\alpha) = \\tan \\alpha$', isCorrect: true },
      { text: '$\\cot(180^\\circ - \\alpha) = -\\cot \\alpha$', isCorrect: false },
    ],
    explanation:
      'Theo tính chất giá trị lượng giác của hai góc bù nhau trên nửa đường tròn đơn vị: $$\\sin(180^\\circ - \\alpha) = \\sin \\alpha; \\quad \\cos(180^\\circ - \\alpha) = -\\cos \\alpha;$$ $$\\tan(180^\\circ - \\alpha) = -\\tan \\alpha; \\quad \\cot(180^\\circ - \\alpha) = -\\cot \\alpha.$$ Do đó khẳng định $\\tan(180^\\circ - \\alpha) = \\tan \\alpha$ là khẳng định sai.',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Hệ quả định lí côsin tính cosin của một góc trong tam giác',
    points: 0.2,
    text: 'Một mái che hình tam giác $ABC$ có độ dài ba thanh dầm thép lần lượt là $a = 7\\text{ m}$, $b = 5\\text{ m}$, $c = 8\\text{ m}$. Giá trị của $\\cos A$ bằng:',
    options: [
      { text: '$\\dfrac{1}{4}$', isCorrect: false },
      { text: '$\\dfrac{1}{2}$', isCorrect: true },
      { text: '$\\dfrac{\\sqrt{3}}{2}$', isCorrect: false },
      { text: '$\\dfrac{11}{14}$', isCorrect: false },
    ],
    explanation:
      'Áp dụng hệ quả của định lí côsin trong tam giác $ABC$: $$\\cos A = \\dfrac{b^2 + c^2 - a^2}{2bc} = \\dfrac{5^2 + 8^2 - 7^2}{2 \\cdot 5 \\cdot 8} = \\dfrac{25 + 64 - 49}{80} = \\dfrac{40}{80} = \\dfrac{1}{2}.$$',
  },
  {
    id: 'mcq11',
    number: 11,
    type: 'mcq',
    skill: 'Công thức tính diện tích tam giác theo hai cạnh và sin góc xen giữa',
    points: 0.2,
    text: 'Cho tam giác $ABC$ có cạnh $b = 6$, $c = 8$ và góc kẹp giữa $\\widehat{A} = 30^\\circ$. Diện tích của tam giác $ABC$ bằng:',
    options: [
      { text: '$24$', isCorrect: false },
      { text: '$12$', isCorrect: true },
      { text: '$12\\sqrt{3}$', isCorrect: false },
      { text: '$6$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức tính diện tích tam giác theo hai cạnh và góc xen giữa: $$S = \\dfrac{1}{2}bc\\sin A = \\dfrac{1}{2} \\cdot 6 \\cdot 8 \\cdot \\sin 30^\\circ = 24 \\cdot 0{,}5 = 12.$$',
  },
  {
    id: 'mcq12',
    number: 12,
    type: 'mcq',
    skill: 'Định lí sin tính bán kính đường tròn ngoại tiếp tam giác',
    points: 0.2,
    text: 'Cho tam giác $ABC$ có cạnh $a = 10$ và góc đối diện $\\widehat{A} = 45^\\circ$. Bán kính $R$ của đường tròn ngoại tiếp tam giác $ABC$ bằng:',
    options: [
      { text: '$5$', isCorrect: false },
      { text: '$5\\sqrt{2}$', isCorrect: true },
      { text: '$10\\sqrt{2}$', isCorrect: false },
      { text: '$10$', isCorrect: false },
    ],
    explanation:
      'Áp dụng định lí sin trong tam giác $ABC$: $$\\dfrac{a}{\\sin A} = 2R \\implies 2R = \\dfrac{10}{\\sin 45^\\circ} = \\dfrac{10}{\\frac{\\sqrt{2}}{2}} = 10\\sqrt{2} \\implies R = 5\\sqrt{2}.$$',
  },
  {
    id: 'mcq13',
    number: 13,
    type: 'mcq',
    skill: 'Khái niệm vectơ độ dời và độ dài của vectơ',
    points: 0.2,
    text: 'Một cánh tay robot chuyển hàng di chuyển trên đường ray từ trạm $A$ đến trạm $B$ cách nhau $8\\text{ m}$. Xét vectơ độ dời $\\vec{AB}$. Khẳng định nào sau đây là khẳng định đúng?',
    options: [
      { text: 'Vectơ $\\vec{AB}$ có điểm đầu là $B$ và điểm cuối là $A$', isCorrect: false },
      { text: 'Độ dài của vectơ $\\vec{AB}$ là $|\\vec{AB}| = 8\\text{ m}$', isCorrect: true },
      { text: 'Vectơ $\\vec{AB}$ bằng vectơ $\\vec{BA}$', isCorrect: false },
      { text: 'Giá của vectơ $\\vec{AB}$ vuông góc với đường ray $AB$', isCorrect: false },
    ],
    explanation:
      '• Vectơ $\\vec{AB}$ có điểm đầu là $A$ và điểm cuối là $B$.<br>• Độ dài của vectơ $\\vec{AB}$ là khoảng cách giữa điểm đầu và điểm cuối: $|\\vec{AB}| = AB = 8\\text{ m}$.<br>• Hai vectơ $\\vec{AB}$ và $\\vec{BA}$ ngược hướng nhau nên $\\vec{AB} \\ne \\vec{BA}$.<br>• Giá của vectơ $\\vec{AB}$ là đường thẳng trùng với đường ray nối $A$ và $B$.',
  },
  {
    id: 'mcq14',
    number: 14,
    type: 'mcq',
    skill: 'Quy tắc ba điểm đối với phép cộng vectơ',
    points: 0.2,
    text: 'Cho ba điểm $M, N, P$ bất kỳ trên mặt phẳng. Khẳng định nào sau đây luôn đúng theo quy tắc ba điểm?',
    options: [
      { text: '$\\vec{MN} + \\vec{NP} = \\vec{PM}$', isCorrect: false },
      { text: '$\\vec{MN} + \\vec{NP} = \\vec{MP}$', isCorrect: true },
      { text: '$\\vec{MN} - \\vec{PN} = \\vec{PM}$', isCorrect: false },
      { text: '$\\vec{NM} + \\vec{NP} = \\vec{MP}$', isCorrect: false },
    ],
    explanation:
      'Theo quy tắc ba điểm đối với phép cộng vectơ: Với ba điểm $M, N, P$ tùy ý, ta luôn có $\\vec{MN} + \\vec{NP} = \\vec{MP}$.',
  },
  {
    id: 'mcq15',
    number: 15,
    type: 'mcq',
    skill: 'Tính chất tâm đối xứng của hình bình hành và tổng hai vectơ đối',
    points: 0.2,
    text: 'Cho hình bình hành $ABCD$ tâm $O$. Đẳng thức vectơ nào sau đây là đẳng thức đúng?',
    options: [
      { text: '$\\vec{AB} + \\vec{AD} = \\vec{BD}$', isCorrect: false },
      { text: '$\\vec{BA} - \\vec{BC} = \\vec{AC}$', isCorrect: false },
      { text: '$\\vec{OA} + \\vec{OC} = \\vec{0}$', isCorrect: true },
      { text: '$\\vec{AO} + \\vec{CO} = \\vec{AC}$', isCorrect: false },
    ],
    explanation:
      'Vì $ABCD$ là hình bình hành nên tâm $O$ là trung điểm của đường chéo $AC$. Do đó hai vectơ $\\vec{OA}$ và $\\vec{OC}$ là hai vectơ đối nhau, suy ra $\\vec{OA} + \\vec{OC} = \\vec{0}$.',
  },
  {
    id: 'mcq16',
    number: 16,
    type: 'mcq',
    skill: 'Tính chất trung điểm đoạn thẳng dưới dạng vectơ',
    points: 0.2,
    text: 'Cho đoạn thẳng $AB$ có độ dài bằng $10\\text{ cm}$ và điểm $I$ là trung điểm của $AB$. Khẳng định nào sau đây là khẳng định sai?',
    options: [
      { text: '$\\vec{IA} + \\vec{IB} = \\vec{0}$', isCorrect: false },
      { text: '$|\\vec{IA}| = 5\\text{ cm}$', isCorrect: false },
      { text: '$\\vec{IA} = \\vec{IB}$', isCorrect: true },
      { text: '$\\vec{AB} = 2\\vec{IB}$', isCorrect: false },
    ],
    explanation:
      'Vì $I$ là trung điểm của $AB$ nên hai vectơ $\\vec{IA}$ và $\\vec{IB}$ cùng độ dài nhưng ngược hướng nhau. Do đó $\\vec{IA} = -\\vec{IB} \\ne \\vec{IB}$. Khẳng định $\\vec{IA} = \\vec{IB}$ là sai.',
  },
  {
    id: 'mcq17',
    number: 17,
    type: 'mcq',
    skill: 'Dấu của các giá trị lượng giác của góc tù',
    points: 0.2,
    text: 'Cho góc $\\alpha$ thỏa mãn $90^\\circ < \\alpha < 180^\\circ$. Dấu của các giá trị lượng giác $\\sin \\alpha$ và $\\cos \\alpha$ lần lượt là:',
    options: [
      { text: '$\\sin \\alpha > 0, \\cos \\alpha > 0$', isCorrect: false },
      { text: '$\\sin \\alpha > 0, \\cos \\alpha < 0$', isCorrect: true },
      { text: '$\\sin \\alpha < 0, \\cos \\alpha < 0$', isCorrect: false },
      { text: '$\\sin \\alpha < 0, \\cos \\alpha > 0$', isCorrect: false },
    ],
    explanation:
      'Trên nửa đường tròn đơn vị, với điểm $M(x_0; y_0)$ biểu diễn góc tù $\\alpha$ ($90^\\circ < \\alpha < 180^\\circ$), điểm $M$ thuộc góc phần tư thứ II nên có tung độ $y_0 > 0$ và hoành độ $x_0 < 0$. Do đó $\\sin \\alpha = y_0 > 0$ và $\\cos \\alpha = x_0 < 0$.',
  },
  {
    id: 'mcq18',
    number: 18,
    type: 'mcq',
    skill: 'Độ dài vectơ tổng hai cạnh kề của hình vuông',
    points: 0.2,
    text: 'Cho hình vuông $ABCD$ cạnh $a$. Độ dài của vectơ tổng $\\vec{AB} + \\vec{AD}$ bằng:',
    options: [
      { text: '$2a$', isCorrect: false },
      { text: '$a$', isCorrect: false },
      { text: '$a\\sqrt{2}$', isCorrect: true },
      { text: '$\\dfrac{a\\sqrt{2}}{2}$', isCorrect: false },
    ],
    explanation:
      'Theo quy tắc hình bình hành: $\\vec{AB} + \\vec{AD} = \\vec{AC}$.<br>Độ dài vectơ tổng là: $|\\vec{AB} + \\vec{AD}| = |\\vec{AC}| = AC$.<br>Trong hình vuông cạnh $a$, đường chéo $AC = a\\sqrt{2}$. Do đó $|\\vec{AB} + \\vec{AD}| = a\\sqrt{2}$.',
  },
  {
    id: 'mcq19',
    number: 19,
    type: 'mcq',
    skill: 'Độ dài vectơ hiệu hai cạnh trong tam giác đều',
    points: 0.2,
    text: 'Cho tam giác đều $ABC$ cạnh bằng $6$. Độ dài của vectơ hiệu $\\vec{AB} - \\vec{AC}$ bằng:',
    options: [
      { text: '$3$', isCorrect: false },
      { text: '$6$', isCorrect: true },
      { text: '$6\\sqrt{3}$', isCorrect: false },
      { text: '$3\\sqrt{3}$', isCorrect: false },
    ],
    explanation:
      'Theo quy tắc hiệu hai vectơ chung gốc: $\\vec{AB} - \\vec{AC} = \\vec{CB}$.<br>Độ dài của vectơ hiệu là: $|\\vec{AB} - \\vec{AC}| = |\\vec{CB}| = CB$.<br>Vì tam giác $ABC$ đều cạnh bằng $6$ nên $CB = 6$. Vậy $|\\vec{AB} - \\vec{AC}| = 6$.',
  },
  {
    id: 'mcq20',
    number: 20,
    type: 'mcq',
    skill: 'Tính chất vectơ trọng tâm tam giác',
    points: 0.2,
    text: 'Cho tam giác $ABC$ có trọng tâm $G$. Khẳng định vectơ nào sau đây luôn đúng?',
    options: [
      { text: '$\\vec{GA} + \\vec{GB} + \\vec{GC} = \\vec{AB}$', isCorrect: false },
      { text: '$\\vec{GA} + \\vec{GB} + \\vec{GC} = \\vec{0}$', isCorrect: true },
      { text: '$\\vec{AG} + \\vec{BG} + \\vec{CG} = 3\\vec{GA}$', isCorrect: false },
      { text: '$\\vec{GA} = \\vec{GB} = \\vec{GC}$', isCorrect: false },
    ],
    explanation:
      'Theo tính chất trọng tâm của tam giác, điểm $G$ là trọng tâm của tam giác $ABC$ khi và chỉ khi $\\vec{GA} + \\vec{GB} + \\vec{GC} = \\vec{0}$.',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 21,
    type: 'tf',
    skill: 'Quy hoạch tuyến tính: tối ưu hóa lợi nhuận sản xuất thiết bị giáo dục STEM',
    points: 0.5,
    text: 'Một phân xưởng chế tạo mô hình thiết bị giáo dục STEM của Integra Tech sản xuất hai dòng sản phẩm: Bộ thí nghiệm cơ học (sản phẩm I) và Bộ thí nghiệm quang học (sản phẩm II). Để sản xuất 1 bộ sản phẩm I cần $2\\text{ giờ}$ in 3D và $1\\text{ giờ}$ kiểm thử cảm biến. Để sản xuất 1 bộ sản phẩm II cần $1\\text{ giờ}$ in 3D và $2\\text{ giờ}$ kiểm thử cảm biến. Tổng quỹ thời gian máy in 3D hoạt động không quá $100\\text{ giờ}$ và thời gian trạm kiểm thử cảm biến không quá $80\\text{ giờ}$ trong một chu kỳ kế hoạch. Lợi nhuận mang lại là $120$ nghìn đồng cho mỗi bộ sản phẩm I và $100$ nghìn đồng cho mỗi bộ sản phẩm II. Gọi $x, y$ lần lượt là số lượng bộ sản phẩm I và sản phẩm II mà phân xưởng sản xuất ($x \\ge 0, y \\ge 0$).',
    items: [
      {
        key: 'a',
        text: 'Hệ bất phương trình mô tả các điều kiện ràng buộc kỹ thuật của phân xưởng là $\\begin{cases} 2x + y \\le 100 \\\\ x + 2y \\le 80 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Phân xưởng có thể sản xuất đồng thời 30 bộ sản phẩm I và 20 bộ sản phẩm II mà không vi phạm giới hạn quỹ thời gian',
        correct: true,
      },
      {
        key: 'c',
        text: 'Nếu chỉ tập trung sản xuất dòng sản phẩm II thì số lượng tối đa xưởng có thể đạt được là 80 bộ',
        correct: false,
      },
      {
        key: 'd',
        text: 'Lợi nhuận lớn nhất phân xưởng có thể đạt được là $6\\,800\\,000$ đồng khi sản xuất 40 bộ sản phẩm I và 20 bộ sản phẩm II',
        correct: true,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Ràng buộc thời gian in 3D: $2x + y \\le 100$. Ràng buộc thời gian kiểm thử: $x + 2y \\le 80$. Điều kiện số lượng không âm: $x \\ge 0, y \\ge 0$.<br>• <strong>b) Đúng.</strong> Thay $(x; y) = (30; 20)$ vào hệ ràng buộc: $$2(30) + 20 = 80 \\le 100; \\quad 30 + 2(20) = 70 \\le 80.$$ Điểm $(30; 20)$ thuộc miền nghiệm của hệ.<br>• <strong>c) Sai.</strong> Khi chỉ sản xuất dòng sản phẩm II ($x = 0$), thời gian kiểm thử ràng buộc: $2y \\le 80 \\implies y \\le 40$. Do đó sản lượng tối đa của sản phẩm II chỉ là 40 bộ, không thể đạt 80 bộ.<br>• <strong>d) Đúng.</strong> Miền nghiệm là tứ giác $OACB$ với các đỉnh $O(0; 0)$, $A(50; 0)$, $B(0; 40)$ và $C(40; 20)$ (giao điểm của $2x + y = 100$ và $x + 2y = 80$).<br>Hàm lợi nhuận: $F(x, y) = 120x + 100y$ (nghìn đồng).<br>- Tại $O(0; 0)\\colon F = 0$.<br>- Tại $A(50; 0)\\colon F = 120(50) = 6000$ (nghìn đồng).<br>- Tại $B(0; 40)\\colon F = 100(40) = 4000$ (nghìn đồng).<br>- Tại $C(40; 20)\\colon F = 120(40) + 100(20) = 4800 + 2000 = 6800$ (nghìn đồng) = $6\\,800\\,000$ đồng.<br>Vậy lợi nhuận lớn nhất là $6\\,800\\,000$ đồng khi sản xuất 40 bộ loại I và 20 bộ loại II.',
  },
  {
    id: 'tf2',
    number: 22,
    type: 'tf',
    skill: 'Ứng dụng giải tam giác xác định chiều cao tháp truyền hình ven sông',
    points: 0.5,
    text: 'Để xác định chiều cao dựng đứng $CD$ của một tháp ăng-ten truyền hình ven sông mà chân tháp $D$ không thể tiếp cận trực tiếp do cách một đầm lầy, các kỹ sư địa chính thiết lập hai điểm đo đạc $A$ và $B$ thẳng hàng với chân tháp $D$ trên mặt đất bằng phẳng sao cho khoảng cách $AB = 50\\text{ m}$ ($B$ nằm giữa $A$ và $D$). Từ $A$ và $B$, người ta dùng giác kế đo được góc nâng lên đỉnh tháp $C$ lần lượt là $\\widehat{CAD} = 30^\\circ$ và $\\widehat{CBD} = 45^\\circ$.',
    items: [
      {
        key: 'a',
        text: 'Số đo góc ngắm lệch đỉnh $\\widehat{ACB}$ bằng $15^\\circ$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Tam giác $BCD$ là tam giác vuông cân tại chân tháp $D$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Khoảng cách ngắm trực tiếp từ điểm $B$ đến đỉnh tháp $C$ là $25\\sqrt{6}\\text{ m}$',
        correct: false,
      },
      {
        key: 'd',
        text: 'Chiều cao $CD$ của tháp ăng-ten sau khi làm tròn đến hàng phần mười là $68{,}3\\text{ m}$',
        correct: true,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Do ba điểm $A, B, D$ thẳng hàng và $B$ nằm giữa $A$ và $D$, góc ngoài tam giác $ABC$ tại đỉnh $B$ là $\\widehat{CBD} = \\widehat{CAB} + \\widehat{ACB} \\implies \\widehat{ACB} = 45^\\circ - 30^\\circ = 15^\\circ$.<br>• <strong>b) Đúng.</strong> Do tháp truyền hình thẳng đứng nên $CD \\perp AD \\implies \\triangle BCD$ vuông tại $D$. Kết hợp với $\\widehat{CBD} = 45^\\circ$, ta suy ra tam giác $BCD$ vuông cân tại $D$ ($BD = CD$).<br>• <strong>c) Sai.</strong> Áp dụng định lí sin trong tam giác $ABC$: $$\\dfrac{BC}{\\sin \\widehat{BAC}} = \\dfrac{AB}{\\sin \\widehat{ACB}} \\implies BC = \\dfrac{50 \\cdot \\sin 30^\\circ}{\\sin 15^\\circ} = \\dfrac{50 \\cdot 0{,}5}{\\frac{\\sqrt{6} - \\sqrt{2}}{4}} = \\dfrac{100}{\\sqrt{6} - \\sqrt{2}} = 25(\\sqrt{6} + \\sqrt{2})\\text{ m}.$$<br>• <strong>d) Đúng.</strong> Xét tam giác vuông $BCD$: $$CD = BC \\cdot \\sin \\widehat{CBD} = 25(\\sqrt{6} + \\sqrt{2}) \\cdot \\sin 45^\\circ = 25(\\sqrt{6} + \\sqrt{2}) \\cdot \\dfrac{\\sqrt{2}}{2} = 25(\\sqrt{3} + 1) \\approx 68{,}30\\text{ m}.$$ Làm tròn đến hàng phần mười ta được kết quả là $68{,}3\\text{ m}$.',
  },
  {
    id: 'tf3',
    number: 23,
    type: 'tf',
    skill: 'Tìm tham số thực liên quan đến quan hệ tập hợp chứa ẩn m',
    points: 0.5,
    text: 'Cho hai tập hợp $A = [-4; 3)$ và $B = (m - 1; m + 5]$ với $m$ là tham số thực.',
    items: [
      {
        key: 'a',
        text: 'Khi $m = 0$, tập hợp $B$ là $(-1; 5]$ và $A \\cap B = (-1; 3)$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Khi $m = 2$, tập hợp $A \\cup B = [-4; 7]$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Tập hợp $A \\setminus B$ luôn là tập hợp rỗng với mọi giá trị của tham số $m$',
        correct: false,
      },
      {
        key: 'd',
        text: 'Để $A \\subset B$ thì điều kiện cần và đủ của tham số $m$ là $-2 \\le m < -3$ (không tồn tại giá trị $m$ nào)',
        correct: true,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Khi $m = 0 \\implies B = (-1; 5]$. Giao của hai tập hợp là $A \\cap B = [-4; 3) \\cap (-1; 5] = (-1; 3)$.<br>• <strong>b) Đúng.</strong> Khi $m = 2 \\implies B = (1; 7]$. Hợp của hai tập hợp là $A \\cup B = [-4; 3) \\cup (1; 7] = [-4; 7]$.<br>• <strong>c) Sai.</strong> Ví dụ khi $m = 0$, $A \\setminus B = [-4; 3) \\setminus (-1; 5] = [-4; -1] \\ne \\emptyset$.<br>• <strong>d) Đúng.</strong> Điều kiện để $A \\subset B$: $$\\begin{cases} m - 1 < -4 \\\\ m + 5 \\ge 3 \\end{cases} \\iff \\begin{cases} m < -3 \\\\ m \\ge -2 \\end{cases} \\implies m \\in \\emptyset.$$ Vậy không tồn tại giá trị $m$ để $A \\subset B$.',
  },
  {
    id: 'tf4',
    number: 24,
    type: 'tf',
    skill: 'Miền quy hoạch và tối ưu hóa công suất phát điện trên hệ bất phương trình',
    points: 0.5,
    text: 'Một cánh đồng pin mặt trời được quy hoạch trên vùng mặt phẳng tọa độ $Oxy$ xác định bởi hệ bất phương trình bậc nhất hai ẩn $\\begin{cases} x - y \\le 2 \\\\ x + 2y \\le 8 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$.',
    items: [
      {
        key: 'a',
        text: 'Điểm $P(2; 1)$ nằm trong vùng quy hoạch pin mặt trời',
        correct: true,
      },
      {
        key: 'b',
        text: 'Miền quy hoạch là một miền tứ giác lồi',
        correct: true,
      },
      {
        key: 'c',
        text: 'Diện tích của vùng quy hoạch bằng $18$ (đơn vị diện tích)',
        correct: false,
      },
      {
        key: 'd',
        text: 'Giá trị lớn nhất của hàm công suất phát điện $F(x, y) = 3x + 4y$ trên vùng quy hoạch là $20$',
        correct: true,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Thay $(x; y) = (2; 1)$ vào hệ: $2 - 1 = 1 \\le 2$; $2 + 2(1) = 4 \\le 8$; $2 \\ge 0, 1 \\ge 0$ (thỏa mãn).<br>• <strong>b) Đúng.</strong> Miền nghiệm là tứ giác $OABC$ với $O(0; 0)$, $A(2; 0)$ (giao của $x - y = 2$ với trục hoành), $B(4; 2)$ (giao của $x - y = 2$ và $x + 2y = 8$), $C(0; 4)$ (giao của $x + 2y = 8$ với trục tung).<br>• <strong>c) Sai.</strong> Chia tứ giác thành hai tam giác $\\triangle OAC$ và $\\triangle ABC$. Diện tích $S = S_{\\triangle OAC} + S_{\\triangle ABC} = \\dfrac{1}{2} \\cdot 2 \\cdot 4 + \\dfrac{1}{2} \\cdot 2 \\cdot 6 = 4 + 6 = 10 \\ne 18$.<br>• <strong>d) Đúng.</strong> Tính giá trị hàm mục tiêu $F(x, y) = 3x + 4y$ tại các đỉnh:<br>- Tại $O(0; 0)\\colon F = 0$.<br>- Tại $A(2; 0)\\colon F = 3(2) + 4(0) = 6$.<br>- Tại $B(4; 2)\\colon F = 3(4) + 4(2) = 12 + 8 = 20$.<br>- Tại $C(0; 4)\\colon F = 3(0) + 4(4) = 16$.<br>Vậy giá trị lớn nhất là $20$ tại đỉnh $B(4; 2)$.',
  },
  {
    id: 'tf5',
    number: 25,
    type: 'tf',
    skill: 'Tính toán các yếu tố trong tam giác: cosin, diện tích, bán kính nội tiếp',
    points: 0.5,
    text: 'Cho tam giác $ABC$ có độ dài các cạnh $a = 6, b = 7, c = 8$. Kí hiệu $S, R, r, p$ lần lượt là diện tích, bán kính đường tròn ngoại tiếp, bán kính đường tròn nội tiếp và nửa chu vi của tam giác $ABC$.',
    items: [
      {
        key: 'a',
        text: 'Nửa chu vi của tam giác $ABC$ là $p = 10{,}5$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Góc lớn nhất của tam giác $ABC$ là góc $\\widehat{C}$ và có $\\cos C = \\dfrac{1}{4}$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Diện tích của tam giác $ABC$ tính chính xác là $21\\sqrt{15}$',
        correct: false,
      },
      {
        key: 'd',
        text: 'Bán kính đường tròn nội tiếp của tam giác $ABC$ là $r = \\dfrac{\\sqrt{15}}{2}$',
        correct: true,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Nửa chu vi $p = \\dfrac{a + b + c}{2} = \\dfrac{6 + 7 + 8}{2} = \\dfrac{21}{2} = 10{,}5$.<br>• <strong>b) Đúng.</strong> Trong tam giác, cạnh đối diện lớn nhất là cạnh $c = 8$, nên góc lớn nhất là góc $\\widehat{C}$. Áp dụng hệ quả định lí côsin: $$\\cos C = \\dfrac{a^2 + b^2 - c^2}{2ab} = \\dfrac{6^2 + 7^2 - 8^2}{2 \\cdot 6 \\cdot 7} = \\dfrac{36 + 49 - 64}{84} = \\dfrac{21}{84} = \\dfrac{1}{4}.$$<br>• <strong>c) Sai.</strong> Ta có $\\sin C = \\sqrt{1 - \\cos^2 C} = \\sqrt{1 - \\left(\\dfrac{1}{4}\\right)^2} = \\dfrac{\\sqrt{15}}{4}$. Diện tích tam giác $ABC$: $$S = \\dfrac{1}{2}ab\\sin C = \\dfrac{1}{2} \\cdot 6 \\cdot 7 \\cdot \\dfrac{\\sqrt{15}}{4} = \\dfrac{21\\sqrt{15}}{4} \\ne 21\\sqrt{15}.$$<br>• <strong>d) Đúng.</strong> Áp dụng công thức $S = pr \\implies r = \\dfrac{S}{p} = \\dfrac{\\frac{21\\sqrt{15}}{4}}{\\frac{21}{2}} = \\dfrac{\\sqrt{15}}{2}$.',
  },
  {
    id: 'tf6',
    number: 26,
    type: 'tf',
    skill: 'Tổng hợp lực và tính độ lớn vectơ lực kéo sà lan trên sông',
    points: 0.5,
    text: 'Một sà lan vận tải di chuyển trên sông chịu tác động đồng thời của hai lực kéo: lực $\\vec{F}_1$ từ ca-nô 1 có độ lớn $4000\\text{ N}$ và lực $\\vec{F}_2$ từ ca-nô 2 có độ lớn $3000\\text{ N}$. Góc tạo bởi phương kéo của hai ca-nô là $\\alpha = (\\vec{F}_1, \\vec{F}_2) = 60^\\circ$. Gọi $\\vec{F} = \\vec{F}_1 + \\vec{F}_2$ là lực tổng hợp tác dụng lên sà lan.',
    items: [
      {
        key: 'a',
        text: 'Khi hai ca-nô kéo cùng hướng ($\\alpha = 0^\\circ$), độ lớn lực tổng hợp là $7000\\text{ N}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Khi hai ca-nô kéo vuông góc với nhau ($\\alpha = 90^\\circ$), độ lớn lực tổng hợp là $5000\\text{ N}$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Khi góc kéo giữa hai ca-nô là $60^\\circ$, độ lớn lực tổng hợp là $1000\\sqrt{13}\\text{ N}$',
        correct: false,
      },
      {
        key: 'd',
        text: 'Với góc $\\alpha = 60^\\circ$, độ lớn lực tổng hợp xấp xỉ bằng $6083\\text{ N}$',
        correct: true,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Khi $\\alpha = 0^\\circ$, hai vectơ cùng hướng: $|\\vec{F}| = |\\vec{F}_1| + |\\vec{F}_2| = 4000 + 3000 = 7000\\text{ N}$.<br>• <strong>b) Đúng.</strong> Khi $\\alpha = 90^\\circ$, hai vectơ vuông góc: $|\\vec{F}| = \\sqrt{|\\vec{F}_1|^2 + |\\vec{F}_2|^2} = \\sqrt{4000^2 + 3000^2} = 5000\\text{ N}$.<br>• <strong>c) Sai.</strong> Khi $\\alpha = 60^\\circ$, áp dụng định lí côsin cho quy tắc hình bình hành: $$|\\vec{F}|^2 = |\\vec{F}_1|^2 + |\\vec{F}_2|^2 + 2|\\vec{F}_1||\\vec{F}_2|\\cos 60^\\circ = 4000^2 + 3000^2 + 2 \\cdot 4000 \\cdot 3000 \\cdot 0{,}5 = 37\\,000\\,000$$ $$\\implies |\\vec{F}| = \\sqrt{37\\,000\\,000} = 1000\\sqrt{37}\\text{ N} \\ne 1000\\sqrt{13}\\text{ N}.$$<br>• <strong>d) Đúng.</strong> Ta có $|\\vec{F}| = 1000\\sqrt{37} \\approx 6082{,}76\\text{ N} \\approx 6083\\text{ N}$.',
  },
  {
    id: 'tf7',
    number: 27,
    type: 'tf',
    skill: 'Phân tích vectơ và tính tích vô hướng trong hình vuông',
    points: 0.5,
    text: 'Cho hình vuông $ABCD$ cạnh bằng $4$. Điểm $M$ là trung điểm của cạnh $CD$, điểm $N$ thuộc cạnh $BC$ sao cho $BN = 1$.',
    items: [
      {
        key: 'a',
        text: 'Vectơ $\\vec{AM}$ có thể phân tích thành $\\vec{AM} = \\vec{AD} + \\dfrac{1}{2}\\vec{AB}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Độ dài của vectơ $\\vec{AM}$ bằng $2\\sqrt{5}$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Độ dài của vectơ $\\vec{AN}$ bằng $17$',
        correct: false,
      },
      {
        key: 'd',
        text: 'Tích vô hướng $\\vec{AM} \\cdot \\vec{AN}$ bằng $12$',
        correct: true,
      },
    ],
    explanation:
      'Chọn hệ trục tọa độ gốc $A(0; 0)$ với $Ax$ theo $\\vec{AB}$ và $Ay$ theo $\\vec{AD}$:<br>$A(0; 0), B(4; 0), D(0; 4), C(4; 4)$.<br>• <strong>a) Đúng.</strong> Điểm $M$ là trung điểm $CD \\implies M(2; 4)$. Suy ra $\\vec{AM} = (2; 4) = \\dfrac{1}{2}\\vec{AB} + \\vec{AD}$.<br>• <strong>b) Đúng.</strong> Độ dài $|\\vec{AM}| = \\sqrt{2^2 + 4^2} = \\sqrt{20} = 2\\sqrt{5}$.<br>• <strong>c) Sai.</strong> Điểm $N \\in BC$ với $BN = 1 \\implies N(4; 1)$. Độ dài $|\\vec{AN}| = \\sqrt{4^2 + 1^2} = \\sqrt{17} \\ne 17$.<br>• <strong>d) Đúng.</strong> Tính tích vô hướng: $\\vec{AM} \\cdot \\vec{AN} = 2(4) + 4(1) = 8 + 4 = 12$.',
  },
  {
    id: 'tf8',
    number: 28,
    type: 'tf',
    skill: 'Phân tích vectơ theo hai vectơ không cùng phương và tính thẳng hàng',
    points: 0.5,
    text: 'Cho tam giác $ABC$ có trọng tâm $G$. Gọi $I$ là trung điểm của đoạn thẳng $AG$, điểm $K$ thuộc cạnh $AC$ sao cho $\\vec{AK} = \\dfrac{1}{3}\\vec{AC}$.',
    items: [
      {
        key: 'a',
        text: 'Vectơ $\\vec{AI}$ được phân tích thành $\\vec{AI} = \\dfrac{1}{6}\\vec{AB} + \\dfrac{1}{6}\\vec{AC}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Vectơ $\\vec{BI}$ được phân tích thành $\\vec{BI} = -\\dfrac{5}{6}\\vec{AB} + \\dfrac{1}{6}\\vec{AC}$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Ba điểm $B, I, K$ không thẳng hàng',
        correct: true,
      },
      {
        key: 'd',
        text: 'Vectơ $\\vec{BK}$ bằng $2\\vec{BI}$',
        correct: false,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Vì $G$ là trọng tâm $\\triangle ABC$ nên $\\vec{AG} = \\dfrac{1}{3}(\\vec{AB} + \\vec{AC})$. Vì $I$ là trung điểm của $AG$ nên: $$\\vec{AI} = \\dfrac{1}{2}\\vec{AG} = \\dfrac{1}{6}\\vec{AB} + \\dfrac{1}{6}\\vec{AC}.$$<br>• <strong>b) Đúng.</strong> Ta có: $$\\vec{BI} = \\vec{AI} - \\vec{AB} = \\left(\\dfrac{1}{6}\\vec{AB} + \\dfrac{1}{6}\\vec{AC}\\right) - \\vec{AB} = -\\dfrac{5}{6}\\vec{AB} + \\dfrac{1}{6}\\vec{AC}.$$<br>• <strong>c) Đúng.</strong> Ta phân tích $\\vec{BK}$: $$\\vec{BK} = \\vec{AK} - \\vec{AB} = \\dfrac{1}{3}\\vec{AC} - \\vec{AB} = -\\vec{AB} + \\dfrac{1}{3}\\vec{AC}.$$ So sánh tỷ số giữa các hệ số của $\\vec{AB}$ và $\\vec{AC}$: $$\\dfrac{-1}{-5/6} = \\dfrac{6}{5} \\ne \\dfrac{1/3}{1/6} = 2.$$ Do đó hai vectơ $\\vec{BI}$ và $\\vec{BK}$ không cùng phương, nghĩa là ba điểm $B, I, K$ không thẳng hàng.<br>• <strong>d) Sai.</strong> Vì hai vectơ không cùng phương nên $\\vec{BK} \\ne 2\\vec{BI}$.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 29,
    type: 'shortans',
    skill: 'Công thức bao hàm - loại trừ cho hai tập hợp trong cộng đồng EdTech',
    points: 0.7,
    text: 'Một cộng đồng khởi nghiệp EdTech tại TP.HCM gồm có 70 chuyên gia. Trong đó có 45 người có năng lực phân tích dữ liệu Toán học, 38 người có kỹ năng tự động hóa luồng phân phối API/n8n, và 8 người làm công tác hỗ trợ cộng đồng không thuộc hai nhóm năng lực kỹ thuật trên. Hỏi có bao nhiêu chuyên gia sở hữu đồng thời cả năng lực phân tích dữ liệu Toán học và kỹ năng tự động hóa luồng API/n8n?',
    placeholder: 'Nhập số lượng chuyên gia (VD: 15)',
    correctDisplay: '21 (chuyên gia)',
    explanation:
      'Gọi $A$ là tập hợp chuyên gia có năng lực phân tích dữ liệu Toán học, $B$ là tập hợp chuyên gia có kỹ năng tự động hóa API/n8n.<br>Số chuyên gia sở hữu ít nhất một trong hai năng lực kỹ thuật trên là: $$n(A \\cup B) = 70 - 8 = 62.$$ Áp dụng công thức cộng số phần tử của hai tập hợp: $$n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$$ $$\\implies 62 = 45 + 38 - n(A \\cap B) \\implies n(A \\cap B) = 83 - 62 = 21.$$ Vậy có đúng 21 chuyên gia sở hữu đồng thời cả hai nhóm năng lực trên.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/chuyên gia|người/gi, '').trim();
      return c === '21';
    },
  },
  {
    id: 'sa2',
    number: 30,
    type: 'shortans',
    skill: 'Độ dài đường trung tuyến trong tam giác và làm tròn số thập phân',
    points: 0.7,
    text: 'Một thiết bị khảo sát trắc địa địa hình không người lái xuất phát từ trạm điều hành $A$, bay thẳng đến vị trí mốc kiểm tra $B$ cách $A$ một khoảng $6\\text{ km}$, rồi đổi hướng bay thẳng đến trạm thu phát tín hiệu $C$ cách $A$ một khoảng $10\\text{ km}$ sao cho góc quan sát $\\widehat{BAC} = 120^\\circ$. Để tối ưu hóa cự ly tiếp vận tín hiệu, thiết bị thực hiện truyền dữ liệu tại điểm mốc $M$ là trung điểm của đoạn nối trực tiếp giữa hai vị trí $B$ và $C$. Khoảng cách từ trạm điều hành $A$ đến điểm phát tín hiệu $M$ bằng bao nhiêu kilômét? (Làm tròn kết quả đến hàng phần mười).',
    placeholder: 'Nhập khoảng cách số (km, VD: 5.2)',
    correctDisplay: '4,4 (km)',
    explanation:
      'Áp dụng định lí côsin trong tam giác $ABC$ để tính bình phương khoảng cách $BC$: $$BC^2 = AB^2 + AC^2 - 2 \\cdot AB \\cdot AC \\cdot \\cos \\widehat{BAC}$$ $$BC^2 = 6^2 + 10^2 - 2 \\cdot 6 \\cdot 10 \\cdot \\cos 120^\\circ = 36 + 100 - 120 \\cdot \\left(-\\dfrac{1}{2}\\right) = 136 + 60 = 196 \\implies BC = 14\\text{ km}.$$ Vì $M$ là trung điểm của $BC$ nên đoạn $AM$ chính là độ dài đường trung tuyến $m_a$ kẻ từ đỉnh $A$: $$m_a^2 = \\dfrac{2(AB^2 + AC^2) - BC^2}{4} = \\dfrac{2(36 + 100) - 196}{4} = \\dfrac{2(136) - 196}{4} = \\dfrac{272 - 196}{4} = \\dfrac{76}{4} = 19.$$ Do đó: $$AM = \\sqrt{19} \\approx 4{,}35889\\text{ ... km}.$$ Làm tròn đến hàng phần mười ta được kết quả là $4{,}4\\text{ km}$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/km|kilômét/gi, '').replace(/,/g, '.').trim();
      return c === '4.4' || c === '4,4';
    },
  },
  {
    id: 'sa3',
    number: 31,
    type: 'shortans',
    skill: 'Quy hoạch tuyến tính: tìm nghiệm nguyên tối ưu chi phí vận chuyển dược phẩm',
    points: 0.6,
    text: 'Một công ty dược phẩm cần vận chuyển khẩn cấp tối thiểu 180 thùng dung dịch sát khuẩn y tế và 140 kiện trang phục bảo hộ từ kho tổng đến các bệnh viện dã chiến. Công ty thuê hai loại xe tải chuyên dụng $M_1$ và $M_2$:<br>• Mỗi chuyến xe $M_1$ có chi phí thuê là 3 triệu đồng, chuyên chở được 20 thùng sát khuẩn và 10 kiện bảo hộ.<br>• Mỗi chuyến xe $M_2$ có chi phí thuê là 4 triệu đồng, chuyên chở được 10 thùng sát khuẩn và 20 kiện bảo hộ.<br>Biết rằng đơn vị vận tải chỉ có thể huy động tối đa 8 chuyến xe loại $M_1$ và số chuyến xe của mỗi loại bắt buộc phải là số nguyên ($x, y \\in \\mathbb{N}$). Tổng chi phí thuê xe thấp nhất mà công ty dược phẩm phải chi trả (theo đơn vị triệu đồng) để hoàn thành kế hoạch vận chuyển trên là bao nhiêu?',
    placeholder: 'Nhập chi phí số (triệu đồng, VD: 45)',
    correctDisplay: '36 (triệu đồng)',
    explanation:
      'Gọi $x, y$ lần lượt là số chuyến xe loại $M_1$ và $M_2$ cần thuê ($x, y \\in \\mathbb{N}$).<br>Hệ bất phương trình ràng buộc lượng hàng hóa cần vận chuyển: $$\\begin{cases} 20x + 10y \\ge 180 \\\\ 10x + 20y \\ge 140 \\\\ 0 \\le x \\le 8 \\\\ y \\ge 0 \\end{cases} \\iff \\begin{cases} 2x + y \\ge 18 \\\\ x + 2y \\ge 14 \\\\ 0 \\le x \\le 8 \\\\ y \\ge 0. \\end{cases}$$ Hàm chi phí cần tối thiểu hóa: $T(x, y) = 3x + 4y$ (triệu đồng).<br>Khảo sát các điểm nguyên $(x; y)$ thỏa mãn hệ ràng buộc với $0 \\le x \\le 8$:<br>• Với $x = 8$: $y \\ge \\max\\left(18 - 2(8); \\dfrac{14 - 8}{2}\\right) = \\max(2; 3) = 3 \\implies y = 3$.<br>Chi phí: $T(8; 3) = 3(8) + 4(3) = 24 + 12 = 36\\text{ triệu đồng}$.<br>• Với $x = 7$: $y \\ge \\max\\left(18 - 2(7); \\dfrac{14 - 7}{2}\\right) = \\max(4; 3{,}5) = 4 \\implies y = 4$.<br>Chi phí: $T(7; 4) = 3(7) + 4(4) = 21 + 16 = 37\\text{ triệu đồng}$.<br>• Với $x = 6$: $y \\ge \\max\\left(18 - 2(6); \\dfrac{14 - 6}{2}\\right) = \\max(6; 4) = 6 \\implies y = 6$.<br>Chi phí: $T(6; 6) = 3(6) + 4(6) = 18 + 24 = 42\\text{ triệu đồng}$.<br>Vậy chi phí thuê xe thấp nhất mà công ty phải chi trả là $36\\text{ triệu đồng}$ khi thuê 8 chuyến xe $M_1$ và 3 chuyến xe $M_2$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/triệu( đồng)?/gi, '').trim();
      return c === '36' || c === '38';
    },
  },
];

export default function Toan10GiuaKy1DeAPage() {
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
    const ma = maHocSinh.trim() || 'HS10-GK1-DE-A';
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

    // Chấm Phần I (20 câu MCQ, 0.20đ/câu = 4.0đ)
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

    // Chấm Phần II (8 bài Đúng/Sai, tối đa 0.50đ/bài = 4.0đ)
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

    // Chấm Phần III (3 câu ngắn: câu 29: 0.7đ, câu 30: 0.7đ, câu 31: 0.6đ = 2.0đ)
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
                Phần I: Trắc nghiệm ABCD (Câu 1 - 20)
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
                Phần II: Đúng/Sai (Câu 21 - 28)
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
                Phần III: Trả lời ngắn (Câu 29 - 31)
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
            TOÁN 10 • KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ I (ĐỀ A)
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
                placeholder="Ví dụ: 10A1-01"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS10-GK1-DE-A'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '10'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Phần I: <strong>{diemPhan1.toFixed(2)}/4.0đ</strong> ({soCauDungMCQ}/20 câu đúng)</span>
                  <span>Phần II: <strong>{diemPhan2.toFixed(2)}/4.0đ</strong></span>
                  <span>Phần III: <strong>{diemPhan3.toFixed(2)}/2.0đ</strong></span>
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
        {/* PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN (20 CÂU - 4,0 ĐIỂM)   */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-sky-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (20 CÂU - 4,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-sky-800/80 px-3 py-1 rounded-full text-sky-200 font-medium">
              0,20 điểm / câu • 4 lựa chọn (1 đáp án đúng duy nhất)
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
        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (08 CÂU - 4,0 ĐIỂM)          */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-emerald-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (08 CÂU - 4,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-emerald-800/80 px-3 py-1 rounded-full text-emerald-200 font-medium">
              Tối đa 0,50 điểm / câu (Đúng 1 ý: 0,05đ | 2 ý: 0,125đ | 3 ý: 0,25đ | 4 ý: 0,50đ)
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
                      ? earnedPoints === 0.5
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
                        Tối đa 0.5 điểm
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        • {q.skill}
                      </span>
                    </div>

                    {isSubmitted && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Đúng {correctCount}/4 ý (+{earnedPoints.toFixed(3)}đ)
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
        {/* PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN (03 CÂU - 2,0 ĐIỂM)     */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN (03 CÂU - 2,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              Câu 29: 0,7đ • Câu 30: 0,7đ • Câu 31: 0,6đ • Học sinh tự điền kết quả vào ô trống
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
