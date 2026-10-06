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
// CHỦ ĐỀ: BẤT PHƯƠNG TRÌNH & HỆ BPT BẬC NHẤT HAI ẨN
// ==========================================

// PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (14 CÂU - 7,0 ĐIỂM, 0.5Đ/CÂU)
const MCQ_QUESTIONS_BPT_DE_B: QuestionMCQ[] = [
  {
    id: 'bpt1',
    number: 1,
    type: 'mcq',
    skill: 'Nhận biết bất phương trình bậc nhất hai ẩn',
    points: 0.5,
    text: 'Khẳng định nào sau đây là một bất phương trình bậc nhất hai ẩn?',
    options: [
      { key: 'A', text: '$3x - 2y < 4$' },
      { key: 'B', text: '$x + y^2 \\ge 3$' },
      { key: 'C', text: '$x^2 + y^2 \\le 1$' },
      { key: 'D', text: '$xy - 2y > 0$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Bất phương trình bậc nhất hai ẩn $x, y$ có dạng tổng quát là $ax + by < c$ (hoặc $\\le, >, \\ge$), trong đó $a, b, c$ là các số thực cho trước và $a, b$ không đồng thời bằng $0$.<br>Phương án $3x - 2y < 4$ thỏa mãn đúng định nghĩa này.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'bpt2',
    number: 2,
    type: 'mcq',
    skill: 'Kiểm tra nghiệm của bất phương trình bậc nhất hai ẩn',
    points: 0.5,
    text: 'Cặp số nào sau đây là một nghiệm của bất phương trình $3x + 2y - 6 < 0$?',
    options: [
      { key: 'A', text: '$(1; 1)$' },
      { key: 'B', text: '$(2; 2)$' },
      { key: 'C', text: '$(0; 4)$' },
      { key: 'D', text: '$(3; 0)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Thay tọa độ $(x; y) = (1; 1)$ vào bất phương trình: $3(1) + 2(1) - 6 = -1 < 0$ (mệnh đề đúng).<br>Do đó, $(1; 1)$ là một nghiệm của bất phương trình đã cho.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'bpt3',
    number: 3,
    type: 'mcq',
    skill: 'Xác định điểm thuộc miền nghiệm của bất phương trình',
    points: 0.5,
    text: 'Miền nghiệm của bất phương trình $2x + y \\le 5$ chứa điểm nào sau đây?',
    options: [
      { key: 'A', text: '$(1; 2)$' },
      { key: 'B', text: '$(2; 3)$' },
      { key: 'C', text: '$(3; 1)$' },
      { key: 'D', text: '$(0; 6)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Thay $(x; y) = (1; 2)$ vào bất phương trình: $2(1) + 2 = 4 \\le 5$ (mệnh đề đúng).<br>Do đó điểm $(1; 2)$ thuộc miền nghiệm của bất phương trình.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'bpt4',
    number: 4,
    type: 'mcq',
    skill: 'Biểu diễn miền nghiệm của bất phương trình trên mặt phẳng tọa độ',
    points: 0.5,
    text: 'Miền nghiệm của bất phương trình $2x + 3y - 6 \\le 0$ trên mặt phẳng tọa độ $Oxy$ là:',
    options: [
      { key: 'A', text: 'Nửa mặt phẳng chứa gốc tọa độ $O(0;0)$ kể cả đường thẳng $d: 2x + 3y - 6 = 0$' },
      { key: 'B', text: 'Nửa mặt phẳng không chứa gốc tọa độ $O(0;0)$ kể cả đường thẳng $d: 2x + 3y - 6 = 0$' },
      { key: 'C', text: 'Nửa mặt phẳng chứa gốc tọa độ $O(0;0)$ không kể đường thẳng $d: 2x + 3y - 6 = 0$' },
      { key: 'D', text: 'Toàn bộ mặt phẳng tọa độ $Oxy$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Thay $O(0;0)$ vào bất phương trình $2x + 3y - 6 \\le 0$, ta có: $2(0) + 3(0) - 6 = -6 \\le 0$ (mệnh đề đúng).<br>Vậy miền nghiệm là nửa mặt phẳng có bờ là đường thẳng $d: 2x + 3y - 6 = 0$ và chứa gốc tọa độ $O(0;0)$ (kể cả bờ $d$).<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'bpt5',
    number: 5,
    type: 'mcq',
    skill: 'Kiểm tra nghiệm của hệ bất phương trình bậc nhất hai ẩn',
    points: 0.5,
    text: 'Cặp số $(x; y) = (1; 2)$ là nghiệm của hệ bất phương trình nào sau đây?',
    options: [
      { key: 'A', text: '$\\begin{cases} x + 2y - 3 < 0 \\\\ 2x - y > 1 \\end{cases}$' },
      { key: 'B', text: '$\\begin{cases} 2x - y \\ge 0 \\\\ x + 3y \\le 8 \\end{cases}$' },
      { key: 'C', text: '$\\begin{cases} x - y > 0 \\\\ 3x + y < 2 \\end{cases}$' },
      { key: 'D', text: '$\\begin{cases} 2x + y < 2 \\\\ x - 3y > 1 \\end{cases}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Thay $(x; y) = (1; 2)$ vào hệ ở phương án B:<br>$$\\begin{cases} 2(1) - 2 = 0 \\ge 0 \\quad (\\text{đúng}) \\\\ 1 + 3(2) = 7 \\le 8 \\quad (\\text{đúng}) \\end{cases}$$Do đó $(1; 2)$ là nghiệm của hệ bất phương trình ở phương án B.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'bpt6',
    number: 6,
    type: 'mcq',
    skill: 'Nhận biết hệ bất phương trình bậc nhất hai ẩn',
    points: 0.5,
    text: 'Hệ bất phương trình nào sau đây là hệ bất phương trình bậc nhất hai ẩn?',
    options: [
      { key: 'A', text: '$\\begin{cases} 3x - y + 2 \\ge 0 \\\\ 2x + 5y < 7 \\end{cases}$' },
      { key: 'B', text: '$\\begin{cases} x^2 + y \\le 1 \\\\ x - 2y > 3 \\end{cases}$' },
      { key: 'C', text: '$\\begin{cases} x + y > 0 \\\\ x^2 + y^2 \\le 4 \\end{cases}$' },
      { key: 'D', text: '$\\begin{cases} 2x - y^2 < 0 \\\\ x + 3y \\ge 1 \\end{cases}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Hệ bất phương trình bậc nhất hai ẩn là hệ gồm hai hay nhiều bất phương trình bậc nhất hai ẩn.<br>Phương án A gồm hai bất phương trình bậc nhất hai ẩn $3x - y + 2 \\ge 0$ và $2x + 5y < 7$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'bpt7',
    number: 7,
    type: 'mcq',
    skill: 'Hình dạng hình học của miền nghiệm hệ bất phương trình',
    points: 0.5,
    text: 'Miền nghiệm của hệ bất phương trình $\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ x + 2y \\le 4 \\end{cases}$ trên mặt phẳng $Oxy$ có dạng là một hình phẳng. Hình phẳng đó là:',
    options: [
      { key: 'A', text: 'Tam giác' },
      { key: 'B', text: 'Hình chữ nhật' },
      { key: 'C', text: 'Tứ giác không vuông' },
      { key: 'D', text: 'Ngũ giác' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Các bất phương trình $x \\ge 0, y \\ge 0$ giới hạn miền nghiệm ở góc phần tư thứ nhất.<br>Đường thẳng $x + 2y = 4$ cắt trục hoành tại $A(4;0)$ và cắt trục tung tại $B(0;2)$.<br>Miền nghiệm là miền tam giác vuông $OAB$ bao gồm cả 3 cạnh.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'bpt8',
    number: 8,
    type: 'mcq',
    skill: 'Xác định hệ bất phương trình từ hình vẽ miền nghiệm',
    points: 0.5,
    text: 'Cho miền nghiệm (miền không bị gạch) giới hạn bởi tam giác $OAB$ với các đỉnh $O(0;0)$, $A(5;0)$, $B(0;2)$ (kể cả biên). Hệ bất phương trình mô tả miền nghiệm này là:',
    options: [
      { key: 'A', text: '$\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ 2x + 5y \\le 10 \\end{cases}$' },
      { key: 'B', text: '$\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ 5x + 2y \\le 10 \\end{cases}$' },
      { key: 'C', text: '$\\begin{cases} x \\le 0 \\\\ y \\le 0 \\\\ 2x + 5y \\ge 10 \\end{cases}$' },
      { key: 'D', text: '$\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ 2x + 5y \\ge 10 \\end{cases}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Đường thẳng đi qua hai điểm $A(5;0)$ và $B(0;2)$ có phương trình đoạn chắn: $\\dfrac{x}{5} + \\dfrac{y}{2} = 1 \\iff 2x + 5y = 10$.<br>Thử $O(0;0)$: $2(0) + 5(0) = 0 \\le 10$ (đúng). Do miền nghiệm chứa $O$ nên bất phương trình là $2x + 5y \\le 10$.<br>Kết hợp $x \\ge 0, y \\ge 0$, ta thu được hệ ở phương án A.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'bpt9',
    number: 9,
    type: 'mcq',
    skill: 'Tìm tọa độ đỉnh của miền nghiệm đa giác',
    points: 0.5,
    text: 'Miền nghiệm của hệ bất phương trình $\\begin{cases} x + y \\le 5 \\\\ x - y \\le 1 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$ là một tứ giác $OABC$. Tọa độ đỉnh $B$ (giao điểm của hai đường thẳng $x + y = 5$ và $x - y = 1$) là:',
    options: [
      { key: 'A', text: '$(3; 2)$' },
      { key: 'B', text: '$(2; 3)$' },
      { key: 'C', text: '$(4; 1)$' },
      { key: 'D', text: '$(1; 4)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Giải hệ phương trình tọa độ giao điểm:<br>$$\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases} \\iff \\begin{cases} 2x = 6 \\\\ y = 5 - x \\end{cases} \\iff \\begin{cases} x = 3 \\\\ y = 2 \\end{cases}$$Vậy tọa độ đỉnh $B$ là $(3; 2)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'bpt10',
    number: 10,
    type: 'mcq',
    skill: 'Tìm giá trị lớn nhất của biểu thức bậc nhất trên miền đa giác',
    points: 0.5,
    text: 'Cho $x, y$ thỏa mãn miền nghiệm của một hệ bất phương trình là tứ giác $OABC$ có các đỉnh $O(0;0)$, $A(4;0)$, $B(3;2)$, $C(0;3)$. Giá trị lớn nhất của biểu thức $F(x, y) = 3x + 2y$ trên miền nghiệm này bằng:',
    options: [
      { key: 'A', text: '$13$' },
      { key: 'B', text: '$12$' },
      { key: 'C', text: '$6$' },
      { key: 'D', text: '$15$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Theo định lý về giá trị cực trị của hàm mục tiêu trên miền nghiệm đa giác, $F(x,y)$ đạt GTLN tại một trong các đỉnh của đa giác:<br>- $F(0, 0) = 3(0) + 2(0) = 0$<br>- $F(4, 0) = 3(4) + 2(0) = 12$<br>- $F(3, 2) = 3(3) + 2(2) = 13$<br>- $F(0, 3) = 3(0) + 2(3) = 6$<br>So sánh các giá trị, GTLN của $F(x,y)$ bằng $13$ tại đỉnh $B(3;2)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'bpt11',
    number: 11,
    type: 'mcq',
    skill: 'Tìm giá trị nhỏ nhất của biểu thức bậc nhất trên miền đa giác',
    points: 0.5,
    text: 'Giá trị nhỏ nhất của biểu thức $F(x, y) = 2x - y$ trên miền nghiệm của hệ bất phương trình $\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ x + y \\le 6 \\\\ 2x + y \\ge 2 \\end{cases}$ bằng:',
    options: [
      { key: 'A', text: '$-6$' },
      { key: 'B', text: '$-1$' },
      { key: 'C', text: '$2$' },
      { key: 'D', text: '$12$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Xác định tọa độ các đỉnh miền nghiệm tứ giác:<br>- $A(1; 0)$ là giao điểm của $y = 0$ và $2x + y = 2$<br>- $B(6; 0)$ là giao điểm của $y = 0$ và $x + y = 6$<br>- $C(0; 6)$ là giao điểm của $x = 0$ và $x + y = 6$<br>- $D(0; 2)$ là giao điểm của $x = 0$ và $2x + y = 2$<br>Tính giá trị $F(x, y) = 2x - y$ tại các đỉnh:<br>$F(1, 0) = 2$, $F(6, 0) = 12$, $F(0, 6) = -6$, $F(0, 2) = -2$.<br>Vậy GTNN của $F(x,y)$ bằng $-6$ tại điểm $(0; 6)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'bpt12',
    number: 12,
    type: 'mcq',
    skill: 'Thiết lập hệ bất phương trình bậc nhất hai ẩn từ bài toán thực tế',
    points: 0.5,
    text: 'Một cơ sở sản xuất chế biến hai loại nước trái cây $A$ và $B$. Để sản xuất $1\\text{ lít}$ nước trái cây loại $A$ cần $2\\text{ kg}$ táo và $1\\text{ kg}$ cam. Để sản xuất $1\\text{ lít}$ nước trái cây loại $B$ cần $1\\text{ kg}$ táo và $2\\text{ kg}$ cam. Cơ sở hiện có tối đa $30\\text{ kg}$ táo và $30\\text{ kg}$ cam. Gọi $x, y$ lần lượt là số lít nước trái cây loại $A$ và $B$ cần sản xuất. Hệ bất phương trình mô tả các điều kiện ràng buộc về nguyên liệu là:',
    options: [
      { key: 'A', text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ 2x + y \\le 30 \\\\ x + 2y \\le 30 \\end{cases}$' },
      { key: 'B', text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ x + 2y \\le 30 \\\\ 2x + y \\ge 30 \\end{cases}$' },
      { key: 'C', text: '$\\begin{cases} x > 0, y > 0 \\\\ 2x + y \\ge 30 \\\\ x + 2y \\ge 30 \\end{cases}$' },
      { key: 'D', text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ x + y \\le 30 \\\\ 2x + 2y \\le 30 \\end{cases}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong><br>- Lượng nước trái cây sản xuất không âm: $x \\ge 0, y \\ge 0$.<br>- Lượng táo sử dụng tối đa $30\\text{ kg}$: $2x + y \\le 30$.<br>- Lượng cam sử dụng tối đa $30\\text{ kg}$: $x + 2y \\le 30$.<br>Kết hợp lại ta thu được hệ ở phương án A.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'bpt13',
    number: 13,
    type: 'mcq',
    skill: 'Tìm điều kiện tham số để biểu thức là bất phương trình bậc nhất hai ẩn',
    points: 0.5,
    text: 'Bất phương trình $(2m-2)x + (m+1)y \\le 8$ là bất phương trình bậc nhất hai ẩn $x, y$ khi và chỉ khi:',
    options: [
      { key: 'A', text: 'Với mọi $m \\in \\mathbb{R}$' },
      { key: 'B', text: '$m \\neq 1$' },
      { key: 'C', text: '$m \\neq -1$' },
      { key: 'D', text: '$m \\neq 1$ và $m \\neq -1$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Bất phương trình $ax + by \\le c$ là bất phương trình bậc nhất hai ẩn khi các hệ số $a, b$ không đồng thời bằng $0$, tức $a^2 + b^2 \\neq 0$.<br>Ở đây $a = 2m - 2$ và $b = m + 1$.<br>Xét hệ điều kiện đồng thời bằng $0$: $\\begin{cases} 2m - 2 = 0 \\\\ m + 1 = 0 \\end{cases} \\iff \\begin{cases} m = 1 \\\\ m = -1 \\end{cases}$ (vô lý).<br>Do đó $a$ và $b$ không bao giờ đồng thời bằng $0$ với bất kỳ giá trị nào của $m$. Bất phương trình luôn là bất phương trình bậc nhất hai ẩn với mọi $m \\in \\mathbb{R}$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'bpt14',
    number: 14,
    type: 'mcq',
    skill: 'Bài toán tối ưu hóa quy hoạch tuyến tính thực tế',
    points: 0.5,
    text: 'Một xưởng cơ khí sản xuất hai loại sản phẩm $A$ và $B$. Mỗi sản phẩm loại $A$ mang lại lợi nhuận $120\\text{ nghìn đồng}$, mỗi sản phẩm loại $B$ mang lại lợi nhuận $180\\text{ nghìn đồng}$. Năng lực sản xuất trong một ngày đối với số sản phẩm $A$ ($x$) và số sản phẩm $B$ ($y$) bị giới hạn bởi hệ bất phương trình: $\\begin{cases} x + y \\le 12 \\\\ x \\ge 3 \\\\ y \\ge 2 \\end{cases}$. Lợi nhuận lớn nhất mà xưởng có thể đạt được trong một ngày là:',
    options: [
      { key: 'A', text: '$1,98\\text{ triệu đồng}$' },
      { key: 'B', text: '$1,80\\text{ triệu đồng}$' },
      { key: 'C', text: '$2,16\\text{ triệu đồng}$' },
      { key: 'D', text: '$1,50\\text{ triệu đồng}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Hàm lợi nhuận: $F(x, y) = 120x + 180y$ (nghìn đồng).<br>Miền nghiệm của hệ là tam giác giới hạn bởi 3 đường thẳng $x = 3$, $y = 2$, $x + y = 12$.<br>Tọa độ 3 đỉnh tam giác miền nghiệm:<br>- $A(3; 2)$ là giao điểm của $x = 3$ và $y = 2$<br>- $B(3; 9)$ là giao điểm của $x = 3$ và $x + y = 12$<br>- $C(10; 2)$ là giao điểm của $y = 2$ và $x + y = 12$<br>Tính $F(x, y)$ tại các đỉnh:<br>$F(3, 2) = 120(3) + 180(2) = 720\\text{ (nghìn đồng)}$<br>$F(3, 9) = 120(3) + 180(9) = 1980\\text{ (nghìn đồng)} = 1,98\\text{ triệu đồng}$<br>$F(10, 2) = 120(10) + 180(2) = 1560\\text{ (nghìn đồng)} = 1,56\\text{ triệu đồng}$<br>Vậy lợi nhuận lớn nhất xưởng đạt được là $1,98\\text{ triệu đồng}$ khi sản xuất $3$ sản phẩm $A$ và $9$ sản phẩm $B$.<br><strong>Đáp án đúng: A.</strong>',
  },
];

// PHẦN II. TỰ LUẬN (2 CÂU - 3,0 ĐIỂM, 1.5Đ/CÂU)
const SHORTANS_QUESTIONS_BPT_DE_B: QuestionShortAns[] = [
  {
    id: 'bpt15',
    number: 15,
    type: 'shortans',
    skill: 'Biểu diễn miền nghiệm và tối ưu hóa biểu thức bậc nhất hai ẩn',
    points: 1.5,
    text: 'Cho hệ bất phương trình bậc nhất hai ẩn: $\\begin{cases} x - y \\le 1 \\\\ 2x + y \\le 8 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$<br><br><strong>a) (0,75 điểm)</strong> Biểu diễn miền nghiệm của hệ bất phương trình trên mặt phẳng tọa độ $Oxy$.<br><strong>b) (0,75 điểm)</strong> Tìm tọa độ các đỉnh của miền nghiệm đa giác và tìm giá trị lớn nhất của biểu thức $F(x, y) = 5x + 2y$ trên miền nghiệm đó.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'Tứ giác OABC: O(0;0), A(1;0), B(3;2), C(0;8); max F = 19 tại B(3;2)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const hasB = clean.includes('(3;2)') || clean.includes('3;2') || clean.includes('b(3,2)') || clean.includes('b(3;2)');
      const hasMax = clean.includes('19') || clean.includes('max=19') || clean.includes('f=19');
      const hasPeaks = clean.includes('(1;0)') || clean.includes('(0;8)') || clean.includes('1;0') || clean.includes('0;8');
      return (hasB && hasMax) || (hasMax && hasPeaks) || clean.includes('19');
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>- Đường thẳng $d_1: x - y = 1$ qua $(1;0)$ và $(0;-1)$. Miền nghiệm chứa $O(0;0)$. (0,25đ)<br>- Đường thẳng $d_2: 2x + y = 8$ qua $(4;0)$ và $(0;8)$. Miền nghiệm chứa $O(0;0)$. (0,25đ)<br>- Kết hợp $x \\ge 0, y \\ge 0$ (góc phần tư thứ I), miền nghiệm của hệ là miền tứ giác $OABC$ (kể cả biên). (0,25đ)<br><br><strong>b) (0,75 điểm)</strong><br>- Tọa độ các đỉnh: $O(0; 0), A(1; 0), B(3; 2), C(0; 8)$. (0,25đ)<br>- Tính giá trị biểu thức $F(x, y) = 5x + 2y$ tại các đỉnh:<br>  + $F(O) = F(0, 0) = 5(0) + 2(0) = 0$<br>  + $F(A) = F(1, 0) = 5(1) + 2(0) = 5$<br>  + $F(B) = F(3, 2) = 5(3) + 2(2) = 19$<br>  + $F(C) = F(0, 8) = 5(0) + 2(8) = 16$. (0,25đ)<br>- So sánh các giá trị, giá trị lớn nhất của $F(x, y)$ trên miền nghiệm bằng $19$ tại đỉnh $B(3; 2)$. (0,25đ)',
  },
  {
    id: 'bpt16',
    number: 16,
    type: 'shortans',
    skill: 'Giải bài toán quy hoạch tuyến tính ứng dụng thực tế sản xuất',
    points: 1.5,
    text: 'Một công ty may mặc dự định may hai loại áo khoác là Áo khoác nhẹ ($A$) và Áo khoác ấm ($B$).<br>- Để may $1$ chiếc áo loại $A$, cần $1\\text{ giờ}$ cắt vải và $2\\text{ giờ}$ may hoàn thiện, mang lại lợi nhuận $150.000\\text{ đồng}$.<br>- Để may $1$ chiếc áo loại $B$, cần $2\\text{ giờ}$ cắt vải và $1\\text{ giờ}$ may hoàn thiện, mang lại lợi nhuận $120.000\\text{ đồng}$.<br>Xưởng có quỹ thời gian tối đa mỗi ngày là $8\\text{ giờ}$ cắt vải và $10\\text{ giờ}$ may hoàn thiện.<br><br><strong>a) (0,75 điểm)</strong> Gọi $x, y$ lần lượt là số chiếc áo loại $A$ và loại $B$ sản xuất trong một ngày ($x, y \\in \\mathbb{R}, x \\ge 0, y \\ge 0$). Lập hệ bất phương trình ràng buộc và biểu diễn miền nghiệm của hệ trên mặt phẳng $Oxy$.<br><strong>b) (0,75 điểm)</strong> Xưởng nên sản xuất bao nhiêu chiếc áo mỗi loại trong một ngày để thu được tổng lợi nhuận lớn nhất và tính giá trị lợi nhuận lớn nhất đó.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: '4 áo loại A, 2 áo loại B (x=4, y=2); Lợi nhuận lớn nhất 840.000 đồng',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const hasA = clean.includes('4') || clean.includes('x=4') || clean.includes('4ao') || clean.includes('4áo');
      const hasB = clean.includes('2') || clean.includes('y=2') || clean.includes('2ao') || clean.includes('2áo');
      const hasProfit = clean.includes('840') || clean.includes('840000') || clean.includes('840.000');
      return (hasA && hasB && hasProfit) || (hasA && hasB) || hasProfit;
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>- Hệ ràng buộc: $\\begin{cases} x + 2y \\le 8 \\\\ 2x + y \\le 10 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$ (0,25đ)<br>- Miền nghiệm là miền tứ giác $OABC$ (kể cả biên) với $O(0;0), A(5;0), B(4;2), C(0;4)$. (0,5đ)<br><br><strong>b) (0,75 điểm)</strong><br>- Lợi nhuận trong một ngày: $T(x, y) = 150x + 120y$ (nghìn đồng). (0,25đ)<br>- Tính giá trị của $T(x,y)$ tại 4 đỉnh miền nghiệm:<br>  + $T(O) = 0$<br>  + $T(A) = 150(5) + 120(0) = 750\\text{ (nghìn đồng)}$<br>  + $T(B) = 150(4) + 120(2) = 840\\text{ (nghìn đồng)}$<br>  + $T(C) = 150(0) + 120(4) = 480\\text{ (nghìn đồng)}$. (0,25đ)<br>- So sánh: Lợi nhuận lớn nhất là $840.000\\text{ đồng}$ khi xưởng sản xuất $4$ chiếc áo loại $A$ và $2$ chiếc áo loại $B$ mỗi ngày. (0,25đ)',
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
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State lưu danh sách câu hỏi trắc nghiệm đã xáo trộn phương án (Fisher-Yates)
  const [shuffledMCQQuestions, setShuffledMCQQuestions] = useState<ShuffledQuestionMCQ[]>(() =>
    MCQ_QUESTIONS_BPT_DE_B.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ originalKey: opt.key, text: opt.text })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS_BPT_DE_B.map((q) => ({
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
  const totalQuestions = MCQ_QUESTIONS_BPT_DE_B.length + SHORTANS_QUESTIONS_BPT_DE_B.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 6. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS10-BPT-DE-B';
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
    MCQ_QUESTIONS_BPT_DE_B.forEach((q) => {
      const studentChoice = mcqAnswers[q.id];
      if (studentChoice === q.correct) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (2 câu Tự luận, 1.5đ/câu)
    SHORTANS_QUESTIONS_BPT_DE_B.forEach((q) => {
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
      bai_thi: 'ĐỀ KIỂM TRA ĐỊNH KỲ TOÁN 10 - BPT & HỆ BPT BẬC NHẤT HAI ẨN [ĐỀ B]',
      diem: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS_BPT_DE_B.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_BPT_DE_B.length}`,
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
        Task_ID: 'KIEM_TRA_BPT_TOAN_10_DE_B',
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
          bai_thi: 'ĐỀ KIỂM TRA TOÁN 10 - BPT [ĐỀ B]',
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
        MCQ_QUESTIONS_BPT_DE_B.map((q) => ({
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
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-800 text-xs font-semibold uppercase tracking-wider rounded-full mb-2">
              Hệ thống khảo sát trực tuyến Integra &bull; Toán 10
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ MÔN TOÁN LỚP 10 -- ĐỀ B
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
              Chủ đề: Bất phương trình và Hệ bất phương trình bậc nhất hai ẩn
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 disabled:bg-slate-100"
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
                placeholder="HS10-BPT01"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 disabled:bg-slate-100"
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 disabled:bg-slate-100"
              />
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl">
              <span className="text-xs font-medium text-indigo-800">Thời gian còn lại</span>
              <span
                className={`text-xl font-bold font-mono ${
                  timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-indigo-950'
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
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        {/* KẾT QUẢ SAU KHI NỘP BÀI */}
        {isSubmitted && (
          <section className="bg-white rounded-2xl shadow-md border-2 border-indigo-600 p-6 sm:p-8 animate-fade-in">
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
              <div className="text-center sm:text-right bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-200 min-w-[140px]">
                <span className="text-xs uppercase text-slate-500 font-semibold block">Điểm số</span>
                <span className="text-4xl font-extrabold text-indigo-700">{diemSo}</span>
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
          <div className="bg-indigo-800 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
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
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 text-xs font-bold rounded-md">
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
                        'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold ring-2 ring-indigo-500/20';
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
                              ? 'bg-indigo-600 text-white'
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
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                      <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
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

          {SHORTANS_QUESTIONS_BPT_DE_B.map((q) => {
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
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 disabled:bg-slate-100"
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
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                      <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
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
              className="w-full sm:w-80 py-4 px-6 bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-400 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-indigo-600/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
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
