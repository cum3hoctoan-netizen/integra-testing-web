'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ 1 MÔN TOÁN LỚP 10';
const EXAM_SUBTITLE = 'CHƯƠNG TRÌNH GDPT 2018 -- THỜI GIAN LÀM BÀI: 60 PHÚT';
const EXAM_TIME_NOTE =
  'Thời gian làm bài: 60 phút • Đề thi gồm 12 câu trắc nghiệm ABCD (3,0đ), 04 câu Đúng/Sai (4,0đ) và 06 câu trả lời ngắn (3,0đ)';

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

// Thang điểm Bộ GD&ĐT 2025 cho phần Đúng/Sai (tối đa 1.0 điểm/câu, tổng 4.0 điểm)
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
    skill: 'Phép toán giao và phần bù của tập hợp số thực',
    points: 0.25,
    text: 'Cho hai tập hợp $A = \\{x \\in \\mathbb{R} \\mid |2x - 1| \\le 3\\}$ và $B = (0; 3]$. Tập hợp phần bù $C_{\\mathbb{R}}(A \\cap B)$ là:',
    options: [
      { text: '$(-\\infty; 0] \\cup (2; +\\infty)$', isCorrect: true },
      { text: '$(-\\infty; -1) \\cup (3; +\\infty)$', isCorrect: false },
      { text: '$(-\\infty; 0] \\cup (3; +\\infty)$', isCorrect: false },
      { text: '$[-1; 0] \\cup (2; 3]$', isCorrect: false },
    ],
    explanation:
      '• Giải bất phương trình xác định tập $A$: $|2x - 1| \\le 3 \\iff -3 \\le 2x - 1 \\le 3 \\iff -1 \\le x \\le 2 \\implies A = [-1; 2]$.<br>• Giao hai tập hợp: $A \\cap B = [-1; 2] \\cap (0; 3] = (0; 2]$.<br>• Phần bù trong $\\mathbb{R}$: $C_{\\mathbb{R}}(A \\cap B) = \\mathbb{R} \\setminus (0; 2] = (-\\infty; 0] \\cup (2; +\\infty)$.',
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Tính giá trị biểu thức lượng giác của một góc tù',
    points: 0.25,
    text: 'Cho góc tù $\\alpha$ ($90^\\circ < \\alpha < 180^\\circ$) thỏa mãn $\\sin \\alpha = \\dfrac{3}{5}$. Giá trị của biểu thức $P = 3\\cos \\alpha - 4\\tan \\alpha$ bằng:',
    options: [
      { text: '$-\\dfrac{3}{5}$', isCorrect: false },
      { text: '$\\dfrac{3}{5}$', isCorrect: true },
      { text: '$-\\dfrac{12}{5}$', isCorrect: false },
      { text: '$\\dfrac{12}{5}$', isCorrect: false },
    ],
    explanation:
      '• Vì $90^\\circ < \\alpha < 180^\\circ$ nên $\\cos \\alpha < 0$. Ta có $\\cos \\alpha = -\\sqrt{1 - \\sin^2 \\alpha} = -\\sqrt{1 - \\left(\\dfrac{3}{5}\\right)^2} = -\\dfrac{4}{5}$.<br>• $\\tan \\alpha = \\dfrac{\\sin \\alpha}{\\cos \\alpha} = \\dfrac{3/5}{-4/5} = -\\dfrac{3}{4}$.<br>• Thay vào $P$: $P = 3\\left(-\\dfrac{4}{5}\\right) - 4\\left(-\\dfrac{3}{4}\\right) = -\\dfrac{12}{5} + 3 = \\dfrac{3}{5}$.',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Ước lượng sai số tương đối của phép tính diện tích hình chữ nhật',
    points: 0.25,
    text: 'Một tấm thép hình chữ nhật có kích thước đo được là chiều dài $a = 15,2\\text{ m} \\pm 0,1\\text{ m}$ và chiều rộng $b = 8,5\\text{ m} \\pm 0,1\\text{ m}$. Sai số tương đối tối đa của phép đo diện tích tấm thép đó gần nhất với giá trị nào sau đây?',
    options: [
      { text: '$0,82\\%$', isCorrect: false },
      { text: '$1,83\\%$', isCorrect: true },
      { text: '$1,25\\%$', isCorrect: false },
      { text: '$2,12\\%$', isCorrect: false },
    ],
    explanation:
      '• Sai số tương đối của chiều dài: $\\delta_a = \\dfrac{d_a}{\\bar{a}} = \\dfrac{0,1}{15,2} \\approx 0,658\\%$.<br>• Sai số tương đối của chiều rộng: $\\delta_b = \\dfrac{d_b}{\\bar{b}} = \\dfrac{0,1}{8,5} \\approx 1,176\\%$.<br>• Sai số tương đối ước lượng của diện tích $S = a \\cdot b$: $\\delta_S \\approx \\delta_a + \\delta_b \\approx 0,658\\% + 1,176\\% = 1,834\\% \\approx 1,83\\%$.',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Xác định tọa độ đỉnh của miền nghiệm hệ bất phương trình bậc nhất hai ẩn',
    points: 0.25,
    text: 'Miền nghiệm của hệ bất phương trình $\\begin{cases} x + 2y \\le 8 \\\\ 3x - y \\ge 3 \\\\ y \\ge 0 \\end{cases}$ trên mặt phẳng tọa độ $Oxy$ là miền tam giác $ABC$ kể cả biên. Tọa độ đỉnh $B$ có tung độ lớn nhất trong miền nghiệm là:',
    options: [
      { text: '$(1; 0)$', isCorrect: false },
      { text: '$(8; 0)$', isCorrect: false },
      { text: '$(2; 3)$', isCorrect: true },
      { text: '$(0; 4)$', isCorrect: false },
    ],
    explanation:
      'Vẽ các đường biên $d_1: x + 2y = 8$, $d_2: 3x - y = 3$ và $d_3: y = 0$.<br>• $d_1 \\cap d_3 \\implies A(8; 0)$.<br>• $d_2 \\cap d_3 \\implies C(1; 0)$.<br>• $d_1 \\cap d_2 \\implies \\begin{cases} x + 2y = 8 \\\\ 3x - y = 3 \\end{cases} \\iff \\begin{cases} x = 2 \\\\ y = 3 \\end{cases} \\implies B(2; 3)$.<br>Tung độ các đỉnh: $y_A = 0, y_C = 0, y_B = 3$. Vậy đỉnh $B(2; 3)$ có tung độ lớn nhất.',
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Định lý côsin và định lý sin tính bán kính đường tròn ngoại tiếp tam giác',
    points: 0.25,
    text: 'Cho tam giác $ABC$ có $AB = 5$, $AC = 8$ và góc $\\widehat{A} = 60^\\circ$. Bán kính đường tròn ngoại tiếp $R$ của tam giác $ABC$ bằng:',
    options: [
      { text: '$\\sqrt{7}$', isCorrect: false },
      { text: '$\\dfrac{7\\sqrt{3}}{3}$', isCorrect: true },
      { text: '$\\dfrac{7}{2}$', isCorrect: false },
      { text: '$7\\sqrt{3}$', isCorrect: false },
    ],
    explanation:
      '• Theo Định lý Côsin: $a^2 = b^2 + c^2 - 2bc \\cos A = 8^2 + 5^2 - 2 \\cdot 8 \\cdot 5 \\cdot \\cos 60^\\circ = 64 + 25 - 40 = 49 \\implies a = 7$.<br>• Theo Định lý Sin: $2R = \\dfrac{a}{\\sin A} \\implies R = \\dfrac{7}{2 \\sin 60^\\circ} = \\dfrac{7}{\\sqrt{3}} = \\dfrac{7\\sqrt{3}}{3}$.',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Tính khoảng tứ phân vị của mẫu số liệu không ghép nhóm',
    points: 0.25,
    text: 'Cho mẫu số liệu không ghép nhóm về thời gian hoàn thành một bài tập trực tuyến (đơn vị: phút) của 9 học sinh: $12, 15, 15, 15, 18, 18, 20, 22, 25$. Khoảng tứ phân vị $\\Delta_Q = Q_3 - Q_1$ của mẫu số liệu này bằng:',
    options: [
      { text: '$6$', isCorrect: true },
      { text: '$5,5$', isCorrect: false },
      { text: '$7$', isCorrect: false },
      { text: '$5$', isCorrect: false },
    ],
    explanation:
      'Mẫu số liệu gồm $n = 9$ giá trị đã sắp xếp tăng dần.<br>• Trung vị $Q_2 = x_5 = 18$.<br>• Nửa số liệu bên trái $Q_2$ gồm 4 giá trị $12, 15, 15, 15 \\implies Q_1 = \\dfrac{15 + 15}{2} = 15$.<br>• Nửa số liệu bên phải $Q_2$ gồm 4 giá trị $18, 20, 22, 25 \\implies Q_3 = \\dfrac{20 + 22}{2} = 21$.<br>• Khoảng tứ phân vị: $\\Delta_Q = Q_3 - Q_1 = 21 - 15 = 6$.',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Nguyên lý bao hàm và loại trừ cho ba tập hợp trong bài toán khảo sát thực tế',
    points: 0.25,
    text: 'Một câu lạc bộ thể thao có $60$ thành viên. Qua khảo sát, có $35$ người chơi bóng đá, $30$ người chơi cầu lông, $25$ người chơi bơi lội; $15$ người chơi cả bóng đá và cầu lông, $10$ người chơi cả cầu lông và bơi lội, $12$ người chơi cả bóng đá và bơi lội; $5$ người chơi cả $3$ môn. Số thành viên không chơi bất kỳ môn nào trong $3$ môn trên là:',
    options: [
      { text: '$2$', isCorrect: true },
      { text: '$3$', isCorrect: false },
      { text: '$5$', isCorrect: false },
      { text: '$8$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức bao hàm - loại trừ cho 3 tập hợp, số thành viên chơi ít nhất một môn là:<br>$$N = 35 + 30 + 25 - (15 + 10 + 12) + 5 = 90 - 37 + 5 = 58\\text{ (thành viên)}.$$<br>Số thành viên không chơi môn nào là: $60 - 58 = 2\\text{ (thành viên)}$.',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Quy hoạch tuyến tính tối ưu hóa lợi nhuận nông nghiệp',
    points: 0.25,
    text: 'Một nông trường dự định trồng hai loại cây $X$ và $Y$ trên diện tích đất tối đa $8\\text{ ha}$. Chi phí đầu tư cho $1\\text{ ha}$ cây $X$ là $20\\text{ triệu đồng}$ và cần $40\\text{ công lao động}$. Chi phí cho $1\\text{ ha}$ cây $Y$ là $30\\text{ triệu đồng}$ và cần $30\\text{ công lao động}$. Nông trường có tổng ngân sách tối đa là $180\\text{ triệu đồng}$ và quỹ lao động tối đa là $240\\text{ công}$. Lợi nhuận từ $1\\text{ ha}$ cây $X$ là $40\\text{ triệu đồng}$ và từ $1\\text{ ha}$ cây $Y$ là $50\\text{ triệu đồng}$. Tổng lợi nhuận lớn nhất nông trường có thể thu được bằng:',
    options: [
      { text: '$320\\text{ triệu đồng}$', isCorrect: true },
      { text: '$300\\text{ triệu đồng}$', isCorrect: false },
      { text: '$340\\text{ triệu đồng}$', isCorrect: false },
      { text: '$280\\text{ triệu đồng}$', isCorrect: false },
    ],
    explanation:
      'Gọi $x, y \\ge 0$ là diện tích trồng cây $X$ và $Y$ (ha).<br>Hệ bất phương trình ràng buộc:<br>$$\\begin{cases} x + y \\le 8 \\\\ 20x + 30y \\le 180 \\iff 2x + 3y \\le 18 \\\\ 40x + 30y \\le 240 \\iff 4x + 3y \\le 24 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$$<br>Miền nghiệm là đa giác tứ giác với các đỉnh $O(0;0), A(6;0), B(3;4), C(0;6)$.<br>Hàm lợi nhuận $F(x, y) = 40x + 50y$ (triệu đồng).<br>Tính giá trị tại các đỉnh:<br>$F(O) = 0, F(A) = 240, F(B) = 40(3) + 50(4) = 320, F(C) = 300$.<br>Lợi nhuận lớn nhất bằng $320\\text{ triệu đồng}$ khi trồng $3\\text{ ha}$ cây $X$ và $4\\text{ ha}$ cây $Y$.',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Tính công cơ học và tìm giá trị lượng giác góc kéo của lực',
    points: 0.25,
    text: 'Một lực $\\vec{F}$ có độ lớn $100\\text{ N}$ tác dụng lên một vật dịch chuyển một quãng đường $s = 20\\text{ m}$ theo phương ngang. Công $A$ sinh ra được tính bởi công thức $A = F \\cdot s \\cdot \\cos \\alpha$, trong đó $\\alpha$ ($0^\\circ < \\alpha < 90^\\circ$) là góc giữa hướng lực kéo và phương chuyển động. Biết công sinh ra là $1000\\sqrt{3}\\text{ J}$. Giá trị của $\\tan \\alpha$ bằng:',
    options: [
      { text: '$\\sqrt{3}$', isCorrect: false },
      { text: '$\\dfrac{\\sqrt{3}}{3}$', isCorrect: true },
      { text: '$1$', isCorrect: false },
      { text: '$\\dfrac{1}{2}$', isCorrect: false },
    ],
    explanation:
      '• Ta có $A = F \\cdot s \\cdot \\cos \\alpha \\implies 1000\\sqrt{3} = 100 \\cdot 20 \\cdot \\cos \\alpha \\iff \\cos \\alpha = \\dfrac{\\sqrt{3}}{2}$.<br>• Vì $0^\\circ < \\alpha < 90^\\circ \\implies \\alpha = 30^\\circ$.<br>• Suy ra $\\tan \\alpha = \\tan 30^\\circ = \\dfrac{\\sqrt{3}}{3}$.',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Ứng dụng định lý sin và tỉ số lượng giác đo chiều cao ngọn tháp',
    points: 0.25,
    text: 'Để xác định chiều cao $CD$ của một ngọn tháp viễn thông (với $D$ là chân tháp trên mặt đất), hai quan trắc viên đứng tại hai vị trí $A$ và $B$ trên mặt đất thẳng hàng với $D$ ($B$ nằm giữa $A$ và $D$). Khoảng cách $AB = 100\\text{ m}$, góc nâng nhìn đỉnh $C$ tại $A$ là $\\widehat{CAD} = 30^\\circ$ và tại $B$ là $\\widehat{CBD} = 45^\\circ$. Chiều cao $CD$ của ngọn tháp gần nhất với giá trị nào sau đây?',
    options: [
      { text: '$120,5\\text{ m}$', isCorrect: false },
      { text: '$136,6\\text{ m}$', isCorrect: true },
      { text: '$141,4\\text{ m}$', isCorrect: false },
      { text: '$150,0\\text{ m}$', isCorrect: false },
    ],
    explanation:
      '• Trong tam giác $ABC$, góc $\\widehat{ACB} = \\widehat{CBD} - \\widehat{CAD} = 45^\\circ - 30^\\circ = 15^\\circ$.<br>• Áp dụng Định lý Sin trong tam giác $ABC$:<br>$$\\dfrac{BC}{\\sin 30^\\circ} = \\dfrac{AB}{\\sin 15^\\circ} \\implies BC = \\dfrac{100 \\cdot \\sin 30^\\circ}{\\sin 15^\\circ} = 50(\\sqrt{6} + \\sqrt{2})\\text{ (m)}.$$<br>• Trong tam giác vuông $BCD$ tại $D$:<br>$$CD = BC \\cdot \\sin 45^\\circ = 50(\\sqrt{6} + \\sqrt{2}) \\cdot \\dfrac{\\sqrt{2}}{2} = 50(\\sqrt{3} + 1) \\approx 136,6\\text{ m}.$$',
  },
  {
    id: 'mcq11',
    number: 11,
    type: 'mcq',
    skill: 'Sai số tuyệt đối tối đa của phép tính diện tích khu đất hình chữ nhật',
    points: 0.25,
    text: 'Một người đo chiều dài và chiều rộng của một khu đất hình chữ nhật thu được kết quả $x = 25\\text{ m} \\pm 0,2\\text{ m}$ và $y = 12\\text{ m} \\pm 0,1\\text{ m}$. Sai số tuyệt đối tối đa của phép tính diện tích khu đất đó bằng:',
    options: [
      { text: '$3,70\\text{ m}^2$', isCorrect: false },
      { text: '$4,92\\text{ m}^2$', isCorrect: true },
      { text: '$2,50\\text{ m}^2$', isCorrect: false },
      { text: '$5,12\\text{ m}^2$', isCorrect: false },
    ],
    explanation:
      '• Diện tích trung bình $S_0 = 25 \\cdot 12 = 300\\text{ m}^2$.<br>• Giá trị kích thước lớn nhất có thể $x_{\\max} = 25,2\\text{ m}$ và $y_{\\max} = 12,1\\text{ m}$.<br>• Diện tích lớn nhất $S_{\\max} = 25,2 \\cdot 12,1 = 304,92\\text{ m}^2$.<br>• Sai số tuyệt đối tối đa của diện tích là $\\Delta_S = S_{\\max} - S_0 = 304,92 - 300 = 4,92\\text{ m}^2$.',
  },
  {
    id: 'mcq12',
    number: 12,
    type: 'mcq',
    skill: 'Lựa chọn số đặc trưng đo xu thế trung tâm khi mẫu số liệu có giá trị bất thường',
    points: 0.25,
    text: 'Một công ty khảo sát số dư tài khoản tiết kiệm (đơn vị: triệu đồng) của $10$ khách hàng ngẫu nhiên thu được mẫu số liệu: $15, 20, 22, 25, 28, 30, 35, 40, 42, 180$. Số đặc trưng đo xu thế trung tâm nào phản ánh trung thực nhất mức độ tiết kiệm đại diện cho đại đa số khách hàng trên?',
    options: [
      { text: 'Số trung bình $\\bar{x} = 43,7$', isCorrect: false },
      { text: 'Trung vị $M_e = 29$', isCorrect: true },
      { text: 'Mốt $M_0 = 180$', isCorrect: false },
      { text: 'Khoảng biến thiên $R = 165$', isCorrect: false },
    ],
    explanation:
      'Mẫu số liệu chứa giá trị bất thường $180$ triệu đồng (lớn đột biến so với các giá trị còn lại). Do đó, số trung bình $\\bar{x} = 43,7$ bị kéo lệch cao hơn hẳn $9/10$ khách hàng. Trung vị $M_e = \\dfrac{28 + 30}{2} = 29$ không bị ảnh hưởng bởi giá trị bất thường nên phản ánh trung thực nhất xu thế trung tâm của đa số khách hàng.',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 13,
    type: 'tf',
    skill: 'Tập hợp số, phương trình bậc hai có tham số và quan hệ bao hàm',
    text: 'Cho hai tập hợp $A = \\{x \\in \\mathbb{R} \\mid |x - 2| \\le 3\\}$ và $B = \\{x \\in \\mathbb{R} \\mid x^2 - 2mx + m^2 - 9 = 0\\}$ (với $m$ là tham số). Xét tính đúng/sai của các phát biểu sau:',
    items: [
      {
        key: 'a',
        text: 'Tập hợp $A$ viết dưới dạng đoạn là $A = [-1; 5]$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Với mọi $m \\in \\mathbb{R}$, tập hợp $B$ luôn có đúng 2 phần tử phân biệt là $x_1 = m - 3$ và $x_2 = m + 3$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Khi $m = 1$, tập hợp $A \\cap B = \\{4\\}$',
        correct: true,
      },
      {
        key: 'd',
        text: 'Có đúng 3 giá trị nguyên của tham số $m$ để $B \\subset A$',
        correct: false,
      },
    ],
    explanation:
      '• **a) Đúng.** Ta có $|x - 2| \\le 3 \\iff -3 \\le x - 2 \\le 3 \\iff -1 \\le x \\le 5 \\implies A = [-1; 5]$.<br>• **b) Đúng.** $x^2 - 2mx + m^2 - 9 = 0 \\iff (x - m)^2 = 9 \\iff x = m - 3$ hoặc $x = m + 3$.<br>• **c) Đúng.** Khi $m = 1 \\implies B = \\{-2; 4\\} \\implies A \\cap B = [-1; 5] \\cap \\{-2; 4\\} = \\{4\\}$.<br>• **d) Sai.** Để $B \\subset A \\iff \\begin{cases} m - 3 \\ge -1 \\\\ m + 3 \\le 5 \\end{cases} \\iff \\begin{cases} m \\ge 2 \\\\ m \\le 2 \\end{cases} \\iff m = 2$. Chỉ có đúng $1$ giá trị nguyên của $m$.',
  },
  {
    id: 'tf2',
    number: 14,
    type: 'tf',
    skill: 'Quy hoạch tuyến tính tối ưu hóa lợi nhuận xưởng may',
    text: 'Một xưởng may sản xuất hai loại áo $A$ và $B$. Để may $1$ chiếc áo $A$ cần $2\\text{ m}^2$ vải và $1\\text{ giờ}$ công, mang lại lợi nhuận $150.000\\text{ đồng}$. Để may $1$ chiếc áo $B$ cần $1\\text{ m}^2$ vải và $2\\text{ giờ}$ công, mang lại lợi nhuận $200.000\\text{ đồng}$. Xưởng có tối đa $80\\text{ m}^2$ vải và $100\\text{ giờ}$ công lao động. Gọi $x, y$ ($x, y \\ge 0$) lần lượt là số chiếc áo $A$ và $B$ sản xuất. Xét tính đúng/sai của các phát biểu sau:',
    items: [
      {
        key: 'a',
        text: 'Hệ bất phương trình mô tả các điều kiện ràng buộc là $\\begin{cases} 2x + y \\le 80 \\\\ x + 2y \\le 100 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Phương án sản xuất $30$ chiếc áo $A$ và $35$ chiếc áo $B$ thỏa mãn tất cả các điều kiện ràng buộc',
        correct: false,
      },
      {
        key: 'c',
        text: 'Miền nghiệm của hệ bất phương trình ràng buộc là miền tứ giác $OABC$ kể cả biên với các đỉnh $O(0; 0), A(40; 0), B(20; 40), C(0; 50)$',
        correct: true,
      },
      {
        key: 'd',
        text: 'Tổng lợi nhuận lớn nhất xưởng may có thể thu được là $11.000.000\\text{ đồng}$',
        correct: true,
      },
    ],
    explanation:
      '• **a) Đúng.** Ràng buộc vải $2x + y \\le 80$, công lao động $x + 2y \\le 100$ và $x \\ge 0, y \\ge 0$.<br>• **b) Sai.** Thay $(30; 35)$ vào $2x + y = 2(30) + 35 = 95 > 80$ (vi phạm điều kiện vải).<br>• **c) Đúng.** Vẽ miền nghiệm ta thu được tứ giác $OABC$ với $O(0; 0), A(40; 0), B(20; 40), C(0; 50)$.<br>• **d) Đúng.** Lợi nhuận $F(x, y) = 150x + 200y$ (nghìn đồng). Tính tại đỉnh $B(20; 40) \\implies F(B) = 11.000\\text{ nghìn đồng} = 11.000.000\\text{ đồng}$.',
  },
  {
    id: 'tf3',
    number: 15,
    type: 'tf',
    skill: 'Hệ thức lượng trong tam giác: tính cạnh, diện tích, bán kính đường tròn nội tiếp và đường cao',
    text: 'Cho tam giác $ABC$ mô phỏng một cánh buồm hình tam giác có $AB = 6\\text{ m}$, $AC = 8\\text{ m}$ và góc $\\widehat{BAC} = 120^\\circ$. Xét tính đúng/sai của các khẳng định sau:',
    items: [
      {
        key: 'a',
        text: 'Độ dài cạnh $BC$ của cánh buồm bằng $2\\sqrt{37}\\text{ m}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Diện tích cánh buồm $S_{\\triangle ABC} = 12\\sqrt{3}\\text{ m}^2$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Bán kính đường tròn nội tiếp $r$ của cánh buồm lớn hơn $2\\text{ m}$',
        correct: false,
      },
      {
        key: 'd',
        text: 'Độ dài đường cao $AH$ hạ từ đỉnh $A$ xuống cạnh $BC$ bằng $\\dfrac{12\\sqrt{3}}{\\sqrt{37}}\\text{ m}$',
        correct: true,
      },
    ],
    explanation:
      '• **a) Đúng.** $BC^2 = 6^2 + 8^2 - 2(6)(8)\\cos 120^\\circ = 148 \\implies BC = 2\\sqrt{37}\\text{ m}$.<br>• **b) Đúng.** $S = \\dfrac{1}{2} \cdot 6 \cdot 8 \cdot \\sin 120^\\circ = 12\\sqrt{3}\\text{ m}^2$.<br>• **c) Sai.** Nửa chu vi $p = 7 + \\sqrt{37} \\approx 13,08\\text{ m} \\implies r = \\dfrac{S}{p} = \\dfrac{12\\sqrt{3}}{7 + \\sqrt{37}} \\approx 1,59\\text{ m} < 2\\text{ m}$.<br>• **d) Đúng.** $AH = \\dfrac{2S}{BC} = \\dfrac{2 \\cdot 12\\sqrt{3}}{2\\sqrt{37}} = \\dfrac{12\\sqrt{3}}{\\sqrt{37}}\\text{ m}$.',
  },
  {
    id: 'tf4',
    number: 16,
    type: 'tf',
    skill: 'Ứng dụng định lý côsin và định lý sin giải quyết bài toán chuyển động tàu biển thực tế',
    text: 'Hai con tàu xuất phát cùng lúc từ cảng $O$. Tàu thứ nhất chạy theo hướng đông với vận tốc $30\\text{ km/h}$. Tàu thứ hai chạy theo hướng tạo với hướng đông một góc $60^\\circ$ với vận tốc $40\\text{ km/h}$. Sau $2\\text{ giờ}$ di chuyển, tàu thứ nhất đến vị trí $A$ và tàu thứ hai đến vị trí $B$. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Khoảng cách $OA = 60\\text{ km}$ và $OB = 80\\text{ km}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Khoảng cách giữa hai con tàu sau $2\\text{ giờ}$ bằng $20\\sqrt{13}\\text{ km}$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Diện tích vùng biển tam giác $OAB$ tạo bởi hai con tàu và cảng bằng $1200\\sqrt{3}\\text{ km}^2$',
        correct: true,
      },
      {
        key: 'd',
        text: 'Sin của góc $\\widehat{OBA}$ giữa hướng di chuyển $BA$ và đường nối cảng $BO$ bằng $\\dfrac{3\\sqrt{3}}{2\\sqrt{13}}$',
        correct: true,
      },
    ],
    explanation:
      '• **a) Đúng.** $OA = 30 \\cdot 2 = 60\\text{ km}, OB = 40 \\cdot 2 = 80\\text{ km}$.<br>• **b) Đúng.** $AB^2 = 60^2 + 80^2 - 2(60)(80)\\cos 60^\\circ = 5200 \\implies AB = 20\\sqrt{13}\\text{ km}$.<br>• **c) Đúng.** $S_{\\triangle OAB} = \\dfrac{1}{2} \\cdot 60 \\cdot 80 \\cdot \\sin 60^\\circ = 1200\\sqrt{3}\\text{ km}^2$.<br>• **d) Đúng.** Áp dụng Định lý Sin trong $\\triangle OAB$: $\\dfrac{OA}{\\sin \\widehat{OBA}} = \\dfrac{AB}{\\sin 60^\\circ} \\implies \\sin \\widehat{OBA} = \\dfrac{60 \\cdot \\frac{\\sqrt{3}}{2}}{20\\sqrt{13}} = \\dfrac{3\\sqrt{3}}{2\\sqrt{13}}$.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 17,
    type: 'shortans',
    skill: 'Đếm số nguyên thuộc giao của hai tập hợp số',
    points: 0.5,
    text: 'Cho hai tập hợp $A = \\{x \\in \\mathbb{R} \\mid -3 \\le x < 5\\}$ và $B = \\{x \\in \\mathbb{R} \\mid 1 < x \\le 8\\}$. Có bao nhiêu số nguyên thuộc tập hợp $A \\cap B$?',
    placeholder: 'Nhập số nguyên (VD: 5)',
    correctDisplay: '3',
    explanation:
      'Ta có $A = [-3; 5)$ và $B = (1; 8] \\implies A \\cap B = (1; 5)$.<br>Các số nguyên thuộc khoảng $(1; 5)$ là $2, 3, 4$.<br>Vậy có tất cả $3$ số nguyên thuộc tập hợp $A \\cap B$.',
    validator: (val: string) => val.trim() === '3',
  },
  {
    id: 'sa2',
    number: 18,
    type: 'shortans',
    skill: 'Tìm giá trị lớn nhất của biểu thức trên miền nghiệm đa giác',
    points: 0.5,
    text: 'Cho miền nghiệm $D$ của hệ bất phương trình $\\begin{cases} x + y \\le 6 \\\\ 2x - y \\ge -3 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$. Tìm giá trị lớn nhất của biểu thức $F(x; y) = 3x + 2y$ trên miền $D$.',
    placeholder: 'Nhập giá trị lớn nhất (VD: 12)',
    correctDisplay: '18',
    explanation:
      'Các đỉnh của miền đa giác nghiệm $D$ là $O(0;0), A(6;0), B(1;5), C(0;3)$.<br>Tính giá trị của $F(x; y) = 3x + 2y$ tại các đỉnh:<br>• $F(O) = 0$.<br>• $F(A) = 3(6) + 2(0) = 18$.<br>• $F(B) = 3(1) + 2(5) = 13$.<br>• $F(C) = 3(0) + 2(3) = 6$.<br>Vậy giá trị lớn nhất $F_{\\max} = 18$ tại điểm $A(6;0)$.',
    validator: (val: string) => val.trim() === '18',
  },
  {
    id: 'sa3',
    number: 19,
    type: 'shortans',
    skill: 'Biến đổi biểu thức lượng giác cơ bản qua sin và cos',
    points: 0.5,
    text: 'Cho góc $\\alpha$ thỏa mãn $\\sin \\alpha + \\cos \\alpha = \\dfrac{7}{5}$ với $0^\\circ < \\alpha < 90^\\circ$. Giá trị của biểu thức $Q = \\tan \\alpha + \\cot \\alpha$ bằng bao nhiêu? (Nhập kết quả dưới dạng phân số tối giản $a/b$).',
    placeholder: 'Nhập phân số tối giản (VD: 13/6)',
    correctDisplay: '25/12',
    explanation:
      '• Bình phương hai vế: $(\\sin \\alpha + \\cos \\alpha)^2 = \\left(\\dfrac{7}{5}\\right)^2 \\iff 1 + 2\\sin \\alpha \\cos \\alpha = \\dfrac{49}{25} \\implies \\sin \\alpha \\cos \\alpha = \\dfrac{12}{25}$.<br>• Ta có $Q = \\tan \\alpha + \\cot \\alpha = \\dfrac{\\sin \\alpha}{\\cos \\alpha} + \\dfrac{\\cos \\alpha}{\\sin \\alpha} = \\dfrac{\\sin^2 \\alpha + \\cos^2 \\alpha}{\\sin \\alpha \\cos \\alpha} = \\dfrac{1}{\\sin \\alpha \\cos \\alpha} = \\dfrac{25}{12}$.',
    validator: (val: string) => val.trim().replace(/\s+/g, '') === '25/12',
  },
  {
    id: 'sa4',
    number: 20,
    type: 'shortans',
    skill: 'Tính chiều cao ngọn núi không thể tiếp cận trực tiếp bằng định lý sin',
    points: 0.5,
    text: 'Để đo chiều cao $CD$ của một ngọn núi mà không thể leo lên đỉnh $C$, người ta chọn hai điểm $A$ và $B$ trên mặt đất phẳng sao cho $A, B, D$ thẳng hàng ($D$ là chân núi). Đo đạc thu được: khoảng cách $AB = 500\\text{ m}$, góc nâng nhìn đỉnh núi tại $A$ là $\\widehat{CAD} = 30^\\circ$ và tại $B$ là $\\widehat{CBD} = 45^\\circ$. Tính chiều cao $CD$ của ngọn núi theo đơn vị mét (làm tròn kết quả đến hàng đơn vị).',
    placeholder: 'Nhập chiều cao số (mét, VD: 475)',
    correctDisplay: '683',
    explanation:
      '• Trong tam giác $ABC$, góc $\\widehat{ACB} = \\widehat{CBD} - \\widehat{CAD} = 45^\\circ - 30^\\circ = 15^\\circ$.<br>• Áp dụng Định lý Sin trong tam giác $ABC$:<br>$$\\dfrac{BC}{\\sin 30^\\circ} = \\dfrac{AB}{\\sin 15^\\circ} \\implies BC = \\dfrac{500 \\cdot \\sin 30^\\circ}{\\sin 15^\\circ} = 250(\\sqrt{6} + \\sqrt{2})\\text{ (m)}.$$<br>• Trong tam giác vuông $BCD$ tại $D$:<br>$$CD = BC \\cdot \\sin 45^\\circ = 250(\\sqrt{6} + \\sqrt{2}) \\cdot \\dfrac{\\sqrt{2}}{2} = 250(\\sqrt{3} + 1) \\approx 683,01\\text{ m}.$$<br>Làm tròn đến hàng đơn vị thu được $683\\text{ m}$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/m|mét/gi, '').trim();
      return c === '683';
    },
  },
  {
    id: 'sa5',
    number: 21,
    type: 'shortans',
    skill: 'Bài toán tối ưu hóa lợi nhuận hai loại cây trồng nông nghiệp',
    points: 0.5,
    text: 'Một nông dân định trồng khoai lang và đậu tương trên diện tích tối đa $10\\text{ ha}$. Chi phí đầu tư cho mỗi ha khoai lang là $4\\text{ triệu đồng}$ và cần $20\\text{ công lao động}$, mang lại lợi nhuận $30\\text{ triệu đồng}$. Chi phí cho mỗi ha đậu tương là $6\\text{ triệu đồng}$ và cần $10\\text{ công lao động}$, mang lại lợi nhuận $25\\text{ triệu đồng}$. Bác có tổng số vốn đầu tư tối đa là $48\\text{ triệu đồng}$ và quỹ lao động tối đa là $140\\text{ công}$. Tổng lợi nhuận lớn nhất bác nông dân thu được bằng bao nhiêu triệu đồng?',
    placeholder: 'Nhập lợi nhuận số (triệu đồng, VD: 180)',
    correctDisplay: '260',
    explanation:
      'Gọi $x, y \\ge 0$ lần lượt là diện tích trồng khoai lang và đậu tương (ha).<br>Hệ bất phương trình ràng buộc:<br>$$\\begin{cases} x + y \\le 10 \\\\ 4x + 6y \\le 48 \\iff 2x + 3y \\le 24 \\\\ 20x + 10y \\le 140 \\iff 2x + y \\le 14 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$$<br>Miền nghiệm là đa giác tứ giác với các đỉnh $O(0;0), A(7;0), B(4,5; 5), C(0;8)$.<br>Hàm lợi nhuận $F(x, y) = 30x + 25y$ (triệu đồng).<br>Tính giá trị tại các đỉnh:<br>$F(O) = 0, F(A) = 210, F(B) = 30(4,5) + 25(5) = 260, F(C) = 200$.<br>Lợi nhuận lớn nhất bằng $260\\text{ triệu đồng}$ khi trồng $4,5\\text{ ha}$ khoai lang và $5\\text{ ha}$ đậu tương.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/triệu( đồng)?/gi, '').trim();
      return c === '260';
    },
  },
  {
    id: 'sa6',
    number: 22,
    type: 'shortans',
    skill: 'Khoảng cách ngắn nhất từ đỉnh góc vuông đến cạnh huyền tam giác vuông',
    points: 0.5,
    text: 'Cho vùng biển tam giác vuông $ABC$ tại $A$ có hai cạnh góc vuông $AB = 60\\text{ km}$ và $AC = 80\\text{ km}$. Một con tàu tuần tra di chuyển liên tục trên đoạn đường biển $BC$. Khoảng cách ngắn nhất từ hải đăng đặt tại điểm $A$ đến con tàu tuần tra trên đoạn $BC$ bằng bao nhiêu km?',
    placeholder: 'Nhập khoảng cách số (km, VD: 35)',
    correctDisplay: '48',
    explanation:
      'Khoảng cách ngắn nhất từ điểm $A$ đến con tàu trên đoạn $BC$ chính là độ dài đường cao $AH$ hạ từ $A$ xuống cạnh huyền $BC$.<br>Cạnh huyền $BC = \\sqrt{AB^2 + AC^2} = \\sqrt{60^2 + 80^2} = 100\\text{ km}$.<br>Đường cao $AH = \\dfrac{AB \\cdot AC}{BC} = \\dfrac{60 \\cdot 80}{100} = 48\\text{ km}$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/km/gi, '').trim();
      return c === '48';
    },
  },
];

export default function Toan10GiuaKy160PPage() {
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
    const ma = maHocSinh.trim() || 'HS10-GK1-60P';
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

    // Chấm Phần I (12 câu MCQ, 0.25đ/câu = 3.0đ)
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

    // Chấm Phần II (4 bài Đúng/Sai, tối đa 1.0đ/bài = 4.0đ)
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

    // Chấm Phần III (6 câu ngắn, 0.5đ/câu = 3.0đ)
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
    const p3Score = p3CorrectCount * 0.5;

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
                Phần I: Trắc nghiệm ABCD (Câu 1 - 12)
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
                Phần II: Đúng/Sai (Câu 13 - 16)
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
                Phần III: Trả lời ngắn (Câu 17 - 22)
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
            TOÁN 10 • KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ 1
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
                placeholder="Ví dụ: 10A1-05"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS10-GK1-60P'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '10'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Phần I: <strong>{diemPhan1.toFixed(2)}/3.0đ</strong> ({soCauDungMCQ}/12 câu đúng)</span>
                  <span>Phần II: <strong>{diemPhan2.toFixed(2)}/4.0đ</strong></span>
                  <span>Phần III: <strong>{diemPhan3.toFixed(2)}/3.0đ</strong></span>
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
        {/* PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN (12 CÂU - 3,0 ĐIỂM)   */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-sky-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (12 CÂU - 3,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-sky-800/80 px-3 py-1 rounded-full text-sky-200 font-medium">
              0,25 điểm / câu • 4 lựa chọn (1 đáp án đúng duy nhất)
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
        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (04 CÂU - 4,0 ĐIỂM)          */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-emerald-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (04 CÂU - 4,0 ĐIỂM)
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
        {/* PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN (06 CÂU - 3,0 ĐIỂM)     */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN (06 CÂU - 3,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              0,50 điểm / câu • Học sinh tự điền kết quả vào ô trống
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
