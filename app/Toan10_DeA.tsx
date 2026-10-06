'use client';

import React, { useState, useEffect } from 'react';

// --- CẤU HÌNH WEBHOOK URL ---
const GOOGLE_APP_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwFjkENCxOPVJcFo8OmXuLad5kcMEC9_Uu48hF045AO0yC8-TnHivEI0ohfUHZkJQlN/exec';
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook-test/cham-diem-integra';

// --- TYPES ---
interface Option {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

interface QuestionMCQ {
  id: string;
  number: number;
  type: 'mcq';
  skill: string;
  text: string;
  options: Option[];
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

interface QuestionShortAns {
  id: string;
  number: number;
  type: 'shortans';
  points: string;
  skill: string;
  text: string;
  correctHint: string;
  placeholder: string;
  explanation: string;
  validator: (val: string) => boolean;
}

// --- DỮ LIỆU CÂU HỎI TRẮC NGHIỆM (PHẦN I - 14 CÂU) ---
const MCQ_QUESTIONS: QuestionMCQ[] = [
  {
    id: 'q1',
    number: 1,
    type: 'mcq',
    skill: 'Định lý Côsin',
    text: 'Cho tam giác $ABC$ có độ dài các cạnh $BC = a, CA = b, AB = c$. Khẳng định nào sau đây <strong>đúng</strong>?',
    options: [
      { key: 'A', text: '$a^2 = b^2 + c^2 + 2bc \\cos A$' },
      { key: 'B', text: '$a^2 = b^2 + c^2 - 2bc \\cos A$' },
      { key: 'C', text: '$a^2 = b^2 + c^2 - bc \\cos A$' },
      { key: 'D', text: '$a^2 = b^2 + c^2 - 2bc \\sin A$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo Định lý Côsin trong tam giác $ABC$, ta có $a^2 = b^2 + c^2 - 2bc \\cos A$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'q2',
    number: 2,
    type: 'mcq',
    skill: 'Định lý Sin',
    text: 'Cho tam giác $ABC$ có bán kính đường tròn ngoại tiếp bằng $R$. Khẳng định nào sau đây <strong>đúng</strong>?',
    options: [
      { key: 'A', text: '$\\dfrac{a}{\\sin A} = R$' },
      { key: 'B', text: '$\\dfrac{a}{\\sin A} = 2R$' },
      { key: 'C', text: '$\\dfrac{a}{\\sin A} = \\dfrac{1}{2R}$' },
      { key: 'D', text: '$\\dfrac{a}{\\cos A} = 2R$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo Định lý Sin trong tam giác $ABC$, ta có $\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C} = 2R$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'q3',
    number: 3,
    type: 'mcq',
    skill: 'Tính cạnh bằng định lý Côsin',
    text: 'Cho tam giác $ABC$ có $b = 6$, $c = 8$ và góc $\\widehat{A} = 120^\\circ$. Độ dài cạnh $a$ bằng:',
    options: [
      { key: 'A', text: '$2\\sqrt{37}$' },
      { key: 'B', text: '$2\\sqrt{13}$' },
      { key: 'C', text: '$10$' },
      { key: 'D', text: '$14$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng Định lý Côsin trong tam giác $ABC$:<br>$$a^2 = b^2 + c^2 - 2bc \\cos A = 6^2 + 8^2 - 2 \\cdot 6 \\cdot 8 \\cdot \\cos 120^\\circ = 36 + 64 - 96 \\cdot \\left(-\\dfrac{1}{2}\\right) = 148.$$Suy ra $a = \\sqrt{148} = 2\\sqrt{37}$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'q4',
    number: 4,
    type: 'mcq',
    skill: 'Độ dài đường cao trong tam giác',
    text: 'Cho tam giác $ABC$ có độ dài ba cạnh lần lượt là $a = 13$, $b = 14$, $c = 15$. Độ dài đường cao $h_b$ kẻ từ đỉnh $B$ của tam giác $ABC$ bằng:',
    options: [
      { key: 'A', text: '$12$' },
      { key: 'B', text: '$\\dfrac{168}{13}$' },
      { key: 'C', text: '$\\dfrac{56}{5}$' },
      { key: 'D', text: '$24$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Tính nửa chu vi $p = \\dfrac{13 + 14 + 15}{2} = 21$.<br>Diện tích tam giác $ABC$ theo công thức Heron:$$S = \\sqrt{p(p-a)(p-b)(p-c)} = \\sqrt{21 \\cdot (21-13) \\cdot (21-14) \\cdot (21-15)} = \\sqrt{21 \\cdot 8 \\cdot 7 \\cdot 6} = 84.$$Mặt khác $S = \\dfrac{1}{2} b h_b \\implies h_b = \\dfrac{2S}{b} = \\dfrac{2 \\cdot 84}{14} = 12$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'q5',
    number: 5,
    type: 'mcq',
    skill: 'Bán kính đường tròn nội tiếp',
    text: 'Cho tam giác $ABC$ có $a = 7$, $b = 8$, $c = 9$. Bán kính $r$ của đường tròn nội tiếp tam giác $ABC$ bằng:',
    options: [
      { key: 'A', text: '$\\sqrt{5}$' },
      { key: 'B', text: '$2\\sqrt{5}$' },
      { key: 'C', text: '$\\dfrac{3\\sqrt{5}}{2}$' },
      { key: 'D', text: '$\\dfrac{\\sqrt{5}}{2}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Nửa chu vi $p = \\dfrac{7 + 8 + 9}{2} = 12$.<br>Diện tích tam giác $ABC$ theo công thức Heron:$$S = \\sqrt{12 \\cdot (12-7) \\cdot (12-8) \\cdot (12-9)} = \\sqrt{12 \\cdot 5 \\cdot 4 \\cdot 3} = 12\\sqrt{5}.$$Bán kính đường tròn nội tiếp $r = \\dfrac{S}{p} = \\dfrac{12\\sqrt{5}}{12} = \\sqrt{5}$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'q6',
    number: 6,
    type: 'mcq',
    skill: 'Giải tam giác thực tế - Khoảng cách',
    text: 'Để đo khoảng cách giữa hai điểm $A$ và $B$ nằm ở hai bên bờ một hồ nước mà không thể đo trực tiếp, người ta chọn một điểm $C$ trên bờ sao cho quan sát được cả $A$ và $B$. Đo được $CA = 60\\text{ m}$, $CB = 100\\text{ m}$ và góc $\\widehat{ACB} = 60^\\circ$. Khoảng cách $AB$ giữa hai điểm bằng:',
    options: [
      { key: 'A', text: '$20\\sqrt{19}\\text{ m}$' },
      { key: 'B', text: '$20\\sqrt{14}\\text{ m}$' },
      { key: 'C', text: '$140\\text{ m}$' },
      { key: 'D', text: '$20\\sqrt{31}\\text{ m}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng Định lý Côsin cho tam giác $ABC$:<br>$$AB^2 = CA^2 + CB^2 - 2 \\cdot CA \\cdot CB \\cdot \\cos \\widehat{ACB} = 60^2 + 100^2 - 2 \\cdot 60 \\cdot 100 \\cdot \\cos 60^\\circ$$$$AB^2 = 3600 + 10000 - 12000 \\cdot \\dfrac{1}{2} = 7600.$$Suy ra $AB = \\sqrt{7600} = 20\\sqrt{19}\\text{ m} \\approx 87,2\\text{ m}$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'q7',
    number: 7,
    type: 'mcq',
    skill: 'Hệ thức lượng nâng cao - Tính góc',
    text: 'Cho tam giác $ABC$ thỏa mãn $a^4 + b^4 + c^4 = 2c^2(a^2 + b^2)$. Số đo góc $\\widehat{C}$ của tam giác $ABC$ có thể bằng:',
    options: [
      { key: 'A', text: '$45^\\circ$ hoặc $135^\\circ$' },
      { key: 'B', text: '$60^\\circ$ hoặc $120^\\circ$' },
      { key: 'C', text: '$45^\\circ$' },
      { key: 'D', text: '$135^\\circ$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Biến đổi đẳng thức đã cho:<br>$$a^4 + b^4 + c^4 = 2a^2c^2 + 2b^2c^2 \\iff a^4 + b^4 + c^4 - 2a^2c^2 - 2b^2c^2 + 2a^2b^2 = 2a^2b^2$$$$\\iff (a^2 + b^2 - c^2)^2 = 2a^2b^2 \\iff a^2 + b^2 - c^2 = \\pm \\sqrt{2}ab.$$Theo hệ quả định lý Côsin: $\\cos C = \\dfrac{a^2 + b^2 - c^2}{2ab} = \\dfrac{\\pm \\sqrt{2}ab}{2ab} = \\pm \\dfrac{\\sqrt{2}}{2}$.<br>- Nếu $\\cos C = \\dfrac{\\sqrt{2}}{2} \\implies \\widehat{C} = 45^\\circ$.<br>- Nếu $\\cos C = -\\dfrac{\\sqrt{2}}{2} \\implies \\widehat{C} = 135^\\circ$.<br>Vậy góc $\\widehat{C}$ có thể bằng $45^\\circ$ hoặc $135^\\circ$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'q8',
    number: 8,
    type: 'mcq',
    skill: 'Nghiệm của hệ bất phương trình',
    text: 'Cặp số $(x; y) = (1; -1)$ là một nghiệm của hệ bất phương trình nào sau đây?',
    options: [
      { key: 'A', text: '$\\begin{cases} x + y - 2 > 0 \\\\ 2x - y + 1 < 0 \\end{cases}$' },
      { key: 'B', text: '$\\begin{cases} x - y - 1 > 0 \\\\ x + 2y + 3 > 0 \\end{cases}$' },
      { key: 'C', text: '$\\begin{cases} x + 3y + 1 < 0 \\\\ 3x - y - 2 \\le 0 \\end{cases}$' },
      { key: 'D', text: '$\\begin{cases} 2x + y + 1 > 0 \\\\ x - y + 2 < 0 \\end{cases}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Thay $(x; y) = (1; -1)$ vào hệ phương án B:<br>$1 - (-1) - 1 = 1 > 0$ (Đúng).<br>$1 + 2(-1) + 3 = 2 > 0$ (Đúng).<br>Do đó cặp số $(1; -1)$ là nghiệm của hệ bất phương trình ở phương án B.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'q9',
    number: 9,
    type: 'mcq',
    skill: 'Hình dạng miền nghiệm hệ BPT',
    text: 'Miền nghiệm của hệ bất phương trình $\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ x + y \\le 4 \\end{cases}$ trên mặt phẳng tọa độ $Oxy$ là một hình phẳng có dạng:',
    options: [
      { key: 'A', text: 'Tam giác' },
      { key: 'B', text: 'Hình chữ nhật' },
      { key: 'C', text: 'Ngũ giác' },
      { key: 'D', text: 'Đường thẳng' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Điều kiện $x \\ge 0, y \\ge 0$ giới hạn miền nghiệm thuộc góc phần tư thứ nhất. Đường thẳng $x + y = 4$ cắt trục hoành tại $(4;0)$ và trục tung tại $(0;4)$. Miền nghiệm là phần mặt phẳng giới hạn bởi ba đường thẳng $x = 0$, $y = 0$ và $x + y = 4$, tạo thành miền tam giác vuông cân có ba đỉnh là $(0;0)$, $(4;0)$ và $(0;4)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'q10',
    number: 10,
    type: 'mcq',
    skill: 'Xác định hệ BPT từ miền nghiệm',
    text: 'Cho miền nghiệm (miền không bị gạch) của một hệ bất phương trình là miền tam giác $OAB$ với các đỉnh $O(0;0)$, $A(3;0)$, $B(0;2)$ (bao gồm cả các cạnh). Hệ bất phương trình đó là:',
    options: [
      { key: 'A', text: '$\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ 2x + 3y \\le 6 \\end{cases}$' },
      { key: 'B', text: '$\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ 3x + 2y \\le 6 \\end{cases}$' },
      { key: 'C', text: '$\\begin{cases} x \\le 0 \\\\ y \\le 0 \\\\ 2x + 3y \\ge 6 \\end{cases}$' },
      { key: 'D', text: '$\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ 2x + 3y \\ge 6 \\end{cases}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Đường thẳng đi qua hai điểm $A(3;0)$ và $B(0;2)$ có phương trình đoạn chắn: $\\dfrac{x}{3} + \\dfrac{y}{2} = 1 \\iff 2x + 3y = 6$.<br>Thử gốc tọa độ $O(0;0)$ vào vế trái: $2(0) + 3(0) = 0 \\le 6$. Miền nghiệm chứa $O$ nên bất phương trình là $2x + 3y \\le 6$.<br>Kết hợp điều kiện miền nghiệm nằm ở góc phần tư thứ I ($x \\ge 0, y \\ge 0$), ta được hệ bất phương trình ở phương án A.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'q11',
    number: 11,
    type: 'mcq',
    skill: 'Đỉnh của miền nghiệm đa giác',
    text: 'Miền nghiệm của hệ bất phương trình $\\begin{cases} x + y \\le 5 \\\\ x - y \\ge -1 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$ là một đa giác. Tọa độ đỉnh có tung độ lớn nhất của đa giác này là:',
    options: [
      { key: 'A', text: '$(2; 3)$' },
      { key: 'B', text: '$(0; 5)$' },
      { key: 'C', text: '$(5; 0)$' },
      { key: 'D', text: '$(0; 1)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Vẽ các đường thẳng biên trên mặt phẳng $Oxy$:<br>- Đường thẳng $d_1: x + y = 5$ cắt $Ox$ tại $(5;0)$, cắt $Oy$ tại $(0;5)$.<br>- Đường thẳng $d_2: x - y = -1$ cắt $Oy$ tại $(0;1)$.<br>- Tọa độ giao điểm của $d_1$ và $d_2$ là nghiệm của hệ $\\begin{cases} x + y = 5 \\\\ x - y = -1 \\end{cases} \\iff \\begin{cases} x = 2 \\\\ y = 3 \\end{cases}$.<br>Miền nghiệm là tứ giác giới hạn bởi 4 đỉnh: $O(0;0)$, $A(5;0)$, $B(2;3)$, $C(0;1)$.<br>Tung độ lớn nhất trong các đỉnh là $y = 3$ ứng với đỉnh $B(2;3)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'q12',
    number: 12,
    type: 'mcq',
    skill: 'Giá trị lớn nhất trên miền đa giác',
    text: 'Cho $x, y$ thỏa mãn hệ bất phương trình $\\begin{cases} 0 \\le x \\le 4 \\\\ y \\ge 0 \\\\ x + y \\le 6 \\end{cases}$. Giá trị lớn nhất của biểu thức $F(x, y) = 3x + 2y$ bằng:',
    options: [
      { key: 'A', text: '$16$' },
      { key: 'B', text: '$12$' },
      { key: 'C', text: '$18$' },
      { key: 'D', text: '$14$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Miền nghiệm của hệ bất phương trình là tứ giác $OABC$ với các đỉnh:<br>- $O(0;0) \\implies F(0,0) = 0$.<br>- $A(4;0) \\implies F(4,0) = 3(4) + 2(0) = 12$.<br>- $B(4;2)$ (giao điểm của $x = 4$ và $x + y = 6$) $\\implies F(4,2) = 3(4) + 2(2) = 16$.<br>- $C(0;6)$ (giao điểm của $x = 0$ và $x + y = 6$) $\\implies F(0,6) = 3(0) + 2(6) = 12$.<br>Giá trị lớn nhất của $F(x,y)$ trên miền nghiệm bằng $16$ tại điểm $(4;2)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'q13',
    number: 13,
    type: 'mcq',
    skill: 'Mô hình hóa bài toán thực tế bằng hệ BPT',
    text: 'Bác An đầu tư trồng hai loại cây nông nghiệp là mì (sắn) và ngô trên diện tích đất tối đa $8\\text{ ha}$. Chi phí trồng $1\\text{ ha}$ mì là $3\\text{ triệu đồng}$, chi phí trồng $1\\text{ ha}$ ngô là $4\\text{ triệu đồng}$. Bác An có tổng số vốn đầu tư tối đa là $27\\text{ triệu đồng}$. Gọi $x$ và $y$ lần lượt là số hecta đất trồng mì và ngô. Hệ bất phương trình mô tả các điều kiện ràng buộc về diện tích và vốn đầu tư của bác An là:',
    options: [
      { key: 'A', text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ x + y \\le 8 \\\\ 3x + 4y \\le 27 \\end{cases}$' },
      { key: 'B', text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ x + y \\ge 8 \\\\ 3x + 4y \\le 27 \\end{cases}$' },
      { key: 'C', text: '$\\begin{cases} x > 0, y > 0 \\\\ x + y \\le 8 \\\\ 4x + 3y \\le 27 \\end{cases}$' },
      { key: 'D', text: '$\\begin{cases} x \\ge 0, y \\ge 0 \\\\ x + y \\le 27 \\\\ 3x + 4y \\le 8 \\end{cases}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong><br>- Diện tích đất trồng không âm: $x \\ge 0, y \\ge 0$.<br>- Ràng buộc tổng diện tích đất: $x + y \\le 8$.<br>- Ràng buộc tổng vốn đầu tư: $3x + 4y \\le 27$.<br>Kết hợp các điều kiện trên ta được hệ bất phương trình ở phương án A.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'q14',
    number: 14,
    type: 'mcq',
    skill: 'Tối ưu hóa quy hoạch tuyến tính',
    text: 'Một xưởng sản xuất hai loại sản phẩm $I$ và $II$. Để sản xuất $1\\text{ kg}$ sản phẩm loại $I$ cần $2\\text{ giờ}$ làm việc của máy và $1\\text{ kg}$ nguyên liệu. Để sản xuất $1\\text{ kg}$ sản phẩm loại $II$ cần $1\\text{ giờ}$ làm việc của máy và $2\\text{ kg}$ nguyên liệu. Xưởng có tối đa $12\\text{ giờ}$ làm việc của máy và $12\\text{ kg}$ nguyên liệu. Mỗi kilôgam sản phẩm loại $I$ mang lại lợi nhuận $50\\text{ nghìn đồng}$, mỗi kilôgam sản phẩm loại $II$ mang lại lợi nhuận $40\\text{ nghìn đồng}$. Tiền lãi lớn nhất mà xưởng có thể thu được là:',
    options: [
      { key: 'A', text: '$360\\text{ nghìn đồng}$' },
      { key: 'B', text: '$300\\text{ nghìn đồng}$' },
      { key: 'C', text: '$400\\text{ nghìn đồng}$' },
      { key: 'D', text: '$320\\text{ nghìn đồng}$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Gọi $x, y$ ($x \\ge 0, y \\ge 0$) lần lượt là số kilôgam sản phẩm loại $I$ và $II$ xưởng sản xuất.<br>Hệ bất phương trình ràng buộc:$$\\begin{cases} 2x + y \\le 12 \\\\ x + 2y \\le 12 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$$Miền nghiệm là tứ giác $OABC$ với các đỉnh $O(0;0)$, $A(6;0)$, $B(4;4)$, $C(0;6)$.<br>Hàm lợi nhuận $T(x, y) = 50x + 40y$ (nghìn đồng).<br>Tính giá trị $T(x,y)$ tại các đỉnh:<br>- $T(0,0) = 0$.<br>- $T(6,0) = 50(6) + 40(0) = 300\\text{ nghìn đồng}$.<br>- $T(4,4) = 50(4) + 40(4) = 360\\text{ nghìn đồng}$.<br>- $T(0,6) = 50(0) + 40(6) = 240\\text{ nghìn đồng}$.<br>Vậy tiền lãi lớn nhất xưởng thu được là $360\\text{ nghìn đồng}$ khi sản xuất $4\\text{ kg}$ sản phẩm loại $I$ và $4\\text{ kg}$ sản phẩm loại $II$.<br><strong>Đáp án đúng: A.</strong>',
  },
];

// --- DỮ LIỆU CÂU HỎI TỰ LUẬN (PHẦN II - 2 CÂU) ---
const SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'q15',
    number: 15,
    type: 'shortans',
    points: '1,5 điểm',
    skill: 'Ứng dụng hệ thức lượng đo khoảng cách thực tế',
    correctHint: 'BC = 77.3, CD = 24.6',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    text: 'Để xác định chiều cao $CD$ của một tháp hải đăng đặt trên đỉnh một ngọn núi đá thẳng đứng bờ biển, người ta chọn hai điểm quan sát $A$ và $B$ thẳng hàng với chân tháp $H$ trên mặt đất phẳng (với $B$ nằm giữa $A$ và $H$, khoảng cách $AB = 40\\text{ m}$). Từ $A$ và $B$, người ta đo được góc nâng nhìn lên đỉnh tháp $C$ lần lượt là $\\widehat{CAD} = 30^\\circ$ và $\\widehat{CBD} = 45^\\circ$.<br><br><strong>a) (0,75 điểm)</strong> Tính độ dài đoạn thẳng $BC$ (khoảng cách từ vị trí $B$ đến đỉnh tháp $C$).<br><strong>b) (0,75 điểm)</strong> Biết chiều cao ngọn núi đá từ chân $H$ đến chân tháp $D$ là $HD = 30\\text{ m}$. Tính chiều cao $CD$ của tháp hải đăng (làm tròn kết quả đến hàng phần mười mét).',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/,/g, '.');
      const hasBC = clean.includes('77.3') || clean.includes('77.27');
      const hasCD = clean.includes('24.6') || clean.includes('24.64');
      return hasBC && hasCD;
    },
    explanation:
      '<strong class="text-emerald-800 font-bold">Đáp án chuẩn:</strong> $BC \\approx 77{,}3\\text{ m}; \\quad CD \\approx 24{,}6\\text{ m}$<br><br><strong>Lời giải chi tiết:</strong><br>a) Trong tam giác $ABC$, ta có góc ngoài $\\widehat{CBD} = \\widehat{CAB} + \\widehat{ACB}$.<br>Suy ra $\\widehat{ACB} = \\widehat{CBD} - \\widehat{CAB} = 45^\\circ - 30^\\circ = 15^\\circ$. (0,25 điểm)<br>Áp dụng Định lý Sin trong tam giác $ABC$:<br>$$\\dfrac{BC}{\\sin \\widehat{CAB}} = \\dfrac{AB}{\\sin \\widehat{ACB}} \\iff \\dfrac{BC}{\\sin 30^\\circ} = \\dfrac{40}{\\sin 15^\\circ}.$$ (0,25 điểm)<br>Suy ra $BC = \\dfrac{40 \\cdot \\sin 30^\\circ}{\\sin 15^\\circ} = \\dfrac{20}{\\sin 15^\\circ} \\approx 77{,}27\\text{ m} \\approx 77{,}3\\text{ m}$. (0,25 điểm)<br><br>b) Xét tam giác vuông $CHB$ tại $H$:<br>$CH = BC \\cdot \\sin \\widehat{CBH} = BC \\cdot \\sin 45^\\circ$. (0,25 điểm)<br>Thay giá trị $BC = \\dfrac{20}{\\sin 15^\\circ}$ vào:<br>$$CH = \\dfrac{20}{\\sin 15^\\circ} \\cdot \\dfrac{\\sqrt{2}}{2} = \\dfrac{10\\sqrt{2}}{\\sin 15^\\circ} \\approx 54{,}64\\text{ m}.$$ (0,25 điểm)<br>Chiều cao của tháp hải đăng $CD$ là:<br>$$CD = CH - HD = 54{,}64 - 30 = 24{,}64\\text{ m} \\approx 24{,}6\\text{ m}.$$ (0,25 điểm)',
  },
  {
    id: 'q16',
    number: 16,
    type: 'shortans',
    points: '1,5 điểm',
    skill: 'Quy hoạch tuyến tính thực phẩm chức năng',
    correctHint: '3 hộp A, 4 hộp B, lãi 320000',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    text: 'Một công ty dược phẩm dự định sản xuất hai loại thực phẩm chức năng bổ sung vi chất là Loại $A$ và Loại $B$.<ul class="list-disc list-inside my-2 space-y-1 text-sm"><li>Để sản xuất $1\\text{ hộp}$ Loại $A$ cần $2\\text{ g}$ chất $X$ và $1\\text{ g}$ chất $Y$, mang lại lợi nhuận $40.000\\text{ đồng}$.</li><li>Để sản xuất $1\\text{ hộp}$ Loại $B$ cần $1\\text{ g}$ chất $X$ và $3\\text{ g}$ chất $Y$, mang lại lợi nhuận $50.000\\text{ đồng}$.</li></ul>Biết rằng nguồn nguyên liệu dự trữ của công ty hiện có tối đa $10\\text{ g}$ chất $X$ và $15\\text{ g}$ chất $Y$.<br><br><strong>a) (0,75 điểm)</strong> Gọi $x, y$ lần lượt là số hộp thực phẩm chức năng Loại $A$ và Loại $B$ cần sản xuất ($x, y \\in \\mathbb{R}, x \\ge 0, y \\ge 0$). Lập hệ bất phương trình mô tả điều kiện ràng buộc và biểu diễn miền nghiệm của hệ bất phương trình đó trên mặt phẳng tọa độ $Oxy$.<br><strong>b) (0,75 điểm)</strong> Xác định số lượng hộp thực phẩm chức năng mỗi loại công ty nên sản xuất để thu được tổng lợi nhuận lớn nhất và tính giá trị lợi nhuận lớn nhất đó.',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/,/g, '.');
      const hasA = clean.includes('3');
      const hasB = clean.includes('4');
      const hasProfit = clean.includes('320') || clean.includes('320000');
      return hasA && hasB && hasProfit;
    },
    explanation:
      '<strong class="text-emerald-800 font-bold">Đáp án chuẩn:</strong> $3\\text{ hộp A}, 4\\text{ hộp B}$, Lợi nhuận lớn nhất $320.000\\text{ đồng}$<br><br><strong>Lời giải chi tiết:</strong><br>a) Lập hệ bất phương trình ràng buộc:<br>- Số lượng sản phẩm không âm: $x \\ge 0, y \\ge 0$.<br>- Lượng chất $X$ sử dụng: $2x + y \\le 10$.<br>- Lượng chất $Y$ sử dụng: $x + 3y \\le 15$.<br>Ta có hệ bất phương trình: $\\begin{cases} 2x + y \\le 10 \\\\ x + 3y \\le 15 \\\\ x \\ge 0 \\\\ y \\ge 0 \\end{cases}$ (0,25 điểm)<br><br>Biểu diễn miền nghiệm trên mặt phẳng $Oxy$:<br>- Đường thẳng $d_1: 2x + y = 10$ qua $(5;0)$ và $(0;10)$.<br>- Đường thẳng $d_2: x + 3y = 15$ qua $(15;0)$ và $(0;5)$.<br>- Miền nghiệm là miền tứ giác $OACB$ (kể cả biên) với $O(0;0)$, $A(5;0)$, $B(0;5)$ và $C(3;4)$ (là giao điểm của $d_1$ và $d_2$). (0,5 điểm)<br><br>b) Tổng lợi nhuận thu được là $F(x, y) = 40x + 50y$ (nghìn đồng). (0,25 điểm)<br>Tính giá trị của $F(x,y)$ tại 4 đỉnh miền nghiệm:<br>- $F(0,0) = 0$.<br>- $F(5,0) = 40(5) + 50(0) = 200\\text{ (nghìn đồng)}$.<br>- $F(0,5) = 40(0) + 50(5) = 250\\text{ (nghìn đồng)}$.<br>- $F(3,4) = 40(3) + 50(4) = 320\\text{ (nghìn đồng)}$. (0,25 điểm)<br>So sánh các giá trị, $F(x,y)$ đạt giá trị lớn nhất bằng $320\\text{ nghìn đồng}$ tại $C(3;4)$.<br>Vậy công ty nên sản xuất $3\\text{ hộp}$ Loại $A$ và $4\\text{ hộp}$ Loại $B$ để thu được lợi nhuận lớn nhất là $320.000\\text{ đồng}$. (0,25 điểm)',
  },
];

// --- COMPONENT CHÍNH ---
export default function Toan10_DeA() {
  // 1. STATE MANAGEMENT
  const [tenHocSinh, setTenHocSinh] = useState<string>('');
  const [maHocSinh, setMaHocSinh] = useState<string>('');
  const [lopNhom, setLopNhom] = useState<string>('');

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [diemSo, setDiemSo] = useState<number>(0);
  const [mangCauSai, setMangCauSai] = useState<string[]>([]);

  // 2. XỬ LÝ KATEX VỚI useEffect & renderMathInElement
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

    // Render ngay khi mount và khi mở lời giải
    triggerKaTeX();

    // Fallback nếu KaTeX script tải bất đồng bộ từ CDN
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
        triggerKaTeX();
        clearInterval(interval);
      }
    }, 250);

    const timeout = setTimeout(() => clearInterval(interval), 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isSubmitted]);

  // Cập nhật đáp án khi học sinh chọn MCQ hoặc nhập Shortans
  const handleAnswerChange = (qId: string, value: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [qId]: value,
    }));
  };

  // 3. LOGIC NỘP BÀI (SUBMIT) & CHẤM ĐIỂM TỰ ĐỘNG
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() ? tenHocSinh.trim() : 'Ẩn danh';
    const ma = maHocSinh.trim() ? maHocSinh.trim() : 'Trống';
    const lop = lopNhom.trim() ? lopNhom.trim() : 'Trống';

    if (ten === 'Ẩn danh' && ma === 'Trống') {
      const confirmAnonymous = window.confirm(
        'Em chưa nhập Tên và Mã Học Sinh. Em có muốn tiếp tục nộp bài ẩn danh không?'
      );
      if (!confirmAnonymous) {
        const inputTen = document.getElementById('input-ten');
        if (inputTen) inputTen.focus();
        return;
      }
    }

    setIsSubmitting(true);

    let calculatedScore = 0;
    const wrongSkills: string[] = [];

    // Chấm Phần I (14 câu trắc nghiệm - 0.5đ/câu)
    MCQ_QUESTIONS.forEach((q) => {
      const studentChoice = answers[q.id];
      if (studentChoice === q.correct) {
        calculatedScore += 0.5;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (2 câu tự luận - 1.5đ/câu)
    SHORTANS_QUESTIONS.forEach((q) => {
      const studentText = answers[q.id] || '';
      const isCorrect = q.validator(studentText);
      if (isCorrect) {
        calculatedScore += 1.5;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Làm tròn 1 chữ số thập phân
    const finalScore = Math.min(10, Math.round(calculatedScore * 10) / 10);
    const uniqueSkills = Array.from(new Set(wrongSkills));

    setDiemSo(finalScore);
    setMangCauSai(uniqueSkills);
    setIsSubmitted(true);

    // Cuộn lên đầu trang xem bảng điểm
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 4. GỬI API WEBHOOK (THEO CHUẨN JSON CỦA YÊU CẦU)
    const tenBaiThi = 'ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ MÔN TOÁN LỚP 10 -- ĐỀ A';
    const chiTietPhanHoiObj = {
      hoc_sinh: ten,
      ma_hs: ma,
      lop: lop,
      bai_thi: tenBaiThi,
      diem: finalScore,
      thoi_gian_nop: new Date().toLocaleString('vi-VN'),
      ky_nang_sai: uniqueSkills,
      dap_an_chi_tiet: answers,
    };

    const webhookGASPayload = {
      action: 'submit_test',
      data: {
        Student_ID: ma,
        Task_ID: 'TOAN10_DEA',
        Diem_So: finalScore,
        Thoi_Gian_Lam: 45,
        Chi_Tiet_Phan_Hoi: JSON.stringify(chiTietPhanHoiObj),
      },
    };

    let isWebhookSent = false;

    // 1. Fetch gửi Webhook Google Apps Script
    try {
      const response = await fetch(GOOGLE_APP_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(webhookGASPayload),
      });

      const result = await response.json();

      if (result.status === "success") {
        console.log('Đã ghi dữ liệu thành công:', result);
        isWebhookSent = true;
      } else {
        console.error('Lỗi từ bên trong Google Apps Script:', result.message);
      }
    } catch (err) {
      console.error('Lỗi kết nối hoặc đứt mạng:', err);
    }

    // 4.2. Đồng bộ dự phòng qua n8n Integra
    try {
      const responseN8n = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoc_sinh: ten,
          ma_hs: ma,
          lop: lop,
          bai_thi: tenBaiThi,
          diem: finalScore,
          thoi_gian_nop: new Date().toLocaleString('vi-VN'),
          ky_nang_sai: uniqueSkills,
        }),
      });
      if (responseN8n.ok) isWebhookSent = true;
    } catch (err) {
      console.warn('n8n local webhook không khả dụng:', err);
    }

    setIsSubmitting(false);

    if (isWebhookSent) {
      alert(`Nộp bài thành công!\nĐiểm của em: ${finalScore} / 10.0\nKết quả chi tiết đã được gửi về Thầy Ngọc.`);
    } else {
      alert(`Đã ghi nhận điểm: ${finalScore} / 10.0. (Hệ thống đã lưu điểm trực tiếp).`);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased selection:bg-brand-500 selection:text-white py-8 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER ĐỀ THI */}
        <header className="bg-white rounded-2xl shadow-sm p-6 md:p-8 text-center border border-slate-200">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 mb-2 uppercase tracking-wider">
            TOÁN 10 -- KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ (45 PHÚT)
          </span>
          <h1 id="exam-title" className="text-2xl md:text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
            ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ MÔN TOÁN LỚP 10 -- ĐỀ A
          </h1>
          <p className="text-slate-600 font-medium mt-2">
            Chủ đề: Hệ thức lượng trong tam giác và Hệ bất phương trình bậc nhất hai ẩn
          </p>
          <p className="text-slate-500 text-sm mt-1 italic">
            (Thời gian làm bài: 45 phút -- Đề thi gồm 14 câu trắc nghiệm và 02 câu tự luận)
          </p>
        </header>

        {/* FORM NHẬP THÔNG TIN HS (BẮT BUỘC 3 TRƯỜNG THEO QUY CHUẨN) */}
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            Thông tin học sinh dự thi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="input-ten" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Họ và tên học sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-ten"
                value={tenHocSinh}
                onChange={(e) => setTenHocSinh(e.target.value)}
                disabled={isSubmitted}
                placeholder="VD: Nguyễn Văn A"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="input-ma-hs" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Mã Học Sinh (Mã HS) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-ma-hs"
                value={maHocSinh}
                onChange={(e) => setMaHocSinh(e.target.value)}
                disabled={isSubmitted}
                placeholder="VD: NTH26-001"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="input-lop" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Lớp / Nhóm học tập
              </label>
              <input
                type="text"
                id="input-lop"
                value={lopNhom}
                onChange={(e) => setLopNhom(e.target.value)}
                disabled={isSubmitted}
                placeholder="VD: 10A1"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          </div>
        </section>

        {/* BẢNG KẾT QUẢ (HIỆN SAU KHI NỘP BÀI) */}
        {isSubmitted && (
          <div
            id="result-box"
            className="p-6 rounded-2xl bg-gradient-to-r from-brand-50 via-indigo-50 to-blue-50 border border-brand-200 shadow-sm transition-all"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-600 text-white">
                    HOÀN THÀNH
                  </span>
                  <h2 className="text-xl font-bold text-slate-800">KẾT QUẢ BÀI THI</h2>
                </div>
                <p id="result-summary" className="text-slate-600 text-sm mt-1.5">
                  Học sinh: {tenHocSinh.trim() || 'Ẩn danh'} -- Lớp: {lopNhom.trim() || 'Trống'} (Mã HS: {maHocSinh.trim() || 'Trống'})
                </p>
                <p id="result-skills" className="text-rose-600 font-semibold text-sm mt-1.5">
                  {mangCauSai.length > 0
                    ? `⚠️ Các chuyên đề/kỹ năng cần ôn tập thêm: ${mangCauSai.join(', ')}`
                    : `🎉 Xuất sắc! Em đã trả lời chính xác tất cả các câu hỏi trong đề thi!`}
                </p>
              </div>
              <div className="text-center bg-white px-7 py-4 rounded-xl shadow border border-brand-100 min-w-[160px]">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Điểm tổng kết
                </span>
                <div id="score-display" className="text-4xl font-black text-brand-600 my-0.5">
                  {diemSo.toFixed(1)}
                </div>
                <span className="text-xs text-slate-400 font-medium">/ 10.0 điểm</span>
              </div>
            </div>
          </div>
        )}

        {/* FORM BÀI THI */}
        <form id="examForm" onSubmit={(e) => e.preventDefault()} className="space-y-6">

          {/* ==================== PHẦN I ==================== */}
          <div className="bg-brand-900 text-white px-5 py-3.5 rounded-xl font-bold text-sm md:text-base flex items-center justify-between shadow-sm">
            <span>I. PHẦN TRẮC NGHIỆM (7,0 ĐIỂM)</span>
            <span className="text-xs bg-brand-800 px-3 py-1 rounded-full text-brand-100 font-semibold tracking-wide">
              14 Câu (0,5đ/câu)
            </span>
          </div>

          {MCQ_QUESTIONS.map((q) => {
            const studentSelected = answers[q.id];
            const isCorrect = studentSelected === q.correct;

            // Xác định viền card câu hỏi sau khi nộp
            let cardBorder = 'border-slate-200';
            if (isSubmitted) {
              cardBorder = isCorrect
                ? 'border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/10'
                : 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10';
            }

            return (
              <div
                key={q.id}
                className={`question-block bg-white rounded-2xl shadow-sm p-6 border transition hover:shadow-md ${cardBorder}`}
                data-id={q.id}
                data-type="mcq"
                data-correct={q.correct}
                data-skill={q.skill}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-lg text-sm">
                    Câu {q.number}
                  </div>
                  <span className="text-xs text-slate-400 font-medium italic">
                    Kỹ năng: {q.skill}
                  </span>
                </div>

                <div
                  className="text-slate-800 text-base leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: q.text }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {q.options.map((opt) => {
                    const isOptionSelected = studentSelected === opt.key;
                    const isOptionCorrectAnswer = opt.key === q.correct;

                    let optionClass = 'border-slate-200 hover:bg-slate-50';
                    if (isSubmitted) {
                      if (isOptionCorrectAnswer) {
                        optionClass = 'correct-choice ring-1 ring-emerald-500 font-semibold';
                      } else if (isOptionSelected && !isOptionCorrectAnswer) {
                        optionClass = 'wrong-choice ring-1 ring-rose-500 line-through';
                      } else {
                        optionClass = 'border-slate-200 opacity-60';
                      }
                    } else if (isOptionSelected) {
                      optionClass = 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500 font-medium';
                    }

                    return (
                      <label
                        key={opt.key}
                        className={`choice-option flex items-center gap-3 p-3.5 border rounded-xl transition ${
                          isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'
                        } ${optionClass}`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt.key}
                          checked={isOptionSelected}
                          disabled={isSubmitted}
                          onChange={() => handleAnswerChange(q.id, opt.key)}
                          className="w-4 h-4 text-brand-600"
                        />
                        <span className="text-sm">
                          <strong>{opt.key}.</strong> {opt.text}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Khối Lời giải chi tiết (hiển thị khi isSubmitted = true) */}
                {isSubmitted && (
                  <div
                    className="explanation mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: q.explanation }}
                  />
                )}
              </div>
            );
          })}

          {/* ==================== PHẦN II ==================== */}
          <div className="bg-indigo-900 text-white px-5 py-3.5 rounded-xl font-bold text-sm md:text-base flex items-center justify-between shadow-sm mt-8">
            <span>II. PHẦN TỰ LUẬN (3,0 ĐIỂM)</span>
            <span className="text-xs bg-indigo-800 px-3 py-1 rounded-full text-indigo-100 font-semibold tracking-wide">
              02 Câu (1,5đ/câu)
            </span>
          </div>

          {SHORTANS_QUESTIONS.map((q) => {
            const studentVal = answers[q.id] || '';
            const isCorrect = q.validator(studentVal);

            let inputStateClass = 'border-slate-300 focus:ring-indigo-500';
            let cardBorder = 'border-slate-200';

            if (isSubmitted) {
              if (isCorrect) {
                inputStateClass = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold';
                cardBorder = 'border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/10';
              } else {
                inputStateClass = 'border-rose-400 bg-rose-50 text-rose-800 font-medium';
                cardBorder = 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10';
              }
            }

            return (
              <div
                key={q.id}
                className={`question-block bg-white rounded-2xl shadow-sm p-6 border transition hover:shadow-md ${cardBorder}`}
                data-id={q.id}
                data-type="shortans"
                data-correct={q.correctHint}
                data-skill={q.skill}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg text-sm">
                    Câu {q.number} ({q.points})
                  </div>
                  <span className="text-xs text-slate-400 font-medium italic">
                    Kỹ năng: {q.skill}
                  </span>
                </div>

                <div
                  className="text-slate-800 text-base leading-relaxed mb-3"
                  dangerouslySetInnerHTML={{ __html: q.text }}
                />

                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nhập đáp số ngắn gọn ({q.placeholder}):
                  </label>
                  <input
                    type="text"
                    name={q.id}
                    value={studentVal}
                    disabled={isSubmitted}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm disabled:cursor-not-allowed ${inputStateClass}`}
                  />
                </div>

                {/* Khối Lời giải chi tiết (hiển thị khi isSubmitted = true) */}
                {isSubmitted && (
                  <div
                    className="explanation mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: q.explanation }}
                  />
                )}
              </div>
            );
          })}

          {/* NÚT NỘP BÀI (ID: btn-nop-bai THEO QUY CHUẨN) */}
          <div className="pt-4">
            <button
              type="button"
              id="btn-nop-bai"
              disabled={isSubmitted || isSubmitting}
              onClick={handleSubmit}
              className={`w-full py-4 px-8 font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-lg ${
                isSubmitted
                  ? 'bg-slate-500 cursor-not-allowed text-white'
                  : 'bg-brand-600 hover:bg-brand-700 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang xử lý & Đồng bộ dữ liệu...
                </>
              ) : isSubmitted ? (
                `ĐÃ NỘP BÀI - ĐIỂM SỐ: ${diemSo.toFixed(1)}/10.0`
              ) : (
                <>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Nộp Bài & Xem Điểm Chi Tiết
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
