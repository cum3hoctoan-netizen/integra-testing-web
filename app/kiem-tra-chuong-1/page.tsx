'use client';

import React, { useState, useEffect, useMemo } from 'react';

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

// --- DỮ LIỆU CÂU HỎI TRẮC NGHIỆM (PHẦN I - 14 CÂU, 0.5 ĐIỂM/CÂU = 7.0 ĐIỂM) ---
const MCQ_QUESTIONS: QuestionMCQ[] = [
  {
    id: 'q1',
    number: 1,
    type: 'mcq',
    skill: 'Quy tắc hình hộp',
    points: 0.5,
    text: 'Cho hình hộp $ABCD.A\'B\'C\'D\'$. Mệnh đề nào sau đây là <strong>đúng</strong> về mối quan hệ giữa các vectơ cạnh và vectơ đường chéo của hình hộp?',
    options: [
      { key: 'A', text: '$\\vec{AB} + \\vec{AD} + \\vec{AA\'} = \\vec{CA\'}$' },
      { key: 'B', text: '$\\vec{AB} + \\vec{AD} + \\vec{AA\'} = \\vec{DB\'}$' },
      { key: 'C', text: '$\\vec{AB} + \\vec{AD} + \\vec{AA\'} = \\vec{AC\'}$' },
      { key: 'D', text: '$\\vec{AB} + \\vec{AD} + \\vec{AA\'} = \\vec{A\'C}$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Theo quy tắc hình bình hành trong mặt phẳng đáy $(ABCD)$, ta có: $$\\vec{AB} + \\vec{AD} = \\vec{AC}$$ Cộng hai vế với vectơ cạnh bên $\\vec{AA\'}$, kết hợp với $\\vec{AA\'} = \\vec{CC\'}$, ta được: $$\\vec{AB} + \\vec{AD} + \\vec{AA\'} = \\vec{AC} + \\vec{CC\'} = \\vec{AC\'}$$ Đây chính là quy tắc hình hộp biểu diễn tổng ba vectơ không đồng phẳng xuất phát từ một đỉnh.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'q2',
    number: 2,
    type: 'mcq',
    skill: 'Phân tích vectơ trong không gian',
    points: 0.5,
    text: 'Cho tứ diện $ABCD$. Gọi $M, N$ lần lượt là trung điểm của các cạnh $AB$ và $CD$. Khẳng định nào sau đây <strong>đúng</strong>?',
    options: [
      { key: 'A', text: '$\\vec{MN} = \\vec{AC} + \\vec{BD}$' },
      { key: 'B', text: '$\\vec{MN} = \\dfrac{1}{2}\\left(\\vec{AC} + \\vec{BD}\\right)$' },
      { key: 'C', text: '$\\vec{MN} = \\dfrac{1}{2}\\left(\\vec{AB} + \\vec{CD}\\right)$' },
      { key: 'D', text: '$\\vec{MN} = \\vec{AD} + \\vec{BC}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng quy tắc ba điểm phân tích vectơ $\\vec{MN}$ theo hai đường đi khác nhau qua các đỉnh của tứ diện:<br>$$\\vec{MN} = \\vec{MA} + \\vec{AC} + \\vec{CN}$$<br>$$\\vec{MN} = \\vec{MB} + \\vec{BD} + \\vec{DN}$$<br>Cộng vế theo vế: $$2\\vec{MN} = (\\vec{MA} + \\vec{MB}) + (\\vec{AC} + \\vec{BD}) + (\\vec{CN} + \\vec{DN})$$<br>Vì $M$ là trung điểm $AB$ nên $\\vec{MA} + \\vec{MB} = \\vec{0}$; vì $N$ là trung điểm $CD$ nên $\\vec{CN} + \\vec{DN} = \\vec{0}$.<br>Do đó: $2\\vec{MN} = \\vec{AC} + \\vec{BD} \\Leftrightarrow \\vec{MN} = \\dfrac{1}{2}(\\vec{AC} + \\vec{BD})$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'q3',
    number: 3,
    type: 'mcq',
    skill: 'Tọa độ vectơ theo các vectơ đơn vị',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho vectơ $\\vec{u} = 2\\vec{i} - 3\\vec{j} + \\vec{k}$, với $\\vec{i}, \\vec{j}, \\vec{k}$ lần lượt là các vectơ đơn vị trên các trục $Ox, Oy, Oz$. Tọa độ của vectơ $\\vec{u}$ là:',
    options: [
      { key: 'A', text: '$(2; 3; 1)$' },
      { key: 'B', text: '$(2; -3; 0)$' },
      { key: 'C', text: '$(2; -3; 1)$' },
      { key: 'D', text: '$(-3; 2; 1)$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Theo định nghĩa tọa độ của vectơ trong hệ trục $Oxyz$, vectơ $\\vec{u} = x\\vec{i} + y\\vec{j} + z\\vec{k}$ có tọa độ duy nhất là bộ số $(x; y; z)$. Do đó, từ $\\vec{u} = 2\\vec{i} - 3\\vec{j} + 1\\vec{k}$ suy ra tọa độ của $\\vec{u}$ là $(2; -3; 1)$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'q4',
    number: 4,
    type: 'mcq',
    skill: 'Hình chiếu vuông góc lên các mặt phẳng tọa độ',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho điểm $M(2; -4; 5)$. Tọa độ điểm $M\'$ là hình chiếu vuông góc của $M$ lên mặt phẳng tọa độ $(Oxy)$ là:',
    options: [
      { key: 'A', text: '$M\'(0; -4; 5)$' },
      { key: 'B', text: '$M\'(2; -4; 0)$' },
      { key: 'C', text: '$M\'(2; 0; 5)$' },
      { key: 'D', text: '$M\'(0; 0; 5)$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Mặt phẳng $(Oxy)$ gồm tất cả các điểm có cao độ $z = 0$. Khi chiếu vuông góc điểm $M(x_0; y_0; z_0)$ lên mặt phẳng $(Oxy)$, hoành độ và tung độ được giữ nguyên, còn cao độ bằng $0$. Do đó $M\'(2; -4; 0)$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'q5',
    number: 5,
    type: 'mcq',
    skill: 'Tọa độ trung điểm đoạn thẳng',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho hai điểm $A(1; 2; -3)$ và $B(3; -4; 1)$. Tọa độ trung điểm $I$ của đoạn thẳng $AB$ là:',
    options: [
      { key: 'A', text: '$I(4; -2; -2)$' },
      { key: 'B', text: '$I(2; -1; -1)$' },
      { key: 'C', text: '$I(1; -3; 2)$' },
      { key: 'D', text: '$I(2; 3; -1)$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Tọa độ trung điểm $I$ của đoạn thẳng $AB$ được tính theo công thức: $$x_I = \\dfrac{x_A + x_B}{2} = \\dfrac{1 + 3}{2} = 2, \\quad y_I = \\dfrac{2 + (-4)}{2} = -1, \\quad z_I = \\dfrac{-3 + 1}{2} = -1 \\implies I(2; -1; -1).$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'q6',
    number: 6,
    type: 'mcq',
    skill: 'Các phép toán tọa độ của vectơ',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho hai vectơ $\\vec{a} = (1; -2; 3)$ và $\\vec{b} = (-2; 1; 4)$. Tọa độ của vectơ $\\vec{v} = 2\\vec{a} - 3\\vec{b}$ là:',
    options: [
      { key: 'A', text: '$(8; -7; 18)$' },
      { key: 'B', text: '$(-4; -1; -6)$' },
      { key: 'C', text: '$(8; -7; -6)$' },
      { key: 'D', text: '$(4; -1; 18)$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Sử dụng biểu thức tọa độ của phép nhân một số với vectơ và phép trừ hai vectơ: $$2\\vec{a} = (2; -4; 6)$$ $$3\\vec{b} = (-6; 3; 12)$$ Suy ra $\\vec{v} = 2\\vec{a} - 3\\vec{b} = (2 - (-6); -4 - 3; 6 - 12) = (8; -7; -6)$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'q7',
    number: 7,
    type: 'mcq',
    skill: 'Tích vô hướng và điều kiện vuông góc',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho hai vectơ $\\vec{a} = (2; 1; -1)$ và $\\vec{b} = (1; m; 3)$. Giá trị của tham số $m$ để hai vectơ $\\vec{a}$ và $\\vec{b}$ vuông góc với nhau là:',
    options: [
      { key: 'A', text: '$m = -1$' },
      { key: 'B', text: '$m = 1$' },
      { key: 'C', text: '$m = 5$' },
      { key: 'D', text: '$m = -5$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Hai vectơ $\\vec{a}$ và $\\vec{b}$ vuông góc với nhau khi và chỉ khi tích vô hướng của chúng bằng $0$: $$\\vec{a} \\perp \\vec{b} \\Leftrightarrow \\vec{a} \\cdot \\vec{b} = 0$$ Thay tọa độ vào ta có: $$2 \\cdot 1 + 1 \\cdot m + (-1) \\cdot 3 = 0 \\Leftrightarrow 2 + m - 3 = 0 \\Leftrightarrow m = 1.$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'q8',
    number: 8,
    type: 'mcq',
    skill: 'Góc giữa hai vectơ',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho hai vectơ $\\vec{u} = (1; 0; 1)$ và $\\vec{v} = (0; 1; 1)$. Số đo góc $\\theta$ giữa hai vectơ $\\vec{u}$ và $\\vec{v}$ bằng:',
    options: [
      { key: 'A', text: '$\\theta = 30^\\circ$' },
      { key: 'B', text: '$\\theta = 45^\\circ$' },
      { key: 'C', text: '$\\theta = 60^\\circ$' },
      { key: 'D', text: '$\\theta = 120^\\circ$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Ta có công thức tính côsin góc giữa hai vectơ: $$\\cos \\theta = \\dfrac{\\vec{u} \\cdot \\vec{v}}{|\\vec{u}| \\cdot |\\vec{v}|} = \\dfrac{1 \\cdot 0 + 0 \\cdot 1 + 1 \\cdot 1}{\\sqrt{1^2 + 0 + 1^2} \\cdot \\sqrt{0 + 1^2 + 1^2}} = \\dfrac{1}{\\sqrt{2} \\cdot \\sqrt{2}} = \\dfrac{1}{2}.$$ Do $0^\\circ \\le \\theta \\le 180^\\circ$ nên $\\theta = 60^\\circ$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'q9',
    number: 9,
    type: 'mcq',
    skill: 'Tọa độ trọng tâm tam giác',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho tam giác $ABC$ có $A(2; 1; -1)$, $B(0; 3; 2)$ và trọng tâm $G(1; 2; 1)$. Tọa độ của đỉnh $C$ là:',
    options: [
      { key: 'A', text: '$C(1; 0; 2)$' },
      { key: 'B', text: '$C(1; 2; 2)$' },
      { key: 'C', text: '$C(3; 6; 2)$' },
      { key: 'D', text: '$C(-1; 2; 0)$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vì $G$ là trọng tâm tam giác $ABC$ nên tọa độ điểm $G$ bằng trung bình cộng tọa độ ba đỉnh $A, B, C$: $$\\begin{cases} x_C = 3x_G - x_A - x_B = 3(1) - 2 - 0 = 1 \\\\ y_C = 3y_G - y_A - y_B = 3(2) - 1 - 3 = 2 \\\\ z_C = 3z_G - z_A - z_B = 3(1) - (-1) - 2 = 2 \\end{cases} \\implies C(1; 2; 2).$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'q10',
    number: 10,
    type: 'mcq',
    skill: 'Khoảng cách giữa hai điểm trong không gian',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho hai điểm $A(1; 2; 0)$ và $B(2; 1; 3)$. Điểm $M(0; y_0; 0)$ nằm trên trục $Oy$ sao cho độ dài đoạn thẳng $AM$ bằng $\\sqrt{10}$. Giá trị của $y_0$ có thể bằng:',
    options: [
      { key: 'A', text: '$y_0 = 3$' },
      { key: 'B', text: '$y_0 = 5$' },
      { key: 'C', text: '$y_0 = 1$' },
      { key: 'D', text: '$y_0 = -3$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng công thức khoảng cách: $$AM = \\sqrt{(0 - 1)^2 + (y_0 - 2)^2 + (0 - 0)^2} = \\sqrt{10} \\Leftrightarrow 1 + (y_0 - 2)^2 = 10$$ $$\\Leftrightarrow (y_0 - 2)^2 = 9 \\Leftrightarrow \\left[\\begin{aligned} y_0 - 2 &= 3 \\\\ y_0 - 2 &= -3 \\end{aligned}\\right. \\Leftrightarrow \\left[\\begin{aligned} y_0 &= 5 \\\\ y_0 &= -1 \\end{aligned}\\right.$$ Đối chiếu với các phương án lựa chọn, ta có $y_0 = 5$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'q11',
    number: 11,
    type: 'mcq',
    skill: 'Cực trị hình học không gian Oxyz và tâm tỉ cự',
    points: 0.5,
    text: 'Trong không gian $Oxyz$, cho ba điểm $A(1; 0; 0)$, $B(0; 2; 0)$, $C(0; 0; 3)$. Gọi $M(x; y; z)$ là điểm thuộc mặt phẳng $(Oxy)$ sao cho biểu thức $P = |\\vec{MA} + \\vec{MB} + 2\\vec{MC}|$ đạt giá trị nhỏ nhất. Tọa độ điểm $M$ là:',
    options: [
      { key: 'A', text: '$M(1; 2; 0)$' },
      { key: 'B', text: '$M\\left(\\dfrac{1}{2}; 1; 0\\right)$' },
      { key: 'C', text: '$M\\left(\\dfrac{1}{4}; \\dfrac{1}{2}; 0\\right)$' },
      { key: 'D', text: '$M\\left(\\dfrac{1}{4}; \\dfrac{1}{2}; \\dfrac{3}{2}\\right)$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Gọi điểm $K$ thỏa mãn $\\vec{KA} + \\vec{KB} + 2\\vec{KC} = \\vec{0}$. Tọa độ điểm $K$ là: $$x_K = \\dfrac{1+0+0}{4} = \\dfrac{1}{4}, \\quad y_K = \\dfrac{0+2+0}{4} = \\dfrac{1}{2}, \\quad z_K = \\dfrac{0+0+2\\cdot 3}{4} = \\dfrac{3}{2} \\implies K\\left(\\dfrac{1}{4}; \\dfrac{1}{2}; \\dfrac{3}{2}\\right)$$ Khi chèn điểm $K$ vào biểu thức $P$, ta có $\\vec{MA} + \\vec{MB} + 2\\vec{MC} = 4\\vec{MK} \\implies P = 4MK$. Để $P$ đạt giá trị nhỏ nhất thì $MK$ phải nhỏ nhất. Do $M \\in (Oxy)$, $M$ chính là hình chiếu vuông góc của $K$ lên mặt phẳng $(Oxy) \\implies M\\left(\\dfrac{1}{4}; \\dfrac{1}{2}; 0\\right)$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'q12',
    number: 12,
    type: 'mcq',
    skill: 'Mô hình hóa chuyển động thẳng đều trong không gian Oxyz',
    points: 0.5,
    text: 'Một máy bay cất cánh từ sân bay. Trong hệ tọa độ $Oxyz$ được chọn (đơn vị trên các trục tính theo km), ra-đa ghi nhận vị trí của máy bay tại thời điểm $t_1 = 0$ phút là $A(2; 3; 1)$ và tại $t_2 = 2$ phút là $B(8; 11; 4)$. Giả sử máy bay bay theo đường thẳng với vận tốc không đổi. Tọa độ vị trí $C$ của máy bay tại thời điểm $t_3 = 5$ phút là:',
    options: [
      { key: 'A', text: '$C(15; 20; 7{,}5)$' },
      { key: 'B', text: '$C(17; 23; 8{,}5)$' },
      { key: 'C', text: '$C(20; 25; 10)$' },
      { key: 'D', text: '$C(14; 19; 7)$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vectơ dịch chuyển của máy bay trong 2 phút: $$\\vec{AB} = (8 - 2; 11 - 3; 4 - 1) = (6; 8; 3)$$ Vận tốc dịch chuyển mỗi phút của máy bay: $$\\vec{v} = \\dfrac{1}{2}\\vec{AB} = (3; 4; 1{,}5)$$ Sau 5 phút kể từ lúc $t = 0$, vectơ dịch chuyển là: $$\\vec{AC} = 5\\vec{v} = (15; 20; 7{,}5)$$ Gọi $C(x_C; y_C; z_C)$, ta có: $$\\begin{cases} x_C = 2 + 15 = 17 \\\\ y_C = 3 + 20 = 23 \\\\ z_C = 1 + 7{,}5 = 8{,}5 \\end{cases} \\implies C(17; 23; 8{,}5).$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'q13',
    number: 13,
    type: 'mcq',
    skill: 'Ứng dụng vectơ giải bài toán cân bằng lực Vật lý',
    points: 0.5,
    text: 'Một chiếc đèn chùm trang trí có khối lượng $m = 6\\text{ kg}$ được treo cân bằng dưới trần nhà nhờ 3 sợi dây cáp thép đồng quy tại điểm $O$ trên đèn, các đầu cáp còn lại gắn cố định tại $A, B, C$ trên trần nhà phẳng nằm ngang. Biết lực căng $\\vec{F}_1, \\vec{F}_2, \\vec{F}_3$ tác dụng lên $O$ có độ lớn bằng nhau và mỗi sợi dây hợp với phương thẳng đứng một góc $30^\\circ$. Lấy gia tốc trọng trường $g = 10\\text{ m/s}^2$. Độ lớn lực căng trên mỗi sợi dây cáp bằng bao nhiêu? (Làm tròn đến hàng phần mười).',
    options: [
      { key: 'A', text: '$20{,}0\\text{ N}$' },
      { key: 'B', text: '$23{,}1\\text{ N}$' },
      { key: 'C', text: '$34{,}6\\text{ N}$' },
      { key: 'D', text: '$40{,}0\\text{ N}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Trọng lực tác dụng lên đèn chùm có độ lớn: $P = m \\cdot g = 6 \\cdot 10 = 60\\text{ N}$, có phương thẳng đứng, hướng xuống dưới. Do 3 lực căng đồng quy có độ lớn bằng nhau và góc tạo với phương thẳng đứng là $30^\\circ$, theo điều kiện cân bằng lực: $$\\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 + \\vec{P} = \\vec{0}$$ Chiếu lên phương thẳng đứng hướng lên: $$3 \\cdot F \\cdot \\cos 30^\\circ = P \\Leftrightarrow 3 \\cdot F \\cdot \\dfrac{\\sqrt{3}}{2} = 60 \\implies F = \\dfrac{40}{\\sqrt{3}} \\approx 23{,}094\\text{ N} \\approx 23{,}1\\text{ N}.$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'q14',
    number: 14,
    type: 'mcq',
    skill: 'Ứng dụng tọa độ không gian vào khoảng cách thực tế',
    points: 0.5,
    text: 'Trong một căn phòng dạng hình hộp chữ nhật, người ta chọn hệ trục tọa độ $Oxyz$ sao cho gốc $O$ trùng với một góc sàn nhà, hai mép tường vuông góc trên sàn nằm trên hai trục $Ox, Oy$ và đường mép tường thẳng đứng trùng với trục $Oz$ (đơn vị đo là mét). Một bóng đèn được treo tại vị trí $D(2; 3; 2{,}5)$ và một robot lau sàn đang hoạt động tại vị trí $M(4; 1; 0)$. Khoảng cách giữa robot $M$ và bóng đèn $D$ bằng bao nhiêu mét? (Làm tròn đến chữ số thập phân thứ hai).',
    options: [
      { key: 'A', text: '$3{,}00\\text{ m}$' },
      { key: 'B', text: '$3{,}50\\text{ m}$' },
      { key: 'C', text: '$3{,}77\\text{ m}$' },
      { key: 'D', text: '$4{,}12\\text{ m}$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Khoảng cách giữa robot $M(4; 1; 0)$ và bóng đèn $D(2; 3; 2{,}5)$ là độ dài đoạn thẳng $MD$: $$MD = \\sqrt{(2 - 4)^2 + (3 - 1)^2 + (2{,}5 - 0)^2} = \\sqrt{(-2)^2 + 2^2 + 2{,}5^2} = \\sqrt{4 + 4 + 6{,}25} = \\sqrt{14{,}25} \\approx 3{,}7749\\text{ m} \\approx 3{,}77\\text{ m}.$$<br><strong>Đáp án đúng: C.</strong>',
  },
];

// --- DỮ LIỆU CÂU HỎI TỰ LUẬN (PHẦN II - 2 CÂU, 1.5 ĐIỂM/CÂU = 3.0 ĐIỂM) ---
const SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'q15',
    number: 15,
    type: 'shortans',
    skill: 'Tích vô hướng và chứng minh thẳng hàng trong không gian',
    points: 1.5,
    text: 'Cho hình lập phương $ABCD.A\'B\'C\'D\'$ có cạnh bằng $a$.<br><br><strong>a) (0,75 điểm)</strong> Chứng minh rằng $\\vec{AC\'} \\cdot \\vec{BD} = 0$. Từ đó rút ra kết luận về góc giữa hai đường thẳng $AC\'$ và $BD$.<br><strong>b) (0,75 điểm)</strong> Gọi $G$ là trọng tâm của tam giác $A\'BD$. Biểu diễn vectơ $\\vec{AG}$ theo ba vectơ không đồng phẳng $\\vec{AB}, \\vec{AD}, \\vec{AA\'}$. Từ đó chứng minh ba điểm $A, G, C\'$ thẳng hàng.',
    placeholder: 'Ví dụ: a) 90 độ; b) AG = 1/3 AC\' (thẳng hàng)',
    correctDisplay: 'a) Góc bằng 90°; b) AG = 1/3 AC\' (A, G, C\' thẳng hàng)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/,/g, '.');
      const hasPartA =
        clean.includes('90') ||
        clean.includes('vuong goc') ||
        clean.includes('vuông góc') ||
        clean.includes('pi/2') ||
        clean.includes('π/2');
      const hasPartB =
        clean.includes('1/3') ||
        clean.includes('thẳng hàng') ||
        clean.includes('thang hang') ||
        clean.includes('cùng phương') ||
        clean.includes('cung phuong');
      return hasPartA || hasPartB;
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>Biểu diễn các vectơ theo ba vectơ chung đỉnh $A$: $$\\vec{AC\'} = \\vec{AB} + \\vec{AD} + \\vec{AA\'} \\quad \\text{và} \\quad \\vec{BD} = \\vec{AD} - \\vec{AB}$$ Xét tích vô hướng: $$\\vec{AC\'} \\cdot \\vec{BD} = (\\vec{AB} + \\vec{AD} + \\vec{AA\'}) \\cdot (\\vec{AD} - \\vec{AB})$$ Do các vectơ cạnh bên vuông góc với nhau và $AB = AD = a$: $$\\vec{AC\'} \\cdot \\vec{BD} = 0 - a^2 + a^2 - 0 + 0 - 0 = 0 \\quad (0,5\\text{ đ})$$ Do $\\vec{AC\'} \\cdot \\vec{BD} = 0$ nên góc giữa hai đường thẳng $AC\'$ và $BD$ bằng $90^\\circ$. $(0,25\\text{ đ})$<br><br><strong>b) (0,75 điểm)</strong><br>Vì $G$ là trọng tâm tam giác $A\'BD$ nên: $$\\vec{AG} = \\dfrac{1}{3}\\left(\\vec{AA\'} + \\vec{AB} + \\vec{AD}\\right) \\quad (0,5\\text{ đ})$$ Mặt khác theo quy tắc hình hộp: $\\vec{AC\'} = \\vec{AB} + \\vec{AD} + \\vec{AA\'}$. Suy ra $\\vec{AG} = \\dfrac{1}{3}\\vec{AC\'} \\Leftrightarrow \\vec{AC\'} = 3\\vec{AG}$.<br>Đẳng thức này chứng tỏ hai vectơ $\\vec{AG}$ và $\\vec{AC\'}$ cùng phương, suy ra ba điểm $A, G, C\'$ thẳng hàng. $(0,25\\text{ đ})$',
  },
  {
    id: 'q16',
    number: 16,
    type: 'shortans',
    skill: 'Xác định tọa độ đỉnh và tính độ dài trong khối hộp Oxyz',
    points: 1.5,
    text: 'Trong một dự án xây dựng cầu vượt cạn, các kỹ sư thiết lập một hệ trục tọa độ $Oxyz$ (đơn vị trên các trục là mét) để quản lý kết cấu. Một trụ cầu bê tông có dạng khối hộp chữ nhật $OABC.O\'A\'B\'C\'$ với $O(0; 0; 0)$, đỉnh $A$ nằm trên tia $Ox$, đỉnh $C$ nằm trên tia $Oy$ và đỉnh $O\'$ nằm trên tia $Oz$. Kích thước trụ cầu là dài $OA = 6\\text{ m}$, rộng $OC = 4\\text{ m}$, cao $OO\' = 10\\text{ m}$.<br><br><strong>a) (0,75 điểm)</strong> Xác định tọa độ các đỉnh $B\', G$ với $G$ là trung điểm của đoạn thẳng $A\'C$.<br><strong>b) (0,75 điểm)</strong> Để gia cố kết cấu, người ta căng một sợi dây cáp thép nối từ đỉnh $O$ đến trung điểm $M$ của cạnh $B\'C\'$. Tính độ dài sợi dây cáp thép $OM$ (làm tròn đến chữ số thập phân thứ hai).',
    placeholder: 'Ví dụ: B\'(6;4;10), G(3;2;5), OM = 11.18m',
    correctDisplay: 'a) B\'(6; 4; 10), G(3; 2; 5); b) OM ≈ 11,18 m',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/,/g, '.');
      const hasCoords =
        clean.includes('6') && (clean.includes('4') || clean.includes('10'));
      const hasLength =
        clean.includes('11.18') ||
        clean.includes('11.18m') ||
        clean.includes('sqrt(125)') ||
        clean.includes('5sqrt(5)') ||
        clean.includes('5căn5');
      return hasCoords || hasLength;
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>Tọa độ các đỉnh: $A(6; 0; 0), C(0; 4; 0), O\'(0; 0; 10) \\implies A\'(6; 0; 10), C\'(0; 4; 10)$.<br>Tọa độ đỉnh $B\'(6; 4; 10)$. $(0,5\\text{ đ})$<br>Tọa độ trung điểm $G$ của $A\'C$: $$\\begin{cases} x_G = \\frac{6 + 0}{2} = 3 \\\\ y_G = \\frac{0 + 4}{2} = 2 \\\\ z_G = \\frac{10 + 0}{2} = 5 \\end{cases} \\implies G(3; 2; 5) \\quad (0,25\\text{ đ})$$<br><strong>b) (0,75 điểm)</strong><br>Tọa độ trung điểm $M$ của cạnh $B\'C\'$: $M(3; 4; 10)$. $(0,25\\text{ đ})$<br>Độ dài sợi cáp $OM$: $$OM = \\sqrt{3^2 + 4^2 + 10^2} = \\sqrt{125} = 5\\sqrt{5} \\approx 11{,}18\\text{ m} \\quad (0,5\\text{ đ})$$',
  },
];

interface ShuffledOption {
  originalKey: 'A' | 'B' | 'C' | 'D';
  text: string;
}

interface ShuffledQuestionMCQ extends Omit<QuestionMCQ, 'options'> {
  options: ShuffledOption[];
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

export default function KiemTraChuong1Page() {
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
    MCQ_QUESTIONS.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ originalKey: opt.key, text: opt.text })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  // Chạy mỗi khi học sinh tải lại trang để 4 phương án tự động đảo vị trí ngẫu nhiên
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS.map((q) => ({
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
  const totalQuestions = MCQ_QUESTIONS.length + SHORTANS_QUESTIONS.length;
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
    MCQ_QUESTIONS.forEach((q) => {
      const studentChoice = mcqAnswers[q.id];
      if (studentChoice === q.correct) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (2 câu Tự luận, 1.5đ/câu)
    SHORTANS_QUESTIONS.forEach((q) => {
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
      bai_thi: 'ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN LỚP 12 – VECTƠ VÀ OXYZ',
      diem: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS.length}`,
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
        Task_ID: 'KIEM_TRA_CHUONG_1_TOAN_12',
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
          bai_thi: 'ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN LỚP 12 – VECTƠ VÀ OXYZ',
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
        MCQ_QUESTIONS.map((q) => ({
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
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider rounded-full mb-2">
              Hệ thống khảo sát trực tuyến Integra
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN LỚP 12 – THỜI GIAN: 45 PHÚT
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
              CHỦ ĐỀ: VECTƠ VÀ HỆ TRỤC TỌA ĐỘ TRONG KHÔNG GIAN (CT GDPT 2018)
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"
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
                placeholder="HS12-001"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"
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
                placeholder="12A1"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"
              />
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
              <span className="text-xs font-medium text-indigo-700">Thời gian còn lại</span>
              <span
                className={`text-xl font-bold font-mono ${
                  timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-indigo-900'
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
          <section className="bg-white rounded-2xl shadow-md border-2 border-indigo-500 p-6 sm:p-8 animate-fade-in">
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
              <div className="text-center sm:text-right bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 min-w-[140px]">
                <span className="text-xs uppercase text-slate-500 font-semibold block">Điểm số</span>
                <span className="text-4xl font-extrabold text-indigo-600">{diemSo}</span>
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
          <div className="bg-indigo-700 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <h2 className="font-bold text-base sm:text-lg">
              PHẦN A. TRẮC NGHIỆM (7,0 điểm – 14 câu, mỗi câu 0,5 điểm)
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
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-md">
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

                {/* DANH SÁCH 4 PHƯƠNG ÁN (ĐÃ XÁO TRỘN FISHER-YATES) */}
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
                        'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-semibold ring-2 ring-indigo-500/20';
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

                {/* LỜI GIẢI CHI TIẾT KHI ĐÃ NỘP BÀI */}
                {isSubmitted && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-lg text-sm text-slate-700">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                      <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
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

          {SHORTANS_QUESTIONS.map((q) => {
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
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"
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
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                      <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
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
              className="w-full sm:w-80 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
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
