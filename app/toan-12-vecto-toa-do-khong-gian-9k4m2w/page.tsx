'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA CHUYÊN ĐỀ TOÁN 12 (CT GDPT 2018)';
const EXAM_SUBTITLE = 'CHỦ ĐỀ: VECTƠ VÀ HỆ TRỤC TỌA ĐỘ TRONG KHÔNG GIAN';
const EXAM_TIME_NOTE =
  'Thời gian làm bài: 90 phút (Không kể thời gian phát đề) • Chuẩn cấu trúc GDPT 2018: 12 câu trắc nghiệm (3,0đ) + 4 bài Đúng/Sai (4,0đ) + 6 câu trả lời ngắn (3,0đ)';

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
    skill: 'Quy tắc hình hộp cộng ba vectơ xuất phát từ một đỉnh',
    points: 0.25,
    text: "Một giàn khung thép hình hộp chữ nhật $ABCD.A'B'C'D'$ trong một công trình xây dựng. Tổng của ba vectơ lực thành phần $\\vec{AB}, \\vec{AD}, \\vec{AA'}$ kéo xuất phát từ đỉnh $A$ bằng vectơ nào sau đây?",
    options: [
      { text: '$\\vec{AC}$', isCorrect: false },
      { text: "$\\vec{AC'}$", isCorrect: true },
      { text: "$\\vec{A'C'}$", isCorrect: false },
      { text: "$\\vec{BD'}$", isCorrect: false },
    ],
    explanation:
      "Theo quy tắc hình hộp áp dụng cho các vectơ lực xuất phát từ cùng một đỉnh $A$:<br>$$\\vec{AB} + \\vec{AD} + \\vec{AA'} = \\vec{AC'}.$$",
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Tọa độ của vectơ vị trí trong không gian Oxyz',
    points: 0.25,
    text: 'Trong hệ tọa độ $Oxyz$ định vị không gian địa lý, một trạm quan trắc khí tượng được đặt tại vị trí $K(-4; 3; 6)$ so với gốc tọa độ $O(0;0;0)$ (đơn vị: km). Tọa độ của vectơ vị trí $\\vec{OK}$ là',
    options: [
      { text: '$(-4; 3; 6)$', isCorrect: true },
      { text: '$(4; -3; -6)$', isCorrect: false },
      { text: '$(-4; -3; 6)$', isCorrect: false },
      { text: '$(6; 3; -4)$', isCorrect: false },
    ],
    explanation:
      'Tọa độ của vectơ vị trí $\\vec{OK}$ chính bằng tọa độ của điểm $K$:<br>$$\\vec{OK} = (x_K - 0; y_K - 0; z_K - 0) = (-4; 3; 6).$$',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Độ lớn của vectơ vận tốc trong không gian Oxyz',
    points: 0.25,
    text: 'Một tàu ngầm khảo sát vùng biển sâu di chuyển với vectơ vận tốc $\\vec{v} = 4\\vec{i} - 3\\vec{j} - 5\\vec{k}$ (đơn vị: m/s). Tốc độ (độ lớn vận tốc) của tàu ngầm bằng',
    options: [
      { text: '$5\\text{ m/s}$', isCorrect: false },
      { text: '$5\\sqrt{2}\\text{ m/s}$', isCorrect: true },
      { text: '$12\\text{ m/s}$', isCorrect: false },
      { text: '$25\\text{ m/s}$', isCorrect: false },
    ],
    explanation:
      'Do $\\vec{i}, \\vec{j}, \\vec{k}$ là các vectơ đơn vị của hệ trục $Oxyz$, ta có $\\vec{v} = (4; -3; -5)$. Tốc độ của tàu ngầm là độ lớn của vectơ vận tốc $\\vec{v}$:<br>$$|\\vec{v}| = \\sqrt{4^2 + (-3)^2 + (-5)^2} = \\sqrt{16 + 9 + 25} = \\sqrt{50} = 5\\sqrt{2}\\text{ m/s}.$$',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Phép nhân vectơ với một số và lực đối cân bằng',
    points: 0.25,
    text: 'Trong một khung giàn không gian 3D, ba vectơ không đồng phẳng $\\vec{a}, \\vec{b}, \\vec{c}$ biểu diễn ba trục chịu lực chính. Một lực kéo $\\vec{F}$ được phân tích thành $\\vec{F} = 2\\vec{a} - 3\\vec{b} + 4\\vec{c}$. Nếu $\\vec{F}\' = -\\vec{F}$ là lực đối cân bằng thì biểu diễn của $\\vec{F}\'$ theo $\\vec{a}, \\vec{b}, \\vec{c}$ là',
    options: [
      { text: "$\\vec{F}' = 2\\vec{a} + 3\\vec{b} - 4\\vec{c}$", isCorrect: false },
      { text: "$\\vec{F}' = -2\\vec{a} + 3\\vec{b} - 4\\vec{c}$", isCorrect: true },
      { text: "$\\vec{F}' = -2\\vec{a} - 3\\vec{b} - 4\\vec{c}$", isCorrect: false },
      { text: "$\\vec{F}' = 2\\vec{a} - 3\\vec{b} - 4\\vec{c}$", isCorrect: false },
    ],
    explanation:
      "Ta có:<br>$$\\vec{F}' = -\\vec{F} = -(2\\vec{a} - 3\\vec{b} + 4\\vec{c}) = -2\\vec{a} + 3\\vec{b} - 4\\vec{c}.$$",
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Khoảng cách giữa hai điểm trong không gian Oxyz',
    points: 0.25,
    text: 'Trong hệ tọa độ $Oxyz$, một thiết bị đo đạc địa hình đặt tại $A(2; -1; 4)$ và một điểm mốc đặt tại $B(5; 3; 4)$ (đơn vị: mét). Khoảng cách giữa thiết bị đo đạc và điểm mốc bằng',
    options: [
      { text: '$3\\text{ m}$', isCorrect: false },
      { text: '$4\\text{ m}$', isCorrect: false },
      { text: '$5\\text{ m}$', isCorrect: true },
      { text: '$\\sqrt{41}\\text{ m}$', isCorrect: false },
    ],
    explanation:
      'Khoảng cách giữa hai điểm $A$ và $B$ được tính theo công thức:<br>$$AB = \\sqrt{(x_B - x_A)^2 + (y_B - y_A)^2 + (z_B - z_A)^2}$$<br>$$AB = \\sqrt{(5 - 2)^2 + (3 - (-1))^2 + (4 - 4)^2} = \\sqrt{3^2 + 4^2 + 0^2} = \\sqrt{25} = 5\\text{ m}.$$',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Góc giữa hai vectơ vị trí trong không gian Oxyz',
    points: 0.25,
    text: 'Trong hệ thống radar theo dõi không lưu, hai máy bay tại một thời điểm có vectơ vị trí lần lượt là $\\vec{r}_1 = (2; 1; 2)$ và $\\vec{r}_2 = (1; 2; -2)$ tính từ trạm radar $O$. Góc tạo bởi hai vectơ vị trí $\\vec{r}_1$ và $\\vec{r}_2$ bằng',
    options: [
      { text: '$45^\\circ$', isCorrect: false },
      { text: '$60^\\circ$', isCorrect: false },
      { text: '$90^\\circ$', isCorrect: true },
      { text: '$120^\\circ$', isCorrect: false },
    ],
    explanation:
      'Tính tích vô hướng của hai vectơ:<br>$$\\vec{r}_1 \\cdot \\vec{r}_2 = 2 \\cdot 1 + 1 \\cdot 2 + 2 \\cdot (-2) = 2 + 2 - 4 = 0.$$<br>Vì tích vô hướng bằng $0$ nên hai vectơ vị trí vuông góc với nhau, tức góc giữa chúng bằng $90^\\circ$.',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Tổng hợp lực không gian và độ lớn của hợp lực',
    points: 0.25,
    text: 'Một hệ thống giàn treo thiết bị có 3 sợi dây cáp tác dụng các lực $\\vec{F}_1, \\vec{F}_2, \\vec{F}_3$ tại điểm đồng quy $S$. Hai lực $\\vec{F}_1$ và $\\vec{F}_2$ nằm trong mặt phẳng nằm ngang, vuông góc với nhau và có độ lớn lần lượt là $30\\text{ N}$ và $40\\text{ N}$. Lực $\\vec{F}_3$ hướng thẳng đứng lên trên với độ lớn $120\\text{ N}$. Độ lớn của hợp lực $\\vec{F} = \\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3$ bằng',
    options: [
      { text: '$190\\text{ N}$', isCorrect: false },
      { text: '$130\\text{ N}$', isCorrect: true },
      { text: '$150\\text{ N}$', isCorrect: false },
      { text: '$70\\text{ N}$', isCorrect: false },
    ],
    explanation:
      'Do $\\vec{F}_1 \\perp \\vec{F}_2$ nên độ lớn tổng hợp lực ngang là:<br>$$|\\vec{F}_1 + \\vec{F}_2| = \\sqrt{|\\vec{F}_1|^2 + |\\vec{F}_2|^2} = \\sqrt{30^2 + 40^2} = 50\\text{ N}.$$<br>Do $(\\vec{F}_1 + \\vec{F}_2)$ nằm trong mặt phẳng nằm ngang và $\\vec{F}_3$ hướng thẳng đứng nên $(\\vec{F}_1 + \\vec{F}_2) \\perp \\vec{F}_3$.<br>Độ lớn hợp lực tổng cộng là:<br>$$|\\vec{F}| = \\sqrt{|\\vec{F}_1 + \\vec{F}_2|^2 + |\\vec{F}_3|^2} = \\sqrt{50^2 + 120^2} = 130\\text{ N}.$$',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Chia đoạn thẳng theo tỉ số cho trước trong không gian Oxyz',
    points: 0.25,
    text: 'Trong hệ tọa độ $Oxyz$ (đơn vị: mét), một rô-bốt di chuyển trên mặt sàn nằm ngang $(Oxy)$ theo đường thẳng nối hai điểm $A(1; 2; 0)$ và $B(7; 10; 0)$. Điểm $M$ thuộc đoạn $AB$ sao cho khoảng cách từ $M$ đến $A$ gấp đôi khoảng cách từ $M$ đến $B$. Tọa độ điểm $M$ là',
    options: [
      { text: '$(3; 4; 0)$', isCorrect: false },
      { text: '$(5; 8; 0)$', isCorrect: true },
      { text: '$(4; 6; 0)$', isCorrect: false },
      { text: '$(6; 9; 0)$', isCorrect: false },
    ],
    explanation:
      'Vì $M$ thuộc đoạn thẳng $AB$ và $MA = 2MB$ nên $\\vec{AM} = 2\\vec{MB} \\iff \\vec{AM} = \\dfrac{2}{3}\\vec{AB}$.<br>Ta có $\\vec{AB} = (7 - 1; 10 - 2; 0 - 0) = (6; 8; 0)$.<br>Do đó $\\vec{AM} = \\dfrac{2}{3}(6; 8; 0) = (4; 6; 0)$.<br>Suy ra tọa độ điểm $M$ là:<br>$$x_M = 1 + 4 = 5, \\quad y_M = 2 + 6 = 8, \\quad z_M = 0 + 0 = 0 \\implies M(5; 8; 0).$$',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Tổng hợp vectơ vận tốc máy bay và luồng gió đối lưu',
    points: 0.25,
    text: 'Một chiếc máy bay phản lực cất cánh với vận tốc đối với không khí được mô tả bởi vectơ $\\vec{v}_1 = (300; 200; 250)$ (đơn vị: km/h). Tại thời điểm đó, một luồng gió đối lưu thổi với vận tốc $\\vec{v}_2 = (20; 40; 50)$ (đơn vị: km/h). Tốc độ thực tế đối với mặt đất của máy bay (độ lớn của vectơ vận tốc tổng hợp $\\vec{v} = \\vec{v}_1 + \\vec{v}_2$) bằng',
    options: [
      { text: '$480\\text{ km/h}$', isCorrect: false },
      { text: '$500\\text{ km/h}$', isCorrect: true },
      { text: '$520\\text{ km/h}$', isCorrect: false },
      { text: '$550\\text{ km/h}$', isCorrect: false },
    ],
    explanation:
      'Vectơ vận tốc tổng hợp thực tế của máy bay đối với mặt đất là:<br>$$\\vec{v} = \\vec{v}_1 + \\vec{v}_2 = (300 + 20; 200 + 40; 250 + 50) = (320; 240; 300).$$<br>Tốc độ thực tế đối với mặt đất là độ lớn của vectơ $\\vec{v}$:<br>$$|\\vec{v}| = \\sqrt{320^2 + 240^2 + 300^2} = \\sqrt{102400 + 57600 + 90000} = \\sqrt{250000} = 500\\text{ km/h}.$$',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Tối ưu hóa tổng bình phương khoảng cách trong hình chóp đều',
    points: 0.25,
    text: 'Một giàn hoa trang trí dạng hình chóp đều $S.ABC$ có độ dài cạnh đáy $AB = BC = CA = 6\\text{ m}$ và độ dài cạnh bên $SA = SB = SC = 4\\text{ m}$. Gọi $G$ là trọng tâm của tam giác đáy $ABC$. Một nghệ nhân treo một hệ thống đèn trang trí tại điểm $M$ nằm trên đoạn thẳng $SG$ sao cho tổng bình phương độ dài các đoạn thẳng nối từ $M$ đến các đỉnh $A, B, C$ và $S$ ($T = MA^2 + MB^2 + MC^2 + MS^2$) đạt giá trị nhỏ nhất. Độ dài đoạn thẳng $SM$ bằng',
    options: [
      { text: '$1\\text{ m}$', isCorrect: false },
      { text: '$1{,}5\\text{ m}$', isCorrect: true },
      { text: '$2\\text{ m}$', isCorrect: false },
      { text: '$0{,}75\\text{ m}$', isCorrect: false },
    ],
    explanation:
      'Gọi $O$ là điểm thỏa mãn $\\vec{OA} + \\vec{OB} + \\vec{OC} + \\vec{OS} = \\vec{0}$.<br>Biến đổi tổng bình phương khoảng cách:<br>$$T = MA^2 + MB^2 + MC^2 + MS^2 = 4MO^2 + (OA^2 + OB^2 + OC^2 + OS^2).$$<br>Do $OA^2 + OB^2 + OC^2 + OS^2$ không đổi nên $T$ đạt giá trị nhỏ nhất khi $M \\equiv O$.<br>Do $S.ABC$ là hình chóp đều nên $O$ nằm trên chiều cao $SG$. Ta có:<br>$$\\vec{OA} + \\vec{OB} + \\vec{OC} = 3\\vec{OG} \\implies 3\\vec{OG} + \\vec{OS} = \\vec{0} \\iff \\vec{SO} = \\dfrac{3}{4}\\vec{SG} \\implies SM = \\dfrac{3}{4}SG.$$<br>Bán kính đường tròn ngoại tiếp đáy $ABC$ là $GA = \\dfrac{a}{\\sqrt{3}} = \\dfrac{6}{\\sqrt{3}} = 2\\sqrt{3}\\text{ m}$.<br>Độ dài đoạn $SG = \\sqrt{SA^2 - GA^2} = \\sqrt{4^2 - (2\\sqrt{3})^2} = \\sqrt{16 - 12} = 2\\text{ m}$.<br>Do đó $SM = \\dfrac{3}{4} \\cdot 2 = 1{,}5\\text{ m}$.',
  },
  {
    id: 'mcq11',
    number: 11,
    type: 'mcq',
    skill: 'Hình chiếu vuông góc của một điểm lên đường thẳng trong không gian Oxyz',
    points: 0.25,
    text: 'Một thiết bị khảo sát địa hình tự động (Drone) xuất phát từ điểm $A(1; 1; 2)$ bay theo một đường thẳng đến điểm $B(7; 4; 8)$. Trên đường bay $AB$, thiết bị cần xác định vị trí $N$ sao cho khoảng cách từ $N$ đến trạm quan trắc mặt đất $P(4; 5; 6)$ là ngắn nhất. Tọa độ điểm $N$ là',
    options: [
      { text: '$(3; 2; 4)$', isCorrect: false },
      { text: '$(5; 3; 6)$', isCorrect: true },
      { text: '$(4; 2{,}5; 5)$', isCorrect: false },
      { text: '$(6; 3{,}5; 7)$', isCorrect: false },
    ],
    explanation:
      'Ta có $\\vec{AB} = (6; 3; 6) = 3(2; 1; 2)$. Điểm $N$ thuộc đường thẳng $AB$ nên biểu diễn tọa độ theo tham số $t$:<br>$$N(1 + 2t; 1 + t; 2 + 2t).$$<br>Vectơ $\\vec{PN} = (1 + 2t - 4; 1 + t - 5; 2 + 2t - 6) = (2t - 3; t - 4; 2t - 4)$.<br>Khoảng cách $PN$ ngắn nhất khi $\\vec{PN} \\perp \\vec{AB} \\iff \\vec{PN} \\cdot (2; 1; 2) = 0$:<br>$$2(2t - 3) + 1(t - 4) + 2(2t - 4) = 0 \\iff 4t - 6 + t - 4 + 4t - 8 = 0 \\iff 9t - 18 = 0 \\iff t = 2.$$<br>Thay $t = 2$ vào tọa độ $N$, ta thu được $N(5; 3; 6)$.',
  },
  {
    id: 'mcq12',
    number: 12,
    type: 'mcq',
    skill: 'Tìm tọa độ đỉnh thứ tư của hình chữ nhật và độ dài đường chéo',
    points: 0.25,
    text: 'Một khung tivi phẳng hình chữ nhật $ABCD$ được treo trên tường trang trí. Trong hệ tọa độ $Oxyz$, biết ba đỉnh $A(1; 2; 3)$, $B(3; 6; 1)$, $C(7; 5; 3)$. Tọa độ đỉnh $D$ và độ dài đường chéo $AC$ của khung tivi lần lượt là',
    options: [
      { text: '$D(5; 0; 5)$ và $AC = 2\\sqrt{10}$', isCorrect: false },
      { text: '$D(5; 1; 5)$ và $AC = 3\\sqrt{5}$', isCorrect: true },
      { text: '$D(4; 1; 5)$ và $AC = 3\\sqrt{5}$', isCorrect: false },
      { text: '$D(5; 1; 5)$ và $AC = 6$', isCorrect: false },
    ],
    explanation:
      'Do $ABCD$ là hình chữ nhật nên $\\vec{AD} = \\vec{BC}$. Ta có $\\vec{BC} = (7 - 3; 5 - 6; 3 - 1) = (4; -1; 2)$.<br>Gọi $D(x_D; y_D; z_D)$, ta có $\\vec{AD} = (x_D - 1; y_D - 2; z_D - 3)$. Do đó:<br>$$\\begin{cases} x_D - 1 = 4 \\\\ y_D - 2 = -1 \\\\ z_D - 3 = 2 \\end{cases} \\implies D(5; 1; 5).$$<br>Độ dài đường chéo $AC$ là:<br>$$AC = \\sqrt{(7 - 1)^2 + (5 - 2)^2 + (3 - 3)^2} = \\sqrt{6^2 + 3^2 + 0^2} = \\sqrt{45} = 3\\sqrt{5}.$$',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 13,
    type: 'tf',
    skill: 'Tọa độ đỉnh hình hộp chữ nhật, độ dài dây cáp và vectơ lực kéo dọc theo cáp',
    text: "Một giàn khung nhà xưởng dạng hình hộp chữ nhật $OABC.O'A'B'C'$ được đặt trong hệ tọa độ $Oxyz$ sao cho $O(0;0;0)$, $A(4; 0; 0)$, $C(0; 6; 0)$, $O'(0; 0; 12)$ (đơn vị: mét). Một dây cáp chịu lực căng từ $O$ đến đỉnh $B'$. Xét tính đúng/sai của các phát biểu sau:",
    items: [
      {
        key: 'a',
        text: "Tọa độ của đỉnh $B'$ trong hệ tọa độ $Oxyz$ là $(4; 6; 12)$.",
        correct: true,
      },
      {
        key: 'b',
        text: "Vectơ biểu diễn vị trí $\\vec{OB'} = 4\\vec{i} + 6\\vec{j} + 12\\vec{k}$.",
        correct: true,
      },
      {
        key: 'c',
        text: "Độ dài của sợi dây cáp $OB'$ bằng $22\\text{ m}$.",
        correct: false,
      },
      {
        key: 'd',
        text: "Nếu một lực $\\vec{F}$ kéo dọc theo cáp từ $O$ đến $B'$ có độ lớn $280\\text{ N}$ thì tọa độ của lực $\\vec{F}$ là $(80; 120; 240)$.",
        correct: true,
      },
    ],
    explanation:
      "• **a) Đúng.** Đỉnh $B'$ có hoành độ $x = 4$, tung độ $y = 6$, cao độ $z = 12$ nên tọa độ là $(4; 6; 12)$.<br>• **b) Đúng.** Biểu diễn vectơ $\\vec{OB'} = 4\\vec{i} + 6\\vec{j} + 12\\vec{k}$.<br>• **c) Sai.** Độ dài đoạn $OB' = \\sqrt{4^2 + 6^2 + 12^2} = \\sqrt{16 + 36 + 144} = \\sqrt{196} = 14\\text{ m}$ (không phải $22\\text{ m}$).<br>• **d) Đúng.** Vectơ đơn vị cùng hướng với $\\vec{OB'}$ là $\\vec{e} = \\dfrac{\\vec{OB'}}{14} = \\left(\\dfrac{4}{14}; \\dfrac{6}{14}; \\dfrac{12}{14}\\right) = \\left(\\dfrac{2}{7}; \\dfrac{3}{7}; \\dfrac{6}{7}\\right)$. Lực $\\vec{F} = 280 \\cdot \\vec{e} = 280 \\cdot \\left(\\dfrac{2}{7}; \\dfrac{3}{7}; \\dfrac{6}{7}\\right) = (80; 120; 240)$.",
  },
  {
    id: 'tf2',
    number: 14,
    type: 'tf',
    skill: 'Vectơ dịch chuyển, vận tốc trung bình và trung điểm đoạn bay của Drone',
    text: 'Một thiết bị bay không người lái (Drone) cất cánh từ vị trí $A(1; 3; 0)$ bay theo đường thẳng đến vị trí $B(7; 11; 24)$ trong thời gian $2$ giây (đơn vị tọa độ là mét). Xét tính đúng/sai của các phát biểu sau:',
    items: [
      {
        key: 'a',
        text: 'Vectơ dịch chuyển $\\vec{AB}$ của Drone có tọa độ là $(6; 8; 24)$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Quãng đường Drone đã bay từ $A$ đến $B$ bằng $38\\text{ m}$.',
        correct: false,
      },
      {
        key: 'c',
        text: 'Vận tốc trung bình của Drone trong $2$ giây đó được biểu diễn bởi vectơ $\\vec{v} = (3; 4; 12)$.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Trạm quan trắc mặt đất $M(4; 7; 12)$ đặt tại trung điểm của đoạn thẳng $AB$.',
        correct: true,
      },
    ],
    explanation:
      '• **a) Đúng.** $\\vec{AB} = (7 - 1; 11 - 3; 24 - 0) = (6; 8; 24)$.<br>• **b) Sai.** Độ dài quãng đường $AB = |\\vec{AB}| = \\sqrt{6^2 + 8^2 + 24^2} = \\sqrt{36 + 64 + 576} = \\sqrt{676} = 26\\text{ m}$ (không phải $38\\text{ m}$).<br>• **c) Đúng.** Vectơ vận tốc trung bình $\\vec{v} = \\dfrac{\\vec{AB}}{\\Delta t} = \\dfrac{(6; 8; 24)}{2} = (3; 4; 12)$.<br>• **d) Đúng.** Tọa độ trung điểm $M$ của $AB$ là $\\left(\\dfrac{1+7}{2}; \\dfrac{3+11}{2}; \\dfrac{0+24}{2}\\right) = (4; 7; 12)$.',
  },
  {
    id: 'tf3',
    number: 15,
    type: 'tf',
    skill: 'Tích vô hướng, diện tích tam giác và góc với mặt phẳng tọa độ (Oxy)',
    text: 'Một mái hiên tam giác $ABC$ của một ngôi nhà thông minh có tọa độ các đỉnh trong hệ $Oxyz$ là $A(2; 0; 0)$, $B(0; 4; 0)$, $C(0; 0; 3)$ (đơn vị: mét). Xét tính đúng/sai của các khẳng định sau:',
    items: [
      {
        key: 'a',
        text: 'Tọa độ các vectơ cạnh là $\\vec{AB} = (-2; 4; 0)$ và $\\vec{AC} = (-2; 0; 3)$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Tích vô hướng $\\vec{AB} \\cdot \\vec{AC} = 4$.',
        correct: true,
      },
      {
        key: 'c',
        text: 'Diện tích của mái hiên tam giác $ABC$ bằng $\\sqrt{61}\\text{ m}^2$.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Góc $\\alpha$ giữa đường thẳng $AB$ và mặt phẳng sàn $(Oxy)$ thỏa mãn $\\sin\\alpha = \\dfrac{3}{5}$.',
        correct: false,
      },
    ],
    explanation:
      '• **a) Đúng.** $\\vec{AB} = (0-2; 4-0; 0-0) = (-2; 4; 0)$ và $\\vec{AC} = (0-2; 0-0; 3-0) = (-2; 0; 3)$.<br>• **b) Đúng.** $\\vec{AB} \\cdot \\vec{AC} = (-2)(-2) + 4(0) + 0(3) = 4$.<br>• **c) Đúng.** Áp dụng công thức diện tích tam giác qua tích vô hướng: $AB = \\sqrt{(-2)^2 + 4^2 + 0} = \\sqrt{20}$, $AC = \\sqrt{(-2)^2 + 0 + 3^2} = \\sqrt{13}$. $\\cos A = \\dfrac{\\vec{AB} \\cdot \\vec{AC}}{AB \\cdot AC} = \\dfrac{4}{\\sqrt{20} \\cdot \\sqrt{13}} = \\dfrac{4}{\\sqrt{260}}$. $\\sin A = \\sqrt{1 - \\cos^2 A} = \\sqrt{1 - \\dfrac{16}{260}} = \\sqrt{\\dfrac{244}{260}}$. $S_{ABC} = \\dfrac{1}{2} AB \\cdot AC \\cdot \\sin A = \\dfrac{1}{2} \\sqrt{260} \\cdot \\sqrt{\\dfrac{244}{260}} = \\dfrac{1}{2}\\sqrt{244} = \\sqrt{61}\\text{ m}^2$.<br>• **d) Sai.** Vì $z_A = z_B = 0$ nên đoạn $AB$ nằm hoàn toàn trong mặt phẳng sàn $(Oxy)$. Do đó góc giữa đường thẳng $AB$ và mặt phẳng $(Oxy)$ bằng $0^\\circ \\implies \\sin\\alpha = 0 \\neq \\dfrac{3}{5}$.',
  },
  {
    id: 'tf4',
    number: 16,
    type: 'tf',
    skill: 'Hợp lực ba vectơ và góc giữa hai vectơ lực tại nút giao kỹ thuật',
    text: 'Tại một nút giao kỹ thuật của hệ thống đường ống dẫn khí, ba nhánh cống chịu tải các lực tác dụng được biểu diễn bởi các vectơ $\\vec{F}_1 = (4; -2; 1)$, $\\vec{F}_2 = (2; 5; -3)$, $\\vec{F}_3 = (-6; 1; 2)$ (đơn vị: kN). Xét tính đúng/sai của các phát biểu sau:',
    items: [
      {
        key: 'a',
        text: 'Hợp lực tác dụng lên tâm nút giao là $\\vec{F} = \\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 = (0; 4; 0)\\text{ kN}$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Độ lớn của hợp lực $\\vec{F}$ bằng $4\\text{ kN}$.',
        correct: true,
      },
      {
        key: 'c',
        text: 'Lực $\\vec{F}_1$ vuông góc với lực $\\vec{F}_2$.',
        correct: false,
      },
      {
        key: 'd',
        text: 'Góc tạo bởi hai lực $\\vec{F}_1$ và $\\vec{F}_3$ là một góc tù.',
        correct: true,
      },
    ],
    explanation:
      '• **a) Đúng.** Hợp lực $\\vec{F} = (4 + 2 - 6; -2 + 5 + 1; 1 - 3 + 2) = (0; 4; 0)\\text{ kN}$.<br>• **b) Đúng.** $|\\vec{F}| = \\sqrt{0^2 + 4^2 + 0^2} = 4\\text{ kN}$.<br>• **c) Sai.** Ta có $\\vec{F}_1 \\cdot \\vec{F}_2 = 4(2) + (-2)(5) + 1(-3) = 8 - 10 - 3 = -5 \\neq 0$ nên hai lực không vuông góc.<br>• **d) Đúng.** Ta có $\\vec{F}_1 \\cdot \\vec{F}_3 = 4(-6) + (-2)(1) + 1(2) = -24 - 2 + 2 = -24 < 0$. Vì tích vô hướng âm nên góc giữa hai vectơ lực $\\vec{F}_1$ và $\\vec{F}_3$ là góc tù.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 17,
    type: 'shortans',
    skill: 'Cân bằng lực giàn treo đèn chùm không gian đối xứng',
    points: 0.5,
    text: 'Một đèn chùm sân khấu có trọng lượng $120\\text{ N}$ được treo cố định tại điểm $S$ bởi ba sợi dây cáp $SA, SB, SC$. Các điểm treo $A, B, C$ nằm trên trần nhà phẳng sao cho $SA, SB, SC$ tạo với mặt trần các góc bằng nhau $60^\\circ$ và các lực căng dây có độ lớn bằng nhau. Độ lớn lực căng $T$ của mỗi sợi dây cáp bằng bao nhiêu Newton? (Làm tròn kết quả đến hàng phần mười).',
    placeholder: 'Nhập số thập phân (N, VD: 28,5)',
    correctDisplay: '46,2',
    explanation:
      'Góc tạo bởi mỗi sợi dây cáp với phương thẳng đứng là $90^\\circ - 60^\\circ = 30^\\circ$. Tổng thành phần lực nâng thẳng đứng của 3 sợi dây cân bằng với trọng lượng đèn $P = 120\\text{ N}$:<br>$$3 \\cdot T \\cdot \\cos 30^\\circ = 120 \\iff 3 \\cdot T \\cdot \\dfrac{\\sqrt{3}}{2} = 120 \\iff T = \\dfrac{80}{\\sqrt{3}} \\approx 46{,}188\\text{ N} \\approx 46{,}2\\text{ N}.$$',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/,/g, '.').replace(/n|newton/gi, '').trim();
      return c === '46.2';
    },
  },
  {
    id: 'sa2',
    number: 18,
    type: 'shortans',
    skill: 'Khoảng cách giữa hai vệ tinh trong không gian tọa độ',
    points: 0.5,
    text: 'Trong hệ tọa độ $Oxyz$ (đơn vị: km), một trạm theo dõi chuyển động phát hiện hai vệ tinh viễn thông $A$ và $B$ có tọa độ lần lượt là $A(2; 1; 6)$ và $B(8; 7; 9)$. Khoảng cách giữa hai vệ tinh tại thời điểm quan sát bằng bao nhiêu kilômét?',
    placeholder: 'Nhập khoảng cách số (km, VD: 15)',
    correctDisplay: '9',
    explanation:
      'Khoảng cách giữa hai vệ tinh $A$ và $B$ là:<br>$$AB = \\sqrt{(8 - 2)^2 + (7 - 1)^2 + (9 - 6)^2} = \\sqrt{6^2 + 6^2 + 3^2} = \\sqrt{36 + 36 + 9} = \\sqrt{81} = 9\\text{ km}.$$',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/km|kilômét/gi, '').trim();
      return c === '9';
    },
  },
  {
    id: 'sa3',
    number: 19,
    type: 'shortans',
    skill: 'Tính công cơ học sinh bởi vectơ lực trong không gian Oxyz',
    points: 0.5,
    text: 'Một cần cẩu kéo một khối bê-tông bằng lực $\\vec{F} = (20; 15; 10)$ (đơn vị: kN) làm khối bê-tông dịch chuyển theo đường thẳng từ $M(1; 1; 0)$ đến $N(6; 5; 3)$ (đơn vị: m). Công $A$ sinh bởi lực $\\vec{F}$ trên quãng đường $MN$ bằng bao nhiêu kilôjun (kJ)? (Biết $1\\text{ kN} \\times 1\\text{ m} = 1\\text{ kJ}$).',
    placeholder: 'Nhập giá trị công A (kJ, VD: 120)',
    correctDisplay: '190',
    explanation:
      'Vectơ độ dịch chuyển $\\vec{MN} = (6 - 1; 5 - 1; 3 - 0) = (5; 4; 3)$. Công sinh bởi lực $\\vec{F}$ là tích vô hướng của lực và vectơ độ dịch chuyển:<br>$$A = \\vec{F} \\cdot \\vec{MN} = 20 \\cdot 5 + 15 \\cdot 4 + 10 \\cdot 3 = 100 + 60 + 30 = 190\\text{ kJ}.$$',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/kj|kilôjun/gi, '').trim();
      return c === '190';
    },
  },
  {
    id: 'sa4',
    number: 20,
    type: 'shortans',
    skill: 'Trọng tâm tam giác và khoảng cách đến mặt phẳng tọa độ (Oxy)',
    points: 0.5,
    text: "Một hệ thống nhà kho lưu trữ hàng hóa thông minh hình hộp chữ nhật $OABC.DKEF$ được thiết lập hệ trục tọa độ $Oxyz$ với $O(0;0;0)$, $A(12; 0; 0)$, $C(0; 9; 0)$, $D(0; 0; 6)$ (đơn vị: mét). Một camera giám sát được treo tại trọng tâm $G$ của tam giác $A'BC$ (với $A'$ là đỉnh nằm thẳng đứng phía trên $A$, tức $A'(12; 0; 6)$). Khoảng cách từ vị trí camera $G$ đến mặt sàn $(Oxy)$ bằng bao nhiêu mét?",
    placeholder: 'Nhập khoảng cách số (mét, VD: 5)',
    correctDisplay: '2',
    explanation:
      "Tọa độ các đỉnh: $A'(12; 0; 6)$, $B(12; 9; 0)$, $C(0; 9; 0)$. Trọng tâm $G$ của tam giác $A'BC$ có cao độ:<br>$$z_G = \\dfrac{z_{A'} + z_B + z_C}{3} = \\dfrac{6 + 0 + 0}{3} = 2\\text{ m}.$$<br>Khoảng cách từ camera $G$ đến mặt sàn $(Oxy)$ chính bằng $z_G = 2\\text{ m}$.",
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/m|mét/gi, '').trim();
      return c === '2';
    },
  },
  {
    id: 'sa5',
    number: 21,
    type: 'shortans',
    skill: 'Tối ưu hóa tổng bình phương khoảng cách đến mặt phẳng (Oxy)',
    points: 0.5,
    text: 'Trong một dự án xây dựng đô thị thông minh $Oxyz$, người ta định vị ba trạm trung chuyển hàng hóa tại $A(2; 3; 1)$, $B(4; 7; 5)$, $C(6; 2; 3)$ (đơn vị: km). Nhà quản lý muốn xây dựng một trung tâm điều hành $M$ nằm trên mặt phẳng sàn $(Oxy)$ (tức $z_M = 0$) sao cho tổng bình phương khoảng cách $MA^2 + MB^2 + MC^2$ đạt giá trị nhỏ nhất. Giá trị của tổng $x_M + y_M$ bằng bao nhiêu?',
    placeholder: 'Nhập giá trị tổng (VD: 14)',
    correctDisplay: '8',
    explanation:
      'Gọi $G$ là trọng tâm của tam giác $ABC$:<br>$$x_G = \\dfrac{2 + 4 + 6}{3} = 4, \\quad y_G = \\dfrac{3 + 7 + 2}{3} = 4, \\quad z_G = \\dfrac{1 + 5 + 3}{3} = 3 \\implies G(4; 4; 3).$$<br>Ta có đẳng thức vectơ: $MA^2 + MB^2 + MC^2 = 3MG^2 + GA^2 + GB^2 + GC^2$.<br>Do $GA^2 + GB^2 + GC^2$ không đổi nên $MA^2 + MB^2 + MC^2$ nhỏ nhất khi $MG$ nhỏ nhất.<br>Vì $M \\in (Oxy)$ nên $M$ là hình chiếu vuông góc của $G$ lên $(Oxy) \\implies M(4; 4; 0)$.<br>Do đó $x_M + y_M = 4 + 4 = 8$.',
    validator: (val: string) => val.trim() === '8',
  },
  {
    id: 'sa6',
    number: 22,
    type: 'shortans',
    skill: 'Tìm tham số m từ điều kiện góc giữa hai vectơ trong không gian Oxyz',
    points: 0.5,
    text: 'Một cống xả nước ngầm dưới lòng đất có hướng dòng chảy được biểu diễn bởi vectơ $\\vec{u} = (1; 1; 0)$. Một đường ống xả nhánh được lắp nối có hướng biểu diễn bởi vectơ $\\vec{v} = (m; 0; 1)$ với $m > 0$. Biết góc giữa hướng dòng chảy của cống ngầm và đường ống xả nhánh bằng $60^\\circ$. Giá trị của tham số $m$ bằng bao nhiêu?',
    placeholder: 'Nhập giá trị của m (VD: 2)',
    correctDisplay: '1',
    explanation:
      'Ta có $\\vec{u} \\cdot \\vec{v} = 1 \\cdot m + 1 \\cdot 0 + 0 \\cdot 1 = m$.<br>$|\\vec{u}| = \\sqrt{1^2 + 1^2 + 0^2} = \\sqrt{2}$.<br>$|\\vec{v}| = \\sqrt{m^2 + 0^2 + 1^2} = \\sqrt{m^2 + 1}$.<br>$$\\cos 60^\\circ = \\dfrac{\\vec{u} \\cdot \\vec{v}}{|\\vec{u}| \\cdot |\\vec{v}|} \\iff \\dfrac{1}{2} = \\dfrac{m}{\\sqrt{2}\\sqrt{m^2 + 1}}.$$<br>Do $m > 0$, bình phương hai vế ta có:<br>$$\\dfrac{1}{4} = \\dfrac{m^2}{2(m^2 + 1)} \\iff 2(m^2 + 1) = 4m^2 \\iff 2m^2 = 2 \\iff m^2 = 1 \\iff m = 1 \\quad (\\text{do } m > 0).$$',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/m\s*=\s*/gi, '').trim();
      return c === '1';
    },
  },
];

export default function Toan12VectoToaDoKhongGianPage() {
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
    const ma = maHocSinh.trim() || 'HS12-VECTO-01';
    const lop = lopNhom.trim() || 'Lớp 12';

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
            TOÁN 12 • HỆ THỐNG KIỂM TRA CHUYÊN ĐỀ
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
                placeholder="Ví dụ: 12A1-05"
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
                placeholder="Ví dụ: 12A1"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS12-VECTO-01'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '12'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Phần I: <strong>{diemPhan1.toFixed(2)}/3.0đ</strong> ({soCauDungMCQ}/12 câu đúng)</span>
                  <span>Phần II: <strong>{diemPhan2.toFixed(2)}/4.0đ</strong></span>
                  <span>Phần III: <strong>{diemPhan3.toFixed(2)}/3.0đ</strong></span>
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
