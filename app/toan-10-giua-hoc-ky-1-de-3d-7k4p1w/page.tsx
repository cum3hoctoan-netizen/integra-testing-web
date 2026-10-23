'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN ĐỀ THI ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA GIỮA HỌC KỲ I - TOÁN 10 (ĐỀ 3D)';
const EXAM_SUBTITLE = 'CHƯƠNG TRÌNH GDPT 2018 -- THỜI GIAN LÀM BÀI: 45 PHÚT';
const EXAM_TIME_NOTE =
  'Thời gian làm bài: 45 phút • Đề thi gồm 10 câu trắc nghiệm ABCD (5,0đ), 02 câu Đúng/Sai (2,0đ) và 03 câu trả lời ngắn (3,0đ)';

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

// Thang điểm Bộ GD&ĐT 2025 cho phần Đúng/Sai (tối đa 1.0 điểm/câu, tổng 2.0 điểm)
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
    skill: 'Mệnh đề phủ định chứa lượng từ với mọi và bất đẳng thức',
    points: 0.5,
    text: 'Một trạm kiểm soát không lưu theo dõi cao độ an toàn $h(t)$ (mét) của các chuyến bay thương mại qua không phận theo thời gian $t \\in [0; 60]$ (phút). Xét mệnh đề an toàn bay: $P\\colon ``\\forall t \\in [0; 60], |h(t) - 10\\,000| \\le 500\'\'$. Mệnh đề phủ định $\\overline{P}$ của mệnh đề $P$ là:',
    options: [
      { text: '$\\exists t \\in [0; 60], |h(t) - 10\\,000| < 500$', isCorrect: false },
      { text: '$\\forall t \\in [0; 60], |h(t) - 10\\,000| > 500$', isCorrect: false },
      { text: '$\\exists t \\in [0; 60], |h(t) - 10\\,000| > 500$', isCorrect: true },
      { text: '$\\exists t \\in [0; 60], |h(t) - 10\\,000| \\ge 500$', isCorrect: false },
    ],
    explanation:
      'Phủ định của mệnh đề chứa lượng từ $``\\forall t \\in X, P(t)\'\'$ là $``\\exists t \\in X, \\overline{P(t)}\'\'$.<br>Phủ định của bất đẳng thức dạng $\\le a$ là $> a$.<br>Do đó, $\\overline{P}\\colon ``\\exists t \\in [0; 60], |h(t) - 10\\,000| > 500\'\'$.',
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Tìm số phần tử của tập hợp các số nguyên nghiệm của phương trình tích',
    points: 0.5,
    text: 'Một thuật toán mã hóa khóa công khai sử dụng tập hợp các chỉ số nguyên $K = \\{x \\in \\mathbb{Z} \\mid (2x^2 - 5x + 2)(x^3 - 4x) = 0\\}$. Số phần tử của tập hợp $K$ là:',
    options: [
      { text: '$5$', isCorrect: false },
      { text: '$4$', isCorrect: false },
      { text: '$3$', isCorrect: true },
      { text: '$2$', isCorrect: false },
    ],
    explanation:
      'Giải phương trình tích trên tập số thực $\\mathbb{R}$:$$\\left[\\begin{array}{l} 2x^2 - 5x + 2 = 0 \\\\ x(x^2 - 4) = 0 \\end{array}\\right. \\iff \\left[\\begin{array}{l} x = 2 \\\\ x = \\dfrac{1}{2} \\\\ x = 0 \\\\ x = 2 \\\\ x = -2. \\end{array}\\right.$$Tập các nghiệm thực là $S = \\left\\{-2; 0; \\dfrac{1}{2}; 2\\right\\}$.<br>Do điều kiện $x \\in \\mathbb{Z}$, ta loại nghiệm phân số $x = \\dfrac{1}{2}$ và gộp nghiệm trùng $x = 2$.<br>Suy ra tập hợp $K = \\{-2; 0; 2\\}$, có đúng $3$ phần tử.',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Quy đồng rút gọn và xác định điểm thuộc miền nghiệm bất phương trình bậc nhất hai ẩn',
    points: 0.5,
    text: 'Một robot công nghiệp di chuyển trên mặt sàn tọa độ $Oxy$ với vùng cảnh báo va chạm được giới hạn bởi bất phương trình bậc nhất hai ẩn $\\dfrac{x - 2y + 1}{3} - \\dfrac{2x + y - 4}{2} > 1$. Cặp tọa độ nào sau đây nằm trong vùng cảnh báo va chạm của robot?',
    options: [
      { text: '$(1; 1)$', isCorrect: false },
      { text: '$(2; 0)$', isCorrect: false },
      { text: '$(-1; 1)$', isCorrect: true },
      { text: '$(0; 2)$', isCorrect: false },
    ],
    explanation:
      'Quy đồng và rút gọn bất phương trình:$$\\dfrac{2(x - 2y + 1) - 3(2x + y - 4)}{6} > 1 \\iff 2x - 4y + 2 - 6x - 3y + 12 > 6$$$$\\iff -4x - 7y + 14 > 6 \\iff -4x - 7y + 8 > 0 \\iff 4x + 7y - 8 < 0.$$Kiểm tra từng cặp tọa độ:<br>• Với $(1; 1)$: $4(1) + 7(1) - 8 = 3 \\nless 0$ (loại).<br>• Với $(2; 0)$: $4(2) + 7(0) - 8 = 0 \\nless 0$ (loại).<br>• Với $(-1; 1)$: $4(-1) + 7(1) - 8 = -5 < 0$ (thỏa mãn).<br>• Với $(0; 2)$: $4(0) + 7(2) - 8 = 6 \\nless 0$ (loại).',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Xác định nửa mặt phẳng bờ đường thẳng chứa gốc tọa độ',
    points: 0.5,
    text: 'Trên mặt phẳng tọa độ $Oxy$, hệ thống cảm biến quang học kiểm soát một hành lang di chuyển được mô tả bởi bất phương trình $(m^2 + 1)x - 2y + 4 \\ge 0$. Biết rằng điểm hiệu chuẩn $M(1; 3)$ luôn thuộc hành lang an toàn với mọi giá trị của tham số $m$. Miền nghiệm của bất phương trình trên khi $m = 1$ là nửa mặt phẳng:',
    options: [
      { text: 'Không chứa gốc tọa độ $O(0; 0)$ và tính cả bờ', isCorrect: false },
      {
        text: 'Chứa gốc tọa độ $O(0; 0)$ và tính cả bờ',
        isCorrect: true,
      },
      { text: 'Chứa điểm $A(-3; 0)$ và không tính bờ', isCorrect: false },
      { text: 'Không chứa điểm $B(0; 2)$ và tính cả bờ', isCorrect: false },
    ],
    explanation:
      'Khi $m = 1$, bất phương trình trở thành:$$(1^2 + 1)x - 2y + 4 \\ge 0 \\iff 2x - 2y + 4 \\ge 0 \\iff x - y + 2 \\ge 0.$$Thay tọa độ gốc $O(0; 0)$ vào vế trái: $0 - 0 + 2 = 2 \\ge 0$ (mệnh đề đúng).<br>Do đó, miền nghiệm là nửa mặt phẳng có bờ là đường thẳng $x - y + 2 = 0$ và chứa gốc tọa độ $O(0; 0)$.',
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Khai triển hằng đẳng thức rút gọn và nhận diện hệ bất phương trình bậc nhất hai ẩn',
    points: 0.5,
    text: 'Trong các hệ điều kiện kỹ thuật dưới đây, hệ nào sau đây thực chất là một hệ bất phương trình bậc nhất hai ẩn đối với hai biến kiểm soát $x$ và $y$?',
    options: [
      { text: '$\\begin{cases} x^2 + y \\le 4 \\\\ 2x - 3y > 1 \\end{cases}$', isCorrect: false },
      {
        text: '$\\begin{cases} (x + 1)^2 - x^2 + 3y \\le 5 \\\\ 2x - y + 7 > 0 \\end{cases}$',
        isCorrect: true,
      },
      { text: '$\\begin{cases} 3x - \\dfrac{2}{y} \\ge 1 \\\\ x + 4y \\le 6 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} 2x + xy \\le 3 \\\\ x - 5y > 0 \\end{cases}$', isCorrect: false },
    ],
    explanation:
      'Xét hệ $\\begin{cases} (x + 1)^2 - x^2 + 3y \\le 5 \\\\ 2x - y + 7 > 0 \\end{cases}$:<br>Khai triển bất phương trình thứ nhất:$$(x^2 + 2x + 1) - x^2 + 3y \\le 5 \\iff 2x + 3y + 1 \\le 5 \\iff 2x + 3y \\le 4.$$Hệ được rút gọn thành: $\\begin{cases} 2x + 3y \\le 4 \\\\ 2x - y + 7 > 0 \\end{cases}$, đây chính là hệ bất phương trình bậc nhất hai ẩn.<br>Các phương án còn lại đều chứa biến bậc hai không triệt tiêu, chứa ẩn ở mẫu thức hoặc chứa tích hai ẩn $xy$.',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Xác định các đỉnh và tính diện tích tam giác miền nghiệm hệ bất phương trình',
    points: 0.5,
    text: 'Một khu vực kiểm soát bay tầm thấp của thiết bị bay không người lái được giới hạn bởi hệ bất phương trình $\\begin{cases} x + y \\ge 2 \\\\ x - y \\le 2 \\\\ x \\le 4 \\end{cases}$ trên mặt phẳng tọa độ $Oxy$ (đơn vị trên các trục là kilômét). Diện tích của khu vực kiểm soát bay này bằng:',
    options: [
      { text: '$8\\text{ km}^2$', isCorrect: false },
      { text: '$4\\text{ km}^2$', isCorrect: true },
      { text: '$6\\text{ km}^2$', isCorrect: false },
      { text: '$2\\text{ km}^2$', isCorrect: false },
    ],
    explanation:
      'Xác định các giao điểm của các đường biên:<br>• Giao điểm của $d_1\\colon x + y = 2$ và $d_2\\colon x - y = 2$ là điểm $A(2; 0)$.<br>• Giao điểm của $d_1\\colon x + y = 2$ và $d_3\\colon x = 4$ là điểm $B(4; -2)$.<br>• Giao điểm của $d_2\\colon x - y = 2$ và $d_3\\colon x = 4$ là điểm $C(4; 2)$.<br>Miền nghiệm là tam giác $ABC$.<br>Đoạn $BC$ nằm trên đường thẳng thẳng đứng $x = 4$, có độ dài: $$BC = |y_C - y_B| = |2 - (-2)| = 4\\text{ km}.$$Đỉnh $A(2; 0)$ có khoảng cách đến đường thẳng $x = 4$ là đường cao $h = |4 - 2| = 2\\text{ km}$.<br>Diện tích của miền kiểm soát bay là: $$S = \\dfrac{1}{2} \\cdot BC \\cdot h = \\dfrac{1}{2} \\cdot 4 \\cdot 2 = 4\\text{ km}^2.$$',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Rút gọn biểu thức lượng giác của hai góc bù nhau và đánh giá dấu',
    points: 0.5,
    text: 'Cho góc tù $\\alpha$ thỏa mãn $90^\\circ < \\alpha < 180^\\circ$. Rút gọn biểu thức lượng giác $M = \\sin(180^\\circ - \\alpha) \\cdot \\cos(180^\\circ - \\alpha) + \\tan(180^\\circ - \\alpha) \\cdot \\cot \\alpha$. Khẳng định nào sau đây là khẳng định đúng?',
    options: [
      { text: '$M = \\sin \\alpha \\cos \\alpha + 1$', isCorrect: false },
      { text: '$M = -\\sin \\alpha \\cos \\alpha - 1$ và $M > -1$', isCorrect: true },
      { text: '$M = -\\sin \\alpha \\cos \\alpha + 1$', isCorrect: false },
      { text: '$M = -\\sin \\alpha \\cos \\alpha - 1$ và $M < -1$', isCorrect: false },
    ],
    explanation:
      'Sử dụng công thức giá trị lượng giác của hai góc bù nhau:$$\\sin(180^\\circ - \\alpha) = \\sin \\alpha; \\quad \\cos(180^\\circ - \\alpha) = -\\cos \\alpha; \\quad \\tan(180^\\circ - \\alpha) = -\\tan \\alpha.$$Thay vào biểu thức $M$:$$M = (\\sin \\alpha)(-\\cos \\alpha) + (-\\tan \\alpha)(\\cot \\alpha) = -\\sin \\alpha \\cos \\alpha - \\tan \\alpha \\cdot \\dfrac{1}{\\tan \\alpha} = -\\sin \\alpha \\cos \\alpha - 1.$$Vì $90^\\circ < \\alpha < 180^\\circ$ nên $\\sin \\alpha > 0$ và $\\cos \\alpha < 0 \\implies -\\sin \\alpha \\cos \\alpha > 0$.<br>Do đó $M = -\\sin \\alpha \\cos \\alpha - 1 > -1$.',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Định lý sin tính bán kính đường tròn ngoại tiếp tam giác',
    points: 0.5,
    text: 'Một trạm thu phát tín hiệu đặt tại $A$ kết nối với hai vệ tinh viễn thông $B$ và $C$. Qua đo đạc góc nội suy, các kỹ sư xác định tam giác $ABC$ có cạnh $BC = 6\\sqrt{2}\\text{ km}$, góc $\\widehat{B} = 75^\\circ$ và góc $\\widehat{C} = 45^\\circ$. Bán kính đường tròn ngoại tiếp $R$ của mạng lưới tam giác tín hiệu $ABC$ bằng:',
    options: [
      { text: '$6\\text{ km}$', isCorrect: false },
      { text: '$2\\sqrt{6}\\text{ km}$', isCorrect: true },
      { text: '$4\\sqrt{3}\\text{ km}$', isCorrect: false },
      { text: '$6\\sqrt{2}\\text{ km}$', isCorrect: false },
    ],
    explanation:
      'Tổng ba góc trong tam giác $ABC$:$$\\widehat{A} = 180^\\circ - (\\widehat{B} + \\widehat{C}) = 180^\\circ - (75^\\circ + 45^\\circ) = 60^\\circ.$$Áp dụng định lí sin trong tam giác $ABC$:$$\\dfrac{BC}{\\sin A} = 2R \\implies 2R = \\dfrac{6\\sqrt{2}}{\\sin 60^\\circ} = \\dfrac{6\\sqrt{2}}{\\frac{\\sqrt{3}}{2}} = \\dfrac{12\\sqrt{2}}{\\sqrt{3}} = 4\\sqrt{6}\\text{ km}.$$Suy ra bán kính đường tròn ngoại tiếp: $$R = 2\\sqrt{6}\\text{ km}.$$',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Đếm số vectơ cùng hướng trong hình lục giác đều',
    points: 0.5,
    text: 'Một khung kết cấu giàn không gian có dạng lục giác đều $ABCDEF$ tâm $O$. Có bao nhiêu vectơ khác vectơ-không, cùng hướng với vectơ $\\vec{AB}$ và có điểm đầu, điểm cuối được chọn từ tập hợp gồm 7 điểm $\\{A, B, C, D, E, F, O\\}$ (không tính chính vectơ $\\vec{AB}$)?',
    options: [
      { text: '$2$', isCorrect: false },
      { text: '$3$', isCorrect: true },
      { text: '$4$', isCorrect: false },
      { text: '$5$', isCorrect: false },
    ],
    explanation:
      'Trong lục giác đều $ABCDEF$ tâm $O$:<br>• Cạnh đối $ED \\parallel AB$ và có chiều từ $E$ đến $D$ cùng hướng với $\\vec{AB}$, cho vectơ $\\vec{ED}$.<br>• Đường chéo chính $FC \\parallel AB$ và $O$ là trung điểm của $FC$, chiều từ $F$ sang $C$ cùng hướng với $\\vec{AB}$, cho các vectơ $\\vec{FO}, \\vec{OC}, \\vec{FC}$. Trong đó các vectơ có độ dài bằng cạnh lục giác đều là $\\vec{FO}, \\vec{OC}$.<br>Như vậy có đúng $3$ vectơ cùng hướng và có độ dài bằng $AB$ (khác $\\vec{AB}$) là $\\vec{ED}, \\vec{FO}, \\vec{OC}$.',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Biểu diễn vectơ trung điểm đoạn thẳng nối trung điểm hai cạnh đối của tứ giác',
    points: 0.5,
    text: 'Cho tứ giác lồi $ABCD$ mô tả kết cấu khung treo tải tĩnh. Gọi $M, N$ lần lượt là trung điểm của hai cạnh đối diện $AD$ và $BC$. Đẳng thức vectơ nào sau đây mô tả đúng mối quan hệ cân bằng hợp lực chuyển vị của hệ?',
    options: [
      { text: '$\\vec{AB} + \\vec{DC} = \\vec{MN}$', isCorrect: false },
      { text: '$\\vec{AB} + \\vec{DC} = 2\\vec{MN}$', isCorrect: true },
      { text: '$\\vec{AC} + \\vec{BD} = \\vec{MN}$', isCorrect: false },
      { text: '$\\vec{AB} - \\vec{DC} = 2\\vec{MN}$', isCorrect: false },
    ],
    explanation:
      'Phân tích vectơ theo quy tắc ba điểm:$$\\vec{AB} = \\vec{AM} + \\vec{MN} + \\vec{NB}$$$$\\vec{DC} = \\vec{DM} + \\vec{MN} + \\vec{NC}$$Cộng hai đẳng thức vế theo vế:$$\\vec{AB} + \\vec{DC} = (\\vec{AM} + \\vec{DM}) + 2\\vec{MN} + (\\vec{NB} + \\vec{NC}).$$Vì $M$ là trung điểm của $AD$ nên $\\vec{AM} + \\vec{DM} = \\vec{0}$.<br>Vì $N$ là trung điểm của $BC$ nên $\\vec{NB} + \\vec{NC} = \\vec{0}$.<br>Suy ra: $\\vec{AB} + \\vec{DC} = 2\\vec{MN}$.',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 11,
    type: 'tf',
    skill: 'Quy hoạch tuyến tính: tối ưu hóa lợi nhuận sản xuất chế phẩm sinh học',
    text: 'Một nhà máy công nghệ sinh học sản xuất hai loại chế phẩm vi sinh nông nghiệp: Chế phẩm Bio-P (loại 1) và Chế phẩm Bio-K (loại 2). Mỗi tấn Bio-P cần 2 tấn sinh khối rơm rạ, 1 tấn phụ gia enzyme và 4 giờ vận hành nồi lên men. Mỗi tấn Bio-K cần 1 tấn sinh khối rơm rạ, 2 tấn phụ gia enzyme và 2 giờ vận hành nồi lên men. Nguồn dự trữ nguyên liệu và công suất máy tối đa trong một tuần là: 80 tấn sinh khối rơm rạ, 70 tấn phụ gia enzyme và 160 giờ vận hành nồi lên men. Để đảm bảo hợp đồng cung ứng định kỳ, nhà máy bắt buộc phải sản xuất tối thiểu 10 tấn Bio-P và tối thiểu 15 tấn Bio-K mỗi tuần. Mỗi tấn Bio-P đem lại lợi nhuận 5 triệu đồng, mỗi tấn Bio-K đem lại lợi nhuận 4 triệu đồng. Gọi $x, y$ lần lượt là sản lượng Bio-P và Bio-K (đơn vị: tấn) được sản xuất trong tuần.',
    items: [
      {
        key: 'a',
        text: 'Hệ bất phương trình mô tả các điều kiện ràng buộc kỹ thuật và hợp đồng là $\\begin{cases} 2x + y \\le 80 \\\\ x + 2y \\le 70 \\\\ x \\ge 10, y \\ge 15 \\end{cases}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Phương án sản xuất 20 tấn Bio-P và 25 tấn Bio-K là một phương án khả thi',
        correct: true,
      },
      {
        key: 'c',
        text: 'Nếu nhà máy chỉ tập trung sản xuất lượng Bio-K tối đa trong điều kiện cho phép thì sản lượng Bio-K có thể đạt được là 35 tấn',
        correct: false,
      },
      {
        key: 'd',
        text: 'Lợi nhuận lớn nhất mà nhà máy có thể đạt được trong một tuần là $230$ triệu đồng khi sản xuất 30 tấn Bio-P và 20 tấn Bio-K',
        correct: true,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Ràng buộc sinh khối: $2x + y \\le 80$. Ràng buộc phụ gia enzyme: $x + 2y \\le 70$. Ràng buộc nồi lên men: $4x + 2y \\le 160 \\iff 2x + y \\le 80$ (trùng ràng buộc sinh khối). Ràng buộc hợp đồng: $x \\ge 10, y \\ge 15$.<br>• <strong>b) Đúng.</strong> Thay $(x; y) = (20; 25)$ vào hệ: $$2(20) + 25 = 65 \\le 80; \\quad 20 + 2(25) = 70 \\le 70; \\quad 20 \\ge 10; \\quad 25 \\ge 15.$$ Điểm $(20; 25)$ thỏa mãn tất cả các ràng buộc.<br>• <strong>c) Sai.</strong> Khi tối đa hóa sản lượng Bio-K ($y$), ta xét với điều kiện $x \\ge 10$: $$x + 2y \\le 70 \\implies 2y \\le 70 - x \\le 70 - 10 = 60 \\implies y \\le 30.$$ Do đó sản lượng Bio-K tối đa chỉ đạt 30 tấn, không thể đạt 35 tấn.<br>• <strong>d) Đúng.</strong> Miền nghiệm là tứ giác lồi tạo bởi các đỉnh giao điểm:<br>- $A(10; 15) \\implies L = 5(10) + 4(15) = 110\\text{ triệu đồng}$.<br>- $B(32{,}5; 15) \\implies L = 5(32{,}5) + 4(15) = 222{,}5\\text{ triệu đồng}$.<br>- $C(30; 20) \\implies L = 5(30) + 4(20) = 230\\text{ triệu đồng}$.<br>- $D(10; 30) \\implies L = 5(10) + 4(30) = 170\\text{ triệu đồng}$.<br>Vậy lợi nhuận lớn nhất là $230\\text{ triệu đồng}$ khi $x = 30$ và $y = 20$.',
  },
  {
    id: 'tf2',
    number: 12,
    type: 'tf',
    skill: 'Ứng dụng giải tam giác xác định khoảng cách từ hải đăng đến bãi san hô ngầm',
    text: 'Một trạm hải đăng $H$ đặt trên hòn đảo biệt lập ven biển. Để xác định khoảng cách ngập nước từ trạm hải đăng $H$ đến một bãi san hô ngầm nguy hiểm tại vị trí $S$, hai trạm quan sát bờ biển $A$ và $B$ cách nhau $1200\\text{ m}$ được thiết lập sao cho ba điểm $A, B, S$ thẳng hàng ($S$ nằm ngoài đoạn $AB$ về phía $B$). Từ $A$ và $B$, người ta tiến hành ngắm hải đăng $H$ và đo được các góc phương vị $\\widehat{HAB} = 45^\\circ$ và $\\widehat{HBA} = 105^\\circ$. Đồng thời từ trạm $B$, góc quan sát giữa hải đăng $H$ và bãi san hô ngầm $S$ là $\\widehat{HBS} = 75^\\circ$. Biết khoảng cách đo đạc dọc bờ biển từ $B$ đến rạn san hô $S$ là $BS = 800\\text{ m}$.',
    items: [
      {
        key: 'a',
        text: 'Khoảng cách từ trạm quan sát $B$ đến ngọn hải đăng $H$ là $1200\\sqrt{2}\\text{ m}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Số đo góc $\\widehat{AHB}$ bằng $30^\\circ$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Khoảng cách từ trạm quan sát $A$ đến ngọn hải đăng $H$ ngắn hơn khoảng cách từ trạm $B$ đến ngọn hải đăng $H$',
        correct: false,
      },
      {
        key: 'd',
        text: 'Khoảng cách đường thẳng từ ngọn hải đăng $H$ đến bãi san hô ngầm $S$ xấp xỉ bằng $1678\\text{ m}$',
        correct: true,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Xét tam giác $ABH$: $\\widehat{AHB} = 180^\\circ - (45^\\circ + 105^\\circ) = 30^\\circ$. Áp dụng định lí sin: $$BH = \\dfrac{AB \\cdot \\sin \\widehat{HAB}}{\\sin \\widehat{AHB}} = \\dfrac{1200 \\cdot \\sin 45^\\circ}{\\sin 30^\\circ} = \\dfrac{1200 \\cdot \\frac{\\sqrt{2}}{2}}{0{,}5} = 1200\\sqrt{2}\\text{ m}.$$<br>• <strong>b) Đúng.</strong> Số đo góc $\\widehat{AHB} = 180^\\circ - (45^\\circ + 105^\\circ) = 30^\\circ$.<br>• <strong>c) Sai.</strong> Trong tam giác $ABH$, vì $\\widehat{HBA} = 105^\\circ > \\widehat{HAB} = 45^\\circ$ nên cạnh đối diện góc lớn hơn phải dài hơn: $AH > BH$. Khoảng cách từ $A$ đến $H$ dài hơn từ $B$ đến $H$.<br>• <strong>d) Đúng.</strong> Xét tam giác $HBS$ có $BH = 1200\\sqrt{2}\\text{ m}$, $BS = 800\\text{ m}$ và $\\widehat{HBS} = 75^\\circ$. Áp dụng định lí côsin: $$HS^2 = BH^2 + BS^2 - 2 \\cdot BH \\cdot BS \\cdot \\cos 75^\\circ = (1200\\sqrt{2})^2 + 800^2 - 2(1200\\sqrt{2})(800)\\cos 75^\\circ \\approx 2\\,817\\,231 \\implies HS \\approx 1678\\text{ m}.$$',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 13,
    type: 'shortans',
    skill: 'Nguyên lý bao hàm và loại trừ cho ba tập hợp trong khảo sát nhân sự',
    points: 1.0,
    text: 'Để đánh giá chất lượng nhân sự chuyển đổi số trong giáo dục, Integra Academy tiến hành sát hạch 120 giáo viên cốt cán về ba kỹ năng: Lập trình Python ($P$), Biên soạn dữ liệu LaTeX ($L$) và Tự động hóa luồng API/n8n ($A$). Kết quả khảo sát ghi nhận:<br>• Có 65 giáo viên thành thạo kỹ năng $P$.<br>• Có 55 giáo viên thành thạo kỹ năng $L$.<br>• Có 50 giáo viên thành thạo kỹ năng $A$.<br>• Có 30 giáo viên thành thạo đồng thời cả hai kỹ năng $P$ và $L$.<br>• Có 25 giáo viên thành thạo đồng thời cả hai kỹ năng $L$ và $A$.<br>• Có 20 giáo viên thành thạo đồng thời cả hai kỹ năng $P$ và $A$.<br>• Có 15 giáo viên không thành thạo bất kỳ kỹ năng nào trong ba kỹ năng trên.<br>Hỏi có bao nhiêu giáo viên thành thạo đồng thời cả ba kỹ năng $P, L$ và $A$?',
    placeholder: 'Nhập số lượng giáo viên (VD: 25)',
    correctDisplay: '10 (giáo viên)',
    explanation:
      'Số giáo viên thành thạo ít nhất một trong ba kỹ năng là: $$n(P \\cup L \\cup A) = 120 - 15 = 105.$$ Áp dụng công thức bao hàm - loại trừ: $$n(P \\cup L \\cup A) = n(P) + n(L) + n(A) - [n(P \\cap L) + n(L \\cap A) + n(P \\cap A)] + n(P \\cap L \\cap A)$$ $$\\implies 105 = 65 + 55 + 50 - (30 + 25 + 20) + n(P \\cap L \\cap A)$$ $$\\implies 105 = 170 - 75 + n(P \\cap L \\cap A) = 95 + n(P \\cap L \\cap A) \\implies n(P \\cap L \\cap A) = 105 - 95 = 10.$$ Vậy có đúng 10 giáo viên thành thạo đồng thời cả ba kỹ năng.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/giáo viên|người/gi, '').trim();
      return c === '10';
    },
  },
  {
    id: 'sa2',
    number: 14,
    type: 'shortans',
    skill: 'Độ dài đường phân giác trong tam giác và làm tròn số',
    points: 1.0,
    text: 'Một cụm ăng-ten vô tuyến điều hướng đặt tại đỉnh $A$ của một khu căn cứ hình tam giác $ABC$ có kích thước hai cạnh viền ranh giới là $AB = 60\\text{ m}$, $AC = 90\\text{ m}$ và góc mở chùm sóng $\\widehat{BAC} = 60^\\circ$. Để tối ưu hóa công suất phủ sóng, các kỹ sư lắp đặt tuyến cáp trục quang ngầm theo đường phân giác trong $AD$ của góc $A$ ($D$ thuộc cạnh đối diện $BC$). Độ dài đường phân giác $AD$ của tuyến cáp quang bằng bao nhiêu mét? (Làm tròn kết quả đến hàng phần mười).',
    placeholder: 'Nhập độ dài số (mét, VD: 48.5)',
    correctDisplay: '62,4 (mét)',
    explanation:
      'Áp dụng công thức tính độ dài đường phân giác trong góc $A$ của tam giác $ABC$: $$l_a = AD = \\dfrac{2bc \\cos\\left(\\dfrac{A}{2}\\right)}{b + c}$$ Với $b = AC = 90\\text{ m}$, $c = AB = 60\\text{ m}$ và $\\widehat{A} = 60^\\circ \\implies \\dfrac{\\widehat{A}}{2} = 30^\\circ$: $$AD = \\dfrac{2 \\cdot 90 \\cdot 60 \\cdot \\cos 30^\\circ}{90 + 60} = \\dfrac{10\\,800 \\cdot \\dfrac{\\sqrt{3}}{2}}{150} = \\dfrac{5400\\sqrt{3}}{150} = 36\\sqrt{3}\\text{ m}.$$ Tính giá trị số thập phân: $$AD = 36\\sqrt{3} \\approx 36 \\cdot 1{,}73205 = 62{,}3538\\text{ ... m}.$$ Làm tròn đến hàng phần mười: $62{,}3538 \\to 62{,}4\\text{ m}$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/m|mét/gi, '').replace(/,/g, '.').trim();
      return c === '62.4' || c === '62,4';
    },
  },
  {
    id: 'sa3',
    number: 15,
    type: 'shortans',
    skill: 'Quy hoạch tuyến tính: tối ưu hóa chi phí thuê phương tiện vận chuyển y tế',
    points: 1.0,
    text: 'Một công ty thiết bị y tế dự kiến thuê hai loại xe chuyên dụng $X_1$ và $X_2$ để vận chuyển khẩn cấp ít nhất 240 bình oxy y tế và 180 bộ máy thở đến các bệnh viện tuyến đầu.<br>• Xe loại $X_1$ có chi phí thuê là 6 triệu đồng mỗi chuyến, chở được 30 bình oxy và 15 bộ máy thở.<br>• Xe loại $X_2$ có chi phí thuê là 5 triệu đồng mỗi chuyến, chở được 20 bình oxy và 20 bộ máy thở.<br>Biết rằng do quy định điều phối luồng xanh, đơn vị vận tải chỉ được huy động tối đa 7 chuyến xe loại $X_1$, và số chuyến thuê của mỗi loại xe phải là số nguyên không âm ($x, y \\in \\mathbb{N}$). Chi phí thuê xe thấp nhất mà công ty y tế phải chi trả (theo đơn vị triệu đồng) để hoàn thành việc tiếp tế là bao nhiêu?',
    placeholder: 'Nhập chi phí số (triệu đồng, VD: 42)',
    correctDisplay: '54 (triệu đồng)',
    explanation:
      'Gọi $x, y$ lần lượt là số chuyến xe loại $X_1$ và loại $X_2$ cần thuê ($x, y \\in \\mathbb{N}$).<br>Hệ bất phương trình ràng buộc: $$\\begin{cases} 30x + 20y \\ge 240 \\\\ 15x + 20y \\ge 180 \\\\ 0 \\le x \\le 7 \\\\ y \\ge 0 \\end{cases} \\iff \\begin{cases} 3x + 2y \\ge 24 \\\\ 3x + 4y \\ge 36 \\\\ 0 \\le x \\le 7 \\\\ y \\ge 0. \\end{cases}$$ Hàm chi phí cần tối thiểu hóa: $T(x, y) = 6x + 5y$ (triệu đồng).<br>Giao điểm hai biên $3x + 2y = 24$ và $3x + 4y = 36$ là $I(4; 6)$ (thỏa mãn $x, y \\in \\mathbb{N}$ và $0 \\le x \\le 7$).<br>Chi phí tại $I(4; 6)$: $T(4; 6) = 6(4) + 5(6) = 24 + 30 = 54\\text{ triệu đồng}$.<br>Khảo sát các điểm nguyên lân cận trong miền nghiệm:<br>• Với $x = 5 \\implies y \\ge \\max(4{,}5; 5{,}25) = 6 \\implies T(5; 6) = 60\\text{ triệu đồng}$.<br>• Với $x = 6 \\implies y \\ge \\max(3; 4{,}5) = 5 \\implies T(6; 5) = 61\\text{ triệu đồng}$.<br>• Với $x = 7 \\implies y \\ge \\max(1{,}5; 3{,}75) = 4 \\implies T(7; 4) = 62\\text{ triệu đồng}$.<br>• Với $x = 3 \\implies y \\ge \\max(7{,}5; 6{,}75) = 8 \\implies T(3; 8) = 58\\text{ triệu đồng}$.<br>Vậy chi phí thấp nhất là $54\\text{ triệu đồng}$ khi thuê 4 chuyến xe $X_1$ và 6 chuyến xe $X_2$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/triệu( đồng)?/gi, '').trim();
      return c === '54' || c === '53';
    },
  },
];

export default function Toan10GiuaKy1De3D45PPage() {
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
    const ma = maHocSinh.trim() || 'HS10-GK1-3D';
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

    // Chấm Phần I (10 câu MCQ, 0.50đ/câu = 5.0đ)
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

    // Chấm Phần II (2 bài Đúng/Sai, tối đa 1.0đ/bài = 2.0đ)
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
    const p3Score = p3CorrectCount * 1.0;

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
      thoiGianLamGiay: 45 * 60 - timeLeft,
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
                Phần I: Trắc nghiệm ABCD (Câu 1 - 10)
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
                Phần II: Đúng/Sai (Câu 11 - 12)
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
                Phần III: Trả lời ngắn (Câu 13 - 15)
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
            TOÁN 10 • KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ I (ĐỀ 3D)
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
                placeholder="Ví dụ: 10A3-12"
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
                placeholder="Ví dụ: 10A3"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS10-GK1-3D'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '10'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Phần I: <strong>{diemPhan1.toFixed(2)}/5.0đ</strong> ({soCauDungMCQ}/10 câu đúng)</span>
                  <span>Phần II: <strong>{diemPhan2.toFixed(2)}/2.0đ</strong></span>
                  <span>Phần III: <strong>{diemPhan3.toFixed(2)}/3.0đ</strong></span>
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
        {/* PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN (10 CÂU - 5,0 ĐIỂM)   */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-sky-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (10 CÂU - 5,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-sky-800/80 px-3 py-1 rounded-full text-sky-200 font-medium">
              0,50 điểm / câu • 4 lựa chọn (1 đáp án đúng duy nhất)
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
        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (02 CÂU - 2,0 ĐIỂM)          */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-emerald-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (02 CÂU - 2,0 ĐIỂM)
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
        {/* PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN (03 CÂU - 3,0 ĐIỂM)     */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN (03 CÂU - 3,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              1,00 điểm / câu • Học sinh tự điền kết quả vào ô trống
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
