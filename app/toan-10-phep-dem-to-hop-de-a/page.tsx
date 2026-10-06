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
// DỮ LIỆU ĐỀ THI ĐẠI SỐ TỔ HỢP - ĐỀ A (45 PHÚT)
// CHỦ ĐỀ: PHÉP ĐẾM CƠ BẢN VÀ NÂNG CAO
// ==========================================

// PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (14 CÂU - 7,0 ĐIỂM, 0.5Đ/CÂU)
const MCQ_QUESTIONS_PHEP_DEM_DE_A: QuestionMCQ[] = [
  {
    id: 'pda1',
    number: 1,
    type: 'mcq',
    skill: 'Quy tắc cộng - nhân và phương pháp phần bù trong tổ hợp',
    points: 0.5,
    text: 'Một câu lạc bộ Toán học gồm $12$ học sinh Nam và $8$ học sinh Nữ. Cần chọn ra một nhóm gồm $3$ học sinh đại diện tham gia hội thảo khoa học. Hỏi có bao nhiêu cách chọn sao cho nhóm được chọn có cả học sinh Nam và học sinh Nữ?',
    options: [
      { key: 'A', text: '$864$' },
      { key: 'B', text: '$1728$' },
      { key: 'C', text: '$1140$' },
      { key: 'D', text: '$2244$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong><br><strong>Cách 1 (Phương pháp Trực tiếp - Phân hoạch trường hợp):</strong><br>- Trường hợp 1: Chọn $1$ Nam và $2$ Nữ: $C_{12}^1 \\times C_8^2 = 12 \\times 28 = 336$ cách.<br>- Trường hợp 2: Chọn $2$ Nam và $1$ Nữ: $C_{12}^2 \\times C_8^1 = 66 \\times 8 = 528$ cách.<br>Tổng số cách chọn hợp lệ là: $336 + 528 = 864$ cách.<br><br><strong>Cách 2 (Phương pháp Phần bù):</strong><br>- Tổng số cách chọn $3$ học sinh tùy ý từ $20$ học sinh: $C_{20}^3 = 1140$ cách.<br>- Số cách chọn $3$ học sinh toàn Nam: $C_{12}^3 = 220$ cách.<br>- Số cách chọn $3$ học sinh toàn Nữ: $C_8^3 = 56$ cách.<br>Số cách chọn hợp lệ là: $1140 - (220 + 56) = 864$ cách.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'pda2',
    number: 2,
    type: 'mcq',
    skill: 'Đếm số tự nhiên chẵn gồm các chữ số đôi một khác nhau',
    points: 0.5,
    text: 'Từ các chữ số thuộc tập hợp $S = \\{0, 1, 2, 3, 4, 5, 6\\}$, lập được bao nhiêu số tự nhiên gồm $4$ chữ số đôi một khác nhau và là một số chẵn?',
    options: [
      { key: 'A', text: '$360$' },
      { key: 'B', text: '$420$' },
      { key: 'C', text: '$450$' },
      { key: 'D', text: '$504$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Gọi số tự nhiên cần lập có dạng $\\overline{abcd}$ với $a, b, c, d \\in S, a \\neq 0$ và $a, b, c, d$ đôi một khác nhau.<br>Do số cần lập là số chẵn nên $d \\in \\{0, 2, 4, 6\\}$. Ta phân rã thành $2$ trường hợp để đảm bảo tính độc lập của vị trí $a \\neq 0$:<br>- <strong>Trường hợp 1: $d = 0$</strong> ($1$ cách chọn $d$). Chữ số $a$ chọn từ $S \\setminus \\{0\\}$: $6$ cách. Chữ số $b$ chọn từ $S \\setminus \\{0, a\\}$: $5$ cách. Chữ số $c$ chọn từ $S \\setminus \\{0, a, b\\}$: $4$ cách. Số cách lập ở TH1: $1 \\times 6 \\times 5 \\times 4 = 120$ số.<br>- <strong>Trường hợp 2: $d \\in \\{2, 4, 6\\}$</strong> ($3$ cách chọn $d$). Chữ số $a$ chọn từ $S \\setminus \\{0, d\\}$: $5$ cách (do $a \\neq 0$). Chữ số $b$ chọn từ $S \\setminus \\{a, d\\}$: $5$ cách (kể cả số $0$). Chữ số $c$ chọn từ $S \\setminus \\{a, b, d\\}$: $4$ cách. Số cách lập ở TH2: $3 \\times 5 \\times 5 \\times 4 = 300$ số.<br>Tổng số các số chẵn thỏa mãn là: $120 + 300 = 420$ số.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pda3',
    number: 3,
    type: 'mcq',
    skill: 'Số nghiệm nguyên không âm và mô hình Vách ngăn Euler',
    points: 0.5,
    text: 'Số nghiệm nguyên không âm $(x_1, x_2, x_3, x_4)$ của phương trình đại số $x_1 + x_2 + x_3 + x_4 = 12$ bằng bao nhiêu?',
    options: [
      { key: 'A', text: '$220$' },
      { key: 'B', text: '$165$' },
      { key: 'C', text: '$455$' },
      { key: 'D', text: '$1820$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Bài toán tương đương với việc chia $12$ phần thưởng giống hệt nhau (kẹo Euler) cho $4$ người sao cho mỗi người có thể nhận từ $0$ đến $12$ phần thưởng ($x_i \\ge 0$).<br>Sử dụng mô hình Vách ngăn Euler (Stars and Bars):<br>Xếp $12$ phần tử và $4 - 1 = 3$ vách ngăn thành một hàng ngang gồm $12 + 3 = 15$ vị trí.<br>Số cách chọn $3$ vị trí đặt vách ngăn trong $15$ vị trí chính là số nghiệm nguyên không âm:<br>$$N = C_{12 + 4 - 1}^{4 - 1} = C_{15}^3 = \\frac{15 \\times 14 \\times 13}{3 \\times 2 \\times 1} = 455 \\text{ (nghiệm)}.$$<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'pda4',
    number: 4,
    type: 'mcq',
    skill: 'Hoán vị lặp của tập hợp đa phần tử',
    points: 0.5,
    text: 'Có bao nhiêu chuỗi ký tự khác nhau có thể tạo thành bằng cách sắp xếp tất cả các chữ cái trong từ tiếng Anh "MATHEMATICS"?',
    options: [
      { key: 'A', text: '$4989600$' },
      { key: 'B', text: '$9979200$' },
      { key: 'C', text: '$19958400$' },
      { key: 'D', text: '$39916800$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Từ "MATHEMATICS" gồm tổng cộng $11$ chữ cái.<br>Thống kê tần suất lặp của các nhóm chữ cái:<br>- Chữ M xuất hiện $2$ lần.<br>- Chữ A xuất hiện $2$ lần.<br>- Chữ T xuất hiện $2$ lần.<br>- Các chữ H, E, I, C, S mỗi chữ xuất hiện $1$ lần.<br>Áp dụng công thức Hoán vị lặp $P_n(n_1, n_2, \\dots, n_k) = \\frac{n!}{n_1! n_2! \\dots n_k!}$, tổng số chuỗi ký tự phân biệt tạo thành là:<br>$$N = \\frac{11!}{2! \\times 2! \\times 2! \\times 1! \\times 1! \\times 1! \\times 1! \\times 1!} = \\frac{39916800}{8} = 4989600 \\text{ (chuỗi)}.$$<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'pda5',
    number: 5,
    type: 'mcq',
    skill: 'Phương pháp buộc khối (Block Binding) trong bài toán xếp vị trí',
    points: 0.5,
    text: 'Xếp $6$ học sinh gồm $3$ học sinh lớp 12A, $2$ học sinh lớp 12B và $1$ học sinh lớp 12C thành một hàng ngang. Hỏi có bao nhiêu cách xếp sao cho các học sinh học cùng một lớp luôn đứng cạnh nhau?',
    options: [
      { key: 'A', text: '$36$' },
      { key: 'B', text: '$72$' },
      { key: 'C', text: '$144$' },
      { key: 'D', text: '$432$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng Phương pháp Buộc khối (Block Binding):<br>- Gom $3$ học sinh lớp 12A thành khối $X_A$. Số cách hoán vị nội bộ khối $X_A$ là $3! = 6$ cách.<br>- Gom $2$ học sinh lớp 12B thành khối $X_B$. Số cách hoán vị nội bộ khối $X_B$ là $2! = 2$ cách.<br>- Học sinh lớp 12C tạo thành khối $X_C$ có $1! = 1$ cách.<br>- Coi $X_A, X_B, X_C$ là $3$ phần tử hoán vị. Số cách xếp $3$ khối này vào hàng ngang là $3! = 6$ cách.<br>Theo quy tắc nhân, tổng số cách xếp hàng hợp lệ là:<br>$$N = (3! \\times 2! \\times 1!) \\times 3! = 6 \\times 2 \\times 1 \\times 6 = 72 \\text{ (cách)}.$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pda6',
    number: 6,
    type: 'mcq',
    skill: 'Phương pháp chèn khe (Insertion Method) cho điều kiện cách ly',
    points: 0.5,
    text: 'Xếp $5$ học sinh nam và $3$ học sinh nữ thành một hàng ngang sao cho không có bất kỳ hai học sinh nữ nào đứng cạnh nhau. Số cách xếp thỏa mãn là:',
    options: [
      { key: 'A', text: '$7200$' },
      { key: 'B', text: '$14400$' },
      { key: 'C', text: '$28800$' },
      { key: 'D', text: '$43200$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng Phương pháp Chèn khe (Insertion Method) cho điều kiện cách ly:<br>- <strong>Bước 1:</strong> Bỏ qua điều kiện học sinh nữ, tiến hành xếp $5$ học sinh nam thành một hàng ngang trước. Số cách xếp $5$ nam là $P_5 = 5! = 120$ cách.<br>- <strong>Bước 2:</strong> $5$ học sinh nam đứng xếp hàng sẽ tạo ra tổng cộng $6$ khoảng trống (khe hở) bao gồm $4$ khe ở giữa và $2$ khe ở hai đầu:<br>$$\\underline{\\quad} \\text{Nam}_1 \\underline{\\quad} \\text{Nam}_2 \\underline{\\quad} \\text{Nam}_3 \\underline{\\quad} \\text{Nam}_4 \\underline{\\quad} \\text{Nam}_5 \\underline{\\quad}$$<br>- <strong>Bước 3:</strong> Để $3$ học sinh nữ không đứng cạnh nhau, ta chọn $3$ khe trống từ $6$ khe hở và xếp $3$ học sinh nữ vào đó (có phân biệt thứ tự). Số cách thực hiện là một chỉnh hợp chập $3$ của $6$: $A_6^3 = 120$ cách.<br>Theo quy tắc nhân, tổng số cách xếp hàng thỏa mãn là: $120 \\times 120 = 14400$ cách.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pda7',
    number: 7,
    type: 'mcq',
    skill: 'Phân phối phần tử phân biệt (Chỉnh hợp lặp / Ánh xạ tập hợp)',
    points: 0.5,
    text: 'Có $5$ lá thư phân biệt cần được gửi vào $3$ hòm thư phân biệt. Biết rằng mỗi hòm thư có khả năng chứa số lượng lá thư tùy ý (kể cả trường hợp hòm thư để trống). Số cách phân phối toàn bộ lá thư vào các hòm thư là:',
    options: [
      { key: 'A', text: '$125$' },
      { key: 'B', text: '$60$' },
      { key: 'C', text: '$243$' },
      { key: 'D', text: '$35$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Xác định chủ thể thực hiện hành vi chọn lựa trong bài toán phân phối:<br>- Mỗi lá thư là một chủ thể chủ động cần chọn $1$ trong $3$ hòm thư để đi vào.<br>- Lá thư thứ 1 có $3$ cách chọn hòm thư.<br>- Lá thư thứ 2 có $3$ cách chọn hòm thư độc lập.<br>- Lập luận tương tự, mỗi lá thư trong $5$ lá thư đều có đúng $3$ lựa chọn hòm thư.<br>Áp dụng quy tắc nhân (mô hình chỉnh hợp lặp / ánh xạ tập hợp $|Y|^{|X|}$ với $|Y|=3, |X|=5$):<br>$$N = 3 \\times 3 \\times 3 \\times 3 \\times 3 = 3^5 = 243 \\text{ (cách)}.$$<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'pda8',
    number: 8,
    type: 'mcq',
    skill: 'Đếm tập con lập thành cấp số cộng bằng tính chất chẵn lẻ',
    points: 0.5,
    text: 'Cho tập hợp $S = \\{1, 2, 3, \\dots, 20\\}$. Có bao nhiêu tập con gồm $3$ phần tử $\\{a, b, c\\}$ của tập $S$ thỏa mãn $a < b < c$ và các phần tử $a, b, c$ lập thành một cấp số cộng?',
    options: [
      { key: 'A', text: '$45$' },
      { key: 'B', text: '$90$' },
      { key: 'C', text: '$114$' },
      { key: 'D', text: '$180$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Ba số $a, b, c$ theo thứ tự $a < b < c$ lập thành một cấp số cộng khi và chỉ khi:<br>$$a + c = 2b.$$<br>Đẳng thức này khẳng định rằng $a$ và $c$ bắt buộc phải <strong>cùng tính chẵn lẻ</strong> (vì tổng $a + c$ phải là một số chẵn $2b$). Đồng thời, khi chọn được cặp số $(a, c)$ cùng tính chẵn lẻ với $a < c$, giá trị trung vị $b = \\frac{a+c}{2}$ hoàn toàn được xác định duy nhất.<br>Tập $S = \\{1, 2, \\dots, 20\\}$ chứa $10$ số chẵn và $10$ số lẻ.<br>- Chọn $2$ số chẵn từ $10$ số chẵn làm cặp $(a, c)$: có $C_{10}^2 = 45$ cách.<br>- Chọn $2$ số lẻ từ $10$ số lẻ làm cặp $(a, c)$: có $C_{10}^2 = 45$ cách.<br>Tổng số tập con thỏa mãn là: $45 + 45 = 90$ tập con.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pda9',
    number: 9,
    type: 'mcq',
    skill: 'Phương pháp vách ngăn Euler kết hợp Nguyên lý Bao hàm - Loại trừ (PIE)',
    points: 0.5,
    text: 'Tìm số nghiệm nguyên $(x_1, x_2, x_3, x_4)$ của phương trình đại số $x_1 + x_2 + x_3 + x_4 = 20$ thỏa mãn điều kiện ràng buộc cận trên $0 \\le x_i \\le 7$ với mọi $i \\in \\{1, 2, 3, 4\\}$.',
    options: [
      { key: 'A', text: '$121$' },
      { key: 'B', text: '$161$' },
      { key: 'C', text: '$210$' },
      { key: 'D', text: '$251$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Sử dụng Phương pháp Vách ngăn Euler kết hợp Nguyên lý Bao hàm - Loại trừ (PIE):<br>- <strong>Bước 1:</strong> Số nghiệm nguyên không âm tự do ($x_i \\ge 0$) là:<br>$$N_0 = C_{20 + 4 - 1}^{4 - 1} = C_{23}^3 = 1771 \\text{ (nghiệm)}.$$<br>- <strong>Bước 2:</strong> Xét biến vi phạm điều kiện $x_i \\le 7$, tức là $x_i \\ge 8$.<br>- <em>Xét 1 biến vi phạm ($x_1 \\ge 8$):</em> Đặt $y_1 = x_1 - 8 \\ge 0$. Phương trình thành $y_1 + x_2 + x_3 + x_4 = 12$. Số nghiệm là $C_{12+3}^3 = C_{15}^3 = 455$. Số trường hợp chọn 1 biến vi phạm trong 4 biến là $C_4^1 \\times 455 = 1820$.<br>- <em>Xét 2 biến vi phạm đồng thời ($x_1 \\ge 8, x_2 \\ge 8$):</em> Đặt $y_1 = x_1 - 8 \\ge 0, y_2 = x_2 - 8 \\ge 0$. Phương trình thành $y_1 + y_2 + x_3 + x_4 = 4$. Số nghiệm là $C_{4+3}^3 = C_7^3 = 35$. Số trường hợp chọn 2 biến vi phạm trong 4 biến là $C_4^2 \\times 35 = 210$.<br>- <em>Xét $\\ge 3$ biến vi phạm:</em> Tổng tối thiểu $3 \\times 8 = 24 > 20 \\implies 0$ nghiệm.<br>- <strong>Bước 3:</strong> Áp dụng công thức PIE đan dấu:<br>$$N = N_0 - \\text{Vi phạm 1} + \\text{Vi phạm 2} = 1771 - 1820 + 210 = 161 \\text{ (nghiệm)}.$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pda10',
    number: 10,
    type: 'mcq',
    skill: 'Hoán vị lệch toàn cục (Derangement)',
    points: 0.5,
    text: 'Một nhóm gồm $5$ bạn sinh viên tham gia trò chơi bốc thăm đổi quà Giáng sinh. Mỗi bạn chuẩn bị $1$ món quà và bỏ vào hòm chung, sau đó mỗi bạn bốc ngẫu nhiên $1$ món quà từ hòm. Hỏi có bao nhiêu cách bốc quà sao cho không có sinh viên nào bốc trúng món quà do chính mình chuẩn bị?',
    options: [
      { key: 'A', text: '$24$' },
      { key: 'B', text: '$44$' },
      { key: 'C', text: '$53$' },
      { key: 'D', text: '$96$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Yêu cầu "không có sinh viên nào bốc trúng quà của chính mình" chính là mô hình <strong>Hoán vị lệch toàn cục (Derangement)</strong> của $5$ phần tử, ký hiệu $D_5$ (hoặc $!5$).<br>Áp dụng công thức Bao hàm - Loại trừ cho hoán vị lệch:<br>$$D_n = n! \\sum_{k=0}^n \\frac{(-1)^k}{k!} = n! \\left( 1 - \\frac{1}{1!} + \\frac{1}{2!} - \\frac{1}{3!} + \\dots + \\frac{(-1)^n}{n!} \\right).$$<br>Với $n = 5$:<br>$$D_5 = 5! \\left( \\frac{1}{2!} - \\frac{1}{3!} + \\frac{1}{4!} - \\frac{1}{5!} \\right) = 120 \\left( \\frac{1}{2} - \\frac{1}{6} + \\frac{1}{24} - \\frac{1}{120} \\right) = 60 - 20 + 5 - 1 = 44 \\text{ (cách)}.$$<br>(Hoặc sử dụng hệ thức truy hồi $D_n = (n-1)(D_{n-1} + D_{n-2})$ với $D_1=0, D_2=1 \\implies D_3=2, D_4=9 \\implies D_5 = 4 \\times (9 + 2) = 44$).<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pda11',
    number: 11,
    type: 'mcq',
    skill: 'Đường đi trên lưới tọa độ nguyên (Lattice Path) có điểm cấm',
    points: 0.5,
    text: 'Một con robot di chuyển từ điểm $A(0,0)$ đến điểm $B(5,4)$ trên lưới tọa độ nguyên. Mỗi bước robot chỉ có thể di chuyển sang phải $1$ đơn vị ($R$) hoặc đi lên trên $1$ đơn vị ($U$). Hỏi có bao nhiêu quỹ đạo di chuyển từ $A$ đến $B$ sao cho robot không đi qua điểm $M(2,2)$?',
    options: [
      { key: 'A', text: '$56$' },
      { key: 'B', text: '$66$' },
      { key: 'C', text: '$72$' },
      { key: 'D', text: '$84$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong><br>- <strong>Bước 1 (Không gian mẫu):</strong> Để đi từ $A(0,0)$ đến $B(5,4)$, robot cần thực hiện đúng $5$ bước $R$ và $4$ bước $U$ (tổng $9$ bước).<br>Số quỹ đạo tùy ý là: $N_{\\text{tổng}} = C_{5+4}^4 = C_9^4 = 126$ đường.<br>- <strong>Bước 2 (Số quỹ đạo bị cấm - đi qua $M(2,2)$):</strong><br>- Quá trình đi từ $A(0,0)$ đến $M(2,2)$: Cần $2$ bước $R$ và $2$ bước $U \\implies C_{2+2}^2 = C_4^2 = 6$ đường.<br>- Quá trình đi từ $M(2,2)$ đến $B(5,4)$: Cần $5-2=3$ bước $R$ và $4-2=2$ bước $U \\implies C_{3+2}^2 = C_5^2 = 10$ đường.<br>- Số đường đi qua $M$ là: $6 \\times 10 = 60$ đường.<br>- <strong>Bước 3 (Kết luận):</strong> Số quỹ đạo không đi qua $M$ là: $126 - 60 = 66$ đường.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pda12',
    number: 12,
    type: 'mcq',
    skill: 'Đếm chuỗi ký tự mật khẩu có điều kiện chẵn lẻ và chữ số đầu',
    points: 0.5,
    text: 'Một hệ thống an ninh yêu cầu thiết lập mật khẩu gồm $8$ ký tự được chọn từ tập chữ số $\\{0, 1, 2, \\dots, 9\\}$ (các chữ số được phép lặp lại). Mật khẩu được gọi là an toàn nếu chứa đúng $3$ chữ số lẻ, $5$ chữ số chẵn và chữ số đầu tiên của mật khẩu không được phép là chữ số $0$. Hệ thống có thể tạo ra bao nhiêu mật khẩu an toàn?',
    options: [
      { key: 'A', text: '$12109375$' },
      { key: 'B', text: '$15625000$' },
      { key: 'C', text: '$19140625$' },
      { key: 'D', text: '$23437500$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Tập chữ số lẻ $L = \\{1, 3, 5, 7, 9\\}$ ($5$ phần tử); Tập chữ số chẵn $C = \\{0, 2, 4, 6, 8\\}$ ($5$ phần tử).<br>Phân rã thành $2$ trường hợp dựa trên chữ số đầu tiên $a_1$:<br>- <strong>Trường hợp 1: Chữ số $a_1$ là chữ số LẺ</strong> ($5$ cách chọn $a_1$).<br>+ Chọn $2$ vị trí cho $2$ chữ số lẻ còn lại trong $7$ vị trí sau: $C_7^2 = 21$ cách.<br>+ Điền $2$ chữ số lẻ vào $2$ vị trí đó (cho phép lặp): $5^2 = 25$ cách.<br>+ Điền $5$ chữ số chẵn vào $5$ vị trí còn lại (kể cả số $0$): $5^5 = 3125$ cách.<br>+ Số mật khẩu TH1: $5 \\times 21 \\times 25 \\times 3125 = 8203125$.<br>- <strong>Trường hợp 2: Chữ số $a_1$ là chữ số CHẴN KHÁC $0$</strong> ($4$ cách chọn $a_1 \\in \\{2, 4, 6, 8\\}$).<br>+ Chọn $3$ vị trí cho $3$ chữ số lẻ trong $7$ vị trí sau: $C_7^3 = 35$ cách.<br>+ Điền $3$ chữ số lẻ vào $3$ vị trí đó: $5^3 = 125$ cách.<br>+ Điền $4$ chữ số chẵn vào $4$ vị trí chẵn còn lại: $5^4 = 625$ cách.<br>+ Số mật khẩu TH2: $4 \\times 35 \\times 125 \\times 625 = 10937500$.<br>Tổng số mật khẩu an toàn là: $8203125 + 10937500 = 19140625$ mật khẩu.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'pda13',
    number: 13,
    type: 'mcq',
    skill: 'Bổ đề Kaplansky chọn phần tử không kề nhau trên chu trình vòng',
    points: 0.5,
    text: 'Có $12$ người ngồi xung quanh một chiếc bàn tròn. Cần chọn ra một nhóm $4$ người để thành lập ban quản trị sao cho không có bất kỳ hai người nào trong nhóm ngồi cạnh nhau. Hỏi có bao nhiêu cách chọn?',
    options: [
      { key: 'A', text: '$70$' },
      { key: 'B', text: '$105$' },
      { key: 'C', text: '$126$' },
      { key: 'D', text: '$210$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Sử dụng Bổ đề Kaplansky chọn $k$ đối tượng không kề nhau từ $n$ đối tượng xếp trên một chu trình vòng:<br>$$K(n, k) = \\frac{n}{n - k} C_{n - k}^k.$$<br>Thay $n = 12$ và $k = 4$ vào công thức:<br>$$K(12, 4) = \\frac{12}{12 - 4} C_{12 - 4}^4 = \\frac{12}{8} C_8^4 = \\frac{3}{2} \\times \\frac{8 \\times 7 \\times 6 \\times 5}{4 \\times 3 \\times 2 \\times 1} = \\frac{3}{2} \\times 70 = 105 \\text{ (cách)}.$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pda14',
    number: 14,
    type: 'mcq',
    skill: 'Dãy chuyển trạng thái / Lớp thặng dư modulo 3 trong phép đếm',
    points: 0.5,
    text: 'Cho tập hợp $X = \\{1, 2, 3, 4, 5, 6, 7, 8\\}$. Lập ngẫu nhiên một số tự nhiên gồm $4$ chữ số từ các chữ số thuộc $X$ (các chữ số được phép lặp lại). Xác suất để chọn được một số chia hết cho $3$ được viết dưới dạng phân số tối giản $\\frac{a}{b}$. Tính giá trị $T = a + b$.',
    options: [
      { key: 'A', text: '$2048$' },
      { key: 'B', text: '$2731$' },
      { key: 'C', text: '$3414$' },
      { key: 'D', text: '$4096$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong><br>- Không gian mẫu: Số các số tự nhiên có $4$ chữ số lập từ $X$ là $|\\Omega| = 8^4 = 4096$.<br>- Phân hoạch tập $X$ theo các lớp thặng dư mod $3$:<br>$A_0 = \\{3, 6\\}$ ($2$ chữ số chia hết cho 3);<br>$A_1 = \\{1, 4, 7\\}$ ($3$ chữ số dư 1);<br>$A_2 = \\{2, 5, 8\\}$ ($3$ chữ số dư 2).<br>- Gọi $x_n$ là số chuỗi độ dài $n$ có tổng các chữ số chia hết cho $3$. Sử dụng hệ thức truy hồi trạng thái thặng dư: $$x_n = 3 \\cdot 8^{n-1} - x_{n-1} \\quad (\\forall n \\ge 2).$$<br>- Thực thi chuỗi truy hồi với $x_1 = |A_0| = 2$:<br>+ $n = 2 \\implies x_2 = 3 \\cdot 8^1 - x_1 = 24 - 2 = 22$.<br>+ $n = 3 \\implies x_3 = 3 \\cdot 8^2 - x_2 = 192 - 22 = 170$.<br>+ $n = 4 \\implies x_4 = 3 \\cdot 8^3 - x_3 = 1536 - 170 = 1366$.<br>- Xác suất biến cố $P = \\frac{1366}{4096} = \\frac{683}{2048}$ (phân số tối giản).<br>Suy ra $a = 683, b = 2048 \\implies T = a + b = 683 + 2048 = 2731$.<br><strong>Đáp án đúng: B.</strong>',
  },
];

// PHẦN II. TỰ LUẬN (2 CÂU - 3,0 ĐIỂM, 1.5Đ/CÂU)
const SHORTANS_QUESTIONS_PHEP_DEM_DE_A: QuestionShortAns[] = [
  {
    id: 'pda15',
    number: 15,
    type: 'shortans',
    skill: 'Kỹ thuật buộc khối và chèn khe trong bài toán xếp vị trí',
    points: 1.5,
    text: 'Một nhóm gồm $8$ sinh viên (gồm $4$ sinh viên ngành Công nghệ thông tin, $2$ sinh viên ngành Khoa học dữ liệu và $2$ sinh viên ngành Trí tuệ nhân tạo) được xếp ngồi vào một dãy gồm $8$ chiếc ghế hàng ngang.<br><br><strong>a) (0,5 điểm)</strong> Tính số cách xếp sao cho $4$ sinh viên ngành Công nghệ thông tin luôn ngồi cạnh nhau.<br><strong>b) (0,5 điểm)</strong> Tính số cách xếp sao cho các sinh viên cùng ngành luôn ngồi cạnh nhau.<br><strong>c) (0,5 điểm)</strong> Tính số cách xếp sao cho không có bất kỳ hai sinh viên ngành Trí tuệ nhân tạo nào ngồi cạnh nhau.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'a) 2880 cách; b) 1152 cách; c) 30240 cách',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const has2880 = clean.includes('2880');
      const has1152 = clean.includes('1152');
      const has30240 = clean.includes('30240');
      return (has2880 && has1152) || (has2880 && has30240) || (has1152 && has30240);
    },
    explanation:
      '<strong>Lời giải chi tiết và Thang điểm (1.5 điểm):</strong><br><br><strong>a) [0,5 điểm]</strong><br>- Gom $4$ SV Công nghệ thông tin thành khối $X_{IT}$. Số cách hoán vị $4$ SV này trong khối là $4! = 24$ cách.<br>- Tập hợp phần tử cần xếp bao gồm khối $X_{IT}$ và $4$ SV còn lại (tổng cộng $5$ phần tử).<br>- Số cách hoán vị $5$ phần tử này vào hàng ngang là $5! = 120$ cách.<br>- Tổng số cách xếp là: $24 \\times 120 = 2880$ cách.<br><br><strong>b) [0,5 điểm]</strong><br>- Gom $4$ SV CNTT thành khối $X_{IT}$ ($4! = 24$ cách hoán vị).<br>- Gom $2$ SV KHDL thành khối $X_{DS}$ ($2! = 2$ cách hoán vị).<br>- Gom $2$ SV AI thành khối $X_{AI}$ ($2! = 2$ cách hoán vị).<br>- Hoán vị $3$ khối $X_{IT}, X_{DS}, X_{AI}$ trên hàng ngang có $3! = 6$ cách.<br>Tổng số cách xếp là: $24 \\times 2 \\times 2 \\times 6 = 1152$ cách.<br><br><strong>c) [0,5 điểm]</strong><br>- Tạm thời bỏ qua $2$ SV AI, tiến hành xếp $6$ SV còn lại ($4$ CNTT + $2$ KHDL) thành hàng ngang. Số cách xếp là $6! = 720$ cách.<br>- $6$ SV này tạo ra $7$ khe hở an toàn (kể cả hai đầu): $\\underline{\\quad} S_1 \\underline{\\quad} S_2 \\underline{\\quad} S_3 \\underline{\\quad} S_4 \\underline{\\quad} S_5 \\underline{\\quad} S_6 \\underline{\\quad}$.<br>- Chọn $2$ khe trong $7$ khe và xếp $2$ SV AI vào có $A_7^2 = 42$ cách.<br>- Tổng số cách xếp thỏa mãn là: $720 \\times 42 = 30240$ cách.',
  },
  {
    id: 'pda16',
    number: 16,
    type: 'shortans',
    skill: 'Phương pháp đếm bằng hai cách (Double Counting) trên đồ thị',
    points: 1.5,
    text: 'Trong một hội nghị khoa học gồm $n$ đại biểu ($n > 30$). Giữa hai đại biểu bất kỳ chỉ có hai trạng thái: quen nhau hoặc không quen nhau. Dữ liệu thống kê cho thấy:<br>1. Mỗi đại biểu quen đúng $30$ đại biểu khác.<br>2. Cứ hai đại biểu quen nhau thì có đúng $19$ đại biểu khác quen với cả hai người đó.<br>3. Cứ hai đại biểu không quen nhau thì có đúng $20$ đại biểu khác quen với cả hai người đó.<br><br>Bằng phương pháp Đếm bằng hai cách (Double Counting), hãy xác định số lượng đại biểu $n$ tham dự hội nghị.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'n = 46 đại biểu',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('46') || clean.includes('n=46');
    },
    explanation:
      '<strong>Lời giải chi tiết và Thang điểm (1.5 điểm):</strong><br><br><strong>Bước 1 (Mô hình hóa):</strong> Coi hội nghị là một đồ thị đơn vô hướng $G=(V,E)$ với $|V|=n$ đỉnh đại diện cho $n$ đại biểu. Hai đỉnh nối với nhau bởi một cạnh nếu hai đại biểu tương ứng quen nhau. Bậc của mỗi đỉnh $d(v) = 30$ với mọi $v \\in V$. (0.25đ)<br><br><strong>Bước 2 (Thiết lập cấu trúc đếm):</strong> Xét tập hợp $T$ gồm tất cả các bộ ba có thứ tự $(C, \\{A, B\\})$ sao cho $C$ quen cả $A$ và $B$ ($A \\neq B$). (0.25đ)<br><br><strong>Bước 3 (Đếm theo Cách 1 - Cố định đỉnh trung tâm $C$):</strong> Cố định đại biểu $C$. Vì $C$ quen đúng $30$ người nên số cặp $\\{A, B\\}$ mà $C$ quen cả hai là $C_{30}^2 = \\frac{30 \\times 29}{2} = 435$. Lấy tổng trên toàn bộ $n$ đại biểu $C$, lực lượng tập $T$ là: $$|T| = 435n \\quad (1). \\quad (0.25\\text{đ})$$<br><strong>Bước 4 (Đếm theo Cách 2 - Cố định cặp đỉnh $\\{A, B\\}$):</strong><br>- Số cặp quen nhau $\\{A, B\\}$ là $|E| = \\frac{30n}{2} = 15n$. Theo giả thiết (2), mỗi cặp quen nhau có $19$ người quen chung $C$. Số bộ từ nhóm này là $15n \\times 19 = 285n$. (0.25đ)<br>- Số cặp không quen nhau $\\{A, B\\}$ là $C_n^2 - 15n = \\frac{n(n-1)}{2} - 15n$. Theo giả thiết (3), mỗi cặp không quen nhau có $20$ người quen chung $C$. Số bộ từ nhóm này là $20 \\left( \\frac{n(n-1)}{2} - 15n \\right) = 10n(n-1) - 300n$. (0.25đ)<br>Tổng số bộ theo cách 2 là: $|T| = 285n + 10n(n-1) - 300n \\quad (2)$.<br><br><strong>Bước 5 (Cân bằng hai cách đếm và Kết luận):</strong><br>Từ (1) và (2) ta có phương trình: $$435n = 285n + 10n(n-1) - 300n.$$ Do $n > 30 > 0$, chia cả hai vế cho $n$: $$435 = 285 + 10(n-1) - 300 \\iff 435 = -15 + 10(n-1) \\iff 10(n-1) = 450 \\iff n = 46.$$ Vậy số lượng đại biểu tham dự hội nghị là $n = 46$. (0.25đ)',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan10PhepDemToHopDeAPage() {
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
    MCQ_QUESTIONS_PHEP_DEM_DE_A.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ originalKey: opt.key, text: opt.text })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS_PHEP_DEM_DE_A.map((q) => ({
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
  const totalQuestions = MCQ_QUESTIONS_PHEP_DEM_DE_A.length + SHORTANS_QUESTIONS_PHEP_DEM_DE_A.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 6. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS-TOHOP-DE-A';
    const lop = lopNhom.trim() || 'Chuyên Toán';

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
    MCQ_QUESTIONS_PHEP_DEM_DE_A.forEach((q) => {
      const studentChoice = mcqAnswers[q.id];
      if (studentChoice === q.correct) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (2 câu Tự luận, 1.5đ/câu)
    SHORTANS_QUESTIONS_PHEP_DEM_DE_A.forEach((q) => {
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
      bai_thi: 'ĐỀ KIỂM TRA ĐỊNH KỲ TOÁN HỌC - PHÉP ĐẾM VÀ ĐẠI SỐ TỔ HỢP [ĐỀ A]',
      diem: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS_PHEP_DEM_DE_A.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_PHEP_DEM_DE_A.length}`,
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
        Task_ID: 'KIEM_TRA_PHEP_DEM_TO_HOP_DE_A',
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
          bai_thi: 'ĐỀ KIỂM TRA TOÁN HỌC - PHÉP ĐẾM VÀ ĐẠI SỐ TỔ HỢP [ĐỀ A]',
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
        MCQ_QUESTIONS_PHEP_DEM_DE_A.map((q) => ({
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
            <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold uppercase tracking-wider rounded-full mb-2">
              Hệ thống khảo sát trực tuyến Integra &bull; Đại số tổ hợp
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN HỌC (45 PHÚT) -- ĐỀ A
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
              Chuyên đề: Phép đếm cơ bản và nâng cao (Đại số tổ hợp) &bull; Dành cho học sinh Năng khiếu
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 disabled:bg-slate-100"
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
                placeholder="HS-TOHOP-01"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 disabled:bg-slate-100"
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
                placeholder="10 Chuyên Toán"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 disabled:bg-slate-100"
              />
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
              <span className="text-xs font-medium text-amber-800">Thời gian còn lại</span>
              <span
                className={`text-xl font-bold font-mono ${
                  timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-amber-950'
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
          <section className="bg-white rounded-2xl shadow-md border-2 border-amber-600 p-6 sm:p-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                  Đã hoàn thành &bull; Chấm điểm tự động
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-2">
                  Kết quả bài thi: {tenHocSinh || 'Học sinh'} ({lopNhom || 'Lớp Chuyên'})
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Đúng {soCauDungMCQ}/14 câu Trắc nghiệm &bull; Đúng {soCauDungShort}/2 câu Tự luận
                </p>
              </div>
              <div className="text-center sm:text-right bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 min-w-[140px]">
                <span className="text-xs uppercase text-slate-500 font-semibold block">Điểm số</span>
                <span className="text-4xl font-extrabold text-amber-700">{diemSo}</span>
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
          <div className="bg-amber-800 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
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
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-md">
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
                        'border-amber-600 bg-amber-50/80 text-amber-950 font-semibold ring-2 ring-amber-500/20';
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
                              ? 'bg-amber-600 text-white'
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
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                      <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
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

          {SHORTANS_QUESTIONS_PHEP_DEM_DE_A.map((q) => {
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
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 disabled:bg-slate-100"
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
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                      <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
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
              className="w-full sm:w-80 py-4 px-6 bg-amber-700 hover:bg-amber-800 disabled:bg-amber-400 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-amber-600/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
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
