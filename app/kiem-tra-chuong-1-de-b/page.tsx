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

// --- DỮ LIỆU CÂU HỎI TRẮC NGHIỆM ĐỀ B (PHẦN I - 14 CÂU, 0.5 ĐIỂM/CÂU = 7.0 ĐIỂM) ---
const MCQ_QUESTIONS_DE_B: QuestionMCQ[] = [
  {
    id: 'b1',
    number: 1,
    type: 'mcq',
    skill: 'Quy tắc hình hộp',
    points: 0.5,
    text: 'Cho hình hộp $ABCD.A\'B\'C\'D\'. Mệnh đề nào sau đây là <strong>đúng</strong> về tổng các vectơ xuất phát từ đỉnh $C$?',
    options: [
      { key: 'A', text: '$\\vec{CB} + \\vec{CD} + \\vec{CC\'} = \\vec{AC\'}$' },
      { key: 'B', text: '$\\vec{CB} + \\vec{CD} + \\vec{CC\'} = \\vec{C\'A}$' },
      { key: 'C', text: '$\\vec{CB} + \\vec{CD} + \\vec{CC\'} = \\vec{CA\'}$' },
      { key: 'D', text: '$\\vec{CB} + \\vec{CD} + \\vec{CC\'} = \\vec{BD\'}$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Theo quy tắc hình bình hành trong mặt phẳng đáy $(ABCD)$, ta có: $$\\vec{CB} + \\vec{CD} = \\vec{CA}$$ Cộng hai vế với vectơ cạnh bên $\\vec{CC\'}$, kết hợp với $\\vec{CC\'} = \\vec{AA\'}$, ta được: $$\\vec{CB} + \\vec{CD} + \\vec{CC\'} = \\vec{CA} + \\vec{CC\'} = \\vec{CA\'}$$ Đây chính là biểu diễn tổng ba vectơ không đồng phẳng xuất phát từ đỉnh $C$ của hình hộp.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'b2',
    number: 2,
    type: 'mcq',
    skill: 'Tính chất trọng tâm tam giác và phân tích vectơ',
    points: 0.5,
    text: 'Cho tứ diện $ABCD$. Gọi $G$ là trọng tâm của tam giác $BCD$. Khẳng định nào sau đây là <strong>đúng</strong>?',
    options: [
      { key: 'A', text: '$\\vec{AG} = \\dfrac{1}{3}\\left(\\vec{AB} + \\vec{AC} + \\vec{AD}\\right)$' },
      { key: 'B', text: '$\\vec{AG} = \\dfrac{1}{2}\\left(\\vec{AB} + \\vec{AC} + \\vec{AD}\\right)$' },
      { key: 'C', text: '$\\vec{AG} = \\vec{AB} + \\vec{AC} + \\vec{AD}$' },
      { key: 'D', text: '$\\vec{AG} = \\dfrac{1}{4}\\left(\\vec{AB} + \\vec{AC} + \\vec{AD}\\right)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Vì $G$ là trọng tâm của tam giác $BCD$ nên ta có: $$\\vec{GB} + \\vec{GC} + \\vec{GD} = \\vec{0}$$ Chèn điểm $A$ vào từng vectơ ở vế trái: $$(\\vec{AB} - \\vec{AG}) + (\\vec{AC} - \\vec{AG}) + (\\vec{AD} - \\vec{AG}) = \\vec{0}$$ $$\\Leftrightarrow \\vec{AB} + \\vec{AC} + \\vec{AD} = 3\\vec{AG} \\Leftrightarrow \\vec{AG} = \\dfrac{1}{3}\\left(\\vec{AB} + \\vec{AC} + \\vec{AD}\\right).$$<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'b3',
    number: 3,
    type: 'mcq',
    skill: 'Tọa độ vectơ theo các vectơ đơn vị',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho vectơ $\\vec{v} = -3\\vec{i} + 4\\vec{j} - 2\\vec{k}$, với $\\vec{i}, \\vec{j}, \\vec{k}$ lần lượt là các vectơ đơn vị trên các trục $Ox, Oy, Oz$. Tọa độ của vectơ $\\vec{v}$ là:',
    options: [
      { key: 'A', text: '$(-3; 4; 2)$' },
      { key: 'B', text: '$(-3; 4; -2)$' },
      { key: 'C', text: '$(3; -4; 2)$' },
      { key: 'D', text: '$(4; -3; -2)$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo định nghĩa tọa độ của vectơ trong không gian $Oxyz$, $\\vec{v} = x\\vec{i} + y\\vec{j} + z\\vec{k}$ có tọa độ là $(x; y; z)$. Do đó $\\vec{v} = (-3; 4; -2)$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'b4',
    number: 4,
    type: 'mcq',
    skill: 'Hình chiếu vuông góc lên các mặt phẳng tọa độ',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho điểm $N(-3; 5; -2)$. Tọa độ điểm $N\'$ là hình chiếu vuông góc của $N$ lên mặt phẳng tọa độ $(Oxz)$ là:',
    options: [
      { key: 'A', text: '$N\'(-3; 5; 0)$' },
      { key: 'B', text: '$N\'(0; 5; -2)$' },
      { key: 'C', text: '$N\'(-3; 0; -2)$' },
      { key: 'D', text: '$N\'(0; 0; -2)$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Mặt phẳng tọa độ $(Oxz)$ có phương trình $y = 0$. Khi chiếu vuông góc điểm $N(-3; 5; -2)$ lên mặt phẳng $(Oxz)$, hoành độ và cao độ được giữ nguyên, còn tung độ bằng $0$. Do đó $N\'(-3; 0; -2)$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'b5',
    number: 5,
    type: 'mcq',
    skill: 'Tọa độ trung điểm đoạn thẳng',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho hai điểm $C(-2; 3; 5)$ và $D(4; 1; -1)$. Tọa độ trung điểm $M$ của đoạn thẳng $CD$ là:',
    options: [
      { key: 'A', text: '$M(2; 4; 4)$' },
      { key: 'B', text: '$M(1; 2; 2)$' },
      { key: 'C', text: '$M(3; -1; -3)$' },
      { key: 'D', text: '$M(6; -2; -6)$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Tọa độ trung điểm $M$ của đoạn thẳng $CD$ là: $$x_M = \\dfrac{-2 + 4}{2} = 1, \\quad y_M = \\dfrac{3 + 1}{2} = 2, \\quad z_M = \\dfrac{5 + (-1)}{2} = 2 \\implies M(1; 2; 2).$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'b6',
    number: 6,
    type: 'mcq',
    skill: 'Các phép toán tọa độ của vectơ',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho hai vectơ $\\vec{a} = (-1; 3; 2)$ và $\\vec{b} = (2; -1; 3)$. Tọa độ của vectơ $\\vec{u} = 3\\vec{a} + 2\\vec{b}$ là:',
    options: [
      { key: 'A', text: '$(1; 7; 12)$' },
      { key: 'B', text: '$(-7; 11; 0)$' },
      { key: 'C', text: '$(1; 5; 12)$' },
      { key: 'D', text: '$(7; -1; 0)$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Ta có: $$3\\vec{a} = (-3; 9; 6)$$ $$2\\vec{b} = (4; -2; 6)$$ Suy ra $\\vec{u} = 3\\vec{a} + 2\\vec{b} = (-3 + 4; 9 + (-2); 6 + 6) = (1; 7; 12)$.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'b7',
    number: 7,
    type: 'mcq',
    skill: 'Tích vô hướng và điều kiện vuông góc',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho hai vectơ $\\vec{u} = (3; -2; m)$ và $\\vec{v} = (2; 1; 4)$. Giá trị của tham số $m$ để hai vectơ $\\vec{u}$ và $\\vec{v}$ vuông góc với nhau là:',
    options: [
      { key: 'A', text: '$m = 1$' },
      { key: 'B', text: '$m = -1$' },
      { key: 'C', text: '$m = 4$' },
      { key: 'D', text: '$m = -4$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Hai vectơ $\\vec{u}$ và $\\vec{v}$ vuông góc với nhau khi và chỉ khi tích vô hướng của chúng bằng $0$: $$\\vec{u} \\perp \\vec{v} \\Leftrightarrow \\vec{u} \\cdot \\vec{v} = 0$$ $$\\Leftrightarrow 3 \\cdot 2 + (-2) \\cdot 1 + m \\cdot 4 = 0 \\Leftrightarrow 6 - 2 + 4m = 0 \\Leftrightarrow 4 + 4m = 0 \\Leftrightarrow m = -1.$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'b8',
    number: 8,
    type: 'mcq',
    skill: 'Góc giữa hai vectơ',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho hai vectơ $\\vec{a} = (1; 0; -1)$ và $\\vec{b} = (0; 1; 1)$. Số đo góc $\\theta$ giữa hai vectơ $\\vec{a}$ và $\\vec{b}$ bằng:',
    options: [
      { key: 'A', text: '$\\theta = 60^\\circ$' },
      { key: 'B', text: '$\\theta = 120^\\circ$' },
      { key: 'C', text: '$\\theta = 45^\\circ$' },
      { key: 'D', text: '$\\theta = 135^\\circ$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Ta có: $$\\cos \\theta = \\dfrac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}| \\cdot |\\vec{b}|} = \\dfrac{1 \\cdot 0 + 0 \\cdot 1 + (-1) \\cdot 1}{\\sqrt{1^2 + 0 + (-1)^2} \\cdot \\sqrt{0 + 1^2 + 1^2}} = \\dfrac{-1}{\\sqrt{2} \\cdot \\sqrt{2}} = -\\dfrac{1}{2}.$$ Do $0^\\circ \\le \\theta \\le 180^\\circ$ nên $\\theta = 120^\\circ$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'b9',
    number: 9,
    type: 'mcq',
    skill: 'Tọa độ trọng tâm tam giác',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho tam giác $ABC$ có $A(-1; 2; 3)$, $C(3; 0; 1)$ và trọng tâm $G(1; 1; 2)$. Tọa độ của đỉnh $B$ là:',
    options: [
      { key: 'A', text: '$B(1; 2; 2)$' },
      { key: 'B', text: '$B(1; 1; 2)$' },
      { key: 'C', text: '$B(3; 3; 6)$' },
      { key: 'D', text: '$B(-1; 1; 0)$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vì $G$ là trọng tâm tam giác $ABC$ nên: $$\\begin{cases} x_B = 3x_G - x_A - x_C = 3(1) - (-1) - 3 = 1 \\\\ y_B = 3y_G - y_A - y_C = 3(1) - 2 - 0 = 1 \\\\ z_B = 3z_G - z_A - z_C = 3(2) - 3 - 1 = 2 \\end{cases} \\implies B(1; 1; 2).$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'b10',
    number: 10,
    type: 'mcq',
    skill: 'Khoảng cách giữa hai điểm trong không gian',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho hai điểm $P(2; 0; 1)$ và $Q(1; 3; -2)$. Điểm $N(0; 0; z_0)$ nằm trên trục $Oz$ sao cho độ dài đoạn thẳng $PN$ bằng $\\sqrt{13}$. Giá trị của $z_0$ có thể bằng:',
    options: [
      { key: 'A', text: '$z_0 = 2$' },
      { key: 'B', text: '$z_0 = 4$' },
      { key: 'C', text: '$z_0 = -4$' },
      { key: 'D', text: '$z_0 = 3$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Khoảng cách $PN = \\sqrt{(0 - 2)^2 + (0 - 0)^2 + (z_0 - 1)^2} = \\sqrt{4 + (z_0 - 1)^2}$. Theo giả thiết: $$\\sqrt{4 + (z_0 - 1)^2} = \\sqrt{13} \\Leftrightarrow 4 + (z_0 - 1)^2 = 13 \\Leftrightarrow (z_0 - 1)^2 = 9$$ $$\\Leftrightarrow \\left[\\begin{aligned} z_0 - 1 &= 3 \\\\ z_0 - 1 &= -3 \\end{aligned}\\right. \\Leftrightarrow \\left[\\begin{aligned} z_0 &= 4 \\\\ z_0 &= -2 \\end{aligned}\\right.$$ Đối chiếu với các phương án lựa chọn, ta chọn $z_0 = 4$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'b11',
    number: 11,
    type: 'mcq',
    skill: 'Cực trị hình học không gian Oxyz và tâm tỉ cự',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho ba điểm $A(2; 0; 0)$, $B(0; 4; 0)$, $C(0; 0; 2)$. Gọi $N(x; y; z)$ là điểm thuộc mặt phẳng $(Oxz)$ sao cho biểu thức $Q = |\\vec{NA} + 2\\vec{NB} + \\vec{NC}|$ đạt giá trị nhỏ nhất. Tọa độ điểm $N$ là:',
    options: [
      { key: 'A', text: '$N\\left(\\dfrac{1}{2}; 2; \\dfrac{1}{2}\\right)$' },
      { key: 'B', text: '$N\\left(\\dfrac{1}{2}; 0; \\dfrac{1}{2}\\right)$' },
      { key: 'C', text: '$N\\left(0; 2; \\dfrac{1}{2}\\right)$' },
      { key: 'D', text: '$N\\left(\\dfrac{1}{2}; 2; 0\\right)$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Gọi điểm $I$ thỏa mãn $\\vec{IA} + 2\\vec{IB} + \\vec{IC} = \\vec{0}$. Tọa độ điểm $I$ là: $$x_I = \\dfrac{2 + 0 + 0}{4} = \\dfrac{1}{2}, \\quad y_I = \\dfrac{0 + 2(4) + 0}{4} = 2, \\quad z_I = \\dfrac{0 + 0 + 2}{4} = \\dfrac{1}{2} \\implies I\\left(\\dfrac{1}{2}; 2; \\dfrac{1}{2}\\right)$$ Khi chèn điểm $I$, biểu thức $Q = |4\\vec{NI}| = 4NI$. Để $Q$ đạt giá trị nhỏ nhất thì $NI$ phải nhỏ nhất. Vì $N \\in (Oxz)$ nên $N$ chính là hình chiếu vuông góc của $I$ lên mặt phẳng $(Oxz)$ (cho $y = 0$) $\\implies N\\left(\\dfrac{1}{2}; 0; \\dfrac{1}{2}\\right)$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'b12',
    number: 12,
    type: 'mcq',
    skill: 'Mô hình hóa chuyển động thẳng đều trong không gian Oxyz',
    points: 0.5,
    text: 'Một thiết bị bay không người lái (UAV) cất cánh từ trạm điều khiển. Trong hệ tọa độ $Oxyz$ (đơn vị tính theo km), tại thời điểm $t_1 = 0$ phút UAV ở vị trí $A(1; 2; 0{,}5)$ và tại thời điểm $t_2 = 3$ phút UAV ở vị trí $B(7; 11; 3{,}5)$. Giả sử UAV bay thẳng theo đường thẳng với vận tốc không đổi. Tọa độ vị trí $C$ của UAV tại thời điểm $t_3 = 4$ phút là:',
    options: [
      { key: 'A', text: '$C(8; 12; 4)$' },
      { key: 'B', text: '$C(9; 14; 4{,}5)$' },
      { key: 'C', text: '$C(10; 15; 5)$' },
      { key: 'D', text: '$C(7; 11; 3{,}5)$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vectơ dịch chuyển của UAV trong 3 phút là: $$\\vec{AB} = (7 - 1; 11 - 2; 3{,}5 - 0{,}5) = (6; 9; 3)$$ Vận tốc dịch chuyển mỗi phút của UAV: $$\\vec{v} = \\dfrac{1}{3}\\vec{AB} = (2; 3; 1)$$ Sau 4 phút kể từ lúc $t = 0$, vectơ dịch chuyển là: $$\\vec{AC} = 4\\vec{v} = (8; 12; 4)$$ Gọi $C(x_C; y_C; z_C)$, ta có: $$\\begin{cases} x_C = 1 + 8 = 9 \\\\ y_C = 2 + 12 = 14 \\\\ z_C = 0{,}5 + 4 = 4{,}5 \\end{cases} \\implies C(9; 14; 4{,}5).$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'b13',
    number: 13,
    type: 'mcq',
    skill: 'Ứng dụng vectơ giải bài toán cân bằng lực Vật lý',
    points: 0.5,
    text: 'Một chiếc loa thùng sân khấu có khối lượng $m = 9\\text{ kg}$ được treo cân bằng dưới trần nhà nhờ 3 sợi dây cáp thép đồng quy tại điểm $O$ trên loa, các đầu cáp còn lại gắn cố định tại $A, B, C$ trên trần nhà phẳng nằm ngang. Biết lực căng $\\vec{F}_1, \\vec{F}_2, \\vec{F}_3$ tác dụng lên $O$ có độ lớn bằng nhau và mỗi sợi dây hợp với phương thẳng đứng một góc $45^\\circ$. Lấy gia tốc trọng trường $g = 10\\text{ m/s}^2$. Độ lớn lực căng trên mỗi sợi dây cáp bằng bao nhiêu? (Làm tròn đến hàng phần mười).',
    options: [
      { key: 'A', text: '$30{,}0\\text{ N}$' },
      { key: 'B', text: '$42{,}4\\text{ N}$' },
      { key: 'C', text: '$52{,}0\\text{ N}$' },
      { key: 'D', text: '$60{,}0\\text{ N}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Trọng lực tác dụng lên loa thùng có độ lớn: $P = m \\cdot g = 9 \\cdot 10 = 90\\text{ N}$. Do loa cân bằng tại $O$, chiếu phương trình cân bằng lên phương thẳng đứng hướng lên: $$3 \\cdot F \\cdot \\cos 45^\\circ = P \\Leftrightarrow 3 \\cdot F \\cdot \\dfrac{\\sqrt{2}}{2} = 90 \\implies F = \\dfrac{180}{3\\sqrt{2}} = 30\\sqrt{2} \\approx 42{,}426\\text{ N} \\approx 42{,}4\\text{ N}.$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'b14',
    number: 14,
    type: 'mcq',
    skill: 'Ứng dụng tọa độ không gian vào khoảng cách thực tế',
    points: 0.5,
    text: 'Trong một xưởng sản xuất dạng hình hộp chữ nhật, người ta gắn hệ trục tọa độ $Oxyz$ (đơn vị tính bằng mét) với gốc $O$ đặt tại một góc sàn xưởng. Một camera giám sát được lắp tại vị trí $C(3; 5; 3{,}2)$ trên trần xưởng và một xe tự hành (AGV) đang hoạt động trên mặt sàn tại vị trí $N(5; 1; 0)$. Khoảng cách giữa xe tự hành $N$ và camera $C$ bằng bao nhiêu mét? (Làm tròn đến chữ số thập phân thứ hai).',
    options: [
      { key: 'A', text: '$4{,}80\\text{ m}$' },
      { key: 'B', text: '$5{,}50\\text{ m}$' },
      { key: 'C', text: '$6{,}20\\text{ m}$' },
      { key: 'D', text: '$5{,}12\\text{ m}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Khoảng cách giữa camera $C$ và xe tự hành $N$ là độ dài đoạn thẳng $CN$: $$CN = \\sqrt{(5 - 3)^2 + (1 - 5)^2 + (0 - 3{,}2)^2} = \\sqrt{2^2 + (-4)^2 + (-3{,}2)^2} = \\sqrt{4 + 16 + 10{,}24} = \\sqrt{30{,}24} \\approx 5{,}4991\\text{ m} \\approx 5{,}50\\text{ m}.$$<br><strong>Đáp án đúng: B.</strong>',
  },
];

// --- DỮ LIỆU CÂU HỎI TỰ LUẬN ĐỀ B (PHẦN II - 2 CÂU, 1.5 ĐIỂM/CÂU = 3.0 ĐIỂM) ---
const SHORTANS_QUESTIONS_DE_B: QuestionShortAns[] = [
  {
    id: 'b15',
    number: 15,
    type: 'shortans',
    skill: 'Tích vô hướng và chứng minh thẳng hàng trong không gian',
    points: 1.5,
    text: 'Cho hình lập phương $ABCD.A\'B\'C\'D\'$ có cạnh bằng $a$.<br><br><strong>a) (0,75 điểm)</strong> Chứng minh rằng $\\vec{A\'C} \\cdot \\vec{B\'D\'} = 0$. Từ đó rút ra kết luận về góc giữa hai đường thẳng $A\'C$ và $B\'D\'.<br><strong>b) (0,75 điểm)</strong> Gọi $H$ là trọng tâm của tam giác $CB\'D\'. Biểu diễn vectơ $\\vec{AH}$ theo ba vectơ không đồng phẳng $\\vec{AB}, \\vec{AD}, \\vec{AA\'}$. Từ đó chứng minh ba điểm $A, H, C\'$ thẳng hàng.',
    placeholder: 'Ví dụ: a) 90 độ; b) AH = 2/3 AC\' (thẳng hàng)',
    correctDisplay: 'a) Góc bằng 90°; b) AH = 2/3 AC\' (A, H, C\' thẳng hàng)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/,/g, '.');
      const hasPartA =
        clean.includes('90') ||
        clean.includes('vuong goc') ||
        clean.includes('vuông góc') ||
        clean.includes('pi/2') ||
        clean.includes('π/2');
      const hasPartB =
        clean.includes('2/3') ||
        clean.includes('thẳng hàng') ||
        clean.includes('thang hang') ||
        clean.includes('cùng phương') ||
        clean.includes('cung phuong');
      return hasPartA || hasPartB;
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>Biểu diễn các vectơ qua ba vectơ chung gốc $A$: $$\\vec{A\'C} = \\vec{AC} - \\vec{AA\'} = \\vec{AB} + \\vec{AD} - \\vec{AA\'} \\quad \\text{và} \\quad \\vec{B\'D\'} = \\vec{AD} - \\vec{AB}$$ Xét tích vô hướng: $$\\vec{A\'C} \\cdot \\vec{B\'D\'} = (\\vec{AB} + \\vec{AD} - \\vec{AA\'}) \\cdot (\\vec{AD} - \\vec{AB}) = 0 - a^2 + a^2 - 0 - 0 + 0 = 0 \\quad (0,5\\text{ đ})$$ Do đó hai đường thẳng $A\'C$ và $B\'D\'$ vuông góc với nhau, góc giữa chúng bằng $90^\\circ$. $(0,25\\text{ đ})$<br><br><strong>b) (0,75 điểm)</strong><br>Vì $H$ là trọng tâm tam giác $CB\'D\'$: $$\\vec{AH} = \\dfrac{1}{3}\\left(\\vec{AC} + \\vec{AB\'} + \\vec{AD\'}\\right) \\quad (0,25\\text{ đ})$$ Biểu diễn từng vectơ qua $\\vec{AB}, \\vec{AD}, \\vec{AA\'}$: $$\\vec{AC} + \\vec{AB\'} + \\vec{AD\'} = 2(\\vec{AB} + \\vec{AD} + \\vec{AA\'}) = 2\\vec{AC\'} \\quad (0,25\\text{ đ})$$ Suy ra: $$\\vec{AH} = \\dfrac{2}{3}\\vec{AC\'}$$ Do hai vectơ $\\vec{AH}$ và $\\vec{AC\'}$ cùng phương nên ba điểm $A, H, C\'$ thẳng hàng. $(0,25\\text{ đ})$',
  },
  {
    id: 'b16',
    number: 16,
    type: 'shortans',
    skill: 'Xác định tọa độ đỉnh và tính độ dài trong khối hộp Oxyz',
    points: 1.5,
    text: 'Trong một dự án thiết kế khán đài thi đấu đa năng, các kỹ sư thiết lập hệ trục tọa độ $Oxyz$ (đơn vị tính bằng mét) để quản lý không gian. Khối chân khán đài bằng bê tông có dạng hình hộp chữ nhật $OABC.O\'A\'B\'C\'$ với $O(0; 0; 0)$, đỉnh $A$ nằm trên tia $Ox$, đỉnh $C$ nằm trên tia $Oy$ và đỉnh $O\'$ nằm trên tia $Oz$. Kích thước khối chân khán đài là chiều dài $OA = 8\\text{ m}$, chiều rộng $OC = 6\\text{ m}$, chiều cao $OO\' = 4\\text{ m}$.<br><br><strong>a) (0,75 điểm)</strong> Xác định tọa độ các đỉnh $B\', K$ với $K$ là trung điểm của đoạn thẳng $C\'A$.<br><strong>b) (0,75 điểm)</strong> Để lắp đặt hệ thống đèn chiếu sáng, người ta căng một dây cáp điện nối từ gốc $O$ đến trung điểm $N$ của cạnh $A\'B\'. Tính độ dài dây cáp điện $ON$ (làm tròn đến chữ số thập phân thứ hai).',
    placeholder: 'Ví dụ: B\'(8;6;4), K(4;3;2), ON = 9.43m',
    correctDisplay: 'a) B\'(8; 6; 4), K(4; 3; 2); b) ON ≈ 9,43 m',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/,/g, '.');
      const hasCoords =
        (clean.includes('8') && clean.includes('6') && clean.includes('4')) ||
        (clean.includes('4') && clean.includes('3') && clean.includes('2'));
      const hasLength =
        clean.includes('9.43') ||
        clean.includes('9.43m') ||
        clean.includes('sqrt(89)') ||
        clean.includes('căn 89') ||
        clean.includes('can 89');
      return hasCoords || hasLength;
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>Tọa độ các đỉnh cơ bản: $A(8; 0; 0), C(0; 6; 0), O\'(0; 0; 4) \\implies C\'(0; 6; 4)$ và $B\'(8; 6; 4)$. $(0,5\\text{ đ})$<br>Tọa độ trung điểm $K$ của đoạn thẳng $C\'A$: $$\\begin{cases} x_K = \\frac{0 + 8}{2} = 4 \\\\ y_K = \\frac{6 + 0}{2} = 3 \\\\ z_K = \\frac{4 + 0}{2} = 2 \\end{cases} \\implies K(4; 3; 2) \\quad (0,25\\text{ đ})$$<br><strong>b) (0,75 điểm)</strong><br>Ta có tọa độ $A\'(8; 0; 4)$ và $B\'(8; 6; 4)$. Trung điểm $N$ của cạnh $A\'B\'$ là: $N(8; 3; 4)$. $(0,25\\text{ đ})$<br>Độ dài dây cáp điện $ON$: $$ON = \\sqrt{8^2 + 3^2 + 4^2} = \\sqrt{64 + 9 + 16} = \\sqrt{89} \\approx 9{,}43\\text{ m} \\quad (0,5\\text{ đ})$$',
  },
];

export default function KiemTraDeBPage() {
  // 1. STATE THÔNG TIN HỌC SINH
  const [tenHocSinh, setTenHocSinh] = useState<string>('');
  const [maHocSinh, setMaHocSinh] = useState<string>('');
  const [lopNhom, setLopNhom] = useState<string>('');

  // 2. STATE LÀM BÀI & TRẢ LỜI
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
  }, [isSubmitted]);

  // Tiến độ làm bài
  const answeredMCQCount = Object.keys(mcqAnswers).length;
  const answeredShortCount = Object.values(shortAnswers).filter((v) => v.trim().length > 0).length;
  const totalQuestions = MCQ_QUESTIONS_DE_B.length + SHORTANS_QUESTIONS_DE_B.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 6. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS-TUDONG';
    const lop = lopNhom.trim() || 'Lớp 12';

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

    if (totalAnswered < totalQuestions) {
      const confirmIncomplete = window.confirm(
        `Bạn mới hoàn thành ${totalAnswered}/${totalQuestions} câu hỏi. Bạn có chắc chắn muốn nộp bài ngay bây giờ?`
      );
      if (!confirmIncomplete) return;
    }

    setIsSubmitting(true);

    let calculatedScore = 0;
    let correctMCQ = 0;
    let correctShort = 0;
    const wrongSkills: string[] = [];

    // Chấm Phần I (14 câu MCQ, 0.5đ/câu)
    MCQ_QUESTIONS_DE_B.forEach((q) => {
      const studentChoice = mcqAnswers[q.id];
      if (studentChoice === q.correct) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (2 câu Tự luận, 1.5đ/câu)
    SHORTANS_QUESTIONS_DE_B.forEach((q) => {
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

    // Payload gửi Webhook GAS theo đúng đặc tả
    const thoiGianLamGiay = 45 * 60 - timeLeft;
    const thoiGianLamPhut = Math.max(1, Math.round(thoiGianLamGiay / 60));

    const chiTietPhanHoiObj = {
      hoc_sinh: ten,
      ma_hs: ma,
      lop: lop,
      bai_thi: 'ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN LỚP 12 – ĐỀ B',
      diem: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS_DE_B.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_DE_B.length}`,
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
        Task_ID: 'KIEM_TRA_TOAN_12_DE_B',
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
          bai_thi: 'ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN LỚP 12 – ĐỀ B',
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER BÀI THI */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-5 text-center">
            <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold uppercase tracking-wider rounded-full mb-2">
              Hệ thống khảo sát trực tuyến Integra &bull; Mã Đề B
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN LỚP 12 – THỜI GIAN: 45 PHÚT
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
              CHỦ ĐỀ: VECTƠ VÀ HỆ TRỤC TỌA ĐỘ TRONG KHÔNG GIAN – ĐỀ B
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
                placeholder="Nguyễn Văn B"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100"
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
                placeholder="HS12-B02"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100"
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
                placeholder="12A2"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100"
              />
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
              <span className="text-xs font-medium text-amber-800">Thời gian còn lại</span>
              <span
                className={`text-xl font-bold font-mono ${
                  timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-amber-900'
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
          <section className="bg-white rounded-2xl shadow-md border-2 border-amber-500 p-6 sm:p-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                  Đã hoàn thành & Chấm điểm tự động
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-2">
                  Kết quả bài thi: {tenHocSinh || 'Học sinh'} ({lopNhom || 'Lớp 12'})
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Đúng {soCauDungMCQ}/14 câu Trắc nghiệm &bull; Đúng {soCauDungShort}/2 câu Tự luận
                </p>
              </div>
              <div className="text-center sm:text-right bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 min-w-[140px]">
                <span className="text-xs uppercase text-slate-500 font-semibold block">Điểm số</span>
                <span className="text-4xl font-extrabold text-amber-600">{diemSo}</span>
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
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
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

        {/* PHẦN A: TRẮC NGHIỆM */}
        <section className="space-y-4">
          <div className="bg-amber-700 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <h2 className="font-bold text-base sm:text-lg">
              PHẦN A. TRẮC NGHIỆM (7,0 điểm – 14 câu, mỗi câu 0,5 điểm)
            </h2>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-md font-medium">
              14 Câu hỏi
            </span>
          </div>

          {MCQ_QUESTIONS_DE_B.map((q) => {
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

                {/* NỘI DUNG CÂU HỎI */}
                <div
                  className="text-slate-900 text-sm sm:text-base leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: q.text }}
                />

                {/* DANH SÁCH 4 PHƯƠNG ÁN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt) => {
                    const isSelected = studentAnswer === opt.key;
                    const isThisCorrect = opt.key === q.correct;

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
                        'border-amber-600 bg-amber-50/80 text-amber-900 font-semibold ring-2 ring-amber-500/20';
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => {
                          if (isSubmitted) return;
                          setMcqAnswers((prev) => ({ ...prev, [q.id]: opt.key }));
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
                          {opt.key}
                        </span>
                        <div
                          className="flex-1 overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: opt.text }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* LỜI GIẢI CHI TIẾT KHI ĐÃ NỘP BÀI */}
                {isSubmitted && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-lg text-sm text-slate-700">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                      <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                      </svg>
                      Hướng dẫn giải chi tiết:
                    </div>
                    <div
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: q.explanation }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* PHẦN B: TỰ LUẬN */}
        <section className="space-y-4">
          <div className="bg-slate-800 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <h2 className="font-bold text-base sm:text-lg">
              PHẦN B. TỰ LUẬN (3,0 điểm – 2 câu, mỗi câu 1,5 điểm)
            </h2>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-md font-medium">
              2 Câu hỏi
            </span>
          </div>

          {SHORTANS_QUESTIONS_DE_B.map((q) => {
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

                {/* NỘI DUNG CÂU HỎI */}
                <div
                  className="text-slate-900 text-sm sm:text-base leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: q.text }}
                />

                {/* Ô NHẬP ĐÁP SỐ / KẾT LUẬN CỦA HỌC SINH */}
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
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100"
                  />
                </div>

                {/* LỜI GIẢI CHI TIẾT VÀ ĐÁP ÁN CHUẨN */}
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
                    <div
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: q.explanation }}
                    />
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
              className="w-full sm:w-80 py-4 px-6 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-amber-500/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  Đang chấm điểm & nộp bài...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
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
                  NỘP BÀI THI
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
