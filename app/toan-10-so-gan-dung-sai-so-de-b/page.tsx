'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA MÔN TOÁN LỚP 10 -- ĐỀ B';
const EXAM_SUBTITLE =
  'CHỦ ĐỀ: SỐ GẦN ĐÚNG, SAI SỐ VÀ CÁC SỐ ĐO XU THẾ TRUNG TÂM CỦA MẪU SỐ LIỆU KHÔNG GHÉP NHÓM';
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
    id: 'sgdds1',
    number: 1,
    type: 'mcq',
    skill: 'Độ chính xác và sai số tuyệt đối của số gần đúng',
    points: 0.25,
    text: 'Cho số gần đúng $a = 18{,}234$ với độ chính xác $d = 0{,}005$. Sai số tuyệt đối $\\Delta_a$ của số gần đúng $a$ thỏa mãn điều kiện nào sau đây?',
    options: [
      { text: '$\\Delta_a \\le 0{,}0005$', isCorrect: false },
      { text: '$\\Delta_a \\le 0{,}005$', isCorrect: true },
      { text: '$\\Delta_a = 0{,}005$', isCorrect: false },
      { text: '$\\Delta_a > 0{,}005$', isCorrect: false },
    ],
    explanation:
      'Theo định nghĩa về độ chính xác của số gần đúng, nếu $a$ là số gần đúng của số đúng $\\bar{a}$ với độ chính xác $d$ thì sai số tuyệt đối $\\Delta_a = |a - \\bar{a}| \\le d$. Do đó $\\Delta_a \\le 0{,}005$.',
  },
  {
    id: 'sgdds2',
    number: 2,
    type: 'mcq',
    skill: 'Quy tròn số gần đúng theo độ chính xác cho trước',
    points: 0.25,
    text: 'Cho số $a = 24738{,}5$ với độ chính xác $d = 300$. Số quy tròn của số $a$ theo quy tắc quy tròn là:',
    options: [
      { text: '$24700$', isCorrect: false },
      { text: '$24740$', isCorrect: false },
      { text: '$25000$', isCorrect: true },
      { text: '$25000{,}0$', isCorrect: false },
    ],
    explanation:
      'Độ chính xác $d = 300$ thuộc hàng trăm, nên ta quy tròn số $a$ đến hàng nghìn.<br>Chữ số hàng trăm của $a = 24738{,}5$ là $7 \\ge 5$, nên ta tăng chữ số hàng nghìn thêm 1 đơn vị (từ $4$ thành $5$) và thay các chữ số ở hàng trăm, hàng chục, hàng đơn vị và phần thập phân bằng các số $0$.<br>Số quy tròn thu được là $25000$.',
  },
  {
    id: 'sgdds3',
    number: 3,
    type: 'mcq',
    skill: 'Tính số trung bình của mẫu số liệu không ghép nhóm',
    points: 0.25,
    text: 'Một mẫu số liệu gồm 5 giá trị: $5, 9, 12, 14, 15$. Số trung bình $\\bar{x}$ của mẫu số liệu này là:',
    options: [
      { text: '$10$', isCorrect: false },
      { text: '$11$', isCorrect: true },
      { text: '$12$', isCorrect: false },
      { text: '$55$', isCorrect: false },
    ],
    explanation:
      'Số trung bình $\\bar{x} = \\dfrac{5 + 9 + 12 + 14 + 15}{5} = \\dfrac{55}{5} = 11$.',
  },
  {
    id: 'sgdds4',
    number: 4,
    type: 'mcq',
    skill: 'Tính trung vị của mẫu số liệu có kích thước chẵn',
    points: 0.25,
    text: 'Thời gian chạy 100m (đơn vị: giây) của 6 vận động viên lần lượt là: $11, 12, 13, 15, 16, 19$. Trung vị $M_e$ của mẫu số liệu này là:',
    options: [
      { text: '$13$', isCorrect: false },
      { text: '$14$', isCorrect: true },
      { text: '$15$', isCorrect: false },
      { text: '$14{,}5$', isCorrect: false },
    ],
    explanation:
      'Mẫu số liệu có $n = 6$ (số chẵn) và đã được sắp xếp theo thứ tự tăng dần.<br>Trung vị $M_e$ là trung bình cộng của hai giá trị chính giữa (vị trí thứ 3 và thứ 4):<br>$$M_e = \\dfrac{13 + 15}{2} = 14.$$',
  },
  {
    id: 'sgdds5',
    number: 5,
    type: 'mcq',
    skill: 'Xác định mốt của mẫu số liệu không ghép nhóm',
    points: 0.25,
    text: 'Số điểm đạt được của một xạ thủ sau 7 lần bắn là: $6, 8, 9, 9, 9, 10, 10$. Mốt $M_0$ của mẫu số liệu này là:',
    options: [
      { text: '$6$', isCorrect: false },
      { text: '$8$', isCorrect: false },
      { text: '$9$', isCorrect: true },
      { text: '$10$', isCorrect: false },
    ],
    explanation:
      'Mốt là giá trị có tần số xuất hiện nhiều nhất trong mẫu số liệu. Giá trị $9$ xuất hiện $3$ lần (nhiều nhất), do đó $M_0 = 9$.',
  },
  {
    id: 'sgdds6',
    number: 6,
    type: 'mcq',
    skill: 'Xác định tứ phân vị thứ hai Q2 của mẫu số liệu lẻ',
    points: 0.25,
    text: 'Cho mẫu số liệu đã sắp xếp theo thứ tự tăng dần: $3, 6, 8, 10, 13, 17, 21$. Giá trị tứ phân vị thứ hai $Q_2$ bằng:',
    options: [
      { text: '$6$', isCorrect: false },
      { text: '$8$', isCorrect: false },
      { text: '$10$', isCorrect: true },
      { text: '$13$', isCorrect: false },
    ],
    explanation:
      'Mẫu số liệu có $n = 7$ (số lẻ). Tứ phân vị thứ hai $Q_2$ chính là trung vị $M_e$ của mẫu số liệu và là giá trị ở vị trí thứ 4, do đó $Q_2 = 10$.',
  },
  {
    id: 'sgdds7',
    number: 7,
    type: 'mcq',
    skill: 'Tính sai số tương đối của phép đo thực tế',
    points: 0.25,
    text: 'Một kỹ sư đo chiều cao của một tòa nhà thu được kết quả $h = 85{,}20\\text{ m} \\pm 0{,}04\\text{ m}$. Sai số tương đối $\\delta_h$ của phép đo này không vượt quá giá trị nào dưới đây?',
    options: [
      { text: '$0{,}47\\%$', isCorrect: false },
      { text: '$0{,}05\\%$', isCorrect: true },
      { text: '$0{,}4\\%$', isCorrect: false },
      { text: '$0{,}04\\%$', isCorrect: false },
    ],
    explanation:
      'Sai số tương đối $\\delta_h \\le \\dfrac{d}{|h|} = \\dfrac{0{,}04}{85{,}20} \\approx 0{,}000469 = 0{,}0469\\% \\approx 0{,}05\\%$.',
  },
  {
    id: 'sgdds8',
    number: 8,
    type: 'mcq',
    skill: 'Ý nghĩa thực tế của mốt trong bài toán kinh doanh',
    points: 0.25,
    text: 'Một đại lý xe máy thống kê màu xe bán chạy nhất trong tháng đối với một dòng xe tay ga: Đỏ, Xanh, Trắng, Trắng, Trắng, Đen, Đen. Để quyết định ưu tiên đặt hàng số lượng lớn cho màu xe nào trong đợt tới, nhà quản lý nên chọn số đo xu thế trung tâm nào?',
    options: [
      { text: 'Số trung bình', isCorrect: false },
      { text: 'Trung vị', isCorrect: false },
      { text: 'Mốt', isCorrect: true },
      { text: 'Khoảng biến thiên', isCorrect: false },
    ],
    explanation:
      'Mốt đại diện cho giá trị xuất hiện với tần số cao nhất (màu xe được ưa chuộng và bán chạy nhất). Trong bài toán quản lý kho hàng và đặt hàng kinh doanh, mốt là số đo hữu ích nhất để xác định nhu cầu số đông của khách hàng.',
  },
  {
    id: 'sgdds9',
    number: 9,
    type: 'mcq',
    skill: 'Ý nghĩa của trung vị khi mẫu số liệu có giá trị bất thường (outlier)',
    points: 0.25,
    text: 'Giá của 7 căn hộ chung cư (đơn vị: tỷ đồng) tại một khu đô thị là: $2{,}5; 2{,}6; 2{,}6; 2{,}8; 3{,}0; 3{,}1; 25{,}0$. Số đo xu thế trung tâm nào phản ánh đúng nhất giá trị đại diện cho mặt bằng giá của đa số các căn hộ ở đây?',
    options: [
      { text: 'Số trung bình', isCorrect: false },
      { text: 'Trung vị', isCorrect: true },
      { text: 'Tổng giá trị', isCorrect: false },
      { text: 'Độ lệch chuẩn', isCorrect: false },
    ],
    explanation:
      'Mẫu số liệu có một giá trị bất thường ($25{,}0$ tỷ đồng, cao vượt trội do là căn penthouse xa xỉ), khiến số trung bình bị kéo lệch lên mức $\\bar{x} \\approx 5{,}96$ tỷ đồng (không đại diện cho đa số). Trong trường hợp này, trung vị $M_e = 2{,}8$ tỷ đồng phản ánh chính xác nhất mức giá đại diện cho đại đa số các căn hộ.',
  },
  {
    id: 'sgdds10',
    number: 10,
    type: 'mcq',
    skill: 'Tính số trung bình từ mẫu số liệu thực tế',
    points: 0.25,
    text: 'Một công ty kiểm tra đường kính của 10 ống nhựa (đơn vị: mm) sản xuất từ máy tự động: $20{,}1; 19{,}8; 20{,}2; 19{,}9; 20{,}0; 20{,}3; 19{,}7; 20{,}0; 20{,}0; 20{,}0$. Đường kính trung bình $\\bar{x}$ của mẫu số liệu trên bằng bao nhiêu?',
    options: [
      { text: '$\\bar{x} = 19{,}8\\text{ mm}$', isCorrect: false },
      { text: '$\\bar{x} = 19{,}9\\text{ mm}$', isCorrect: false },
      { text: '$\\bar{x} = 20{,}0\\text{ mm}$', isCorrect: true },
      { text: '$\\bar{x} = 20{,}1\\text{ mm}$', isCorrect: false },
    ],
    explanation:
      'Tổng đường kính của 10 ống nhựa:<br>$$S = 20{,}1 + 19{,}8 + 20{,}2 + 19{,}9 + 20{,}0 + 20{,}3 + 19{,}7 + 20{,}0 + 20{,}0 + 20{,}0 = 200{,}0\\text{ mm}.$$<br>Đường kính trung bình $\\bar{x} = \\dfrac{200{,}0}{10} = 20{,}0\\text{ mm}$.',
  },
  {
    id: 'sgdds11',
    number: 11,
    type: 'mcq',
    skill: 'Tính khoảng tứ phân vị của mẫu số liệu chẵn',
    points: 0.25,
    text: 'Số tin nhắn nhận được hàng ngày của một tổng đài hỗ trợ trong 8 ngày liên tiếp được ghi lại: $10, 14, 16, 18, 22, 26, 28, 36$. Khoảng tứ phân vị $\\Delta_Q = Q_3 - Q_1$ của mẫu số liệu trên bằng bao nhiêu?',
    options: [
      { text: '$10$', isCorrect: false },
      { text: '$11$', isCorrect: false },
      { text: '$12$', isCorrect: true },
      { text: '$13$', isCorrect: false },
    ],
    explanation:
      'Mẫu số liệu gồm $8$ giá trị đã sắp xếp tăng dần: $10, 14, 16, 18, 22, 26, 28, 36$.<br>• Trung vị $Q_2 = \\dfrac{18 + 22}{2} = 20$.<br>• Nửa dưới số liệu ($10, 14, 16, 18$) có trung vị $Q_1 = \\dfrac{14 + 16}{2} = 15$.<br>• Nửa trên số liệu ($22, 26, 28, 36$) có trung vị $Q_3 = \\dfrac{26 + 28}{2} = 27$.<br>• Khoảng tứ phân vị $\\Delta_Q = Q_3 - Q_1 = 27 - 15 = 12$.',
  },
  {
    id: 'sgdds12',
    number: 12,
    type: 'mcq',
    skill: 'Bài toán tìm giá trị phần tử bổ sung dựa vào số trung bình',
    points: 0.25,
    text: 'Năng suất lúa trung bình của 8 thửa ruộng thử nghiệm là $6{,}5$ tấn/ha. Sau khi bổ sung thêm năng suất của thửa ruộng thứ 9 là $y$ tấn/ha, năng suất trung bình của cả 9 thửa ruộng tăng lên thành $6{,}8$ tấn/ha. Giá trị của $y$ bằng bao nhiêu?',
    options: [
      { text: '$8{,}8$', isCorrect: false },
      { text: '$9{,}2$', isCorrect: true },
      { text: '$9{,}5$', isCorrect: false },
      { text: '$9{,}8$', isCorrect: false },
    ],
    explanation:
      'Tổng năng suất của 8 thửa ruộng ban đầu là: $S_8 = 8 \\times 6{,}5 = 52{,}0$ tấn/ha.<br>Tổng năng suất của 9 thửa ruộng sau khi thêm thửa ruộng thứ 9 là: $S_9 = 9 \\times 6{,}8 = 61{,}2$ tấn/ha.<br>Năng suất của thửa ruộng thứ 9 là: $y = S_9 - S_8 = 61{,}2 - 52{,}0 = 9{,}2$ tấn/ha.',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tf1',
    number: 1,
    type: 'tf',
    skill: 'Phân tích ý nghĩa sai số tuyệt đối, sai số tương đối và quy tròn số',
    text: 'Một nhà máy đóng gói sữa thực hiện kiểm tra thể tích thực của các hộp sữa $1\\text{ lít}$. Kết quả đo được thể hiện là $V = 998{,}5\\text{ ml} \\pm 0{,}5\\text{ ml}$.',
    items: [
      { key: 'a', text: 'Số gần đúng của thể tích hộp sữa là $a = 998{,}5\\text{ ml}$ với độ chính xác $d\' = 0{,}5\\text{ ml}$.', correct: true },
      { key: 'b', text: 'Sai số tuyệt đối của phép đo $\\Delta_a$ chắc chắn bằng đúng $0{,}5\\text{ ml}$.', correct: false },
      { key: 'c', text: 'Sai số tương đối của phép đo $\\delta_a$ không vượt quá $0{,}06\\%$.', correct: true },
      { key: 'd', text: 'Quy tròn số $a = 998{,}5$ đến hàng đơn vị ta được số $998$.', correct: false },
    ],
    explanation:
      '<strong>a) Đúng:</strong> Ký hiệu $998{,}5 \\pm 0{,}5$ có nghĩa số gần đúng là $a = 998{,}5\\text{ ml}$ và độ chính xác là $d\' = 0{,}5\\text{ ml}$.<br><strong>b) Sai:</strong> Dấu $\\pm 0{,}5\\text{ ml}$ chỉ ra rằng sai số tuyệt đối $\\Delta_a = |a - \\bar{a}| \\le 0{,}5\\text{ ml}$, tức là không vượt quá $0{,}5\\text{ ml}$ chứ không bắt buộc phải bằng đúng $0{,}5\\text{ ml}$.<br><strong>c) Đúng:</strong> Sai số tương đối $\\delta_a \\le \\dfrac{d\'}{|a|} = \\dfrac{0{,}5}{998{,}5} \\approx 0{,}00050075 = 0{,}0501\\% \\le 0{,}06\\%$.<br><strong>d) Sai:</strong> Khi quy tròn $a = 998{,}5$ đến hàng đơn vị, chữ số ở hàng phần mười là $5 \\ge 5$ nên ta cộng 1 vào chữ số hàng đơn vị, thu được $999$.',
  },
  {
    id: 'tf2',
    number: 2,
    type: 'tf',
    skill: 'Tính các số đo xu thế trung tâm của mẫu số liệu',
    text: 'Thống kê số giờ tự học trong một tuần của 10 học sinh lớp 10B thu được mẫu số liệu sau: $8, 10, 10, 12, 14, 16, 18, 18, 18, 36$.',
    items: [
      { key: 'a', text: 'Số trung bình số giờ tự học của 10 học sinh là $15$ giờ.', correct: true },
      { key: 'b', text: 'Trung vị của mẫu số liệu là $15$ giờ.', correct: true },
      { key: 'c', text: 'Mốt của mẫu số liệu trên bằng $10$ giờ.', correct: false },
      { key: 'd', text: 'Tứ phân vị thứ nhất $Q_1 = 10$ giờ và tứ phân vị thứ ba $Q_3 = 18$ giờ.', correct: true },
    ],
    explanation:
      '<strong>a) Đúng:</strong> Tổng số giờ $= 8 + 10 + 10 + 12 + 14 + 16 + 18 + 18 + 18 + 36 = 150$. Số trung bình $\\bar{x} = \\dfrac{150}{10} = 15$ giờ.<br><strong>b) Đúng:</strong> Mẫu đã sắp xếp tăng dần có 10 giá trị. Trung vị $M_e = \\dfrac{14 + 16}{2} = 15$ giờ.<br><strong>c) Sai:</strong> Giá trị $18$ xuất hiện $3$ lần (nhiều hơn $10$ chỉ xuất hiện $2$ lần), do đó mốt của mẫu số liệu là $M_0 = 18$ giờ chứ không phải $10$.<br><strong>d) Đúng:</strong> Nửa dưới gồm $8, 10, 10, 12, 14$ có trung vị $Q_1 = 10$. Nửa trên gồm $16, 18, 18, 18, 36$ có trung vị $Q_3 = 18$.',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'sa1',
    number: 1,
    type: 'shortans',
    skill: 'Quy tròn số lớn đến hàng nghìn theo độ chính xác hàng trăm',
    points: 1.0,
    text: 'Cho số gần đúng $a = 4825600$ với độ chính xác $d = 400$. Hãy quy tròn số $a$ theo quy tắc quy tròn.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: '4826000',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean === '4826000';
    },
    explanation:
      'Độ chính xác $d = 400$ ở hàng trăm, nên ta quy tròn số $a = 4825600$ đến hàng nghìn.<br>Chữ số hàng trăm của $a$ là $6 \\ge 5$, nên ta tăng chữ số hàng nghìn thêm 1 đơn vị (từ $5$ thành $6$) và thay các chữ số hàng trăm, hàng chục, hàng đơn vị bằng các số $0$.<br>Số quy tròn thu được là $4826000$.',
  },
  {
    id: 'sa2',
    number: 2,
    type: 'shortans',
    skill: 'Tính khoảng tứ phân vị từ mẫu số liệu lẻ 11 giá trị',
    points: 1.0,
    text: 'Kết quả đo chiều cao (đơn vị: cm) của 11 cây giống trong vườn ươm được ghi lại như sau: $15, 17, 18, 19, 20, 21, 22, 24, 25, 27, 38$. Tính khoảng tứ phân vị $\\Delta_Q = Q_3 - Q_1$ của mẫu số liệu trên.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: '7',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean === '7';
    },
    explanation:
      'Mẫu số liệu có $n = 11$ giá trị đã sắp xếp tăng dần:<br>$$15, 17, 18, 19, 20, 21, 22, 24, 25, 27, 38.$$<br>• Tứ phân vị thứ hai $Q_2 = 21$ (vị trí thứ 6).<br>• Nửa số liệu bên trái $Q_2$ là $15, 17, 18, 19, 20 \\implies Q_1 = 18$.<br>• Nửa số liệu bên phải $Q_2$ là $22, 24, 25, 27, 38 \\implies Q_3 = 25$.<br>• Khoảng tứ phân vị $\\Delta_Q = Q_3 - Q_1 = 25 - 18 = 7$.',
  },
  {
    id: 'sa3',
    number: 3,
    type: 'shortans',
    skill: 'Tìm giá trị phần tử chưa biết khi số trung bình bằng trung vị',
    points: 1.0,
    text: 'Điểm kiểm tra môn Toán của 5 học sinh là: $5{,}5; 6{,}0; 6{,}5; 7{,}0; x$. Biết rằng số trung bình của mẫu số liệu này bằng trung vị của mẫu số liệu. Tìm giá trị của $x$ biết $x > 7{,}0$.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: '7,5 (hoặc 7.5)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('7.5') || clean.includes('7,5');
    },
    explanation:
      'Vì $x > 7{,}0$, mẫu số liệu gồm 5 giá trị đã được sắp xếp theo thứ tự tăng dần là:<br>$$5{,}5; 6{,}0; 6{,}5; 7{,}0; x.$$<br>Trung vị của mẫu số liệu là giá trị đứng ở vị trí thứ 3: $M_e = 6{,}5$.<br>Theo đề bài, số trung bình $\\bar{x}$ bằng trung vị $M_e = 6{,}5$, do đó:<br>$$\\dfrac{5{,}5 + 6{,}0 + 6{,}5 + 7{,}0 + x}{5} = 6{,}5 \\iff \\dfrac{25{,}0 + x}{5} = 6{,}5 \\iff 25{,}0 + x = 32{,}5 \\iff x = 7{,}5.$$<br>Giá trị $x = 7{,}5$ thỏa mãn điều kiện $x > 7{,}0$.',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan10SoGanDungSaiSoDeBPage() {
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
    const ma = maHocSinh.trim() || 'HS10-TK-B';
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
        Task_ID: 'KIEM_TRA_TOAN_10_SO_GAN_DUNG_SAI_SO_DE_B_45P',
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
                placeholder="VD: HS10-TK-001"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS10-TK-B'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '10'}</span>
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
