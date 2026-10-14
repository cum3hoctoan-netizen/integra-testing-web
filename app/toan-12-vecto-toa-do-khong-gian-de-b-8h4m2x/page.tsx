'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA CHUYÊN ĐỀ TOÁN 12 (CT GDPT 2018)';
const EXAM_SUBTITLE = '[ĐỀ B] CHỦ ĐỀ: VECTƠ VÀ HỆ TRỤC TỌA ĐỘ TRONG KHÔNG GIAN';
const EXAM_TIME_NOTE =
  'Thời gian làm bài: 90 phút (Không kể thời gian phát đề) • Chuẩn cấu trúc GDPT 2018: 12 câu trắc nghiệm + 4 bài Đúng/Sai + 6 câu trả lời ngắn';

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
    skill: 'Quy tắc hình bình hành cộng hai vectơ mặt bên của hình hộp chữ nhật',
    points: 0.25,
    text: "Một giàn khung thép hình hộp chữ nhật $ABCD.A'B'C'D'$ trong một công trình xây dựng. Tổng của hai vectơ lực thành phần $\\vec{AB}$ và $\\vec{AA'}$ kéo dọc theo hai cạnh xuất phát từ đỉnh $A$ của giàn khung bằng vectơ nào sau đây?",
    options: [
      { text: '$\\vec{AC}$', isCorrect: false },
      { text: "$\\vec{AB'}$", isCorrect: true },
      { text: "$\\vec{AD'}$", isCorrect: false },
      { text: "$\\vec{A'C'}$", isCorrect: false },
    ],
    explanation:
      "Theo quy tắc hình bình hành áp dụng cho hình chữ nhật $ABB'A'$ ở mặt bên:<br>$$\\vec{AB} + \\vec{AA'} = \\vec{AB'}.$$",
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Xác định tọa độ của vectơ vị trí từ gốc tọa độ Oxyz',
    points: 0.25,
    text: 'Trong hệ tọa độ $Oxyz$ định vị không gian địa lý, một cảm biến quan trắc môi trường được xác định tại vị trí $M(-3; 4; -2)$ so với trạm điều khiển trung tâm đặt tại gốc tọa độ $O(0;0;0)$ (đơn vị: km). Tọa độ của vectơ vị trí $\\vec{OM}$ của cảm biến là',
    options: [
      { text: '$(-3; 4; -2)$', isCorrect: true },
      { text: '$(3; -4; 2)$', isCorrect: false },
      { text: '$(-3; -4; -2)$', isCorrect: false },
      { text: '$(2; -4; 3)$', isCorrect: false },
    ],
    explanation:
      'Tọa độ của vectơ vị trí $\\vec{OM}$ chính bằng tọa độ của điểm $M$:<br>$$\\vec{OM} = (x_M - 0; y_M - 0; z_M - 0) = (-3; 4; -2).$$',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Biểu diễn tọa độ vectơ theo các vectơ đơn vị của hệ trục Oxyz',
    points: 0.25,
    text: 'Một tàu ngầm nghiên cứu đại dương di chuyển với vectơ vận tốc $\\vec{v} = -2\\vec{i} + 5\\vec{j} - 3\\vec{k}$ (đơn vị: m/s). Tọa độ của vectơ vận tốc $\\vec{v}$ trong hệ tọa độ $Oxyz$ là',
    options: [
      { text: '$(2; 5; -3)$', isCorrect: false },
      { text: '$(-2; 5; -3)$', isCorrect: true },
      { text: '$(-2; -5; -3)$', isCorrect: false },
      { text: '$(-3; 5; -2)$', isCorrect: false },
    ],
    explanation:
      'Do $\\vec{i}, \\vec{j}, \\vec{k}$ là các vectơ đơn vị của hệ trục $Oxyz$, ta có:<br>$$\\vec{v} = -2\\vec{i} + 5\\vec{j} - 3\\vec{k} \\Rightarrow \\vec{v} = (-2; 5; -3).$$',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Điều kiện cân bằng của hệ lực trong không gian ba chiều',
    points: 0.25,
    text: 'Trong một thử nghiệm cân bằng tải trọng ba chiều, bốn sợi dây cáp chịu lực cùng buộc vào một nút khung thép đặt tại điểm $O$. Các lực kéo được biểu diễn bởi bốn vectơ $\\vec{F}_1, \\vec{F}_2, \\vec{F}_3, \\vec{F}_4$. Biết rằng nút khung thép giữ nguyên ở trạng thái cân bằng tuyệt đối. Khẳng định nào sau đây là đúng?',
    options: [
      { text: '$\\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 = \\vec{F}_4$', isCorrect: false },
      { text: '$\\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 + \\vec{F}_4 = \\vec{0}$', isCorrect: true },
      { text: '$|\\vec{F}_1| + |\\vec{F}_2| + |\\vec{F}_3| = |\\vec{F}_4|$', isCorrect: false },
      { text: '$\\vec{F}_1 \\cdot \\vec{F}_2 + \\vec{F}_3 \\cdot \\vec{F}_4 = 0$', isCorrect: false },
    ],
    explanation:
      'Điều kiện cân bằng lực trong không gian ba chiều là tổng hợp tất cả các lực tác dụng lên vật bằng vectơ không:<br>$$\\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 + \\vec{F}_4 = \\vec{0}.$$',
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Tính khoảng cách giữa hai điểm trong không gian Oxyz',
    points: 0.25,
    text: 'Một phòng thí nghiệm dạng hình hộp chữ nhật được thiết lập hệ trục tọa độ $Oxyz$ với đơn vị trên các trục là mét. Cảm biến nhiệt độ treo tại vị trí $A(1; 2; 3)$ và bộ điều khiển trung tâm đặt tại vị trí $B(5; 2; 6)$. Khoảng cách giữa cảm biến nhiệt độ và bộ điều khiển trung tâm bằng',
    options: [
      { text: '$4{,}0\\text{ m}$', isCorrect: false },
      { text: '$5{,}0\\text{ m}$', isCorrect: true },
      { text: '$6{,}0\\text{ m}$', isCorrect: false },
      { text: '$7{,}0\\text{ m}$', isCorrect: false },
    ],
    explanation:
      'Khoảng cách giữa hai điểm $A$ và $B$ được tính theo công thức:<br>$$AB = \\sqrt{(x_B - x_A)^2 + (y_B - y_A)^2 + (z_B - z_A)^2}$$<br>$$AB = \\sqrt{(5 - 1)^2 + (2 - 2)^2 + (6 - 3)^2} = \\sqrt{16 + 0 + 9} = \\sqrt{25} = 5\\text{ m}.$$',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Tính góc giữa hai vectơ bằng tích vô hướng trong không gian',
    points: 0.25,
    text: 'Trong hệ thống quản lý bay thương mại, hai máy bay tại một thời điểm có vectơ vị trí tính từ trạm kiểm soát không lưu $O$ lần lượt là $\\vec{u} = (1; 1; 0)$ và $\\vec{v} = (0; 1; 1)$. Góc tạo bởi hai vectơ vị trí $\\vec{u}$ và $\\vec{v}$ của hai máy bay bằng',
    options: [
      { text: '$30^\\circ$', isCorrect: false },
      { text: '$60^\\circ$', isCorrect: true },
      { text: '$45^\\circ$', isCorrect: false },
      { text: '$90^\\circ$', isCorrect: false },
    ],
    explanation:
      'Ta có $\\vec{u} \\cdot \\vec{v} = 1 \\cdot 0 + 1 \\cdot 1 + 0 \\cdot 1 = 1$.<br>$|\\vec{u}| = \\sqrt{1^2 + 1^2 + 0^2} = \\sqrt{2}$, $|\\vec{v}| = \\sqrt{0^2 + 1^2 + 1^2} = \\sqrt{2}$.<br>$$\\cos(\\vec{u}, \\vec{v}) = \\frac{\\vec{u} \\cdot \\vec{v}}{|\\vec{u}| \\cdot |\\vec{v}|} = \\frac{1}{\\sqrt{2} \\cdot \\sqrt{2}} = \\frac{1}{2} \\Rightarrow (\\vec{u}, \\vec{v}) = 60^\\circ.$$',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Phân tích lực căng dây treo vật thể ở trạng thái cân bằng ba chiều',
    points: 0.25,
    text: 'Một chiếc đèn trang trí có trọng lượng $120\\text{ N}$ được treo vào trần nhà nhờ $3$ sợi dây cáp không giãn có độ dài bằng nhau, kết nối từ trần nhà xuống điểm buộc $S$ trên đèn. Biết rằng góc tạo bởi mỗi sợi dây cáp với phương thẳng đứng đều bằng $45^\\circ$ và lực căng trên $3$ sợi dây có độ lớn bằng nhau. Độ lớn của lực căng trên mỗi sợi dây cáp xấp xỉ bằng',
    options: [
      { text: '$40{,}0\\text{ N}$', isCorrect: false },
      { text: '$56{,}6\\text{ N}$', isCorrect: true },
      { text: '$69{,}3\\text{ N}$', isCorrect: false },
      { text: '$80{,}0\\text{ N}$', isCorrect: false },
    ],
    explanation:
      'Gọi $T$ là độ lớn lực căng của mỗi sợi dây cáp. Thành phần lực căng dây theo phương thẳng đứng của mỗi sợi dây là $T \\cdot \\cos 45^\\circ$. Do chiếc đèn trang trí ở trạng thái cân bằng, tổng các thành phần lực nâng thẳng đứng phải cân bằng với trọng lượng $P = 120\\text{ N}$:<br>$$3 \\cdot T \\cdot \\cos 45^\\circ = 120 \\iff 3 \\cdot T \\cdot \\frac{\\sqrt{2}}{2} = 120 \\iff T = \\frac{80}{\\sqrt{2}} = 40\\sqrt{2} \\approx 56{,}57\\text{ N} \\approx 56{,}6\\text{ N}.$$',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Tìm tọa độ trung điểm đoạn thẳng trong không gian Oxyz',
    points: 0.25,
    text: 'Một xe tự hành AGV chuyển động trong nhà máy thông minh theo đường thẳng từ vị trí xuất phát $A(4; 2; 1)$ đến vị trí trả hàng $B(10; 8; 5)$ và dừng lại kiểm tra kỹ thuật tại điểm $M$ nằm chính giữa đoạn thẳng $AB$. Tọa độ điểm $M$ là',
    options: [
      { text: '$(14; 10; 6)$', isCorrect: false },
      { text: '$(7; 5; 3)$', isCorrect: true },
      { text: '$(6; 6; 4)$', isCorrect: false },
      { text: '$(3; 3; 2)$', isCorrect: false },
    ],
    explanation:
      'Vì $M$ là trung điểm của đoạn thẳng $AB$ nên tọa độ của $M$ là:<br>$$x_M = \\frac{4 + 10}{2} = 7, \\quad y_M = \\frac{2 + 8}{2} = 5, \\quad z_M = \\frac{1 + 5}{2} = 3 \\Rightarrow M(7; 5; 3).$$',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Cộng vectơ vận tốc và tính độ lớn vận tốc máy bay trong không gian',
    points: 0.25,
    text: 'Một máy bay cất cánh với vectơ vận tốc đối với không khí là $\\vec{v}_1 = (200; 300; 60)$ (đơn vị: km/h). Đồng thời, một luồng gió thổi với vận tốc $\\vec{v}_2 = (40; 20; 30)$ (đơn vị: km/h). Tốc độ thực tế đối với mặt đất của máy bay (độ lớn của vectơ vận tốc tổng hợp $\\vec{v} = \\vec{v}_1 + \\vec{v}_2$) bằng',
    options: [
      { text: '$450\\text{ km/h}$', isCorrect: false },
      { text: '$410\\text{ km/h}$', isCorrect: true },
      { text: '$380\\text{ km/h}$', isCorrect: false },
      { text: '$500\\text{ km/h}$', isCorrect: false },
    ],
    explanation:
      'Vectơ vận tốc tổng hợp thực tế của máy bay là:<br>$$\\vec{v} = \\vec{v}_1 + \\vec{v}_2 = (200 + 40; 300 + 20; 60 + 30) = (240; 320; 90).$$<br>Tốc độ thực tế đối với mặt đất là độ lớn của vectơ $\\vec{v}$:<br>$$|\\vec{v}| = \\sqrt{240^2 + 320^2 + 90^2} = \\sqrt{57600 + 102400 + 8100} = \\sqrt{168100} = 410\\text{ km/h}.$$',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Tối ưu hóa hình học không gian kết hợp khoảng cách và cực trị',
    points: 0.25,
    text: 'Một cột ăng-ten viễn thông $SO = 15\\text{ m}$ được gia cố bởi ba dây cáp kéo từ điểm $S$ xuống ba cọc đất $A, B, C$ sao cho $S.ABC$ là hình chóp đều. Bán kính đường tròn ngoại tiếp đáy $ABC$ là $OA = OB = OC = 3\\sqrt{8}\\text{ m}$ (tức $6\\sqrt{2}\\text{ m}$). Một kỹ sư gắn một cảm biến tại điểm $M$ trên đoạn $SO$ sao cho tổng khoảng cách từ $M$ đến $3$ cọc $A, B, C$ và đỉnh $S$ ($SM + MA + MB + MC$) đạt giá trị nhỏ nhất. Độ dài đoạn $SM$ bằng',
    options: [
      { text: '$15\\text{ m}$', isCorrect: false },
      { text: '$12\\text{ m}$', isCorrect: true },
      { text: '$9\\text{ m}$', isCorrect: false },
      { text: '$3\\text{ m}$', isCorrect: false },
    ],
    explanation:
      "Đặt $OM = x$ ($0 \\le x \\le 15$). Ta có $SM = 15 - x$.<br>Do $MA = MB = MC = \\sqrt{OM^2 + OA^2} = \\sqrt{x^2 + (3\\sqrt{8})^2} = \\sqrt{x^2 + 72}$.<br>Tổng khoảng cách $f(x) = (15 - x) + 3\\sqrt{x^2 + 72}$.<br>Xét đạo hàm $f'(x) = -1 + \\frac{3x}{\\sqrt{x^2 + 72}}$.<br>Cho $f'(x) = 0 \\iff 3x = \\sqrt{x^2 + 72} \\iff 9x^2 = x^2 + 72 \\iff 8x^2 = 72 \\iff x = 3\\text{ m}$.<br>Lập bảng biến thiên, $f(x)$ đạt giá trị nhỏ nhất tại $x = 3\\text{ m}$. Do đó $SM = 15 - x = 15 - 3 = 12\\text{ m}$.",
  },
  {
    id: 'mcq11',
    number: 11,
    type: 'mcq',
    skill: 'Hình chiếu của một điểm lên đường thẳng trong không gian Oxyz',
    points: 0.25,
    text: 'Một máy bay nông nghiệp không người lái bay theo đường thẳng từ vị trí $A(2; 0; 1)$ đến vị trí $B(8; 6; 7)$. Điểm $N$ trên đường bay $AB$ sao cho khoảng cách từ máy bay đến một trạm thu phát sóng tại điểm $P(4; 5; 0)$ là ngắn nhất có tọa độ là',
    options: [
      { text: '$(3; 1; 2)$', isCorrect: false },
      { text: '$(4; 2; 3)$', isCorrect: true },
      { text: '$(5; 3; 4)$', isCorrect: false },
      { text: '$(6; 4; 5)$', isCorrect: false },
    ],
    explanation:
      'Ta có $\\vec{AB} = (6; 6; 6) = 6(1; 1; 1)$. Điểm $N$ thuộc đường thẳng $AB$ nên $N(2 + t; t; 1 + t)$.<br>Vectơ $\\vec{PN} = (t - 2; t - 5; t + 1)$.<br>Khoảng cách $PN$ ngắn nhất khi $\\vec{PN} \\perp \\vec{AB} \\iff \\vec{PN} \\cdot (1; 1; 1) = 0$:<br>$$(t - 2) + (t - 5) + (t + 1) = 0 \\iff 3t - 6 = 0 \\iff t = 2.$$<br>Thay $t = 2$ vào tọa độ $N$, ta thu được $N(4; 2; 3)$.',
  },
  {
    id: 'mcq12',
    number: 12,
    type: 'mcq',
    skill: 'Tìm tọa độ đỉnh hình chữ nhật và tích vô hướng trực giao trong không gian',
    points: 0.25,
    text: 'Một tấm pin năng lượng mặt trời hình chữ nhật $ABCD$ lắp trên mái nhà có tọa độ các đỉnh $A(2; 1; 3)$, $B(4; 3; 2)$, $C(5; 1; 0)$. Tọa độ đỉnh $D$ của tấm pin và giá trị của tích vô hướng $\\vec{AB} \\cdot \\vec{AD}$ lần lượt bằng',
    options: [
      { text: '$D(3; -1; 1)$ và $\\vec{AB} \\cdot \\vec{AD} = 2$', isCorrect: false },
      { text: '$D(3; -1; 1)$ và $\\vec{AB} \\cdot \\vec{AD} = 0$', isCorrect: true },
      { text: '$D(-1; 3; 1)$ và $\\vec{AB} \\cdot \\vec{AD} = 0$', isCorrect: false },
      { text: '$D(3; -1; 1)$ và $\\vec{AB} \\cdot \\vec{AD} = 4$', isCorrect: false },
    ],
    explanation:
      'Do $ABCD$ là hình chữ nhật nên $\\vec{AD} = \\vec{BC}$.<br>Ta có $\\vec{BC} = (5 - 4; 1 - 3; 0 - 2) = (1; -2; -2)$.<br>Gọi $D(x_D; y_D; z_D)$, ta có $\\vec{AD} = (x_D - 2; y_D - 1; z_D - 3)$. Do đó:<br>$$\\begin{cases} x_D - 2 = 1 \\\\ y_D - 1 = -2 \\\\ z_D - 3 = -2 \\end{cases} \\Rightarrow D(3; -1; 1).$$<br>Mặt khác, $ABCD$ là hình chữ nhật nên $AB \\perp AD \\Rightarrow \\vec{AB} \\cdot \\vec{AD} = 0$.',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 13,
    type: 'tf',
    skill: 'Tọa độ điểm hình hộp, biểu diễn vectơ đơn vị và vectơ lực cùng hướng',
    text: "Một mô hình khung kỹ thuật hình hộp chữ nhật $OABC.O'A'B'C'$ được dựng trong hệ tọa độ $Oxyz$ với các vectơ đơn vị $\\vec{i}, \\vec{j}, \\vec{k}$ nằm trên các cạnh $OA, OC, OO'$. Biết $OA = 6\\text{ m}$, $OC = 8\\text{ m}$, $OO' = 24\\text{ m}$. Một sợi dây cáp gia cố nối từ $O$ đến đỉnh $B'$. Xét tính đúng/sai của các khẳng định sau:",
    items: [
      {
        key: 'a',
        text: "Tọa độ của đỉnh $B'$ trong hệ $Oxyz$ là $(6; 8; 24)$.",
        correct: true,
      },
      {
        key: 'b',
        text: "Vectơ biểu diễn vị trí $\\vec{OB'} = 6\\vec{i} + 8\\vec{j} + 24\\vec{k}$.",
        correct: true,
      },
      {
        key: 'c',
        text: "Độ dài của sợi dây cáp $OB'$ bằng $38\\text{ m}$.",
        correct: false,
      },
      {
        key: 'd',
        text: "Nếu một lực $\\vec{F}$ kéo dọc theo cáp từ $O$ đến $B'$ có độ lớn $520\\text{ N}$ thì tọa độ của lực $\\vec{F}$ là $(120; 160; 480)$.",
        correct: true,
      },
    ],
    explanation:
      "• **a) Đúng.** Đỉnh $B'$ có hoành độ $x = 6$, tung độ $y = 8$, cao độ $z = 24$ nên tọa độ là $(6; 8; 24)$.<br>• **b) Đúng.** Biểu diễn vectơ $\\vec{OB'} = 6\\vec{i} + 8\\vec{j} + 24\\vec{k}$.<br>• **c) Sai.** Độ dài đoạn $OB' = \\sqrt{6^2 + 8^2 + 24^2} = \\sqrt{36 + 64 + 576} = \\sqrt{676} = 26\\text{ m}$ (không phải $38\\text{ m}$).<br>• **d) Đúng.** Vectơ đơn vị cùng hướng với $\\vec{OB'}$ là $\\vec{e} = \\frac{\\vec{OB'}}{26} = \\left(\\frac{6}{26}; \\frac{8}{26}; \\frac{24}{26}\\right)$. Lực $\\vec{F} = 520 \\cdot \\vec{e} = 520 \\cdot \\left(\\frac{6}{26}; \\frac{8}{26}; \\frac{24}{26}\\right) = (120; 160; 480)$.",
  },
  {
    id: 'tf2',
    number: 14,
    type: 'tf',
    skill: 'Vectơ dịch chuyển, quãng đường bay, vectơ vận tốc và trung điểm quỹ đạo',
    text: 'Một thiết bị đo đạc địa hình tự động (Drone) cất cánh từ vị trí $A(2; 1; 0)$ bay theo đường thẳng đến vị trí $B(8; 9; 12)$ trong thời gian $4$ giây (đơn vị tọa độ là mét). Xét tính đúng/sai của các phát biểu sau:',
    items: [
      {
        key: 'a',
        text: 'Vectơ dịch chuyển $\\vec{AB}$ của Drone có tọa độ là $(6; 8; 12)$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Quãng đường Drone đã bay từ $A$ đến $B$ bằng $26\\text{ m}$.',
        correct: false,
      },
      {
        key: 'c',
        text: 'Vận tốc trung bình của Drone trong $4$ giây đó được biểu diễn bởi vectơ $\\vec{v} = (1{,}5; 2; 3)$.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Trạm quan trắc mặt đất $M(5; 5; 6)$ đặt tại trung điểm của đoạn thẳng $AB$.',
        correct: true,
      },
    ],
    explanation:
      '• **a) Đúng.** $\\vec{AB} = (8 - 2; 9 - 1; 12 - 0) = (6; 8; 12)$.<br>• **b) Sai.** Độ dài quãng đường $AB = |\\vec{AB}| = \\sqrt{6^2 + 8^2 + 12^2} = \\sqrt{244} = 2\\sqrt{61}\\text{ m} \\approx 15{,}62\\text{ m}$ (không phải $26\\text{ m}$).<br>• **c) Đúng.** Vectơ vận tốc trung bình $\\vec{v} = \\frac{\\vec{AB}}{\\Delta t} = \\frac{(6; 8; 12)}{4} = (1{,}5; 2; 3)$.<br>• **d) Đúng.** Tọa độ trung điểm $M$ của $AB$ là $\\left(\\frac{2+8}{2}; \\frac{1+9}{2}; \\frac{0+12}{2}\\right) = (5; 5; 6)$.',
  },
  {
    id: 'tf3',
    number: 15,
    type: 'tf',
    skill: 'Tích có hướng, diện tích tam giác và góc giữa hai mặt phẳng trong không gian',
    text: 'Một cấu trúc mái hiên tam giác $ABC$ của công trình kiến trúc có tọa độ các đỉnh trong hệ $Oxyz$ là $A(3; 0; 0)$, $B(0; 4; 0)$, $C(0; 0; 12)$ (đơn vị: mét). Xét tính đúng/sai của các khẳng định sau:',
    items: [
      {
        key: 'a',
        text: 'Tọa độ các vectơ cạnh là $\\vec{AB} = (-3; 4; 0)$ và $\\vec{AC} = (-3; 0; 12)$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Tích có hướng $[\\vec{AB}, \\vec{AC}] = (48; 36; 12)$.',
        correct: true,
      },
      {
        key: 'c',
        text: 'Diện tích của mái hiên tam giác $ABC$ bằng $6\\sqrt{26}\\text{ m}^2$.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Góc $\\theta$ giữa mặt phẳng mái hiên $ABC$ và mặt phẳng sàn $(Oxy)$ thỏa mãn $\\cos\\theta = \\frac{4}{\\sqrt{26}}$.',
        correct: false,
      },
    ],
    explanation:
      '• **a) Đúng.** $\\vec{AB} = (0-3; 4-0; 0-0) = (-3; 4; 0)$ và $\\vec{AC} = (0-3; 0-0; 12-0) = (-3; 0; 12)$.<br>• **b) Đúng.** $[\\vec{AB}, \\vec{AC}] = (4 \\cdot 12 - 0 \\cdot 0; 0 \\cdot (-3) - (-3) \\cdot 12; (-3) \\cdot 0 - 4 \\cdot (-3)) = (48; 36; 12)$.<br>• **c) Đúng.** $S_{ABC} = \\frac{1}{2} |[\\vec{AB}, \\vec{AC}]| = \\frac{1}{2} \\sqrt{48^2 + 36^2 + 12^2} = \\frac{1}{2} \\sqrt{3744} = \\frac{1}{2} \\cdot 12\\sqrt{26} = 6\\sqrt{26}\\text{ m}^2$.<br>• **d) Sai.** Vectơ pháp tuyến của mặt phẳng $ABC$ là $\\vec{n} = (48; 36; 12) = 12(4; 3; 1)$. Vectơ pháp tuyến của mặt sàn $(Oxy)$ là $\\vec{k} = (0; 0; 1)$.<br>$$\\cos\\theta = \\frac{|4 \\cdot 0 + 3 \\cdot 0 + 1 \\cdot 1|}{\\sqrt{4^2 + 3^2 + 1^2} \\cdot 1} = \\frac{1}{\\sqrt{26}} \\neq \\frac{4}{\\sqrt{26}}.$$',
  },
  {
    id: 'tf4',
    number: 16,
    type: 'tf',
    skill: 'Cộng vectơ lực, độ lớn hợp lực, tính trực giao và góc tù giữa hai vectơ',
    text: 'Tại một nút giao thông cầu vượt ba tầng, ba nhánh chịu tải các lực tác dụng được biểu diễn bởi các vectơ $\\vec{F}_1 = (3; -2; 1)$, $\\vec{F}_2 = (1; 4; -3)$, $\\vec{F}_3 = (-4; 1; 4)$ (đơn vị: kN). Xét tính đúng/sai của các phát biểu sau:',
    items: [
      {
        key: 'a',
        text: 'Hợp lực tác dụng lên tâm nút giao là $\\vec{F} = \\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 = (0; 3; 2)\\text{ kN}$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Độ lớn của hợp lực $\\vec{F}$ bằng $\\sqrt{13}\\text{ kN}$.',
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
      '• **a) Đúng.** Hợp lực $\\vec{F} = (3 + 1 - 4; -2 + 4 + 1; 1 - 3 + 4) = (0; 3; 2)\\text{ kN}$.<br>• **b) Đúng.** $|\\vec{F}| = \\sqrt{0^2 + 3^2 + 2^2} = \\sqrt{13}\\text{ kN}$.<br>• **c) Sai.** Ta có $\\vec{F}_1 \\cdot \\vec{F}_2 = 3(1) + (-2)(4) + 1(-3) = -8 \\neq 0$ nên hai lực không vuông góc.<br>• **d) Đúng.** Ta có $\\vec{F}_1 \\cdot \\vec{F}_3 = 3(-4) + (-2)(1) + 1(4) = -10 < 0$. Vì tích vô hướng âm nên góc giữa hai vectơ lực $\\vec{F}_1$ và $\\vec{F}_3$ là góc tù.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 17,
    type: 'shortans',
    skill: 'Xác định độ lớn lực căng dây treo đèn ở trạng thái cân bằng',
    points: 0.5,
    text: 'Một bóng đèn trang trí trung tâm có trọng lượng $90\\text{ N}$ được treo cố định tại điểm $S$ bởi ba sợi dây cáp $SA, SB, SC$. Các điểm treo $A, B, C$ nằm trên trần nhà phẳng sao cho $SA, SB, SC$ tạo với mặt trần các góc bằng nhau $60^\\circ$ và các lực căng dây có độ lớn bằng nhau. Độ lớn lực căng $T$ của mỗi sợi dây cáp bằng bao nhiêu Newton? (Làm tròn kết quả đến hàng phần mười).',
    placeholder: 'Nhập giá trị lực căng (N, VD: 28,4 hoặc 28.4)',
    correctDisplay: '34,6',
    explanation:
      'Góc tạo bởi mỗi sợi dây cáp với phương thẳng đứng là $90^\\circ - 60^\\circ = 30^\\circ$. Tổng thành phần lực nâng thẳng đứng của $3$ sợi dây cân bằng với trọng lượng đèn $P = 90\\text{ N}$:<br>$$3 \\cdot T \\cdot \\cos 30^\\circ = 90 \\iff 3 \\cdot T \\cdot \\frac{\\sqrt{3}}{2} = 90 \\iff T = \\frac{60}{\\sqrt{3}} = 20\\sqrt{3} \\approx 34{,}64\\text{ N} \\approx 34{,}6\\text{ N}.$$',
    validator: (val: string) => {
      const cleaned = val.trim().toLowerCase().replace(/n$/, '').trim().replace(',', '.');
      return cleaned === '34.6';
    },
  },
  {
    id: 'sa2',
    number: 18,
    type: 'shortans',
    skill: 'Tính khoảng cách giữa hai tọa độ máy bay trong không gian Oxyz',
    points: 0.5,
    text: 'Trong không gian $Oxyz$ (đơn vị: km), hệ thống giám sát định vị hai máy bay $A$ và $B$ lần lượt tại tọa độ $A(2; 2; 5)$ và $B(8; 8; 8)$. Khoảng cách giữa hai máy bay tại thời điểm quan sát bằng bao nhiêu kilômét?',
    placeholder: 'Nhập khoảng cách số (km, VD: 15)',
    correctDisplay: '9',
    explanation:
      'Khoảng cách giữa hai máy bay $A$ và $B$ là:<br>$$AB = \\sqrt{(8 - 2)^2 + (8 - 2)^2 + (8 - 5)^2} = \\sqrt{6^2 + 6^2 + 3^2} = \\sqrt{36 + 36 + 9} = \\sqrt{81} = 9\\text{ km}.$$',
    validator: (val: string) => {
      const cleaned = val.trim().toLowerCase().replace(/km$/, '').trim();
      return cleaned === '9';
    },
  },
  {
    id: 'sa3',
    number: 19,
    type: 'shortans',
    skill: 'Tính công cơ học sinh bởi vectơ lực dịch chuyển trong không gian',
    points: 0.5,
    text: 'Một sà-lan chở hàng được kéo bởi lực $\\vec{F} = (12; 15; 8)$ (đơn vị: kN) dịch chuyển một đoạn thẳng từ vị trí $M(2; 1; 1)$ đến vị trí $N(6; 7; 3)$ (đơn vị: km). Công $A$ sinh bởi lực $\\vec{F}$ trên quãng đường $MN$ bằng bao nhiêu Megajun (MJ)? (Biết $1\\text{ kN} \\times 1\\text{ km} = 1\\text{ MJ}$).',
    placeholder: 'Nhập giá trị công sinh ra (MJ, VD: 120)',
    correctDisplay: '154',
    explanation:
      'Vectơ độ dịch chuyển $\\vec{MN} = (6 - 2; 7 - 1; 3 - 1) = (4; 6; 2)$. Công sinh bởi lực $\\vec{F}$ là tích vô hướng của lực và vectơ độ dịch chuyển:<br>$$A = \\vec{F} \\cdot \\vec{MN} = 12 \\cdot 4 + 15 \\cdot 6 + 8 \\cdot 2 = 48 + 90 + 16 = 154\\text{ MJ}.$$',
    validator: (val: string) => {
      const cleaned = val.trim().toLowerCase().replace(/mj$/, '').trim();
      return cleaned === '154';
    },
  },
  {
    id: 'sa4',
    number: 20,
    type: 'shortans',
    skill: 'Tính tọa độ trọng tâm tam giác và khoảng cách đến mặt sàn Oxy',
    points: 0.5,
    text: "Một hệ thống nhà kho thông minh hình hộp chữ nhật $OABC.DKEF$ đặt trong hệ $Oxyz$ với $O(0;0;0)$, $A(9;0;0)$, $C(0;12;0)$, $D(0;0;5)$ (đơn vị: mét). Cảm biến trung tâm đặt tại trọng tâm $G$ của tam giác $A'BC$ (với $A'$ là đỉnh ngay trên $A$, tức $A'(9;0;5)$). Khoảng cách từ cảm biến $G$ đến mặt sàn $Oxy$ bằng bao nhiêu mét? (Viết kết quả dưới dạng phân số tối giản $a/b$).",
    placeholder: 'Nhập kết quả dạng phân số tối giản (VD: 7/4)',
    correctDisplay: '5/3',
    explanation:
      "Tọa độ các đỉnh: $A'(9; 0; 5)$, $B(9; 12; 0)$, $C(0; 12; 0)$. Trọng tâm $G$ của tam giác $A'BC$ có cao độ:<br>$$z_G = \\frac{z_{A'} + z_B + z_C}{3} = \\frac{5 + 0 + 0}{3} = \\frac{5}{3}\\text{ m}.$$<br>Khoảng cách từ $G$ đến mặt sàn $Oxy$ chính bằng $z_G = \\frac{5}{3}\\text{ m}$.",
    validator: (val: string) => {
      const cleaned = val.trim().toLowerCase().replace(/m$/, '').trim();
      return cleaned === '5/3';
    },
  },
  {
    id: 'sa5',
    number: 21,
    type: 'shortans',
    skill: 'Cực trị tổng bình phương khoảng cách và hình chiếu lên mặt phẳng tọa độ',
    points: 0.5,
    text: 'Ba điểm dân cư được định vị trong hệ $Oxyz$ tại $A(2; 1; 2)$, $B(4; 5; 4)$, $C(6; 0; 6)$ (đơn vị: km). Một trạm tiếp sóng $M$ đặt trên mặt phẳng $(Oxy)$ (tức $z_M = 0$) sao cho tổng bình phương khoảng cách $MA^2 + MB^2 + MC^2$ đạt giá trị nhỏ nhất. Giá trị của tổng $x_M + y_M$ bằng bao nhiêu?',
    placeholder: 'Nhập giá trị tổng số (VD: 11)',
    correctDisplay: '6',
    explanation:
      'Gọi $G$ là trọng tâm của tam giác $ABC$:<br>$$x_G = \\frac{2 + 4 + 6}{3} = 4, \\quad y_G = \\frac{1 + 5 + 0}{3} = 2, \\quad z_G = \\frac{2 + 4 + 6}{3} = 4 \\Rightarrow G(4; 2; 4).$$<br>Ta có đẳng thức vectơ: $MA^2 + MB^2 + MC^2 = 3MG^2 + GA^2 + GB^2 + GC^2$.<br>Do $GA^2 + GB^2 + GC^2$ không đổi nên $MA^2 + MB^2 + MC^2$ nhỏ nhất khi $MG$ nhỏ nhất.<br>Vì $M \\in (Oxy)$ nên $M$ là hình chiếu vuông góc của $G$ lên $(Oxy) \\Rightarrow M(4; 2; 0)$.<br>Do đó $x_M + y_M = 4 + 2 = 6$.',
    validator: (val: string) => val.trim() === '6',
  },
  {
    id: 'sa6',
    number: 22,
    type: 'shortans',
    skill: 'Tính góc giữa hai vectơ dòng chảy ngầm trong không gian',
    points: 0.5,
    text: 'Một cống thoát nước ngầm có hướng dòng chảy biểu diễn bởi vectơ $\\vec{u} = (1; \\sqrt{2}; 1)$. Một ống xả nước phụ chuẩn bị lắp đấu nối có hướng biểu diễn bởi vectơ $\\vec{v} = (0; 1; 0)$. Góc giữa hướng dòng chảy của cống ngầm và ống xả phụ bằng bao nhiêu độ?',
    placeholder: 'Nhập số đo góc theo độ (VD: 30)',
    correctDisplay: '45',
    explanation:
      'Ta có $\\vec{u} \\cdot \\vec{v} = 1 \\cdot 0 + \\sqrt{2} \\cdot 1 + 1 \\cdot 0 = \\sqrt{2}$.<br>$|\\vec{u}| = \\sqrt{1^2 + (\\sqrt{2})^2 + 1^2} = \\sqrt{4} = 2$.<br>$|\\vec{v}| = \\sqrt{0^2 + 1^2 + 0^2} = 1$.<br>$$\\cos(\\vec{u}, \\vec{v}) = \\frac{\\vec{u} \\cdot \\vec{v}}{|\\vec{u}| \\cdot |\\vec{v}|} = \\frac{\\sqrt{2}}{2 \\cdot 1} = \\frac{\\sqrt{2}}{2} \\Rightarrow (\\vec{u}, \\vec{v}) = 45^\\circ.$$',
    validator: (val: string) => {
      const cleaned = val.trim().toLowerCase().replace(/độ|°|deg$/, '').trim();
      return cleaned === '45';
    },
  },
];

export default function Toan12VectoToaDoKhongGianDeBPage() {
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
    const ma = maHocSinh.trim() || 'HS12-VT-B01';
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
              12
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
                Phần I: Trắc nghiệm 4 lựa chọn (Câu 1 - 12)
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
            TOÁN 12 • VECTƠ VÀ HỆ TRỤC TỌA ĐỘ TRONG KHÔNG GIAN
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
                placeholder="VD: HS12-VT-B001"
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
                placeholder="VD: 12A1"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS12-VT-B01'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '12'}</span>
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
        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (4 BÀI - 4,0 ĐIỂM)          */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-emerald-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (4 BÀI - 4,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-emerald-800/80 px-3 py-1 rounded-full text-emerald-200 font-medium">
              Tối đa 1,0 điểm / bài • 1 ý: 0.1đ | 2 ý: 0.25đ | 3 ý: 0.5đ | 4 ý: 1.0đ
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
        {/* PHẦN III: TRẢ LỜI NGẮN (6 CÂU - 3,0 ĐIỂM)                 */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẢ LỜI NGẮN (6 CÂU - 3,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              0,5 điểm / câu • Nhập giá trị số chính xác
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
