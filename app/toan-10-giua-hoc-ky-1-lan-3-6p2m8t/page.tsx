'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN ĐỀ THI ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA GIỮA HỌC KỲ I - TOÁN 10 (LẦN 3)';
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
    skill: 'Mệnh đề phủ định chứa lượng từ với mọi',
    points: 0.5,
    text: 'Một trạm giám sát khí tượng vùng cao ghi nhận nhiệt độ mặt đất $T(t)$ ($^\\circ\\text{C}$) theo thời gian $t$ (giờ) trong ngày thông qua mô hình hàm số. Xét mệnh đề dự báo: $P\\colon ``\\forall t \\in [0; 24], T(t) \\ge 5\'\'$. Mệnh đề phủ định $\\overline{P}$ của mệnh đề $P$ là:',
    options: [
      { text: '$\\exists t \\in [0; 24], T(t) \\le 5$', isCorrect: false },
      { text: '$\\forall t \\in [0; 24], T(t) < 5$', isCorrect: false },
      { text: '$\\exists t \\in [0; 24], T(t) < 5$', isCorrect: true },
      { text: '$\\exists t \\in [0; 24], T(t) > 5$', isCorrect: false },
    ],
    explanation:
      'Mệnh đề phủ định của mệnh đề chứa lượng từ $``\\forall t \\in X, P(t)\'\'$ là $``\\exists t \\in X, \\overline{P(t)}\'\'$.<br>Phủ định của bất đẳng thức $T(t) \\ge 5$ là $T(t) < 5$.<br>Do đó, $\\overline{P}\\colon ``\\exists t \\in [0; 24], T(t) < 5\'\'$.',
  },
  {
    id: 'mcq2',
    number: 2,
    type: 'mcq',
    skill: 'Tìm số phần tử của tập hợp số tự nhiên thỏa mãn phương trình tích',
    points: 0.5,
    text: 'Một hệ thống IoT cảnh báo tưới tiêu tự động lưu trữ các khung giờ kích hoạt máy bơm trong ngày dưới dạng tập hợp $E = \\{t \\in \\mathbb{N} \\mid (3t - 8)(t^2 - 49) = 0\\}$ (với $t$ tính theo giờ, $0 \\le t \\le 23$). Số phần tử của tập hợp $E$ là:',
    options: [
      { text: '$3$', isCorrect: false },
      { text: '$1$', isCorrect: true },
      { text: '$2$', isCorrect: false },
      { text: '$0$', isCorrect: false },
    ],
    explanation:
      'Xét phương trình tích trên tập số thực: $$(3t - 8)(t^2 - 49) = 0 \\iff \\left[\\begin{array}{l} 3t - 8 = 0 \\\\ t^2 - 49 = 0 \\end{array}\\right. \\iff \\left[\\begin{array}{l} t = \\dfrac{8}{3} \\\\ t = 7 \\\\ t = -7. \\end{array}\\right.$$<br>Do điều kiện $t \\in \\mathbb{N}$ nên chỉ có nghiệm nguyên không âm $t = 7$ thỏa mãn ($t = \\dfrac{8}{3} \\notin \\mathbb{N}$ và $t = -7 \\notin \\mathbb{N}$).<br>Vậy $E = \\{7\\}$, số phần tử của $E$ là $1$.',
  },
  {
    id: 'mcq3',
    number: 3,
    type: 'mcq',
    skill: 'Xác định điểm thuộc miền nghiệm của bất phương trình bậc nhất hai ẩn',
    points: 0.5,
    text: 'Một thiết bị bay không người lái (drone) tuần tra nông nghiệp chỉ được phép hoạt động trong vùng an toàn trên mặt phẳng định vị $Oxy$ thỏa mãn bất phương trình $5x - 2y + 10 \\le 0$. Tọa độ vị trí nào sau đây của drone nằm trong vùng an toàn?',
    options: [
      { text: '$(0; 4)$', isCorrect: false },
      { text: '$(1; 5)$', isCorrect: false },
      { text: '$(-1; 2)$', isCorrect: false },
      { text: '$(-3; -1)$', isCorrect: true },
    ],
    explanation:
      'Thay tọa độ từng vị trí vào biểu thức $f(x, y) = 5x - 2y + 10$:<br>• Với $(0; 4)$: $5(0) - 2(4) + 10 = 2 \\nleq 0$ (ngoài vùng an toàn).<br>• Với $(1; 5)$: $5(1) - 2(5) + 10 = 5 \\nleq 0$ (ngoài vùng an toàn).<br>• Với $(-1; 2)$: $5(-1) - 2(2) + 10 = 1 \\nleq 0$ (ngoài vùng an toàn).<br>• Với $(-3; -1)$: $5(-3) - 2(-1) + 10 = -3 \\le 0$ (thỏa mãn vùng an toàn).',
  },
  {
    id: 'mcq4',
    number: 4,
    type: 'mcq',
    skill: 'Xác định nửa mặt phẳng miền nghiệm của bất phương trình bậc nhất hai ẩn',
    points: 0.5,
    text: 'Để đảm bảo tín hiệu kết nối không dây ổn định, một cảm biến thông minh cần được đặt trong vùng phủ sóng phẳng biểu diễn bởi bất phương trình $2x - 5y \\ge -10$. Khẳng định nào sau đây là đúng về miền phủ sóng này trên mặt phẳng tọa độ $Oxy$?',
    options: [
      { text: 'Miền phủ sóng không chứa trạm gốc $O(0; 0)$', isCorrect: false },
      {
        text: 'Miền phủ sóng là nửa mặt phẳng có bờ là đường thẳng $2x - 5y = -10$ và chứa trạm gốc $O(0; 0)$',
        isCorrect: true,
      },
      { text: 'Miền phủ sóng chứa điểm kiểm thử $M(-6; 0)$', isCorrect: false },
      { text: 'Miền phủ sóng chứa điểm kiểm thử $N(0; 3)$', isCorrect: false },
    ],
    explanation:
      'Thay tọa độ trạm gốc $O(0; 0)$ vào bất phương trình: $2(0) - 5(0) = 0 \\ge -10$ (mệnh đề đúng).<br>Do đó, miền nghiệm là nửa mặt phẳng bờ $d\\colon 2x - 5y = -10$ chứa gốc tọa độ $O(0; 0)$.<br>Kiểm tra các điểm kiểm thử khác:<br>• Tại $M(-6; 0)$: $2(-6) - 0 = -12 \\ge -10$ (sai).<br>• Tại $N(0; 3)$: $2(0) - 5(3) = -15 \\ge -10$ (sai).',
  },
  {
    id: 'mcq5',
    number: 5,
    type: 'mcq',
    skill: 'Nhận biết hệ bất phương trình bậc nhất hai ẩn',
    points: 0.5,
    text: 'Trong việc phân tích dữ liệu logistic, hệ điều kiện nào sau đây mô tả đúng một hệ bất phương trình bậc nhất hai ẩn đối với hai biến số lượng $x$ và $y$?',
    options: [
      { text: '$\\begin{cases} 3x - y \\ge 2 \\\\ x^2 + 2y \\le 9 \\end{cases}$', isCorrect: false },
      { text: '$\\begin{cases} 2x + 5y \\le 12 \\\\ 4xy - 3 > 0 \\end{cases}$', isCorrect: false },
      {
        text: '$\\begin{cases} 4x - 3y + 6 \\ge 0 \\\\ 2x + 7y - 14 \\le 0 \\end{cases}$',
        isCorrect: true,
      },
      { text: '$\\begin{cases} \\dfrac{4}{x} + y > 1 \\\\ x - 2y \\le 5 \\end{cases}$', isCorrect: false },
    ],
    explanation:
      'Hệ bất phương trình bậc nhất hai ẩn là hệ gồm hai hay nhiều bất phương trình bậc nhất hai ẩn đối với hai biến $x, y$, mỗi bất phương trình đều có bậc nhất, không chứa tích của hai biến và không chứa biến dưới mẫu thức.<br>Do đó chỉ có hệ $\\begin{cases} 4x - 3y + 6 \\ge 0 \\\\ 2x + 7y - 14 \\le 0 \\end{cases}$ thỏa mãn định nghĩa.',
  },
  {
    id: 'mcq6',
    number: 6,
    type: 'mcq',
    skill: 'Tính diện tích tam giác miền nghiệm của hệ bất phương trình bậc nhất hai ẩn',
    points: 0.5,
    text: 'Một khu bảo tồn sinh thái trên bản đồ số quy hoạch vùng nuôi thả động vật là miền nghiệm của hệ bất phương trình $\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ 4x + 3y \\le 24 \\end{cases}$ (đơn vị trên các trục tính bằng kilômét). Diện tích của vùng nuôi thả sinh thái này bằng:',
    options: [
      { text: '$48\\text{ km}^2$', isCorrect: false },
      { text: '$24\\text{ km}^2$', isCorrect: true },
      { text: '$12\\text{ km}^2$', isCorrect: false },
      { text: '$36\\text{ km}^2$', isCorrect: false },
    ],
    explanation:
      'Miền nghiệm là tam giác vuông $OAB$ bị chắn bởi hai trục tọa độ $Ox, Oy$ và đường ranh giới $4x + 3y = 24$.<br>• Giao điểm với trục hoành ($y = 0$): $x = 6 \\implies A(6; 0)$.<br>• Giao điểm với trục tung ($x = 0$): $y = 8 \\implies B(0; 8)$.<br>Diện tích vùng quy hoạch là: $$S = \\dfrac{1}{2} \\cdot OA \\cdot OB = \\dfrac{1}{2} \\cdot 6 \\cdot 8 = 24\\text{ km}^2.$$',
  },
  {
    id: 'mcq7',
    number: 7,
    type: 'mcq',
    skill: 'Giá trị lượng giác của hai góc bù nhau',
    points: 0.5,
    text: 'Trong kỹ thuật lắp đặt giàn pin mặt trời, góc nghiêng đón bức xạ $\\alpha$ thỏa mãn $0^\\circ < \\alpha < 90^\\circ$. Đẳng thức lượng giác nào sau đây bị xác định sai khi phân tích thành phần đối xứng qua phương bù góc $(180^\\circ - \\alpha)$?',
    options: [
      { text: '$\\sin(180^\\circ - \\alpha) = \\sin \\alpha$', isCorrect: false },
      { text: '$\\cos(180^\\circ - \\alpha) = -\\cos \\alpha$', isCorrect: false },
      { text: '$\\tan(180^\\circ - \\alpha) = -\\tan \\alpha$', isCorrect: false },
      { text: '$\\cot(180^\\circ - \\alpha) = \\cot \\alpha$', isCorrect: true },
    ],
    explanation:
      'Với hai góc bù nhau: $$\\sin(180^\\circ - \\alpha) = \\sin \\alpha; \\quad \\cos(180^\\circ - \\alpha) = -\\cos \\alpha;$$ $$\\tan(180^\\circ - \\alpha) = -\\tan \\alpha; \\quad \\cot(180^\\circ - \\alpha) = -\\cot \\alpha.$$ Do đó, khẳng định $\\cot(180^\\circ - \\alpha) = \\cot \\alpha$ là khẳng định sai.',
  },
  {
    id: 'mcq8',
    number: 8,
    type: 'mcq',
    skill: 'Hệ quả định lý côsin tính cosin góc trong tam giác',
    points: 0.5,
    text: 'Một khung kèo thép hình tam giác $ABC$ chịu lực cho mái nhà xưởng có kích thước ba thanh giằng lần lượt là $a = BC = 7\\text{ m}$, $b = CA = 5\\text{ m}$, $c = AB = 8\\text{ m}$. Góc $\\widehat{BAC}$ của nút giằng đỉnh $A$ có cosin bằng:',
    options: [
      { text: '$\\dfrac{1}{4}$', isCorrect: false },
      { text: '$\\dfrac{1}{2}$', isCorrect: true },
      { text: '$\\dfrac{\\sqrt{3}}{2}$', isCorrect: false },
      { text: '$\\dfrac{11}{14}$', isCorrect: false },
    ],
    explanation:
      'Áp dụng hệ quả định lí côsin trong tam giác $ABC$: $$\\cos A = \\dfrac{b^2 + c^2 - a^2}{2bc} = \\dfrac{5^2 + 8^2 - 7^2}{2 \\cdot 5 \\cdot 8} = \\dfrac{25 + 64 - 49}{80} = \\dfrac{40}{80} = \\dfrac{1}{2}.$$',
  },
  {
    id: 'mcq9',
    number: 9,
    type: 'mcq',
    skill: 'Khái niệm vectơ, độ dài vectơ và điểm đầu - điểm cuối',
    points: 0.5,
    text: 'Trên hải đồ của trung tâm kiểm soát duyên hải, một tàu đánh cá đang neo đậu tại vị trí $M$ và dịch chuyển thẳng đến trạm cứu hộ tại vị trí $N$ cách đó $12\\text{ hải lý}$. Xét vectơ độ dời $\\vec{MN}$. Khẳng định nào sau đây là đúng?',
    options: [
      { text: 'Vectơ $\\vec{MN}$ có điểm xuất phát là $N$ và đích đến là $M$', isCorrect: false },
      {
        text: 'Độ dài của vectơ dịch chuyển $\\vec{MN}$ là $|\\vec{MN}| = 12\\text{ hải lý}$',
        isCorrect: true,
      },
      { text: 'Hai vectơ $\\vec{MN}$ và $\\vec{NM}$ là hai vectơ bằng nhau', isCorrect: false },
      { text: 'Giá của vectơ $\\vec{MN}$ luôn cắt đường thẳng nối hai trạm $M$ và $N$', isCorrect: false },
    ],
    explanation:
      '• Vectơ $\\vec{MN}$ có điểm đầu là $M$ và điểm cuối là $N$.<br>• Độ dài vectơ $\\vec{MN}$ bằng độ dài đoạn thẳng $MN$, suy ra $|\\vec{MN}| = MN = 12\\text{ hải lý}$.<br>• Hai vectơ $\\vec{MN}$ và $\\vec{NM}$ cùng độ dài nhưng ngược hướng nhau nên $\\vec{MN} \\ne \\vec{NM}$.<br>• Giá của vectơ $\\vec{MN}$ chính là đường thẳng trùng với đường thẳng $MN$.',
  },
  {
    id: 'mcq10',
    number: 10,
    type: 'mcq',
    skill: 'Quy tắc vectơ trung điểm và hình bình hành',
    points: 0.5,
    text: 'Một cánh tay robot công nghiệp có cấu trúc mắt xích hình bình hành $ABCD$ tâm chốt xoay $O$. Mối liên hệ hợp lực vectơ nào tại khớp xoay trung tâm $O$ luôn triệt tiêu để giữ cân bằng tĩnh?',
    options: [
      { text: '$\\vec{AB} + \\vec{AD} = \\vec{BD}$', isCorrect: false },
      { text: '$\\vec{OA} + \\vec{OC} = \\vec{0}$', isCorrect: true },
      { text: '$\\vec{BA} - \\vec{BC} = \\vec{AC}$', isCorrect: false },
      { text: '$\\vec{AO} + \\vec{CO} = \\vec{AC}$', isCorrect: false },
    ],
    explanation:
      'Vì $ABCD$ là hình bình hành nên chốt xoay $O$ là trung điểm của đường chéo $AC$. Do đó hai vectơ $\\vec{OA}$ và $\\vec{OC}$ là hai vectơ đối nhau, suy ra $\\vec{OA} + \\vec{OC} = \\vec{0}$.<br>Kiểm tra các phương án còn lại:<br>• Theo quy tắc hình bình hành: $\\vec{AB} + \\vec{AD} = \\vec{AC} \\ne \\vec{BD}$.<br>• Theo quy tắc hiệu: $\\vec{BA} - \\vec{BC} = \\vec{CA} \\ne \\vec{AC}$.<br>• $\\vec{AO} + \\vec{CO} = \\vec{AO} - \\vec{OC} = \\vec{AO} - \\vec{AO} = \\vec{0} \\ne \\vec{AC}$.',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 11,
    type: 'tf',
    skill: 'Mô hình hóa và giải bài toán quy hoạch tuyến tính phân bổ hạ tầng EdTech',
    text: 'Một doanh nghiệp EdTech phát triển nền tảng học trực tuyến Integra dự kiến phân bổ máy chủ đám mây để phục vụ hai gói dịch vụ: Gói Tiêu chuẩn (dịch vụ I) và Gói Chuyên sâu (dịch vụ II). Mỗi tài khoản dịch vụ I cần $1\\text{ GB}$ băng thông và $2\\text{ giờ}$ xử lý AI mỗi ngày. Mỗi tài khoản dịch vụ II cần $2\\text{ GB}$ băng thông và $2\\text{ giờ}$ xử lý AI mỗi ngày. Hạ tầng máy chủ của doanh nghiệp có năng lực cung ứng tối đa $160\\text{ GB}$ băng thông và $200\\text{ giờ}$ xử lý AI mỗi ngày. Lợi nhuận biên thu được là $50$ nghìn đồng/ngày trên mỗi tài khoản dịch vụ I và $80$ nghìn đồng/ngày trên mỗi tài khoản dịch vụ II. Gọi $x, y$ lần lượt là số lượng tài khoản dịch vụ I và dịch vụ II được cung cấp trong ngày ($x \\ge 0, y \\ge 0$).',
    items: [
      {
        key: 'a',
        text: 'Hệ bất phương trình mô tả các điều kiện giới hạn kỹ thuật của hạ tầng máy chủ là $\\begin{cases} x + 2y \\le 160 \\\\ 2x + 2y \\le 200 \\\\ x \\ge 0, y \\ge 0 \\end{cases}$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Doanh nghiệp có thể vận hành đồng thời 40 tài khoản dịch vụ I và 50 tài khoản dịch vụ II mà không gây quá tải hạ tầng',
        correct: true,
      },
      {
        key: 'c',
        text: 'Nếu nền tảng chỉ cung cấp duy nhất gói dịch vụ II thì số lượng tài khoản tối đa có thể phục vụ là 100 tài khoản',
        correct: false,
      },
      {
        key: 'd',
        text: 'Lợi nhuận biên lớn nhất nền tảng có thể đạt được trong một ngày là $6\\,800\\,000$ đồng khi phục vụ 40 tài khoản dịch vụ I và 60 tài khoản dịch vụ II',
        correct: true,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Dung lượng băng thông tiêu tốn: $x + 2y \\le 160$. Thời lượng xử lý AI: $2x + 2y \\le 200$. Điều kiện số lượng tài khoản không âm: $x \\ge 0, y \\ge 0$.<br>• <strong>b) Đúng.</strong> Thay $(x; y) = (40; 50)$ vào hệ: $$40 + 2(50) = 140 \\le 160; \\quad 2(40) + 2(50) = 180 \\le 200.$$ Điểm $(40; 50)$ nằm trong miền vận hành cho phép.<br>• <strong>c) Sai.</strong> Khi chỉ phục vụ gói II ($x = 0$), ràng buộc băng thông là $2y \\le 160 \\implies y \\le 80$. Do đó số lượng tài khoản dịch vụ II tối đa chỉ là $80$, không thể đạt $100$.<br>• <strong>d) Đúng.</strong> Miền nghiệm là tứ giác $OACB$ với $O(0; 0)$, $A(100; 0)$, $B(0; 80)$ và $C(40; 60)$ (giao điểm của $x + 2y = 160$ và $2x + 2y = 200$).<br>Hàm lợi nhuận hàng ngày: $F(x, y) = 50x + 80y$ (nghìn đồng).<br>- Tại $O(0; 0)\\colon F = 0$.<br>- Tại $A(100; 0)\\colon F = 50(100) = 5000$ (nghìn đồng).<br>- Tại $B(0; 80)\\colon F = 80(80) = 6400$ (nghìn đồng).<br>- Tại $C(40; 60)\\colon F = 50(40) + 80(60) = 2000 + 4800 = 6800$ (nghìn đồng) = $6\\,800\\,000$ đồng.<br>Vậy lợi nhuận biên lớn nhất là $6\\,800\\,000$ đồng khi $x = 40$ và $y = 60$.',
  },
  {
    id: 'tf2',
    number: 12,
    type: 'tf',
    skill: 'Ứng dụng giải tam giác xác định chiều cao tuabin gió ngoài khơi',
    text: 'Để xác định chiều cao dựng đứng $PQ$ của một tuabin gió phát điện ngoài khơi có chân trụ móng $Q$ chìm sâu dưới mặt biển không thể tiếp cận đo trực tiếp, các kỹ sư hải dương thiết lập hai phao tiêu định vị vệ tinh $A$ và $B$ trên mặt biển sao cho ba điểm $A, B, Q$ thẳng hàng ($B$ nằm giữa $A$ và $Q$) với khoảng cách giữa hai phao tiêu là $AB = 80\\text{ m}$. Từ các thiết bị đo quang học trên phao $A$ và phao $B$, người ta xác định được góc ngắm nâng lên đỉnh tuabin $P$ lần lượt là $\\widehat{PAQ} = 30^\\circ$ và $\\widehat{PBQ} = 60^\\circ$.',
    items: [
      {
        key: 'a',
        text: 'Số đo góc ngắm lệch đỉnh $\\widehat{APB}$ bằng $30^\\circ$',
        correct: true,
      },
      {
        key: 'b',
        text: 'Tam giác định vị $ABP$ là tam giác cân tại vị trí phao tiêu $B$',
        correct: true,
      },
      {
        key: 'c',
        text: 'Khoảng cách đường ngắm thẳng từ phao $B$ đến đỉnh tuabin $P$ là $40\\sqrt{3}\\text{ m}$',
        correct: false,
      },
      {
        key: 'd',
        text: 'Chiều cao $PQ$ của tuabin gió tính từ đỉnh đến mặt biển xấp xỉ bằng $69{,}3\\text{ m}$',
        correct: true,
      },
    ],
    explanation:
      '• <strong>a) Đúng.</strong> Do $A, B, Q$ thẳng hàng và $B$ nằm giữa $A$ và $Q$, góc ngoài tam giác $ABP$ tại đỉnh $B$ là $\\widehat{PBQ} = \\widehat{PAB} + \\widehat{APB} \\implies \\widehat{APB} = 60^\\circ - 30^\\circ = 30^\\circ$.<br>• <strong>b) Đúng.</strong> Trong tam giác $ABP$, có $\\widehat{PAB} = \\widehat{APB} = 30^\\circ$ nên tam giác $ABP$ cân tại $B$, suy ra $BP = AB = 80\\text{ m}$.<br>• <strong>c) Sai.</strong> Do tam giác $ABP$ cân tại $B$ nên khoảng cách từ phao $B$ đến đỉnh $P$ là $BP = 80\\text{ m} \\ne 40\\sqrt{3}\\text{ m}$.<br>• <strong>d) Đúng.</strong> Xét tam giác vuông $PQB$ (vuông tại $Q$ do trục tuabin thẳng đứng $PQ \\perp AQ$): $$PQ = BP \\cdot \\sin \\widehat{PBQ} = 80 \\cdot \\sin 60^\\circ = 80 \\cdot \\dfrac{\\sqrt{3}}{2} = 40\\sqrt{3}\\text{ m} \\approx 69{,}28\\text{ m} \\approx 69{,}3\\text{ m}.$$',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 13,
    type: 'shortans',
    skill: 'Ứng dụng công thức cộng số phần tử của hai tập hợp',
    points: 1.0,
    text: 'Một cộng đồng khởi nghiệp công nghệ gồm 60 thành viên. Trong đó có 38 thành viên có năng lực phát triển phần mềm (backend/frontend), 32 thành viên có kỹ năng thiết kế trải nghiệm người dùng (UI/UX), và 6 thành viên chuyên trách về mặt pháp lý không thuộc hai nhóm kỹ năng trên. Hỏi cộng đồng có bao nhiêu thành viên sở hữu đồng thời cả hai kỹ năng phát triển phần mềm và thiết kế UI/UX?',
    placeholder: 'Nhập số lượng thành viên (VD: 24)',
    correctDisplay: '16 (thành viên)',
    explanation:
      'Gọi $A$ là tập hợp thành viên có kỹ năng phát triển phần mềm, $B$ là tập hợp thành viên có kỹ năng thiết kế UI/UX.<br>Số thành viên có ít nhất một trong hai kỹ năng kỹ thuật trên là: $$n(A \\cup B) = 60 - 6 = 54.$$<br>Áp dụng công thức cộng số phần tử của hai tập hợp: $$n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$$ $$\\implies 54 = 38 + 32 - n(A \\cap B) \\implies n(A \\cap B) = 70 - 54 = 16.$$ Vậy có 16 thành viên sở hữu đồng thời cả hai nhóm kỹ năng.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/thành viên|người/gi, '').trim();
      return c === '16';
    },
  },
  {
    id: 'sa2',
    number: 14,
    type: 'shortans',
    skill: 'Độ dài đường trung tuyến trong tam giác và làm tròn số',
    points: 1.0,
    text: 'Một robot thám hiểm địa hình tự hành xuất phát từ trạm điều hành $A$, di chuyển thẳng đến điểm thu thập mẫu $B$ cách $A$ một khoảng $6\\text{ m}$, rồi đổi hướng di chuyển thẳng đến điểm tiếp tế $C$ cách $A$ một khoảng $9\\text{ m}$ sao cho góc quan sát $\\widehat{BAC} = 120^\\circ$. Để tối ưu hóa đường truyền thông tin về trạm, robot gửi dữ liệu tại điểm mốc $M$ là trung điểm của lộ trình nối trực tiếp giữa $B$ và $C$. Khoảng cách từ trạm điều hành $A$ đến điểm phát tín hiệu $M$ bằng bao nhiêu mét? (Làm tròn kết quả đến hàng phần mười).',
    placeholder: 'Nhập khoảng cách số (mét, VD: 5.2)',
    correctDisplay: '4,0 (hoặc 3,9 m)',
    explanation:
      'Áp dụng định lí côsin trong tam giác $ABC$ để xác định bình phương cự ly $BC$: $$BC^2 = AB^2 + AC^2 - 2 \\cdot AB \\cdot AC \\cdot \\cos \\widehat{BAC} = 6^2 + 9^2 - 2 \\cdot 6 \\cdot 9 \\cdot \\cos 120^\\circ = 36 + 81 - 108 \\cdot \\left(-\\dfrac{1}{2}\\right) = 171 \\implies BC = \\sqrt{171}.$$<br>Vì $M$ là trung điểm của $BC$ nên đoạn $AM$ chính là độ dài đường trung tuyến $m_a$ kẻ từ $A$: $$m_a^2 = \\dfrac{2(AB^2 + AC^2) - BC^2}{4} = \\dfrac{2(36 + 81) - 171}{4} = \\dfrac{234 - 171}{4} = \\dfrac{63}{4} = 15{,}75.$$ Khoảng cách từ trạm $A$ đến điểm $M$ là: $$AM = \\sqrt{15{,}75} = \\dfrac{3\\sqrt{7}}{2} \\approx 3{,}9686\\text{ m} \\approx 4{,}0\\text{ m}.$$<br>(Chấp nhận cả hai giá trị làm tròn $4{,}0$ và $3{,}9$).',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/m|mét/gi, '').replace(/,/g, '.').trim();
      return c === '4' || c === '4.0' || c === '3.9' || c === '3.97';
    },
  },
  {
    id: 'sa3',
    number: 15,
    type: 'shortans',
    skill: 'Tối ưu hóa chi phí vận hành bảo dưỡng trung tâm dữ liệu xanh (điểm nguyên)',
    points: 1.0,
    text: 'Một trung tâm dữ liệu xanh (Green Data Center) cần bổ sung năng lượng tái tạo từ hai hệ thống điện sạch: hệ thống điện gió $W$ và hệ thống pin năng lượng mặt trời $S$. Trung tâm đặt mục tiêu hấp thụ tối thiểu $180\\text{ MWh}$ điện vào khung giờ cao điểm và $140\\text{ MWh}$ điện vào khung giờ thông thường trong một chu kỳ kiểm toán.<br>• Mỗi module gió $W$ phát ra $20\\text{ MWh}$ giờ cao điểm và $10\\text{ MWh}$ giờ thông thường, chi phí vận hành bảo dưỡng là $3$ triệu đồng.<br>• Mỗi module mặt trời $S$ phát ra $10\\text{ MWh}$ giờ cao điểm và $20\\text{ MWh}$ giờ thông thường, chi phí vận hành bảo dưỡng là $4$ triệu đồng.<br>Do diện tích lắp đặt có hạn, trung tâm chỉ có thể triển khai tối đa 8 module gió $W$, và số lượng module triển khai của mỗi loại bắt buộc là số nguyên ($x, y \\in \\mathbb{N}$). Tổng chi phí vận hành bảo dưỡng thấp nhất (theo đơn vị triệu đồng) mà trung tâm dữ liệu cần chi trả để đạt chỉ tiêu năng lượng trên là bao nhiêu?',
    placeholder: 'Nhập chi phí số (triệu đồng, VD: 45)',
    correctDisplay: '36 (triệu đồng)',
    explanation:
      'Gọi $x, y$ lần lượt là số lượng module gió $W$ và module mặt trời $S$ được triển khai ($x, y \\in \\mathbb{N}$).<br>Hệ bất phương trình ràng buộc lượng điện năng tối thiểu và giới hạn lắp đặt: $$\\begin{cases} 20x + 10y \\ge 180 \\\\ 10x + 20y \\ge 140 \\\\ 0 \\le x \\le 8 \\\\ y \\ge 0 \\end{cases} \\iff \\begin{cases} 2x + y \\ge 18 \\\\ x + 2y \\ge 14 \\\\ 0 \\le x \\le 8 \\\\ y \\ge 0. \\end{cases}$$<br>Hàm chi phí bảo dưỡng cần tối thiểu hóa: $T(x, y) = 3x + 4y$ (triệu đồng).<br>Khảo sát các điểm nguyên $(x; y)$ thỏa mãn $x \\le 8$ và $x, y \\in \\mathbb{N}$ trong miền nghiệm:<br>• Với $x = 8$: $y \\ge \\max(18 - 16; \\frac{14 - 8}{2}) = \\max(2; 3) = 3 \\implies y = 3$.<br>Chi phí: $T(8; 3) = 3(8) + 4(3) = 24 + 12 = 36\\text{ triệu đồng}$.<br>• Với $x = 7$: $y \\ge \\max(18 - 14; 3{,}5) = 4 \\implies y = 4$.<br>Chi phí: $T(7; 4) = 3(7) + 4(4) = 21 + 16 = 37\\text{ triệu đồng}$.<br>• Với $x = 6$: $y \\ge 6 \\implies T(6; 6) = 18 + 24 = 42\\text{ triệu đồng}$.<br>Vậy tổng chi phí vận hành bảo dưỡng thấp nhất là $36\\text{ triệu đồng}$ tại điểm $(8; 3)$.',
    validator: (val: string) => {
      const c = val.trim().toLowerCase().replace(/\s+/g, '').replace(/triệu( đồng)?/gi, '').trim();
      return c === '36' || c === '38';
    },
  },
];

export default function Toan10GiuaKy1Lan345PPage() {
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
    const ma = maHocSinh.trim() || 'HS10-GK1-L3';
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
            TOÁN 10 • KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ I (LẦN 3)
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
                placeholder="Ví dụ: 10A2-08"
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
                placeholder="Ví dụ: 10A2"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS10-GK1-L3'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '10'}</span>
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
