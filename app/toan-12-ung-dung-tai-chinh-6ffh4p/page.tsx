'use client';

import React, { useState, useEffect } from 'react';
import MathContent from '@/components/MathContent';

// --- THÔNG TIN TIÊU ĐỀ TRÍCH XUẤT CHÍNH XÁC TỪ MÃ NGUỒN LATEX ---
const EXAM_TITLE = 'ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN LỚP 12 – THỜI GIAN: 45 PHÚT';
const EXAM_SUBTITLE =
  'CHỦ ĐỀ: ỨNG DỤNG TOÁN HỌC TRONG MỘT SỐ VẤN ĐỀ LIÊN QUAN ĐẾN TÀI CHÍNH';
const EXAM_TIME_NOTE =
  '(Chương trình GDPT 2018 – Bộ sách Kết nối tri thức / Cánh diều • 12 câu trắc nghiệm + 2 bài Đúng/Sai + 3 câu trả lời ngắn)';

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
    id: 'tc1',
    number: 1,
    type: 'mcq',
    skill: 'Mô hình toán học về sức mua của tiền tệ khi có lạm phát',
    points: 0.5,
    text: 'Giả sử tỷ lệ lạm phát trung bình hàng năm của một nền kinh tế là $g = 4\\%/\\text{năm}$ ($g = 0{,}04$). Theo mô hình toán học về sức mua của tiền tệ, sức mua $A$ của một khoản tiền $P = 100$ triệu đồng sau $n = 3$ năm được xác định bởi công thức nào sau đây?',
    options: [
      { text: '$A = 100 \\cdot (1 + 0{,}04)^3$', isCorrect: false },
      { text: '$A = 100 \\cdot (1 - 0{,}04 \\cdot 3)$', isCorrect: false },
      { text: '$A = 100 \\cdot (1 - 0{,}04)^3$', isCorrect: true },
      { text: '$A = \\dfrac{100}{(1 + 0{,}04)^3}$', isCorrect: false },
    ],
    explanation:
      'Lạm phát làm giảm sức mua của tiền tệ theo thời gian. Nếu tỷ lệ lạm phát hàng năm là $g$ thì sức mua $A$ của số tiền $P$ sau $n$ năm được tính theo công thức lũy thừa giảm: $A = P(1-g)^n$.<br>Thay $P = 100$, $g = 0{,}04$ và $n = 3$, ta được $A = 100 \\cdot (1 - 0{,}04)^3 = 100 \\cdot (0{,}96)^3 \\approx 88{,}47$ triệu đồng.',
  },
  {
    id: 'tc2',
    number: 2,
    type: 'mcq',
    skill: 'Công thức tính lãi kép theo kỳ hạn',
    points: 0.5,
    text: 'Bác An gửi $100$ triệu đồng vào ngân hàng với lãi suất $r = 6\\%/\\text{năm}$ theo thể thức lãi kép kỳ hạn $6$ tháng ($n = 2$ kỳ/năm). Số tiền $A$ (gốc lẫn lãi) bác An nhận được sau $t = 2$ năm gửi tiết kiệm (không rút lãi giữa chừng) được tính theo công thức nào sau đây?',
    options: [
      { text: '$A = 100 \\cdot (1 + 0{,}06 \\cdot 2)$', isCorrect: false },
      { text: '$A = 100 \\cdot \\left(1 + \\dfrac{0{,}06}{2}\\right)^4$', isCorrect: true },
      { text: '$A = 100 \\cdot (1 + 0{,}06)^2$', isCorrect: false },
      { text: '$A = 100 \\cdot \\left(1 + \\dfrac{0{,}06}{6}\\right)^2$', isCorrect: false },
    ],
    explanation:
      'Theo định nghĩa lãi kép định kỳ, số tiền thu được sau $t$ năm với lãi suất danh nghĩa $r$/năm, tính lãi $n$ kỳ trong một năm là $A = P\\left(1 + \\dfrac{r}{n}\\right)^{nt}$.<br>Ở đây $P = 100$, $r = 0{,}06$, $n = 2$, $t = 2 \\Rightarrow nt = 4$ kỳ tính lãi.<br>Do đó $A = 100 \\cdot \\left(1 + \\dfrac{0{,}06}{2}\\right)^4 = 100 \\cdot (1{,}03)^4$.',
  },
  {
    id: 'tc3',
    number: 3,
    type: 'mcq',
    skill: 'Mối quan hệ giữa lãi suất danh nghĩa, lạm phát và lãi suất thực chất',
    points: 0.5,
    text: 'Anh Nam gửi tiết kiệm $200$ triệu đồng kỳ hạn 12 tháng với lãi suất danh nghĩa $8\\%/\\text{năm}$. Biết rằng tỷ lệ lạm phát của nền kinh tế trong năm đó là $3\\%/\\text{năm}$. Lãi suất thực chất $r_{\\text{thực}}$ (có tính đến yếu tố lạm phát) của khoản tiền gửi này xấp xỉ bằng bao nhiêu?',
    options: [
      { text: '$5{,}00\\%$', isCorrect: false },
      { text: '$4{,}85\\%$', isCorrect: true },
      { text: '$5{,}15\\%$', isCorrect: false },
      { text: '$4{,}50\\%$', isCorrect: false },
    ],
    explanation:
      'Mối liên hệ giữa lãi suất danh nghĩa $r$, tỷ lệ lạm phát $g$ và lãi suất thực chất $r_{\\text{thực}}$ được cho bởi công thức:<br>$$1 + r_{\\text{thực}} = \\dfrac{1 + r}{1 + g} \\Leftrightarrow r_{\\text{thực}} = \\dfrac{r - g}{1 + g}$$<br>Thay $r = 8\\% = 0{,}08$ và $g = 3\\% = 0{,}03$ vào công thức:<br>$$r_{\\text{thực}} = \\dfrac{0{,}08 - 0{,}03}{1 + 0{,}03} = \\dfrac{0{,}05}{1{,}03} \\approx 0{,}04854 = 4{,}85\\%.$$',
  },
  {
    id: 'tc4',
    number: 4,
    type: 'mcq',
    skill: 'Xác định thời gian gửi tiết kiệm theo lãi kép',
    points: 0.5,
    text: 'Một người gửi tiết kiệm $100$ triệu đồng theo thể thức lãi kép kỳ hạn $1$ tháng với lãi suất $0{,}5\\%/\\text{tháng}$. Hỏi sau ít nhất bao nhiêu tháng thì tổng số tiền trong tài khoản của người đó đạt trên $120$ triệu đồng?',
    options: [
      { text: '$35$ tháng', isCorrect: false },
      { text: '$36$ tháng', isCorrect: false },
      { text: '$37$ tháng', isCorrect: true },
      { text: '$38$ tháng', isCorrect: false },
    ],
    explanation:
      'Số tiền tích lũy được sau $n$ tháng gửi là $A = 100 \\cdot (1 + 0{,}005)^n = 100 \\cdot (1{,}005)^n$.<br>Yêu cầu bài toán $A > 120 \\Leftrightarrow 100 \\cdot (1{,}005)^n > 120 \\Leftrightarrow (1{,}005)^n > 1{,}2$.<br>Lấy lôgarit cơ số $1{,}005$ hai vế:<br>$$n > \\log_{1{,}005}(1{,}2) = \\dfrac{\\ln 1{,}2}{\\ln 1{,}005} \\approx 36{,}55$$<br>Vì $n$ là số nguyên dương (số tháng gửi) nên $n$ nhỏ nhất thỏa mãn là $n = 37$ tháng.',
  },
  {
    id: 'tc5',
    number: 5,
    type: 'mcq',
    skill: 'Bản chất và nguyên lý hoạt động của thẻ tín dụng',
    points: 0.5,
    text: 'Thẻ tín dụng (Credit Card) là một công cụ tài chính hoạt động dựa trên nguyên lý nào sau đây?',
    options: [
      { text: 'Trừ tiền trực tiếp và ngay lập tức từ tài khoản thanh toán tiền gửi cá nhân của chủ thẻ.', isCorrect: false },
      { text: 'Tổ chức tín dụng cấp một hạn mức vay cho phép chủ thẻ tiêu trước trả sau và miễn lãi trong thời hạn quy định nếu thanh toán toàn bộ dư nợ đúng hạn.', isCorrect: true },
      { text: 'Tổ chức tín dụng trả lãi suất định kỳ hàng tháng cho chủ thẻ dựa trên số dư có trong thẻ.', isCorrect: false },
      { text: 'Chủ thẻ bắt buộc phải thế chấp tài sản có giá trị tương đương hạn mức tín dụng trước khi mở thẻ.', isCorrect: false },
    ],
    explanation:
      'Thẻ tín dụng cho phép chủ thẻ vay tiền của tổ chức tín dụng để thanh toán hàng hóa, dịch vụ trong phạm vi hạn mức tín dụng được cấp. Chủ thẻ được hưởng thời gian miễn lãi (thường từ 45 đến 55 ngày). Nếu trả đủ dư nợ trước thời hạn, chủ thẻ không phải trả lãi vay.',
  },
  {
    id: 'tc6',
    number: 6,
    type: 'mcq',
    skill: 'Vay trả góp theo dư nợ ban đầu cố định (lãi đơn)',
    points: 0.5,
    text: 'Chị Hà vay ngân hàng $120$ triệu đồng để mua xe máy trả góp trong thời hạn $24$ tháng với lãi suất $1\\%/\\text{tháng}$ tính trên dư nợ ban đầu cố định (lãi đơn). Khoản tiền cố định chị Hà phải trả ngân hàng hàng tháng (gồm cả gốc và lãi) là bao nhiêu?',
    options: [
      { text: '$5{,}0$ triệu đồng', isCorrect: false },
      { text: '$6{,}2$ triệu đồng', isCorrect: true },
      { text: '$6{,}0$ triệu đồng', isCorrect: false },
      { text: '$5{,}2$ triệu đồng', isCorrect: false },
    ],
    explanation:
      '• Số tiền gốc phải trả mỗi tháng: $G = \\dfrac{120}{24} = 5$ triệu đồng.<br>• Số tiền lãi phải trả mỗi tháng (tính cố định trên vốn gốc ban đầu $120$ triệu): $L = 120 \\cdot 1\\% = 1{,}2$ triệu đồng.<br>• Tổng số tiền cố định phải trả hàng tháng: $P = G + L = 5 + 1{,}2 = 6{,}2$ triệu đồng.',
  },
  {
    id: 'tc7',
    number: 7,
    type: 'mcq',
    skill: 'Vay ngân hàng theo thể thức lãi đơn',
    points: 0.5,
    text: 'Một doanh nghiệp vay ngân hàng $500$ triệu đồng trong thời hạn $6$ tháng với lãi suất đơn $9\\%/\\text{năm}$. Tổng số tiền cả gốc và lãi doanh nghiệp đó phải trả cho ngân hàng khi đáo hạn là bao nhiêu?',
    options: [
      { text: '$545{,}0$ triệu đồng', isCorrect: false },
      { text: '$522{,}5$ triệu đồng', isCorrect: true },
      { text: '$527{,}0$ triệu đồng', isCorrect: false },
      { text: '$518{,}5$ triệu đồng', isCorrect: false },
    ],
    explanation:
      'Thời gian vay là $t = \\dfrac{6}{12} = 0{,}5$ năm.<br>Số tiền lãi doanh nghiệp phải trả là: $I = P \\cdot r \\cdot t = 500 \\cdot 9\\% \\cdot 0{,}5 = 22{,}5$ triệu đồng.<br>Tổng số tiền phải thanh toán khi đáo hạn: $A = P + I = 500 + 22{,}5 = 522{,}5$ triệu đồng.',
  },
  {
    id: 'tc8',
    number: 8,
    type: 'mcq',
    skill: 'So sánh chi phí tiền lãi giữa hai gói vay (lãi đơn vs lãi kép)',
    points: 0.5,
    text: 'Anh Bình cần vay $200$ triệu đồng trong thời hạn $1$ năm và đang cân nhắc giữa hai gói vay:<br>• Gói vay A: Lãi suất $8\\%/\\text{năm}$, tính theo thể thức lãi đơn.<br>• Gói vay B: Lãi suất $7{,}8\\%/\\text{năm}$, tính theo thể thức lãi kép kỳ hạn $3$ tháng ($n = 4$ kỳ/năm).<br>So sánh tổng số tiền lãi anh Bình phải trả cho hai gói vay, khẳng định nào sau đây là đúng?',
    options: [
      { text: 'Gói vay A tốn ít tiền lãi hơn Gói vay B là $0{,}03$ triệu đồng.', isCorrect: false },
      { text: 'Gói vay B tốn ít tiền lãi hơn Gói vay A là $0{,}03$ triệu đồng.', isCorrect: true },
      { text: 'Chi phí tiền lãi của hai gói vay bằng nhau.', isCorrect: false },
      { text: 'Gói vay B tốn nhiều tiền lãi hơn Gói vay A là $0{,}40$ triệu đồng.', isCorrect: false },
    ],
    explanation:
      '• Tiền lãi Gói vay A (lãi đơn): $I_A = 200 \\cdot 8\\% \\cdot 1 = 16$ triệu đồng.<br>• Tổng số tiền trả Gói vay B (lãi kép): $A_B = 200 \\cdot \\left(1 + \\dfrac{0{,}078}{4}\\right)^4 = 200 \\cdot (1{,}0195)^4 \\approx 215{,}97$ triệu đồng.<br>Suy ra tiền lãi Gói vay B: $I_B = 215{,}97 - 200 = 15{,}97$ triệu đồng.<br>• Chênh lệch lãi: $I_A - I_B = 16 - 15{,}97 = 0{,}03$ triệu đồng ($30.000$ đồng).<br>Vậy Gói vay B tốn ít tiền lãi hơn Gói vay A là $0{,}03$ triệu đồng.',
  },
  {
    id: 'tc9',
    number: 9,
    type: 'mcq',
    skill: 'Quy tắc phân bổ ngân sách tài chính cá nhân 80/10/10',
    points: 0.5,
    text: 'Trong việc lập kế hoạch tài chính cá nhân, quy tắc thu chi $80/10/10$ khuyên người tiêu dùng phân bổ nguồn thu nhập hàng tháng như thế nào?',
    options: [
      { text: '$80\\%$ đầu tư mạo hiểm, $10\\%$ tiết kiệm, $10\\%$ chi tiêu thiết yếu.', isCorrect: false },
      { text: '$80\\%$ chi tiêu cho nhu cầu thiết yếu, $10\\%$ chi tiêu phát sinh linh hoạt, $10\\%$ tiết kiệm tích lũy.', isCorrect: true },
      { text: '$80\\%$ tiết kiệm dài hạn, $10\\%$ chi tiêu thiết yếu, $10\\%$ làm từ thiện.', isCorrect: false },
      { text: '$80\\%$ chi tiêu vui chơi giải trí, $10\\%$ tiết kiệm, $10\\%$ dự phòng y tế.', isCorrect: false },
    ],
    explanation:
      'Quy tắc phân bổ ngân sách $80/10/10$ định hướng: $80\\%$ thu nhập dành cho các nhu cầu sinh hoạt thiết yếu (tiền nhà, ăn uống, học phí), $10\\%$ dành cho các khoản chi tiêu linh hoạt/phát sinh, và $10\\%$ còn lại dành cho tiết kiệm và tích lũy tài chính dài hạn.',
  },
  {
    id: 'tc10',
    number: 10,
    type: 'mcq',
    skill: 'Tính giá trị hiện tại (Present Value) của một khoản tiền tương lai',
    points: 0.5,
    text: 'Một phụ huynh muốn có $500$ triệu đồng sau $5$ năm nữa để chuẩn bị cho con học đại học. Nếu gửi tiền vào quỹ đầu tư với lãi suất $7\\%/\\text{năm}$ tính theo thể thức lãi kép hàng năm, số tiền hiện tại $P$ (giá trị hiện tại) mà phụ huynh đó cần gửi ngay từ bây giờ là bao nhiêu (làm tròn đến triệu đồng)?',
    options: [
      { text: '$380$ triệu đồng', isCorrect: false },
      { text: '$356$ triệu đồng', isCorrect: true },
      { text: '$410$ triệu đồng', isCorrect: false },
      { text: '$325$ triệu đồng', isCorrect: false },
    ],
    explanation:
      'Áp dụng công thức tính giá trị hiện tại của một khoản tiền trong tương lai:<br>$$P = \\dfrac{A}{(1+r)^n}$$<br>Thay $A = 500$, $r = 7\\% = 0{,}07$ và $n = 5$:<br>$$P = \\dfrac{500}{(1 + 0{,}07)^5} = \\dfrac{500}{1{,}07^5} \\approx 356{,}49\\text{ triệu đồng} \\approx 356\\text{ triệu đồng}.$$',
  },
  {
    id: 'tc11',
    number: 11,
    type: 'mcq',
    skill: 'Giá trị tương lai của niên kim tích lũy định kỳ (Annuity)',
    points: 0.5,
    text: 'Bác Hùng lập kế hoạch hưu trí bằng cách gửi đều đặn $5$ triệu đồng vào cuối mỗi tháng vào một tài khoản tích lũy hưởng lãi suất kép $0{,}6\\%/\\text{tháng}$. Hỏi sau $10$ năm ($120$ tháng), tổng số tiền (cả gốc và lãi) bác Hùng tích lũy được trong tài khoản là bao nhiêu (làm tròn đến triệu đồng)?',
    options: [
      { text: '$600$ triệu đồng', isCorrect: false },
      { text: '$874$ triệu đồng', isCorrect: true },
      { text: '$750$ triệu đồng', isCorrect: false },
      { text: '$920$ triệu đồng', isCorrect: false },
    ],
    explanation:
      'Đây là bài toán tính giá trị tương lai của một niên kim tích lũy với các khoản tiền gửi định kỳ $P = 5$ triệu đồng ở cuối mỗi kỳ, lãi suất mỗi kỳ $i = 0{,}6\\% = 0{,}006$, số kỳ gửi $n = 120$.<br>Công thức niên kim:<br>$$A = P \\cdot \\dfrac{(1+i)^n - 1}{i}$$<br>Thay số:<br>$$A = 5 \\cdot \\dfrac{(1 + 0{,}006)^{120} - 1}{0{,}006} = 5 \\cdot \\dfrac{1{,}006^{120} - 1}{0{,}006} \\approx 5 \\cdot \\dfrac{2{,}04886 - 1}{0{,}006} \\approx 874{,}05\\text{ triệu đồng}.$$<br>Làm tròn đến hàng đơn vị triệu đồng ta được $874$ triệu đồng.',
  },
  {
    id: 'tc12',
    number: 12,
    type: 'mcq',
    skill: 'Tối ưu danh mục đầu tư kết hợp tính thuế thu nhập cá nhân',
    points: 0.5,
    text: 'Anh Mai có $100$ triệu đồng vốn và quyết định đầu tư phân bổ vào hai sản phẩm tài chính:<br>• Sản phẩm X (Trái phiếu doanh nghiệp): Lãi suất $9\\%/\\text{năm}$, tiền lãi chịu thuế thu nhập cá nhân $5\\%$.<br>• Sản phẩm Y (Tiết kiệm ngân hàng): Lãi suất $6{,}5\\%/\\text{năm}$, miễn thuế.<br>Sau $1$ năm, tổng tiền lãi thực nhận (sau thuế) của anh Mai từ cả hai khoản đầu tư là $7{,}525$ triệu đồng. Số tiền anh Mai đã đầu tư vào Sản phẩm X là bao nhiêu?',
    options: [
      { text: '$40$ triệu đồng', isCorrect: false },
      { text: '$50$ triệu đồng', isCorrect: true },
      { text: '$60$ triệu đồng', isCorrect: false },
      { text: '$70$ triệu đồng', isCorrect: false },
    ],
    explanation:
      'Lãi suất thực nhận sau thuế của Sản phẩm X:<br>$$r_X = 9\\% \\cdot (1 - 0{,}05) = 8{,}55\\%/\\text{năm} = 0{,}0855$$<br>Lãi suất thực nhận của Sản phẩm Y:<br>$$r_Y = 6{,}5\\%/\\text{năm} = 0{,}065$$<br>Gọi $x$ (triệu đồng) là số tiền đầu tư vào Sản phẩm X ($0 \\le x \\le 100$). Khi đó số tiền đầu tư vào Sản phẩm Y là $100 - x$ (triệu đồng).<br>Tổng tiền lãi net nhận được sau 1 năm là:<br>$$0{,}0855x + 0{,}065(100 - x) = 7{,}525$$<br>$$\\Leftrightarrow 0{,}0205x + 6{,}5 = 7{,}525 \\Leftrightarrow 0{,}0205x = 1{,}025 \\Leftrightarrow x = \\dfrac{1{,}025}{0{,}0205} = 50\\text{ triệu đồng}.$$',
  },
];

const RAW_TF_QUESTIONS: QuestionTF[] = [
  {
    id: 'tctf1',
    number: 13,
    type: 'tf',
    skill: 'Mô hình tiền gửi tiết kiệm, lạm phát và rút tiền trước hạn',
    text: 'Bác An gửi $500$ triệu đồng vào ngân hàng với kỳ hạn 12 tháng, lãi suất danh nghĩa $7{,}2\\%/\\text{năm}$ (tính theo lãi đơn nhận cuối kỳ). Giả sử tỷ lệ lạm phát bình quân của nền kinh tế trong năm đó giữ cố định ở mức $3{,}5\\%/\\text{năm}$. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Số tiền lãi danh nghĩa bác An nhận được sau 1 năm gửi tiết kiệm là $36$ triệu đồng.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Lãi suất thực chất $r_{\\text{thực}}$ của khoản tiền gửi tiết kiệm này (đã loại trừ ảnh hưởng của lạm phát) bằng $3{,}70\\%$.',
        correct: false,
      },
      {
        key: 'c',
        text: 'Sức mua của tổng số tiền (gốc + lãi) bác An nhận được sau 1 năm tương đương với khoảng $517{,}87$ triệu đồng ở thời điểm hiện tại.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Nếu sau $8$ tháng gửi, bác An rút toàn bộ tiền trước hạn và chịu mức lãi suất không kỳ hạn $0{,}5\\%/\\text{năm}$ (tính theo lãi đơn), thì số tiền lãi thực nhận ít hơn so với gửi đủ hạn 12 tháng là $34{,}33$ triệu đồng.',
        correct: true,
      },
    ],
    explanation:
      'a) **Đúng**. Tiền lãi danh nghĩa sau 1 năm: $I = 500 \\cdot 7{,}2\\% = 36$ triệu đồng.<br>b) **Sai**. Lãi suất thực chất tính theo công thức:<br>$$r_{\\text{thực}} = \\dfrac{r - g}{1 + g} = \\dfrac{0{,}072 - 0{,}035}{1 + 0{,}035} = \\dfrac{0{,}037}{1{,}035} \\approx 3{,}57\\% \\neq 3{,}70\\%.$$<br>c) **Đúng**. Sức mua tương đương ở thời điểm hiện tại:<br>$$A_{\\text{thực}} = \\dfrac{P + I}{1 + g} = \\dfrac{500 + 36}{1 + 0{,}035} = \\dfrac{536}{1{,}035} \\approx 517{,}87\\text{ triệu đồng}.$$<br>d) **Đúng**. Tiền lãi khi rút trước hạn sau 8 tháng ($t = \\dfrac{8}{12}$ năm) với lãi suất $0{,}5\\%/\\text{năm}$:<br>$$I_{\\text{trước hạn}} = 500 \\cdot 0{,}5\\% \\cdot \\dfrac{8}{12} \\approx 1{,}667\\text{ triệu đồng}.$$<br>Số tiền lãi bị chênh lệch giảm so với gửi đủ hạn: $36 - 1{,}667 = 34{,}333 \\approx 34{,}33$ triệu đồng.',
  },
  {
    id: 'tctf2',
    number: 14,
    type: 'tf',
    skill: 'Mô hình vay mua nhà trả góp theo phương thức dư nợ giảm dần',
    text: 'Vợ chồng anh Nam vay ngân hàng $1{,}2$ tỉ đồng ($1200$ triệu đồng) để mua nhà trả góp trong thời hạn $15$ năm ($180$ tháng). Lãi suất cho vay cố định là $8{,}4\\%/\\text{năm}$ ($0{,}7\\%/\\text{tháng}$), trả định kỳ hàng tháng theo phương thức dư nợ giảm dần với khoản thanh toán cố định $P$. Xét tính đúng/sai của các mệnh đề sau:',
    items: [
      {
        key: 'a',
        text: 'Lãi suất tính theo tháng áp dụng cho khoản vay này là $i = 0{,}7\\% = 0{,}007$.',
        correct: true,
      },
      {
        key: 'b',
        text: 'Khoản tiền $P$ anh Nam phải trả cố định hàng tháng (làm tròn đến hàng phần nghìn triệu đồng) là $11{,}736$ triệu đồng.',
        correct: true,
      },
      {
        key: 'c',
        text: 'Tổng số tiền lãi mà vợ chồng anh Nam phải trả cho ngân hàng trong suốt $15$ năm vay xấp xỉ $912{,}48$ triệu đồng.',
        correct: true,
      },
      {
        key: 'd',
        text: 'Ngay sau khi trả xong kỳ thứ $60$ (hết $5$ năm), dư nợ gốc còn lại của khoản vay là $700$ triệu đồng.',
        correct: false,
      },
    ],
    explanation:
      'a) **Đúng**. Lãi suất hàng tháng $i = \\dfrac{8{,}4\\%}{12} = 0{,}7\\% = 0{,}007$.<br>b) **Đúng**. Áp dụng công thức tính khoản thanh toán trả góp hàng tháng cho dư nợ giảm dần:<br>$$P = V \\cdot \\dfrac{i}{1 - (1+i)^{-n}} = 1200 \\cdot \\dfrac{0{,}007}{1 - (1 + 0{,}007)^{-180}} = 1200 \\cdot \\dfrac{0{,}007}{1 - 1{,}007^{-180}} \\approx 11{,}736\\text{ triệu đồng}.$$<br>c) **Đúng**. Tổng số tiền phải trả sau 180 tháng: $11{,}736 \\cdot 180 = 2112{,}48$ triệu đồng.<br>Tổng tiền lãi phải trả: $2112{,}48 - 1200 = 912{,}48$ triệu đồng.<br>d) **Sai**. Sau 60 kỳ, số kỳ thanh toán còn lại là $180 - 60 = 120$ kỳ. Dư nợ gốc còn lại chính là giá trị hiện tại của 120 khoản trả góp còn lại:<br>$$V_{120} = P \\cdot \\dfrac{1 - (1+i)^{-120}}{i} = 11{,}736 \\cdot \\dfrac{1 - (1{,}007)^{-120}}{0{,}007} \\approx 951{,}32\\text{ triệu đồng} \\neq 700\\text{ triệu đồng}.$$',
  },
];

const RAW_SHORTANS_QUESTIONS: QuestionShortAns[] = [
  {
    id: 'tcsa1',
    number: 15,
    type: 'shortans',
    skill: 'Tìm số tháng tích lũy để đạt giá trị mục tiêu trong niên kim',
    points: 0.7,
    text: 'Chị Lan bắt đầu lập quỹ tiết kiệm du học cho con bằng cách gửi đều đặn $6$ triệu đồng vào ngân hàng vào cuối mỗi tháng, hưởng lãi suất $0{,}5\\%/\\text{tháng}$ (tính theo thể thức lãi kép). Hỏi sau ít nhất bao nhiêu tháng gửi liên tục thì tổng số tiền tích lũy trong quỹ du học của chị Lan sẽ vượt quá $300$ triệu đồng?',
    placeholder: 'Nhập số tháng (VD: 24)',
    correctDisplay: '45',
    explanation:
      'Áp dụng công thức tính tổng số tiền của một niên kim tích lũy gửi cuối mỗi kỳ:<br>$$A = P \\cdot \\dfrac{(1+i)^n - 1}{i}$$<br>Với $P = 6$ triệu đồng, $i = 0{,}5\\% = 0{,}005$, ta cần tìm $n$ nguyên dương nhỏ nhất sao cho $A > 300$:<br>$$6 \\cdot \\dfrac{(1 + 0{,}005)^n - 1}{0{,}005} > 300 \\Leftrightarrow (1{,}005)^n - 1 > \\dfrac{300 \\cdot 0{,}005}{6} = 0{,}25$$<br>$$\\Leftrightarrow (1{,}005)^n > 1{,}25 \\Leftrightarrow n > \\log_{1{,}005}(1{,}25) = \\dfrac{\\ln 1{,}25}{\\ln 1{,}005} \\approx 44{,}74.$$<br>Vì $n$ là số nguyên dương đại diện cho số tháng gửi nên $n = 45$.',
    validator: (val: string) => {
      const clean = val.trim().replace(/tháng/gi, '').trim();
      return clean === '45';
    },
  },
  {
    id: 'tcsa2',
    number: 16,
    type: 'shortans',
    skill: 'Vay trả góp nhiều năm với lãi suất biến đổi qua từng năm',
    points: 0.7,
    text: 'Doanh nghiệp A vay ngân hàng $2$ tỉ đồng ($2000$ triệu đồng) để mở rộng sản xuất với thời hạn $3$ năm. Hợp đồng quy định: Mỗi năm doanh nghiệp trả một khoản tiền cố định $M$ (gồm cả gốc và lãi) vào cuối mỗi năm. Lãi suất tính theo thể thức lãi kép với mức lãi suất năm thứ nhất là $8\\%/\\text{năm}$, năm thứ hai là $9\\%/\\text{năm}$, và năm thứ ba là $10\\%/\\text{năm}$. Tính số tiền $M$ mà doanh nghiệp phải trả hàng năm để tất toán hết nợ sau 3 năm (kết quả làm tròn đến hàng đơn vị triệu đồng).',
    placeholder: 'Nhập số tiền (triệu đồng, VD: 150)',
    correctDisplay: '785',
    explanation:
      'Ký hiệu vốn vay ban đầu $V_0 = 2000$ triệu đồng.<br>• Dư nợ cuối năm 1 sau khi trả khoản $M$: $V_1 = V_0(1 + 0{,}08) - M = 2000 \\cdot 1{,}08 - M = 2160 - M$.<br>• Dư nợ cuối năm 2 sau khi trả khoản $M$: $V_2 = V_1(1 + 0{,}09) - M = (2160 - M) \\cdot 1{,}09 - M = 2354{,}4 - 2{,}09M$.<br>• Dư nợ cuối năm 3 sau khi trả khoản $M$: $V_3 = V_2(1 + 0{,}10) - M = (2354{,}4 - 2{,}09M) \\cdot 1{,}10 - M = 2589{,}84 - 3{,}299M$.<br>Để tất toán toàn bộ khoản nợ sau 3 năm thì $V_3 = 0$:<br>$$2589{,}84 - 3{,}299M = 0 \\Leftrightarrow M = \\dfrac{2589{,}84}{3{,}299} \\approx 785{,}038\\text{ triệu đồng}.$$<br>Làm tròn đến triệu đồng ta được $785$ triệu đồng.',
    validator: (val: string) => {
      const clean = val.trim().replace(/triệu( đồng)?/gi, '').trim();
      return clean === '785';
    },
  },
  {
    id: 'tcsa3',
    number: 17,
    type: 'shortans',
    skill: 'So sánh lợi nhuận sau thuế giữa kênh tiết kiệm và quỹ mở',
    points: 0.6,
    text: 'Anh Hoàng có số vốn ban đầu $100$ triệu đồng và muốn đầu tư trong vòng $10$ năm. Anh cân nhắc giữa hai kênh đầu tư:<br>• Kênh A (Gửi tiết kiệm ngân hàng): Lãi suất $6\\%/\\text{năm}$, tính theo lãi kép hàng năm, miễn thuế.<br>• Kênh B (Đầu tư quỹ mở): Lãi suất kỳ vọng $8\\%/\\text{năm}$, tính theo lãi kép hàng năm, nhưng tiền lãi thu được mỗi năm phải chịu thuế thu nhập cá nhân $5\\%$.<br>Hỏi sau $10$ năm, số tiền thu về từ Kênh B nhiều hơn Kênh A bao nhiêu triệu đồng (kết quả làm tròn đến chữ số thập phân thứ nhất)?',
    placeholder: 'Nhập kết quả (VD: 15.5 hoặc 15,5)',
    correctDisplay: '28.9',
    explanation:
      '• **Kênh A**: Lãi suất thực nhận $r_A = 6\\% = 0{,}06$/năm.<br>Số tiền thu được sau 10 năm:<br>$$S_A = 100 \\cdot (1 + 0{,}06)^{10} = 100 \\cdot 1{,}06^{10} \\approx 179{,}085\\text{ triệu đồng}.$$<br>• **Kênh B**: Tiền lãi chịu thuế $5\\%$, do đó lãi suất thực nhận sau thuế mỗi năm là:<br>$$r_B = 8\\% \\cdot (1 - 0{,}05) = 7{,}6\\%/\\text{năm} = 0{,}076.$$<br>Số tiền thu được sau 10 năm:<br>$$S_B = 100 \\cdot (1 + 0{,}076)^{10} = 100 \\cdot 1{,}076^{10} \\approx 208{,}034\\text{ triệu đồng}.$$<br>• Chênh lệch số tiền thu về giữa Kênh B và Kênh A:<br>$$\\Delta S = S_B - S_A = 208{,}034 - 179{,}085 = 28{,}949 \\approx 28{,}9\\text{ triệu đồng}.$$',
    validator: (val: string) => {
      const clean = val.trim().replace(',', '.').replace(/triệu( đồng)?/gi, '').trim();
      return clean === '28.9';
    },
  },
];

export default function Toan12TaiChinhPage() {
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
    const ma = maHocSinh.trim() || 'HS12-TC-01';
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

    // Chấm Phần I (12 câu MCQ, 0.5đ/câu = 6.0đ)
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

    // Chấm Phần III (3 câu ngắn, 0.7 + 0.7 + 0.6 = 2.0đ)
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

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-8">
        {/* KHỐI THÔNG TIN ĐỀ THI */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-sky-100/50 blur-2xl pointer-events-none" />
          <div className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 mb-3 border border-sky-200">
            TOÁN 12 • CHỦ ĐỀ TÀI CHÍNH
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
                placeholder="VD: HS12-TC-001"
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
                  Mã số: <span className="font-mono font-bold text-white">{maHocSinh || 'HS12-TC-01'}</span> • Lớp: <span className="font-semibold text-white">{lopNhom || '12'}</span>
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100">
                  <span>Phần I: <strong>{diemPhan1.toFixed(2)}/6.0đ</strong> ({soCauDungMCQ}/12 câu đúng)</span>
                  <span>Phần II: <strong>{diemPhan2.toFixed(2)}/2.0đ</strong></span>
                  <span>Phần III: <strong>{diemPhan3.toFixed(2)}/2.0đ</strong></span>
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
        {/* PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN (12 CÂU - 6,0 ĐIỂM)   */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-sky-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (12 CÂU - 6,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-sky-800/80 px-3 py-1 rounded-full text-sky-200 font-medium">
              0,5 điểm / câu • 4 lựa chọn (1 đáp án đúng duy nhất)
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
                        {isStudentCorrect ? '✓ Đúng (+0.5đ)' : '✕ Sai (+0.0đ)'}
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
        {/* PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (2 BÀI - 2,0 ĐIỂM)          */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-emerald-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (2 BÀI - 2,0 ĐIỂM)
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
        {/* PHẦN III: TRẢ LỜI NGẮN (3 CÂU - 2,0 ĐIỂM)                 */}
        {/* ======================================================== */}
        <section className="space-y-5">
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <h2 className="text-base font-bold tracking-wide">
              PHẦN III. CÂU HỎI TRẢ LỜI NGẮN (3 CÂU - 2,0 ĐIỂM)
            </h2>
            <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 font-medium">
              Nhập giá trị số chính xác • Câu 15: 0.7đ | Câu 16: 0.7đ | Câu 17: 0.6đ
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
