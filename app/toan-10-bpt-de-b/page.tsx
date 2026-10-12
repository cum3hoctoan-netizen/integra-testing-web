'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA MÔN TOÁN LỚP 10 -- ĐỀ B';
const EXAM_SUBTITLE = 'CHỦ ĐỀ: BẤT PHƯƠNG TRÌNH VÀ HỆ BẤT PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN';
const EXAM_TIME_NOTE = '(Thời gian làm bài: 45 phút • 12 câu trắc nghiệm + 2 bài Đúng/Sai + 3 câu trả lời ngắn)';

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

// Thang điểm Bộ GD&ĐT 2025 cho phần Đúng/Sai (tối đa 2.0 điểm/câu)
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
    id: 'bpt1',
    number: 1,
    type: 'mcq',
    skill: 'Kiểm tra nghiệm của bất phương trình bậc nhất hai ẩn',
    points: 0.25,
    text: 'Cặp số nào sau đây là một nghiệm của bất phương trình $3x - 2y + 4 < 0$?',
    options: [
      { text: '$(1; 1)$', isCorrect: false },
      { text: '$(0; 1)$', isCorrect: false },
      { text: '$(-1; 2)$', isCorrect: true },
      { text: '$(2; 0)$', isCorrect: false },
    ],
    explanation:
      'Thay cặp số $(-1; 2)$ vào bất phương trình ta được: $3(-1) - 2(2) + 4 = -3 < 0$ (mệnh đề đúng).<br>Các cặp số còn lại khi thay vào đều cho kết quả không thỏa mãn bất phương trình.',
  },
  {
    id: 'bpt2',
    number: 2,
    type: 'mcq',
    skill: 'Xác định điểm thuộc miền nghiệm của bất phương trình',
    points: 0.25,
    text: 'Miền nghiệm của bất phương trình $2x - y \\ge -2$ là nửa mặt phẳng (kể cả đường thẳng $2x - y = -2$) chứa điểm nào dưới đây?',
    options: [
      { text: '$(-2; 1)$', isCorrect: false },
      { text: '$(0; 0)$', isCorrect: true },
      { text: '$(-3; 0)$', isCorrect: false },
      { text: '$(-1; 3)$', isCorrect: false },
    ],
    explanation:
      'Thay điểm $O(0; 0)$ vào bất phương trình: $2(0) - 0 = 0 \\ge -2$ (đúng). Do đó nửa mặt phẳng miền nghiệm chứa gốc tọa độ $O(0; 0)$.',
  },
  {
    id: 'bpt3',
    number: 3,
    type: 'mcq',
    skill: 'Tìm tham số m để cặp số là nghiệm của bất phương trình',
    points: 0.25,
    text: 'Tìm tất cả các giá trị của tham số $m$ để cặp số $(x; y) = (1; -3)$ là một nghiệm của bất phương trình $(2m - 1)x + my - 2 > 0$.',
    options: [
      { text: '$m > -3$', isCorrect: false },
      { text: '$m < -3$', isCorrect: true },
      { text: '$m > 3$', isCorrect: false },
      { text: '$m < 3$', isCorrect: false },
    ],
    explanation:
      'Thay $x = 1, y = -3$ vào bất phương trình ta có:<br>$$(2m - 1)(1) + m(-3) - 2 > 0 \\Leftrightarrow 2m - 1 - 3m - 2 > 0 \\Leftrightarrow -m - 3 > 0 \\Leftrightarrow m < -3.$$',
  },
  {
    id: 'bpt4',
    number: 4,
    type: 'mcq',
    skill: 'Kiểm tra nghiệm của hệ bất phương trình bậc nhất hai ẩn',
    points: 0.25,
    text: 'Cho hệ bất phương trình $\\begin{cases} 2x - y + 3 \\ge 0 \\\\ x + 3y - 1 > 0 \\end{cases}$. Cặp số nào sau đây là một nghiệm của hệ bất phương trình đã cho?',
    options: [
      { text: '$(0; 0)$', isCorrect: false },
      { text: '$(1; 1)$', isCorrect: true },
      { text: '$(-2; 0)$', isCorrect: false },
      { text: '$(0; -1)$', isCorrect: false },
    ],
    explanation:
      'Thay cặp số $(1; 1)$ vào hệ:<br>$\\begin{cases} 2(1) - 1 + 3 = 4 \\ge 0 \\quad (\\text{đúng}) \\\\ 1 + 3(1) - 1 = 3 > 0 \\quad (\\text{đúng}) \\end{cases}$.<br>Vậy $(1; 1)$ là một nghiệm của hệ bất phương trình.',
  },
  {
    id: 'bpt5',
    number: 5,
    type: 'mcq',
    skill: 'Xác định hệ bất phương trình từ miền nghiệm hình học',
    points: 0.25,
    text: 'Miền không bị gạch chéo (kể cả các đường biên) được giới hạn bởi ba đường thẳng $d_1: x = 0$, $d_2: x - y = 0$ và $d_3: x + 2y = 4$ biểu diễn miền nghiệm của hệ bất phương trình nào sau đây?',
    options: [
      { text: '$\\begin{cases} x \\ge 0 \\\\ x - y \\ge 0 \\\\ x + 2y \\le 4 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} x \\ge 0 \\\\ x - y \\le 0 \\\\ x + 2y \\le 4 \\end{cases}$', isCorrect: true },
      { text: '$\\begin{cases} y \\ge 0 \\\\ x - y \\le 0 \\\\ x + 2y \\ge 4 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} x \\le 0 \\\\ x - y \\le 0 \\\\ x + 2y \\le 4 \\end{cases}$', isCorrect: false },
    ],
    explanation:
      'Thử điểm $(0; 1)$ nằm trong miền không bị gạch chéo:<br>$x = 0 \\ge 0$, $0 - 1 = -1 \\le 0$, $0 + 2(1) = 2 \\le 4$.<br>Do đó hệ bất phương trình tương ứng là $\\begin{cases} x \\ge 0 \\\\ x - y \\le 0 \\\\ x + 2y \\le 4 \\end{cases}$.',
  },
  {
    id: 'bpt6',
    number: 6,
    type: 'mcq',
    skill: 'Xác định tọa độ đỉnh của miền nghiệm tam giác',
    points: 0.25,
    text: 'Miền nghiệm của hệ bất phương trình $\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ 2x + y \\le 4 \\end{cases}$ là một miền tam giác. Tọa độ các đỉnh của tam giác đó là:',
    options: [
      { text: '$(0;0), (2;0), (0;4)$', isCorrect: true },
      { text: '$(0;0), (4;0), (0;2)$', isCorrect: false },
      { text: '$(0;0), (2;2), (0;4)$', isCorrect: false },
      { text: '$(1;1), (2;0), (0;4)$', isCorrect: false },
    ],
    explanation:
      'Các đường ranh giới là $x = 0$ (trục $Oy$), $y = 0$ (trục $Ox$) và $2x + y = 4$.<br>Giao điểm của từng cặp đường thẳng là $(0;0)$, $(2;0)$, $(0;4)$.',
  },
  {
    id: 'bpt7',
    number: 7,
    type: 'mcq',
    skill: 'Tìm giá trị lớn nhất của biểu thức trên miền nghiệm đa giác',
    points: 0.25,
    text: 'Cho miền nghiệm của hệ bất phương trình $\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ x + y \\le 5 \\\\ x + 2y \\le 6 \\end{cases}$ là miền đa giác $OABC$ với các đỉnh $O(0;0), A(0;3), B(4;1), C(5;0)$. Giá trị lớn nhất của biểu thức $F(x, y) = 2x + 5y$ trên miền nghiệm này bằng bao nhiêu?',
    options: [
      { text: '$10$', isCorrect: false },
      { text: '$13$', isCorrect: false },
      { text: '$15$', isCorrect: true },
      { text: '$18$', isCorrect: false },
    ],
    explanation:
      'Tính giá trị của $F(x, y)$ tại các đỉnh của đa giác miền nghiệm:<br>• $F(0,0) = 2(0) + 5(0) = 0$<br>• $F(0,3) = 2(0) + 5(3) = 15$<br>• $F(4,1) = 2(4) + 5(1) = 13$<br>• $F(5,0) = 2(5) + 5(0) = 10$<br>Giá trị lớn nhất của $F(x,y)$ bằng $15$, đạt tại điểm $A(0;3)$.',
  },
  {
    id: 'bpt8',
    number: 8,
    type: 'mcq',
    skill: 'Biểu diễn miền trong tam giác bằng hệ bất phương trình',
    points: 0.25,
    text: 'Cho tam giác $MNP$ có các đỉnh $M(0; 4)$, $N(2; 0)$, $P(0; 0)$. Miền nghiệm (gồm cả bờ) là miền trong của tam giác $MNP$ được biểu diễn bởi hệ bất phương trình nào sau đây?',
    options: [
      { text: '$\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ 2x + y \\le 4 \\end{cases}$', isCorrect: true },
      { text: '$\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ x + 2y \\le 4 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} x \\le 0 \\\\ y \\le 0 \\\\ 2x + y \\ge 4 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ 2x + y \\ge 4 \\end{cases}$', isCorrect: false },
    ],
    explanation:
      'Phương trình đường thẳng $MN$ đi qua $M(0; 4)$ và $N(2; 0)$ có dạng đoạn chắn: $\\dfrac{x}{2} + \\dfrac{y}{4} = 1 \\Leftrightarrow 2x + y = 4$.<br>Miền tam giác nằm ở góc phần tư thứ I ($x \\ge 0, y \\ge 0$) và chứa điểm $P(0;0)$, do đó $2x + y \\le 4$.',
  },
  {
    id: 'bpt9',
    number: 9,
    type: 'mcq',
    skill: 'Toán thực tế: Lập hệ bất phương trình điều kiện sản xuất',
    points: 0.25,
    text: 'Một xưởng thủ công sản xuất hai loại đồ mỹ nghệ X và Y. Để sản xuất 1 sản phẩm X cần 3 giờ chế tác và 1 kg nguyên liệu. Để sản xuất 1 sản phẩm Y cần 2 giờ chế tác và 2 kg nguyên liệu. Mỗi ngày xưởng có tối đa 12 giờ chế tác và 8 kg nguyên liệu. Gọi $x, y$ lần lượt là số sản phẩm X và Y sản xuất trong một ngày ($x, y \\ge 0$). Hệ bất phương trình mô tả các điều kiện ràng buộc trên là:',
    options: [
      { text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ 3x + 2y \\le 12 \\\\ x + 2y \\le 8 \\end{cases}$', isCorrect: true },
      { text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ x + 2y \\le 12 \\\\ 3x + 2y \\le 8 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} x > 0, y > 0 \\\\ 3x + 2y \\ge 12 \\\\ x + 2y \\ge 8 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ 2x + 3y \\le 12 \\\\ 2x + y \\le 8 \\end{cases}$', isCorrect: false },
    ],
    explanation:
      'Tổng thời gian chế tác không vượt quá 12 giờ: $3x + 2y \\le 12$.<br>Tổng lượng nguyên liệu không vượt quá 8 kg: $x + 2y \\le 8$.<br>Ràng buộc số lượng sản phẩm không âm: $x \\ge 0, y \\ge 0$.',
  },
  {
    id: 'bpt10',
    number: 10,
    type: 'mcq',
    skill: 'Toán thực tế: Lập hệ bất phương trình phối hợp thức ăn chăn nuôi',
    points: 0.25,
    text: 'Một trang trại cần cung cấp ít nhất 800 đơn vị vitamin A và 600 đơn vị vitamin C mỗi ngày cho đàn gia súc. Có hai loại thức ăn T1 và T2. Mỗi kg T1 chứa 400 đơn vị vitamin A và 200 đơn vị vitamin C. Mỗi kg T2 chứa 200 đơn vị vitamin A và 200 đơn vị vitamin C. Gọi $x, y$ lần lượt là số kg thức ăn T1 và T2 mà trang trại dùng mỗi ngày ($x \\ge 0, y \\ge 0$). Hệ bất phương trình biểu diễn lượng vitamin tối thiểu cần cung cấp là:',
    options: [
      { text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ 2x + y \\ge 4 \\\\ x + y \\ge 3 \\end{cases}$', isCorrect: true },
      { text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ 2x + y \\le 4 \\\\ x + y \\le 3 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ x + 2y \\ge 4 \\\\ x + y \\ge 3 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ 4x + y \\ge 8 \\\\ x + 2y \\ge 6 \\end{cases}$', isCorrect: false },
    ],
    explanation:
      'Tổng vitamin A: $400x + 200y \\ge 800 \\Leftrightarrow 2x + y \\ge 4$.<br>Tổng vitamin C: $200x + 200y \\ge 600 \\Leftrightarrow x + y \\ge 3$.<br>Cùng với điều kiện $x \\ge 0, y \\ge 0$.',
  },
  {
    id: 'bpt11',
    number: 11,
    type: 'mcq',
    skill: 'Toán thực tế: Tối ưu hóa lợi nhuận bán hàng',
    points: 0.25,
    text: 'Một cửa hàng bán hai loại bánh ngọt X và Y. Lợi nhuận thu được khi bán 1 hộp bánh X là 50 nghìn đồng, 1 hộp bánh Y là 40 nghìn đồng. Gọi $x, y$ lần lượt là số hộp bánh X và Y bán trong ngày ($x, y \\ge 0$). Miền nghiệm thỏa mãn các điều kiện kinh doanh là tứ giác $OABC$ với các đỉnh $O(0;0), A(0;30), B(20;25), C(40;0)$. Lợi nhuận lớn nhất mà cửa hàng có thể đạt được trong ngày là bao nhiêu?',
    options: [
      { text: '1,2 triệu đồng', isCorrect: false },
      { text: '1,6 triệu đồng', isCorrect: false },
      { text: '2,0 triệu đồng', isCorrect: true },
      { text: '2,5 triệu đồng', isCorrect: false },
    ],
    explanation:
      'Hàm lợi nhuận: $F(x, y) = 50x + 40y$ (nghìn đồng).<br>Tính giá trị tại các đỉnh:<br>• $F(0,0) = 0$.<br>• $F(0,30) = 1200$ nghìn đồng = 1,2 triệu đồng.<br>• $F(20,25) = 50(20) + 40(25) = 2000$ nghìn đồng = 2,0 triệu đồng.<br>• $F(40,0) = 50(40) + 40(0) = 2000$ nghìn đồng = 2,0 triệu đồng.<br>Lợi nhuận lớn nhất cửa hàng có thể đạt được trong ngày là 2,0 triệu đồng.',
  },
  {
    id: 'bpt12',
    number: 12,
    type: 'mcq',
    skill: 'Toán thực tế: Tối ưu hóa lượt tiếp cận quảng cáo đa kênh',
    points: 0.25,
    text: 'Một công ty truyền thông dự định chạy quảng cáo sản phẩm trên hai nền tảng: Mạng xã hội ($x$ phút) và Truyền hình ($y$ phút). Chi phí quảng cáo trên Mạng xã hội là 2 triệu đồng/phút, trên Truyền hình là 6 triệu đồng/phút, với tổng ngân sách không quá 36 triệu đồng. Mỗi phút quảng cáo trên Mạng xã hội tiếp cận được 15.000 người, trên Truyền hình tiếp cận được 40.000 người. Công ty yêu cầu thời lượng Truyền hình không quá 4 phút; thời lượng Mạng xã hội ít nhất là 3 phút và thời lượng Mạng xã hội phải lớn hơn hoặc bằng thời lượng Truyền hình. Để lượng người tiếp cận lớn nhất, số phút quảng cáo trên Mạng xã hội ($x$) và Truyền hình ($y$) cần mua là:',
    options: [
      { text: '$x = 6, y = 4$', isCorrect: false },
      { text: '$x = 12, y = 2$', isCorrect: false },
      { text: '$x = 18, y = 0$', isCorrect: true },
      { text: '$x = 4, y = 4$', isCorrect: false },
    ],
    explanation:
      'Các điều kiện ràng buộc: $x \\ge 3, 0 \\le y \\le 4, x \\ge y, 2x + 6y \\le 36 \\Leftrightarrow x + 3y \\le 18$.<br>Lượng người tiếp cận: $N(x, y) = 15.000x + 40.000y$.<br>Xét các đỉnh của đa giác miền nghiệm:<br>• Điểm $(3,0) \\Rightarrow N = 45.000$.<br>• Điểm $(18,0) \\Rightarrow N = 270.000$.<br>• Điểm $(6,4) \\Rightarrow N = 15.000(6) + 40.000(4) = 250.000$.<br>• Điểm $(4,4) \\Rightarrow N = 220.000$.<br>• Điểm $(3,3) \\Rightarrow N = 165.000$.<br>Vậy lượng người tiếp cận lớn nhất là 270.000 người khi chọn $x = 18$ phút Mạng xã hội và $y = 0$ phút Truyền hình.',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 1,
    type: 'tf',
    skill: 'Khảo sát miền nghiệm đa giác và giá trị của biểu thức bậc nhất',
    text: 'Cho hệ bất phương trình $\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ x + y \\le 5 \\\\ x + 2y \\le 8 \\end{cases}$. Gọi $S$ là miền nghiệm (bao gồm cả biên) của hệ bất phương trình và $F(x, y) = 3x + 2y$ là biểu thức xét trên miền $S$.',
    items: [
      { key: 'a', text: 'Cặp số $(1; 2)$ thuộc miền nghiệm $S$.', correct: true },
      { key: 'b', text: 'Miền nghiệm $S$ là một tứ giác có diện tích bằng $11{,}5$.', correct: true },
      { key: 'c', text: 'Giá trị lớn nhất của $F(x, y)$ trên miền $S$ đạt được tại điểm $C(5;0)$.', correct: true },
      { key: 'd', text: 'Giá trị nhỏ nhất của $F(x, y)$ trên miền $S$ bằng $8$.', correct: false },
    ],
    explanation:
      '<strong>a) Đúng:</strong> Thay $(1;2)$: $1 \\ge 0, 2 \\ge 0, 1+2=3 \\le 5, 1+2(2)=5 \\le 8$ (đều đúng).<br><strong>b) Đúng:</strong> Các đỉnh đa giác miền nghiệm là $O(0;0), A(0;4), B(2;3), C(5;0)$. Diện tích $S_{OABC} = S_{OAB} + S_{OBC} = \\dfrac{1}{2} \\cdot 4 \\cdot 2 + \\dfrac{1}{2} \\cdot 5 \\cdot 3 = 4 + 7{,}5 = 11{,}5$.<br><strong>c) Đúng:</strong> $F(O)=0, F(A)=8, F(B)=12, F(C)=15$. Giá trị lớn nhất $F_{\\max}=15$ đạt tại $C(5;0)$.<br><strong>d) Sai:</strong> Giá trị nhỏ nhất $F_{\\min} = 0$ tại $O(0;0)$, không phải bằng $8$.',
  },
  {
    id: 'tf2',
    number: 2,
    type: 'tf',
    skill: 'Bài toán sản xuất bàn ghế tối ưu hóa lợi nhuận tuần',
    text: 'Một xưởng sản xuất bàn (X) và ghế (Y). Để làm 1 chiếc bàn cần 3 giờ chế biến gỗ và 1 giờ hoàn thiện. Để làm 1 chiếc ghế cần 1 giờ chế biến gỗ và 1 giờ hoàn thiện. Tổng thời gian tối đa trong tuần cho công đoạn chế biến gỗ là 45 giờ, công đoạn hoàn thiện là 25 giờ. Lợi nhuận từ 1 chiếc bàn là 600 nghìn đồng, 1 chiếc ghế là 300 nghìn đồng. Gọi $x, y$ lần lượt là số chiếc bàn và ghế sản xuất trong tuần ($x, y \\ge 0$).',
    items: [
      { key: 'a', text: 'Hệ bất phương trình biểu diễn thời gian hoạt động của các công đoạn trong tuần là $\\begin{cases} x \\ge 0, y \\ge 0 \\\\ 3x + y \\le 45 \\\\ x + y \\le 25 \\end{cases}$.', correct: true },
      { key: 'b', text: 'Nếu xưởng sản xuất 10 chiếc bàn và 10 chiếc ghế trong một tuần thì kế hoạch này vi phạm thời gian công đoạn chế biến gỗ.', correct: false },
      { key: 'c', text: 'Đa giác miền nghiệm của hệ bất phương trình có các đỉnh là $O(0;0), A(0;25), B(10;15), C(15;0)$.', correct: true },
      { key: 'd', text: 'Để thu được lợi nhuận lớn nhất, xưởng cần sản xuất 10 chiếc bàn và 15 chiếc ghế trong một tuần.', correct: true },
    ],
    explanation:
      '<strong>a) Đúng:</strong> Công đoạn chế biến gỗ: $3x + y \\le 45$; Công đoạn hoàn thiện: $x + y \\le 25$.<br><strong>b) Sai:</strong> Với $x=10, y=10$: Công đoạn chế biến gỗ dùng $3(10) + 10 = 40 \\le 45$ (chưa vi phạm).<br><strong>c) Đúng:</strong> Giao điểm của các đường ranh giới xác định tứ giác $OABC$ với các đỉnh $O(0;0), A(0;25), B(10;15), C(15;0)$.<br><strong>d) Đúng:</strong> Hàm lợi nhuận $T(x,y) = 600x + 300y$. $T(O)=0, T(A)=7500, T(B)=10500, T(C)=9000$ (nghìn đồng). Lợi nhuận lớn nhất bằng 10,5 triệu đồng tại $B(10;15)$.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 1,
    type: 'shortans',
    skill: 'Tìm GTLN của biểu thức F(x, y) trên miền nghiệm hệ 4 bất phương trình',
    points: 1.0,
    text: 'Cho $x, y$ thỏa mãn hệ bất phương trình $\\begin{cases} 2x - y \\le 4 \\\\ x + y \\le 5 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$. Tìm giá trị lớn nhất của biểu thức $F(x, y) = 4x + 3y$.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: '18',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean === '18';
    },
    explanation:
      'Vẽ miền nghiệm của hệ bất phương trình, ta được miền tứ giác $OABC$ với các đỉnh:<br>$O(0;0), A(0;5), B(3;2), C(2;0)$.<br>Tính giá trị của $F(x, y)$ tại các đỉnh:<br>• $F(0,0) = 0$<br>• $F(0,5) = 15$<br>• $F(3,2) = 4(3) + 3(2) = 18$<br>• $F(2,0) = 8$.<br>Vậy giá trị lớn nhất của $F(x, y)$ bằng 18.',
  },
  {
    id: 'sa2',
    number: 2,
    type: 'shortans',
    skill: 'Toán thực tế: Phân bổ vốn đầu tư BĐS và Trái phiếu tối đa lợi nhuận',
    points: 1.0,
    text: 'Một nhà đầu tư dự định rót tối đa 2 tỷ đồng vào hai lĩnh vực: Bất động sản và Trái phiếu doanh nghiệp. Lợi nhuận dự kiến hàng năm từ Bất động sản là 12\\%, từ Trái phiếu là 8\\%. Nhà đầu tư yêu cầu số tiền rót vào Trái phiếu phải ít nhất là 400 triệu đồng và không ít hơn số tiền đầu tư vào Bất động sản. Lợi nhuận tối đa hàng năm (theo đơn vị triệu đồng) mà nhà đầu tư có thể thu được là bao nhiêu?',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: '200',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('200');
    },
    explanation:
      'Gọi $x, y$ lần lượt là số tiền đầu tư Bất động sản và Trái phiếu (đơn vị: triệu đồng, $x \\ge 0, y \\ge 400$).<br>Hệ điều kiện: $\\begin{cases} x \\ge 0, y \\ge 400 \\\\ x + y \\le 2000 \\\\ y \\ge x \\end{cases}$.<br>Hàm lợi nhuận: $L(x, y) = 0{,}12x + 0{,}08y$ (triệu đồng).<br>Miền nghiệm là tứ giác với các đỉnh: $(0; 400), (0; 2000), (1000; 1000), (400; 400)$.<br>Tính lợi nhuận tại các đỉnh:<br>• $L(0, 400) = 32$ triệu đồng.<br>• $L(0, 2000) = 160$ triệu đồng.<br>• $L(1000, 1000) = 0{,}12(1000) + 0{,}08(1000) = 200$ triệu đồng.<br>• $L(400, 400) = 80$ triệu đồng.<br>Vậy lợi nhuận tối đa hàng năm nhà đầu tư thu được là 200 triệu đồng.',
  },
  {
    id: 'sa3',
    number: 3,
    type: 'shortans',
    skill: 'Toán thực tế: Tối thiểu hóa chi phí thức ăn nuôi thủy sản',
    points: 1.0,
    text: 'Một trang trại nuôi thủy sản phối hợp hai loại thức ăn K1 và K2. Mỗi kg K1 chứa 10 g chất dinh dưỡng A, 20 g chất dinh dưỡng B và có giá 40 nghìn đồng. Mỗi kg K2 chứa 20 g chất dinh dưỡng A, 10 g chất dinh dưỡng B và có giá 30 nghìn đồng. Mỗi ngày, trang trại cần cung cấp tối thiểu 100 g chất dinh dưỡng A và 80 g chất dinh dưỡng B. Chi phí tối thiểu (theo đơn vị nghìn đồng) để mua thức ăn trong một ngày là bao nhiêu?',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: '200',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('200');
    },
    explanation:
      'Gọi $x, y$ lần lượt là số kg thức ăn K1 và K2 ($x \\ge 0, y \\ge 0$).<br>Ràng buộc dinh dưỡng: $\\begin{cases} 10x + 20y \\ge 100 \\Leftrightarrow x + 2y \\ge 10 \\\\ 20x + 10y \\ge 80 \\Leftrightarrow 2x + y \\ge 8 \\end{cases}$.<br>Hàm chi phí: $C(x, y) = 40x + 30y$ (nghìn đồng).<br>Miền nghiệm là vùng không giới hạn có các đỉnh biên: $A(0; 8), B(2; 4), C(10; 0)$.<br>Tính chi phí tại các đỉnh:<br>• $C(0, 8) = 40(0) + 30(8) = 240$ nghìn đồng.<br>• $C(2, 4) = 40(2) + 30(4) = 200$ nghìn đồng.<br>• $C(10, 0) = 40(10) + 30(0) = 400$ nghìn đồng.<br>Chi phí tối thiểu mua thức ăn trong một ngày là 200 nghìn đồng.',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan10BptDeBPage() {
  // 1. STATE THÔNG TIN HỌC SINH
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
    const ma = maHocSinh.trim() || 'HS10-BPT-B';
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
    setDiemSo(finalScore);
    setSoCauDungMCQ(correctMCQ);
    setMangCauSai(uniqueWrongSkills);

    const thoiGianLamPhut = Math.max(1, Math.round((45 * 60 - timeLeft) / 60));

    const chiTietPhanHoiObj = {
      ho_ten: ten,
      ma_so: ma,
      lop: lop,
      de_thi: `${EXAM_TITLE} - ${EXAM_SUBTITLE}`,
      diem_so: finalScore,
      diem_phan_1: p1Score,
      diem_phan_2: p2Score,
      diem_phan_3: p3Score,
      so_cau_dung_mcq: `${correctMCQ}/${RAW_MCQ_QUESTIONS.length}`,
      thoi_gian_lam_phut: thoiGianLamPhut,
      thoi_gian_nop: new Date().toLocaleString('vi-VN'),
      ky_nang_sai: uniqueWrongSkills,
      dap_an_mcq_selected: mcqAnswers,
      dap_an_tf: tfAnswers,
      dap_an_tu_luan: shortAnswers,
    };

    const webhookGASPayload = {
      action: 'submit_test',
      data: {
        Student_ID: ma,
        Task_ID: 'KIEM_TRA_TOAN_10_BPT_DE_B_45P',
        Diem_So: finalScore,
        Thoi_Gian_Lam: thoiGianLamPhut,
        Chi_Tiet_Phan_Hoi: JSON.stringify(chiTietPhanHoiObj),
      },
    };

    // 1. Fetch gửi Webhook Google Apps Script
    try {
      await fetch(GOOGLE_APP_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(webhookGASPayload),
        mode: 'no-cors',
      });
    } catch (err) {
      console.warn('Lỗi gửi Webhook Google Apps Script:', err);
    }

    // 2. Fetch gửi Webhook n8n
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...webhookGASPayload,
          full_details: chiTietPhanHoiObj,
        }),
      });
    } catch (err) {
      console.warn('Lỗi gửi Webhook n8n:', err);
    }

    setIsSubmitted(true);
    setIsSubmitting(false);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Làm lại bài thi
  const handleReset = () => {
    if (!window.confirm('Bạn có chắc chắn muốn làm lại bài thi từ đầu?')) return;
    setMcqAnswers({});
    setTfAnswers({});
    setShortAnswers({});
    setIsSubmitted(false);
    setTimeLeft(45 * 60);
    setDiemSo(0);
    setDiemPhan1(0);
    setDiemPhan2(0);
    setDiemPhan3(0);
    setSoCauDungMCQ(0);
    setMangCauSai([]);

    const reshuffled = RAW_MCQ_QUESTIONS.map((q) => ({
      ...q,
      options: shuffleOptions(q.options),
    }));
    setShuffledMCQQuestions(reshuffled);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 selection:bg-sky-500 selection:text-white">
      {/* HEADER CỐ ĐỊNH */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md shadow-sky-500/20">
              10
            </span>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-snug">
                {EXAM_TITLE}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {EXAM_SUBTITLE} • {EXAM_TIME_NOTE}
              </p>
            </div>
          </div>

          {/* ĐỒNG HỒ & NÚT NỘP BÀI */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-base transition-all ${
                timeLeft < 300
                  ? 'bg-rose-50 border-rose-300 text-rose-600 animate-bounce'
                  : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}
            >
              <svg
                className="w-5 h-5 text-current animate-spin"
                style={{ animationDuration: '4s' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatTime(timeLeft)}</span>
            </div>

            {!isSubmitted && (
              <button
                id="btn-nop-bai"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Đang nộp...' : 'Nộp bài thi'}
              </button>
            )}
          </div>
        </div>

        {/* THANH TIẾN ĐỘ */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-gradient-to-r from-sky-500 to-indigo-600 h-1.5 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        {/* THÔNG TIN THÍ SINH */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Thông tin thí sinh dự thi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                placeholder="VD: HS10-BPT-001"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS10-BPT-B'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '10'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Phần I: <strong>{diemPhan1.toFixed(2)}/3.0đ</strong> ({soCauDungMCQ}/12 câu đúng)</span>
                  <span>Phần II: <strong>{diemPhan2.toFixed(1)}/4.0đ</strong></span>
                  <span>Phần III: <strong>{diemPhan3.toFixed(1)}/3.0đ</strong></span>
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
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition border border-white/20 cursor-pointer"
              >
                🖨️ In bài làm / Lưu PDF
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-xs font-bold transition shadow cursor-pointer"
              >
                🔄 Làm lại bài thi
              </button>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN (12 CÂU - 3,0 ĐIỂM)   */}
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
                        {isStudentCorrect ? '✓ Đúng (+0.25đ)' : '✕ Sai (+0.0đ)'}
                      </span>
                    )}
                  </div>

                  <MathContent
                    content={q.text}
                    className="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mb-4"
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
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition shrink-0 ${
                              isOptionSelected
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {displayLabel}
                          </span>
                          <MathContent content={opt.text} className="text-sm flex-1" />
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
              const currentSubs = tfAnswers[q.id] || {};
              let correctCount = 0;
              q.items.forEach((item) => {
                if (currentSubs[item.key] === item.correct) {
                  correctCount += 1;
                }
              });
              const earnedPoints = calculateTFPoints(correctCount);

              return (
                <div
                  key={q.id}
                  id={`cau-tf-${q.number}`}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                        Bài {q.number} (Đúng / Sai)
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                        2,0 điểm
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        • {q.skill}
                      </span>
                    </div>

                    {isSubmitted && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {correctCount}/4 ý đúng (+{earnedPoints}đ)
                      </span>
                    )}
                  </div>

                  <MathContent
                    content={q.text}
                    className="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mb-4"
                  />

                  {/* BẢNG 4 Ý a, b, c, d */}
                  <div className="space-y-3">
                    {q.items.map((item) => {
                      const userChoice = currentSubs[item.key];
                      const isItemCorrect = isSubmitted ? userChoice === item.correct : false;

                      return (
                        <div
                          key={item.key}
                          className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isSubmitted
                              ? isItemCorrect
                                ? 'bg-emerald-50/40 border-emerald-300'
                                : 'bg-rose-50/40 border-rose-300'
                              : 'bg-slate-50/50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 flex-1">
                            <span className="font-bold text-slate-700 uppercase shrink-0 text-sm mt-0.5">
                              {item.key})
                            </span>
                            <MathContent content={item.text} className="text-sm text-slate-800 flex-1" />
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
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
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer disabled:cursor-default ${
                                userChoice === true
                                  ? isSubmitted
                                    ? item.correct === true
                                      ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300'
                                      : 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-200'
                                    : 'bg-sky-600 text-white border-sky-600'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              Đúng
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
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer disabled:cursor-default ${
                                userChoice === false
                                  ? isSubmitted
                                    ? item.correct === false
                                      ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300'
                                      : 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-200'
                                    : 'bg-sky-600 text-white border-sky-600'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              Sai
                            </button>

                            {isSubmitted && (
                              <span className="text-xs font-bold ml-1">
                                {item.correct ? (
                                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Chuẩn: Đúng</span>
                                ) : (
                                  <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded">Chuẩn: Sai</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Lời giải chi tiết phần Đúng/Sai */}
                  {isSubmitted && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm bg-slate-50/80 p-3.5 rounded-xl text-slate-700 overflow-x-auto whitespace-pre-wrap break-words">
                      <div className="font-semibold text-slate-800 flex items-center gap-1 mb-2">
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
        {/* PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN (3 CÂU - 3,0 ĐIỂM)     */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN (3 CÂU - 3,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              1,0 điểm / câu • Điền kết quả trực tiếp & Chấm điểm tự động
            </span>
          </div>

          <div className="space-y-4">
            {RAW_SHORTANS_QUESTIONS.map((q) => {
              const currentVal = shortAnswers[q.id] || '';
              const isCorrect = isSubmitted ? q.validator(currentVal) : false;

              return (
                <div
                  key={q.id}
                  id={`cau-sa-${q.number}`}
                  className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : currentVal.trim()
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-amber-300 bg-amber-50/20'
                      : currentVal.trim()
                      ? 'border-indigo-300 shadow-indigo-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-800 font-bold text-xs">
                        Câu {q.number}
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
                        {isCorrect ? '✓ Đúng (+1.0đ)' : '✕ Chưa chính xác (+0.0đ)'}
                      </span>
                    )}
                  </div>

                  <MathContent
                    content={q.text}
                    className="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mb-4"
                  />

                  {/* Ô nhập câu trả lời */}
                  <div className="space-y-2">
                    <label htmlFor={`input-${q.id}`} className="block text-xs font-bold text-slate-700">
                      Kết quả / Đáp số của bạn:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`input-${q.id}`}
                        type="text"
                        disabled={isSubmitted}
                        value={currentVal}
                        onChange={(e) =>
                          setShortAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder={q.placeholder}
                        className={`w-full max-w-md px-4 py-2.5 text-sm rounded-xl border transition focus:outline-none ${
                          isSubmitted
                            ? isCorrect
                              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold'
                              : 'border-rose-400 bg-rose-50/50 text-rose-900 line-through'
                            : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Lời giải chi tiết */}
                  {isSubmitted && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm bg-slate-50/80 p-4 rounded-xl text-slate-700 overflow-x-auto whitespace-pre-wrap break-words">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md text-xs">
                          Đáp số chuẩn: {q.correctDisplay}
                        </span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <span className="text-indigo-600">📝</span> Hướng dẫn chấm & lời giải chi tiết:
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

        {/* NÚT NỘP BÀI CUỐI TRANG */}
        {!isSubmitted && (
          <div className="pt-6 pb-12 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-base rounded-2xl shadow-lg transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Đang chấm điểm & lưu...' : 'Hoàn thành và Nộp bài thi'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
