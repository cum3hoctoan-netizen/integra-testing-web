'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA ĐÁNH GIÁ NĂNG LỰC TOÁN HỌC LỚP 10';
const EXAM_SUBTITLE = 'Chương trình GDPT 2018 - Thời gian làm bài: 75 phút';
const EXAM_TIME_NOTE =
  'Thời gian làm bài: 75 phút • Đề thi gồm 12 câu trắc nghiệm ABCD (3,0đ), 04 câu Đúng/Sai (4,0đ) và 06 câu trả lời ngắn (3,0đ)';

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

// Thang điểm Bộ GD&ĐT cho phần Đúng/Sai (tối đa 1.0 điểm/câu, tổng 4.0 điểm cho 4 câu)
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
    skill: 'Phép toán giao của hai tập hợp số',
    points: 0.25,
    text: 'Cho hai tập hợp $A = [-2; 3)$ và $B = (1; 5]$. Tập hợp giao $A \\cap B$ là:',
    options: [
      { text: '$[-2; 5]$', isCorrect: false },
      { text: '$(1; 3)$', isCorrect: true },
      { text: '$[-2; 1]$', isCorrect: false },
      { text: '$[3; 5]$', isCorrect: false },
    ],
    explanation:
      'Ta có $A \\cap B = \\{x \\in \\mathbb{R} \\mid -2 \\le x < 3 \\text{ và } 1 < x \\le 5\\} = (1; 3)$.',
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Mệnh đề phủ định chứa lượng từ với mọi',
    points: 0.25,
    text: 'Phủ định của mệnh đề $P: "\\forall x \\in \\mathbb{R}, x^2 - x + 7 > 0"$ là mệnh đề nào sau đây?',
    options: [
      { text: '$\\overline{P}: "\\exists x \\in \\mathbb{R}, x^2 - x + 7 \\le 0"$', isCorrect: true },
      { text: '$\\overline{P}: "\\forall x \\in \\mathbb{R}, x^2 - x + 7 \\le 0"$', isCorrect: false },
      { text: '$\\overline{P}: "\\exists x \\in \\mathbb{R}, x^2 - x + 7 < 0"$', isCorrect: false },
      { text: '$\\overline{P}: "\\exists x \\in \\mathbb{R}, x^2 - x + 7 = 0"$', isCorrect: false },
    ],
    explanation:
      'Phủ định của lượng từ $\\forall$ là $\\exists$, phủ định của dấu so sánh $>$ là $\\le$. Do đó $\\overline{P}: "\\exists x \\in \\mathbb{R}, x^2 - x + 7 \\le 0"$.',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Dấu của các giá trị lượng giác của một góc tù',
    points: 0.25,
    text: 'Với góc tù $\\alpha$ ($90^\\circ < \\alpha < 180^\\circ$), khẳng định nào sau đây về giá trị lượng giác là **đúng**?',
    options: [
      { text: '$\\sin \\alpha < 0$ và $\\cos \\alpha > 0$', isCorrect: false },
      { text: '$\\sin \\alpha > 0$ và $\\cos \\alpha < 0$', isCorrect: true },
      { text: '$\\sin \\alpha > 0$ và $\\cos \\alpha > 0$', isCorrect: false },
      { text: '$\\sin \\alpha < 0$ và $\\cos \\alpha < 0$', isCorrect: false },
    ],
    explanation:
      'Trên nửa đường tròn đơn vị, với góc tù $90^\\circ < \\alpha < 180^\\circ$, điểm biểu diễn $M(x_0; y_0)$ có tung độ $y_0 = \\sin \\alpha > 0$ và hoành độ $x_0 = \\cos \\alpha < 0$.',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Độ chính xác của phép đo số gần đúng',
    points: 0.25,
    text: 'Khi đo cạnh của một mảnh đất hình vuông, kết quả thu được là $a = 10\\text{ m} \\pm 0,2\\text{ m}$. Độ chính xác $d$ của phép đo này bằng:',
    options: [
      { text: '$d = 10\\text{ m}$', isCorrect: false },
      { text: '$d = 0,2\\text{ m}$', isCorrect: true },
      { text: '$d = 0,1\\text{ m}$', isCorrect: false },
      { text: '$d = 0,02\\text{ m}$', isCorrect: false },
    ],
    explanation:
      'Kết quả đo dạng $a = \\bar{a} \\pm d$, suy ra độ chính xác $d = 0,2\\text{ m}$.',
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Kiểm tra nghiệm của hệ bất phương trình bậc nhất hai ẩn',
    points: 0.25,
    text: 'Cặp số $(x; y) = (2; -1)$ là một nghiệm của hệ bất phương trình nào sau đây?',
    options: [
      { text: '$\\begin{cases} x + y - 3 > 0 \\\\ 2x - y < 0 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} 2x + y > 1 \\\\ x - 2y \\le 4 \\end{cases}$', isCorrect: true },
      { text: '$\\begin{cases} x - y < 0 \\\\ x + 3y > 1 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} 3x + y \\le 4 \\\\ x - y < 1 \\end{cases}$', isCorrect: false },
    ],
    explanation:
      'Thay $(x; y) = (2; -1)$ vào hệ B:<br>$$\\begin{cases} 2(2) + (-1) = 3 > 1 \\quad (\\text{Đúng}) \\\\ 2 - 2(-1) = 4 \\le 4 \\quad (\\text{Đúng}) \\end{cases}.$$<br>Do đó $(2; -1)$ là nghiệm của hệ B.',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Định lý côsin tính độ dài cạnh trong tam giác',
    points: 0.25,
    text: 'Cho tam giác $ABC$ có cạnh $b = 7$, $c = 5$ và góc $\\widehat{A} = 60^\\circ$. Độ dài cạnh $a$ bằng:',
    options: [
      { text: '$\\sqrt{39}$', isCorrect: true },
      { text: '$\\sqrt{109}$', isCorrect: false },
      { text: '$7$', isCorrect: false },
      { text: '$\\sqrt{19}$', isCorrect: false },
    ],
    explanation:
      'Áp dụng Định lý Côsin trong tam giác $ABC$:<br>$$a^2 = b^2 + c^2 - 2bc \\cos A = 7^2 + 5^2 - 2 \\cdot 7 \\cdot 5 \\cdot \\cos 60^\\circ = 49 + 25 - 35 = 39 \\implies a = \\sqrt{39}.$$',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Quy tắc quy tròn số gần đúng đến hàng chục',
    points: 0.25,
    text: 'Quy tròn số gần đúng $a = 2374,56$ đến hàng chục ta được số quy tròn là:',
    options: [
      { text: '$2370$', isCorrect: true },
      { text: '$2380$', isCorrect: false },
      { text: '$2374,6$', isCorrect: false },
      { text: '$2400$', isCorrect: false },
    ],
    explanation:
      'Hàng quy tròn là hàng chục (chữ số 7). Chữ số ngay sau hàng quy tròn là 4 ($< 5$), nên ta giữ nguyên chữ số 7 và thay các chữ số ở phần nguyên sau đó bằng 0, bỏ phần thập phân. Kết quả là $2370$.',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Phần bù và hiệu của hai tập hợp số',
    points: 0.25,
    text: 'Cho hai tập hợp $A = \\{x \\in \\mathbb{R} \\mid -2 \\le x < 4\\}$ và $B = (1; 6]$. Tập hợp phần bù $C_A(A \\cap B)$ bằng:',
    options: [
      { text: '$[-2; 1]$', isCorrect: true },
      { text: '$(1; 4)$', isCorrect: false },
      { text: '$[4; 6]$', isCorrect: false },
      { text: '$[-2; 1)$', isCorrect: false },
    ],
    explanation:
      'Ta có $A = [-2; 4)$ và $B = (1; 6] \\implies A \\cap B = (1; 4)$.<br>Phần bù $C_A(A \\cap B) = A \\setminus (A \\cap B) = [-2; 4) \\setminus (1; 4) = [-2; 1]$.',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Diện tích hình phẳng tạo bởi miền nghiệm của hệ bất phương trình',
    points: 0.25,
    text: 'Miền nghiệm của hệ bất phương trình $\\begin{cases} x + y \\le 3 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$ trên mặt phẳng tọa độ $Oxy$ có diện tích bằng:',
    options: [
      { text: '$9$', isCorrect: false },
      { text: '$4,5$', isCorrect: true },
      { text: '$3$', isCorrect: false },
      { text: '$6$', isCorrect: false },
    ],
    explanation:
      'Miền nghiệm là tam giác vuông $OAB$ với $O(0;0)$, $A(3;0)$, $B(0;3)$.<br>Diện tích $S = \\dfrac{1}{2} OA \\cdot OB = \\dfrac{1}{2} \\cdot 3 \\cdot 3 = 4,5$.',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Công thức diện tích tam giác tính góc nhọn',
    points: 0.25,
    text: 'Cho tam giác $ABC$ có $AB = 6$, $AC = 8$ và diện tích $S = 12\\sqrt{3}$. Biết góc $\\widehat{A}$ là góc nhọn, số đo góc $\\widehat{A}$ bằng:',
    options: [
      { text: '$30^\\circ$', isCorrect: false },
      { text: '$45^\\circ$', isCorrect: false },
      { text: '$60^\\circ$', isCorrect: true },
      { text: '$120^\\circ$', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức diện tích $S = \\dfrac{1}{2} AB \\cdot AC \\cdot \\sin A \\implies 12\\sqrt{3} = \\dfrac{1}{2} \\cdot 6 \\cdot 8 \\cdot \\sin A = 24 \\sin A \\implies \\sin A = \\dfrac{\\sqrt{3}}{2}$.<br>Vì góc $\\widehat{A}$ nhọn nên $\\widehat{A} = 60^\\circ$.',
  },
  {
    id: 'mcq11',
    number: 11,
    type: 'mcq',
    skill: 'Thiết lập hệ bất phương trình bậc nhất hai ẩn từ bài toán thực tế',
    points: 0.25,
    text: 'Một xưởng đúc kim loại sản xuất hai loại hợp kim $X$ và $Y$. Để đúc $1\\text{ kg}$ hợp kim $X$ cần $0,5\\text{ kg}$ đồng và $0,5\\text{ kg}$ kẽm. Để đúc $1\\text{ kg}$ hợp kim $Y$ cần $0,8\\text{ kg}$ đồng và $0,2\\text{ kg}$ kẽm. Xưởng hiện có tối đa $16\\text{ kg}$ đồng và $7\\text{ kg}$ kẽm. Gọi $x, y$ lần lượt là số kg hợp kim $X$ và $Y$ đúc được ($x \\ge 0, y \\ge 0$). Hệ bất phương trình biểu diễn các điều kiện ràng buộc là:',
    options: [
      { text: '$\\begin{cases} 5x + 8y \\le 160 \\\\ 5x + 2y \\le 70 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$', isCorrect: true },
      { text: '$\\begin{cases} 5x + 5y \\le 160 \\\\ 8x + 2y \\le 70 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} 0,5x + 0,2y \\le 16 \\\\ 0,8x + 0,5y \\le 7 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} 8x + 5y \\le 160 \\\\ 2x + 5y \\le 70 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$', isCorrect: false },
    ],
    explanation:
      '• Ràng buộc về đồng: $0,5x + 0,8y \\le 16 \\iff 5x + 8y \\le 160$.<br>• Ràng buộc về kẽm: $0,5x + 0,2y \\le 7 \\iff 5x + 2y \\le 70$.<br>• Điều kiện không âm: $x \\ge 0, y \\ge 0$.<br>Kết hợp lại ta thu được hệ ở phương án A.',
  },
  {
    id: 'mcq12',
    number: 12,
    type: 'mcq',
    skill: 'Ứng dụng định lý côsin đo khoảng cách không thể trực tiếp tiếp cận',
    points: 0.25,
    text: 'Để xác định khoảng cách giữa hai vị trí $A$ và $B$ ở hai bên bờ một hồ nước mà không thể đo trực tiếp, quan trắc viên chọn vị trí $C$ sao cho nhìn thấy cả $A$ và $B$. Qua đo đạc thu được $CA = 80\\text{ m}$, $CB = 120\\text{ m}$ và góc $\\widehat{ACB} = 120^\\circ$. Khoảng cách $AB$ gần nhất với giá trị nào sau đây?',
    options: [
      { text: '$174,4\\text{ m}$', isCorrect: true },
      { text: '$105,8\\text{ m}$', isCorrect: false },
      { text: '$200\\text{ m}$', isCorrect: false },
      { text: '$144,2\\text{ m}$', isCorrect: false },
    ],
    explanation:
      'Áp dụng Định lý Côsin trong tam giác $ABC$:<br>$$AB^2 = CA^2 + CB^2 - 2 CA \\cdot CB \\cos 120^\\circ = 80^2 + 120^2 - 2 \\cdot 80 \\cdot 120 \\cdot \\left(-\\dfrac{1}{2}\\right) = 6400 + 14400 + 9600 = 30400.$$<br>Suy ra $AB = \\sqrt{30400} \\approx 174,3559\\text{ m} \\approx 174,4\\text{ m}$.',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 13,
    type: 'tf',
    skill: 'Tập hợp, phương trình bậc hai có tham số và quan hệ bao hàm',
    text: 'Cho hai tập hợp $A = \\{x \\in \\mathbb{R} \\mid |x - 1| \\le 2\\}$ và $B = \\{x \\in \\mathbb{R} \\mid x^2 - 2mx + m^2 - 1 = 0\\}$ (với $m$ là tham số). Xét tính đúng/sai của các phát biểu sau:',
    items: [
      {
        key: 'a',
        text: 'Tập hợp $A$ biểu diễn dưới dạng khoảng/đoạn là $A = [-1; 3]$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Tập hợp $B$ luôn có đúng $2$ phần tử phân biệt $x_1 = m - 1$ và $x_2 = m + 1$ với mọi $m \\in \\mathbb{R}$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Khi $m = 0$, tập hợp $B = \\{-1; 1\\}$ và $A \\cap B = \\varnothing$',
        correct: false,
      },
      {
        key: 'd',
        text: 'Có $3$ giá trị nguyên của tham số $m$ để $B \\subset A$',
        correct: true,
      },
    ],
    explanation:
      '• **a) Đúng.** $|x - 1| \\le 2 \\iff -2 \\le x - 1 \\le 2 \\iff -1 \\le x \\le 3 \\implies A = [-1; 3]$.<br>• **b) Đúng.** $x^2 - 2mx + m^2 - 1 = 0 \\iff (x - m)^2 = 1 \\iff x = m - 1$ hoặc $x = m + 1$.<br>• **c) Sai.** Khi $m = 0 \\implies B = \\{-1; 1\\} \\implies A \\cap B = \\{-1; 1\\} \\neq \\varnothing$.<br>• **d) Đúng.** Để $B \\subset A \\iff \\begin{cases} m - 1 \\ge -1 \\\\ m + 1 \\le 3 \\end{cases} \\iff \\begin{cases} m \\ge 0 \\\\ m \\le 2 \\end{cases} \\iff 0 \\le m \\le 2$. Các giá trị nguyên là $m \\in \\{0; 1; 2\\}$ (có 3 giá trị).',
  },
  {
    id: 'tf2',
    number: 14,
    type: 'tf',
    skill: 'Sai số tuyệt đối, sai số tương đối và quy tròn số trong bài toán đo đạc thực tế',
    text: 'Một kỹ sư sử dụng thiết bị đo laser khảo sát mảnh đất hình chữ nhật. Kết quả đo chiều dài $L$ và chiều rộng $W$ thu được là: $L = 25,4\\text{ m} \\pm 0,1\\text{ m}$ và $W = 12,5\\text{ m} \\pm 0,1\\text{ m}$. Xét tính đúng/sai của các khẳng định sau:',
    items: [
      {
        key: 'a',
        text: 'Sai số tuyệt đối của phép đo chiều dài $L$ được ước lượng là $d_L = 0,1\\text{ m}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Sai số tương đối của phép đo chiều rộng $W$ nhỏ hơn sai số tương đối của phép đo chiều dài $L$',
        correct: false,
      },
      {
        key: 'c',
        text: 'Chu vi $P$ của mảnh đất thỏa mãn $75,4\\text{ m} \\le P \\le 76,2\\text{ m}$',
        correct: true,
      },
      {
        key: 'd',
        text: 'Quy tròn diện tích trung bình $S = 317,5\\text{ m}^2$ đến hàng đơn vị ta được $317\\text{ m}^2$',
        correct: false,
      },
    ],
    explanation:
      '• **a) Đúng.** Theo dạng kết quả $L = \\bar{L} \\pm d_L$, sai số tuyệt đối ước lượng là $d_L = 0,1\\text{ m}$.<br>• **b) Sai.** $\\delta_L = \\dfrac{0,1}{25,4} \\approx 0,39\\%$; $\\delta_W = \\dfrac{0,1}{12,5} = 0,8\\%$. Do đó $\\delta_W > \\delta_L$.<br>• **c) Đúng.** $P = 2(L + W)$. Giá trị nhỏ nhất $P_{\\min} = 2(25,3 + 12,4) = 75,4\\text{ m}$; Giá trị lớn nhất $P_{\\max} = 2(25,5 + 12,6) = 76,2\\text{ m}$.<br>• **d) Sai.** Số $317,5$ khi quy tròn đến hàng đơn vị (chữ số 7, sau đó là 5) ta nâng lên thành $318\\text{ m}^2$.',
  },
  {
    id: 'tf3',
    number: 15,
    type: 'tf',
    skill: 'Quy hoạch tuyến tính: tối ưu hóa lợi nhuận sản xuất thuốc từ nguồn dinh dưỡng',
    text: 'Một công ty dược phẩm sản xuất hai loại thuốc bổ $A$ và $B$ từ hai chất dinh dưỡng $X$ và $Y$.<br>• Mỗi viên thuốc $A$ chứa $2\\text{ mg}$ chất $X$ và $1\\text{ mg}$ chất $Y$, mang lại lợi nhuận $4.000\\text{ đồng}$.<br>• Mỗi viên thuốc $B$ chứa $1\\text{ mg}$ chất $X$ và $2\\text{ mg}$ chất $Y$, mang lại lợi nhuận $5.000\\text{ đồng}$.<br>Công ty có tối đa $80\\text{ mg}$ chất $X$ và $100\\text{ mg}$ chất $Y$ mỗi ngày. Gọi $x, y$ ($x, y \\ge 0$) lần lượt là số viên thuốc $A$ và $B$ sản xuất trong một ngày. Xét tính đúng/sai của các phát biểu sau:',
    items: [
      {
        key: 'a',
        text: 'Hệ bất phương trình mô tả các điều kiện ràng buộc về nguyên liệu là $\\begin{cases} 2x + y \\le 80 \\\\ x + 2y \\le 100 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Miền nghiệm của hệ bất phương trình ràng buộc là miền tứ giác $OABC$ kể cả biên với các đỉnh $O(0;0), A(40;0), B(20;40), C(0;50)$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Phương án sản xuất $30$ viên thuốc $A$ và $30$ viên thuốc $B$ mang lại lợi nhuận lớn hơn phương án sản xuất tại đỉnh $B(20;40)$',
        correct: false,
      },
      {
        key: 'd',
        text: 'Lợi nhuận lớn nhất công ty có thể thu được trong một ngày là $280.000\\text{ đồng}$ khi sản xuất $20$ viên thuốc $A$ và $40$ viên thuốc $B$',
        correct: true,
      },
    ],
    explanation:
      '• **a) Đúng.** Ràng buộc chất $X$: $2x + y \\le 80$; Ràng buộc chất $Y$: $x + 2y \\le 100$; $x \\ge 0, y \\ge 0$.<br>• **b) Đúng.** Vẽ các đường biên ta được tứ giác $OABC$ với $O(0;0), A(40;0), B(20;40), C(0;50)$.<br>• **c) Sai.** Phương án $(30; 30)$ vi phạm điều kiện $2(30) + 30 = 90 > 80$ (không thuộc miền nghiệm).<br>• **d) Đúng.** Hàm lợi nhuận $F(x, y) = 4x + 5y$ (nghìn đồng). Tính tại các đỉnh: $F(O) = 0, F(A) = 160, F(B) = 280, F(C) = 250$. Vậy lợi nhuận tối đa bằng $280.000\\text{ đồng}$.',
  },
  {
    id: 'tf4',
    number: 16,
    type: 'tf',
    skill: 'Hệ thức lượng trong tam giác: bài toán chuyển động của tàu biển trên biển',
    text: 'Một con tàu chở hàng khởi hành từ cảng $O$ đi thẳng theo hướng đông với vận tốc $30\\text{ km/h}$. Cùng lúc đó, một tàu cứu hộ khởi hành từ cảng $O$ đi thẳng theo hướng tạo với hướng đông một góc $60^\\circ$ với vận tốc $40\\text{ km/h}$. Sau $2\\text{ giờ}$ di chuyển, tàu chở hàng đến vị trí $A$ và tàu cứu hộ đến vị trí $B$. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Khoảng cách từ cảng $O$ đến vị trí $A$ là $60\\text{ km}$ và đến vị trí $B$ là $80\\text{ km}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Khoảng cách giữa hai tàu sau $2\\text{ giờ}$ di chuyển bằng $100\\text{ km}$',
        correct: false,
      },
      {
        key: 'c',
        text: 'Khoảng cách giữa hai tàu sau $2\\text{ giờ}$ bằng $20\\sqrt{13}\\text{ km}$ (xấp xỉ $72,1\\text{ km}$)',
        correct: true,
      },
      {
        key: 'd',
        text: 'Diện tích vùng biển tạo bởi tam giác $OAB$ sau $2\\text{ giờ}$ bằng $1200\\sqrt{3}\\text{ km}^2$',
        correct: true,
      },
    ],
    explanation:
      '• **a) Đúng.** $OA = 30 \\cdot 2 = 60\\text{ km}$, $OB = 40 \\cdot 2 = 80\\text{ km}$.<br>• **b) Sai.** $AB^2 = OA^2 + OB^2 - 2 OA \\cdot OB \\cos 60^\\circ = 60^2 + 80^2 - 2(60)(80)(0,5) = 5200 \\implies AB = \\sqrt{5200} = 20\\sqrt{13} \\approx 72,1\\text{ km} \\neq 100\\text{ km}$.<br>• **c) Đúng.** $AB = 20\\sqrt{13}\\text{ km} \\approx 72,1\\text{ km}$.<br>• **d) Đúng.** $S_{\\triangle OAB} = \\dfrac{1}{2} OA \\cdot OB \\cdot \\sin 60^\\circ = \\dfrac{1}{2} \\cdot 60 \\cdot 80 \\cdot \\dfrac{\\sqrt{3}}{2} = 1200\\sqrt{3}\\text{ km}^2$.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 17,
    type: 'shortans',
    skill: 'Công thức đếm phần tử hợp của ba tập hợp (Biểu đồ Ven)',
    points: 0.5,
    text: 'Một lớp học có $45$ học sinh. Qua khảo sát việc sử dụng các nền tảng học trực tuyến, có $28$ học sinh dùng Zalo, $20$ học sinh dùng Zoom, $18$ học sinh dùng Google Meet; $10$ học sinh dùng cả Zalo và Zoom, $8$ học sinh dùng cả Zoom và Google Meet, $9$ học sinh dùng cả Zalo và Google Meet; $5$ học sinh dùng cả $3$ nền tảng. Hỏi có bao nhiêu học sinh trong lớp không sử dụng bất kỳ nền tảng nào trong $3$ nền tảng trên?',
    placeholder: 'Nhập số học sinh (VD: 3)',
    correctDisplay: '1',
    explanation:
      'Số học sinh sử dụng ít nhất một nền tảng học trực tuyến là:<br>$$N = 28 + 20 + 18 - (10 + 8 + 9) + 5 = 66 - 27 + 5 = 44\\text{ (học sinh)}.$$<br>Số học sinh không sử dụng nền tảng nào là: $45 - 44 = 1\\text{ (học sinh)}$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/học sinh/gi, '').trim();
      return c === '1';
    },
  },
  {
    id: 'sa2',
    number: 18,
    type: 'shortans',
    skill: 'Sai số tuyệt đối tối đa trong phép tính diện tích hình vuông',
    points: 0.5,
    text: 'Một người đo cạnh của một mảnh đất hình vuông thu được kết quả $x = 20\\text{ m} \\pm 0,1\\text{ m}$. Sai số tuyệt đối tối đa của phép tính diện tích mảnh đất hình vuông đó bằng bao nhiêu mét vuông?',
    placeholder: 'Nhập số thập phân (m², VD: 2.15)',
    correctDisplay: '4,01',
    explanation:
      'Diện tích trung bình $S_0 = 20^2 = 400\\text{ m}^2$.<br>Giá trị cạnh lớn nhất $x_{\\max} = 20,1\\text{ m} \\implies S_{\\max} = 20,1^2 = 404,01\\text{ m}^2$.<br>Sai số tuyệt đối tối đa của diện tích là: $\\Delta_S = S_{\\max} - S_0 = 404,01 - 400 = 4,01\\text{ m}^2$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/,/g, '.').replace(/m2|m²|mét vuông/gi, '').trim();
      return c === '4.01';
    },
  },
  {
    id: 'sa3',
    number: 19,
    type: 'shortans',
    skill: 'Ứng dụng định lý sin và lượng giác tính chiều cao ngọn núi không thể tiếp cận',
    points: 0.5,
    text: 'Để đo chiều cao $CD$ của một ngọn núi mà không thể leo lên đỉnh $C$, người ta chọn hai điểm $A$ và $B$ trên mặt đất bằng phẳng sao cho $A, B, D$ thẳng hàng ($D$ là chân núi). Đo đạc cho kết quả: khoảng cách $AB = 400\\text{ m}$, góc nâng $\\widehat{CAD} = 30^\\circ$ và $\\widehat{CBD} = 45^\\circ$. Tính chiều cao $CD$ của ngọn núi theo đơn vị mét (làm tròn kết quả đến hàng đơn vị).',
    placeholder: 'Nhập số nguyên (mét, VD: 382)',
    correctDisplay: '546',
    explanation:
      'Trong tam giác $ABC$, ta có $\\widehat{ACB} = \\widehat{CBD} - \\widehat{CAD} = 45^\\circ - 30^\\circ = 15^\\circ$.<br>Áp dụng Định lý Sin trong tam giác $ABC$:<br>$$\\dfrac{BC}{\\sin 30^\\circ} = \\dfrac{AB}{\\sin 15^\\circ} \\implies BC = \\dfrac{400 \\cdot \\sin 30^\\circ}{\\sin 15^\\circ} = \\dfrac{200}{\\sin 15^\\circ}\\text{ (m)}.$$<br>Trong tam giác vuông $BCD$ tại $D$:<br>$$CD = BC \\cdot \\sin 45^\\circ = \\dfrac{200 \\cdot \\sin 45^\\circ}{\\sin 15^\\circ} = 200(\\sqrt{3} + 1) \\approx 546,41\\text{ m}.$$<br>Làm tròn đến hàng đơn vị thu được $546\\text{ m}$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/m|mét/gi, '').trim();
      return c === '546';
    },
  },
  {
    id: 'sa4',
    number: 20,
    type: 'shortans',
    skill: 'Quy hoạch tuyến tính: tối ưu hóa lợi nhuận trồng trọt hai loại cây trồng',
    points: 0.5,
    text: 'Một bác nông dân dự định trồng khoai lang và đậu tương trên diện tích tối đa $10\\text{ ha}$. Chi phí đầu tư cho mỗi ha khoai lang là $4\\text{ triệu đồng}$ và cần $20\\text{ công lao động}$, mang lại lợi nhuận $30\\text{ triệu đồng/ha}$. Chi phí cho mỗi ha đậu tương là $6\\text{ triệu đồng}$ và cần $10\\text{ công lao động}$, mang lại lợi nhuận $25\\text{ triệu đồng/ha}$. Bác nông dân có tổng số vốn đầu tư tối đa là $48\\text{ triệu đồng}$ và quỹ lao động tối đa là $140\\text{ công}$. Tổng lợi nhuận lớn nhất bác nông dân có thể thu được bằng bao nhiêu triệu đồng?',
    placeholder: 'Nhập giá trị lợi nhuận (triệu đồng, VD: 175)',
    correctDisplay: '260',
    explanation:
      'Gọi $x, y$ lần lượt là diện tích trồng khoai lang và đậu tương ($x, y \\ge 0$).<br>Hệ bất phương trình ràng buộc:<br>$$\\begin{cases} x + y \\le 10 \\\\ 4x + 6y \\le 48 \\iff 2x + 3y \\le 24 \\\\ 20x + 10y \\le 140 \\iff 2x + y \\le 14 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$$<br>Miền nghiệm là đa giác tứ giác với các đỉnh $O(0;0), A(7;0), B(4,5; 5), D(0;8)$.<br>Hàm lợi nhuận $F(x, y) = 30x + 25y$ (triệu đồng).<br>Tính giá trị tại các đỉnh:<br>• $F(O) = 0$<br>• $F(A) = 210$<br>• $F(B) = 30(4,5) + 25(5) = 260$<br>• $F(D) = 200$<br>Lợi nhuận lớn nhất bằng $260\\text{ triệu đồng}$ khi trồng $4,5\\text{ ha}$ khoai lang và $5\\text{ ha}$ đậu tương.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/triệu( đồng)?/gi, '').trim();
      return c === '260';
    },
  },
  {
    id: 'sa5',
    number: 21,
    type: 'shortans',
    skill: 'Hệ thức lượng trong tam giác vuông: khoảng cách ngắn nhất từ đỉnh đến cạnh huyền',
    points: 0.5,
    text: 'Cho tam giác $ABC$ vuông tại $A$ có $AB = 60\\text{ km}$ và $AC = 80\\text{ km}$. Một con tàu di chuyển trên đoạn thẳng $BC$. Khoảng cách ngắn nhất từ đỉnh $A$ đến con tàu trên đoạn $BC$ bằng bao nhiêu km?',
    placeholder: 'Nhập khoảng cách số (km, VD: 36)',
    correctDisplay: '48',
    explanation:
      'Khoảng cách ngắn nhất từ điểm $A$ đến con tàu trên đoạn $BC$ chính là độ dài đường cao $AH$ hạ từ $A$ xuống cạnh huyền $BC$.<br>Cạnh huyền $BC = \\sqrt{AB^2 + AC^2} = \\sqrt{60^2 + 80^2} = 100\\text{ km}$.<br>Đường cao $AH = \\dfrac{AB \\cdot AC}{BC} = \\dfrac{60 \\cdot 80}{100} = 48\\text{ km}$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/km/gi, '').trim();
      return c === '48';
    },
  },
  {
    id: 'sa6',
    number: 22,
    type: 'shortans',
    skill: 'Tìm tham số m để giá trị lớn nhất của hàm mục tiêu trên miền nghiệm đạt giá trị cho trước',
    points: 0.5,
    text: 'Cho miền nghiệm $D$ của hệ bất phương trình $\\begin{cases} x + y \\le 4 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$. Tìm giá trị của tham số $m$ để giá trị lớn nhất của biểu thức $F(x; y) = mx + 2y$ trên miền $D$ bằng $12$.',
    placeholder: 'Nhập giá trị của m (VD: 5)',
    correctDisplay: '3',
    explanation:
      'Miền nghiệm $D$ là tam giác $OAB$ với $O(0;0)$, $A(4;0)$, $B(0;4)$.<br>Giá trị của $F(x; y) = mx + 2y$ tại các đỉnh là:<br>• $F(O) = 0$<br>• $F(B) = 2(4) = 8$<br>• $F(A) = 4m$<br>Vì giá trị lớn nhất bằng $12 > 8$, giá trị lớn nhất phải đạt tại đỉnh $A(4;0)$.<br>Suy ra $F(A) = 4m = 12 \\iff m = 3$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/m\s*=\s*/gi, '').trim();
      return c === '3';
    },
  },
];

export default function Toan10DanhGiaNangLucPage() {
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

  // 4. ĐỒNG HỒ ĐẾM NGƯỢC (75 PHÚT = 4500 GIÂY)
  const [timeLeft, setTimeLeft] = useState<number>(75 * 60);

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
    const ma = maHocSinh.trim() || 'HS10-DGNL-01';
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
      thoiGianLamGiay: 75 * 60 - timeLeft,
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
            TOÁN 10 • ĐỀ KIỂM TRA ĐÁNH GIÁ NĂNG LỰC
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS10-DGNL-01'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '10'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Phần I: <strong>{diemPhan1.toFixed(2)}/3.0đ</strong> ({soCauDungMCQ}/12 câu đúng)</span>
                  <span>Phần II: <strong>{diemPhan2.toFixed(2)}/4.0đ</strong></span>
                  <span>Phần III: <strong>{diemPhan3.toFixed(2)}/3.0đ</strong></span>
                  <span>Thời gian làm bài: <strong>{Math.max(1, Math.round((75 * 60 - timeLeft) / 60))} phút</strong></span>
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
