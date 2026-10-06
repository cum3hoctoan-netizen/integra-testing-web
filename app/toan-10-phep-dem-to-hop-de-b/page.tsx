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
// DỮ LIỆU ĐỀ THI ĐẠI SỐ TỔ HỢP - ĐỀ B (45 PHÚT)
// CHỦ ĐỀ: PHÉP ĐẾM CƠ BẢN VÀ NÂNG CAO
// ==========================================

// PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (14 CÂU - 7,0 ĐIỂM, 0.5Đ/CÂU)
const MCQ_QUESTIONS_PHEP_DEM_DE_B: QuestionMCQ[] = [
  {
    id: 'pdb1',
    number: 1,
    type: 'mcq',
    skill: 'Quy tắc cộng - nhân và phương pháp phần bù trong tổ hợp',
    points: 0.5,
    text: 'Một câu lạc bộ Học thuật gồm $10$ học sinh chuyên Toán và $6$ học sinh chuyên Vật lý. Cần chọn ra một đoàn đại biểu gồm $3$ học sinh tham gia kỳ thi sáng tạo trẻ. Hỏi có bao nhiêu cách chọn sao cho trong đoàn đại biểu có cả học sinh chuyên Toán và học sinh chuyên Vật lý?',
    options: [
      { key: 'A', text: '$420$' },
      { key: 'B', text: '$560$' },
      { key: 'C', text: '$840$' },
      { key: 'D', text: '$120$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong><br><strong>Cách 1 (Phương pháp Trực tiếp - Phân hoạch trường hợp):</strong><br>- Trường hợp 1: Chọn $1$ Toán và $2$ Lý: $C_{10}^1 \\times C_6^2 = 10 \\times 15 = 150$ cách.<br>- Trường hợp 2: Chọn $2$ Toán và $1$ Lý: $C_{10}^2 \\times C_6^1 = 45 \\times 6 = 270$ cách.<br>Tổng số cách chọn hợp lệ là: $150 + 270 = 420$ cách.<br><br><strong>Cách 2 (Phương pháp Phần bù):</strong><br>- Tổng số cách chọn $3$ học sinh tùy ý từ $16$ học sinh: $C_{16}^3 = 560$ cách.<br>- Số cách chọn $3$ học sinh toàn Toán: $C_{10}^3 = 120$ cách.<br>- Số cách chọn $3$ học sinh toàn Lý: $C_6^3 = 20$ cách.<br>Số cách chọn hợp lệ là: $560 - (120 + 20) = 420$ cách.<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'pdb2',
    number: 2,
    type: 'mcq',
    skill: 'Đếm số tự nhiên chẵn gồm các chữ số đôi một khác nhau',
    points: 0.5,
    text: 'Từ các chữ số thuộc tập hợp $S = \\{0, 1, 2, 3, 4, 5\\}$, lập được bao nhiêu số tự nhiên gồm $4$ chữ số đôi một khác nhau và là một số chẵn?',
    options: [
      { key: 'A', text: '$120$' },
      { key: 'B', text: '$156$' },
      { key: 'C', text: '$180$' },
      { key: 'D', text: '$216$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Gọi số tự nhiên cần lập có dạng $\\overline{abcd}$ với $a, b, c, d \\in S, a \\neq 0$ và $a, b, c, d$ đôi một khác nhau.<br>Do số cần lập là số chẵn nên $d \\in \\{0, 2, 4\\}$. Ta phân rã thành $2$ trường hợp để đảm bảo tính độc lập của vị trí $a \\neq 0$:<br>- <strong>Trường hợp 1: $d = 0$</strong> ($1$ cách chọn $d$). Chữ số $a$ chọn từ $S \\setminus \\{0\\}$: $5$ cách. Chữ số $b$ chọn từ $S \\setminus \\{0, a\\}$: $4$ cách. Chữ số $c$ chọn từ $S \\setminus \\{0, a, b\\}$: $3$ cách. Số cách lập ở TH1: $1 \\times 5 \\times 4 \\times 3 = 60$ số.<br>- <strong>Trường hợp 2: $d \\in \\{2, 4\\}$</strong> ($2$ cách chọn $d$). Chữ số $a$ chọn từ $S \\setminus \\{0, d\\}$: $4$ cách (do $a \\neq 0$). Chữ số $b$ chọn từ $S \\setminus \\{a, d\\}$: $4$ cách (kể cả số $0$). Chữ số $c$ chọn từ $S \\setminus \\{a, b, d\\}$: $3$ cách. Số cách lập ở TH2: $2 \\times 4 \\times 4 \\times 3 = 96$ số.<br>Tổng số các số chẵn thỏa mãn là: $60 + 96 = 156$ số.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pdb3',
    number: 3,
    type: 'mcq',
    skill: 'Số nghiệm nguyên không âm và mô hình Vách ngăn Euler',
    points: 0.5,
    text: 'Số nghiệm nguyên không âm $(x_1, x_2, x_3, x_4, x_5)$ của phương trình đại số $x_1 + x_2 + x_3 + x_4 + x_5 = 10$ bằng bao nhiêu?',
    options: [
      { key: 'A', text: '$252$' },
      { key: 'B', text: '$504$' },
      { key: 'C', text: '$1001$' },
      { key: 'D', text: '$3003$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Bài toán tương đương với việc phân phối $10$ phần thưởng giống hệt nhau cho $5$ người sao cho mỗi người có thể nhận từ $0$ đến $10$ phần thưởng ($x_i \\ge 0$).<br>Sử dụng mô hình Vách ngăn Euler (Stars and Bars):<br>Xếp $10$ phần tử và $5 - 1 = 4$ vách ngăn thành một hàng ngang gồm $10 + 4 = 14$ vị trí.<br>Số cách chọn $4$ vị trí đặt vách ngăn trong $14$ vị trí chính là số nghiệm nguyên không âm:<br>$$N = C_{10 + 5 - 1}^{5 - 1} = C_{14}^4 = \\frac{14 \\times 13 \\times 12 \\times 11}{4 \\times 3 \\times 2 \\times 1} = 1001 \\text{ (nghiệm)}.$$<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'pdb4',
    number: 4,
    type: 'mcq',
    skill: 'Hoán vị lặp của tập hợp đa phần tử',
    points: 0.5,
    text: 'Có bao nhiêu chuỗi ký tự khác nhau có thể tạo thành bằng cách sắp xếp tất cả các chữ cái trong từ tiếng Anh "STATISTICS"?',
    options: [
      { key: 'A', text: '$50400$' },
      { key: 'B', text: '$100800$' },
      { key: 'C', text: '$302400$' },
      { key: 'D', text: '$604800$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Từ "STATISTICS" gồm tổng cộng $10$ chữ cái.<br>Thống kê tần suất lặp của các nhóm chữ cái:<br>- Chữ S xuất hiện $3$ lần.<br>- Chữ T xuất hiện $3$ lần.<br>- Chữ I xuất hiện $2$ lần.<br>- Các chữ A, C mỗi chữ xuất hiện $1$ lần.<br>Áp dụng công thức Hoán vị lặp $P_n(n_1, n_2, \\dots, n_k) = \\frac{n!}{n_1! n_2! \\dots n_k!}$, tổng số chuỗi ký tự phân biệt tạo thành là:<br>$$N = \\frac{10!}{3! \\times 3! \\times 2! \\times 1! \\times 1!} = \\frac{3628800}{6 \\times 6 \\times 2} = 50400 \\text{ (chuỗi)}.$$<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'pdb5',
    number: 5,
    type: 'mcq',
    skill: 'Phương pháp buộc khối (Block Binding) trong bài toán xếp vị trí',
    points: 0.5,
    text: 'Xếp $7$ cuốn sách gồm $3$ cuốn sách Toán, $2$ cuốn sách Vật lý và $2$ cuốn sách Hóa học lên một kệ sách hàng ngang. Hỏi có bao nhiêu cách xếp sao cho các cuốn sách thuộc cùng một môn học luôn đứng cạnh nhau?',
    options: [
      { key: 'A', text: '$72$' },
      { key: 'B', text: '$144$' },
      { key: 'C', text: '$288$' },
      { key: 'D', text: '$504$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng Phương pháp Buộc khối (Block Binding):<br>- Gom $3$ cuốn sách Toán thành khối $X_{\\text{Toán}}$. Số cách hoán vị nội bộ khối $X_{\\text{Toán}}$ là $3! = 6$ cách.<br>- Gom $2$ cuốn sách Vật lý thành khối $X_{\\text{Lý}}$. Số cách hoán vị nội bộ khối $X_{\\text{Lý}}$ là $2! = 2$ cách.<br>- Gom $2$ cuốn sách Hóa học thành khối $X_{\\text{Hóa}}$. Số cách hoán vị nội bộ khối $X_{\\text{Hóa}}$ là $2! = 2$ cách.<br>- Coi $X_{\\text{Toán}}, X_{\\text{Lý}}, X_{\\text{Hóa}}$ là $3$ phần tử hoán vị. Số cách xếp $3$ khối này vào kệ sách là $3! = 6$ cách.<br>Theo quy tắc nhân, tổng số cách xếp sách hợp lệ là:<br>$$N = (3! \\times 2! \\times 2!) \\times 3! = (6 \\times 2 \\times 2) \\times 6 = 144 \\text{ (cách)}.$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pdb6',
    number: 6,
    type: 'mcq',
    skill: 'Phương pháp chèn khe (Insertion Method) cho điều kiện cách ly',
    points: 0.5,
    text: 'Xếp $6$ học sinh nam và $3$ học sinh nữ thành một hàng ngang sao cho không có bất kỳ hai học sinh nữ nào đứng cạnh nhau. Số cách xếp thỏa mãn là:',
    options: [
      { key: 'A', text: '$25200$' },
      { key: 'B', text: '$75600$' },
      { key: 'C', text: '$151200$' },
      { key: 'D', text: '$302400$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Áp dụng Phương pháp Chèn khe (Insertion Method) cho điều kiện cách ly:<br>- <strong>Bước 1:</strong> Bỏ qua điều kiện học sinh nữ, tiến hành xếp $6$ học sinh nam thành một hàng ngang trước. Số cách xếp $6$ nam là $P_6 = 6! = 720$ cách.<br>- <strong>Bước 2:</strong> $6$ học sinh nam đứng xếp hàng sẽ tạo ra tổng cộng $7$ khoảng trống (khe hở) bao gồm $5$ khe ở giữa và $2$ khe ở hai đầu:<br>$$\\underline{\\quad} \\text{Nam}_1 \\underline{\\quad} \\text{Nam}_2 \\underline{\\quad} \\text{Nam}_3 \\underline{\\quad} \\text{Nam}_4 \\underline{\\quad} \\text{Nam}_5 \\underline{\\quad} \\text{Nam}_6 \\underline{\\quad}$$<br>- <strong>Bước 3:</strong> Để $3$ học sinh nữ không đứng cạnh nhau, ta chọn $3$ khe trống từ $7$ khe hở và xếp $3$ học sinh nữ vào đó (có phân biệt thứ tự). Số cách thực hiện là một chỉnh hợp chập $3$ của $7$: $A_7^3 = 210$ cách.<br>Theo quy tắc nhân, tổng số cách xếp hàng thỏa mãn là: $720 \\times 210 = 151200$ cách.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'pdb7',
    number: 7,
    type: 'mcq',
    skill: 'Phân phối phần tử phân biệt (Chỉnh hợp lặp / Ánh xạ tập hợp)',
    points: 0.5,
    text: 'Có $6$ món quà phân biệt cần trao cho $4$ học sinh xuất sắc. Biết rằng mỗi học sinh có thể nhận được số lượng món quà tùy ý (kể cả trường hợp không nhận được món quà nào). Số cách phân phối toàn bộ số quà cho các học sinh là:',
    options: [
      { key: 'A', text: '$720$' },
      { key: 'B', text: '$1296$' },
      { key: 'C', text: '$2048$' },
      { key: 'D', text: '$4096$' },
    ],
    correct: 'D',
    explanation:
      '<strong>Lời giải:</strong> Xác định chủ thể thực hiện hành vi chọn lựa trong bài toán phân phối:<br>- Mỗi món quà là một chủ thể chủ động cần chọn $1$ trong $4$ học sinh để trao tặng.<br>- Món quà thứ 1 có $4$ cách chọn học sinh nhận.<br>- Món quà thứ 2 có $4$ cách chọn học sinh nhận độc lập.<br>- Lập luận tương tự, mỗi món quà trong $6$ món quà đều có đúng $4$ lựa chọn học sinh.<br>Áp dụng quy tắc nhân (mô hình chỉnh hợp lặp / ánh xạ tập hợp $|Y|^{|X|}$ với $|Y|=4, |X|=6$):<br>$$N = 4 \\times 4 \\times 4 \\times 4 \\times 4 \\times 4 = 4^6 = 4096 \\text{ (cách)}.$$<br><strong>Đáp án đúng: D.</strong>',
  },
  {
    id: 'pdb8',
    number: 8,
    type: 'mcq',
    skill: 'Đếm tập con lập thành cấp số cộng bằng tính chất chẵn lẻ',
    points: 0.5,
    text: 'Cho tập hợp $S = \\{1, 2, 3, \\dots, 30\\}$. Có bao nhiêu tập con gồm $3$ phần tử $\\{a, b, c\\}$ của tập $S$ thỏa mãn $a < b < c$ và các phần tử $a, b, c$ lập thành một cấp số cộng?',
    options: [
      { key: 'A', text: '$105$' },
      { key: 'B', text: '$210$' },
      { key: 'C', text: '$420$' },
      { key: 'D', text: '$455$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Ba số $a, b, c$ theo thứ tự $a < b < c$ lập thành một cấp số cộng khi và chỉ khi:<br>$$a + c = 2b.$$<br>Đẳng thức này khẳng định rằng $a$ và $c$ bắt buộc phải <strong>cùng tính chẵn lẻ</strong> (vì tổng $a + c$ phải là một số chẵn $2b$). Đồng thời, khi chọn được cặp số $(a, c)$ cùng tính chẵn lẻ với $a < c$, giá trị trung vị $b = \\frac{a+c}{2}$ hoàn toàn được xác định duy nhất.<br>Tập $S = \\{1, 2, \\dots, 30\\}$ chứa $15$ số chẵn và $15$ số lẻ.<br>- Chọn $2$ số chẵn từ $15$ số chẵn làm cặp $(a, c)$: có $C_{15}^2 = 105$ cách.<br>- Chọn $2$ số lẻ từ $15$ số lẻ làm cặp $(a, c)$: có $C_{15}^2 = 105$ cách.<br>Tổng số tập con thỏa mãn là: $105 + 105 = 210$ tập con.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pdb9',
    number: 9,
    type: 'mcq',
    skill: 'Phương pháp vách ngăn Euler kết hợp Nguyên lý Bao hàm - Loại trừ (PIE)',
    points: 0.5,
    text: 'Tìm số nghiệm nguyên $(x_1, x_2, x_3, x_4)$ của phương trình đại số $x_1 + x_2 + x_3 + x_4 = 18$ thỏa mãn điều kiện ràng buộc cận trên $0 \\le x_i \\le 6$ với mọi $i \\in \\{1, 2, 3, 4\\}$.',
    options: [
      { key: 'A', text: '$84$' },
      { key: 'B', text: '$126$' },
      { key: 'C', text: '$168$' },
      { key: 'D', text: '$210$' },
    ],
    correct: 'A',
    explanation:
      '<strong>Lời giải:</strong> Sử dụng Phương pháp Vách ngăn Euler kết hợp Nguyên lý Bao hàm - Loại trừ (PIE):<br>- <strong>Bước 1:</strong> Số nghiệm nguyên không âm tự do ($x_i \\ge 0$) là:<br>$$N_0 = C_{18 + 4 - 1}^{4 - 1} = C_{21}^3 = 1330 \\text{ (nghiệm)}.$$<br>- <strong>Bước 2:</strong> Xét biến vi phạm điều kiện $x_i \\le 6$, tức là $x_i \\ge 7$.<br>- <em>Xét 1 biến vi phạm ($x_1 \\ge 7$):</em> Đặt $y_1 = x_1 - 7 \\ge 0$. Phương trình thành $y_1 + x_2 + x_3 + x_4 = 11$. Số nghiệm là $C_{11+3}^3 = C_{14}^3 = 364$. Số trường hợp chọn 1 biến vi phạm trong 4 biến là $C_4^1 \\times 364 = 1456$.<br>- <em>Xét 2 biến vi phạm đồng thời ($x_1 \\ge 7, x_2 \\ge 7$):</em> Đặt $y_1 = x_1 - 7 \\ge 0, y_2 = x_2 - 7 \\ge 0$. Phương trình thành $y_1 + y_2 + x_3 + x_4 = 4$. Số nghiệm là $C_{4+3}^3 = C_7^3 = 35$. Số trường hợp chọn 2 biến vi phạm trong 4 biến là $C_4^2 \\times 35 = 210$.<br>- <em>Xét $\\ge 3$ biến vi phạm:</em> Tổng tối thiểu $3 \\times 7 = 21 > 18 \\implies 0$ nghiệm.<br>- <strong>Bước 3:</strong> Áp dụng công thức PIE đan dấu:<br>$$N = N_0 - \\text{Vi phạm 1} + \\text{Vi phạm 2} = 1330 - 1456 + 210 = 84 \\text{ (nghiệm)}.$$<br><strong>Đáp án đúng: A.</strong>',
  },
  {
    id: 'pdb10',
    number: 10,
    type: 'mcq',
    skill: 'Hoán vị lệch toàn cục (Derangement)',
    points: 0.5,
    text: 'Một công ty công nghệ có $6$ nhân viên được cấp $6$ máy tính có mã định danh riêng biệt. Sau một đợt nâng cấp phần mềm, các máy tính được giao ngẫu nhiên lại cho $6$ nhân viên. Hỏi có bao nhiêu cách giao máy tính sao cho không có bất kỳ nhân viên nào nhận đúng chiếc máy tính ban đầu của mình?',
    options: [
      { key: 'A', text: '$132$' },
      { key: 'B', text: '$265$' },
      { key: 'C', text: '$360$' },
      { key: 'D', text: '$720$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Yêu cầu "không có nhân viên nào nhận đúng chiếc máy tính của mình" chính là mô hình <strong>Hoán vị lệch toàn cục (Derangement)</strong> của $6$ phần tử, ký hiệu $D_6$ (hoặc $!6$).<br>Áp dụng công thức Bao hàm - Loại trừ cho hoán vị lệch:<br>$$D_n = n! \\sum_{k=0}^n \\frac{(-1)^k}{k!} = n! \\left( 1 - \\frac{1}{1!} + \\frac{1}{2!} - \\frac{1}{3!} + \\dots + \\frac{(-1)^n}{n!} \\right).$$<br>Với $n = 6$:<br>$$D_6 = 6! \\left( \\frac{1}{2!} - \\frac{1}{3!} + \\frac{1}{4!} - \\frac{1}{5!} + \\frac{1}{6!} \\right) = 720 \\left( \\frac{1}{2} - \\frac{1}{6} + \\frac{1}{24} - \\frac{1}{120} + \\frac{1}{720} \\right)$$<br>$$= 360 - 120 + 30 - 6 + 1 = 265 \\text{ (cách)}.$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pdb11',
    number: 11,
    type: 'mcq',
    skill: 'Đường đi trên lưới tọa độ nguyên (Lattice Path) có điểm cấm',
    points: 0.5,
    text: 'Một con robot di chuyển từ điểm $A(0,0)$ đến điểm $B(6,4)$ trên lưới tọa độ nguyên. Mỗi bước robot chỉ có thể di chuyển sang phải $1$ đơn vị ($R$) hoặc đi lên trên $1$ đơn vị ($U$). Hỏi có bao nhiêu quỹ đạo di chuyển từ $A$ đến $B$ sao cho robot không đi qua điểm $N(3,2)$?',
    options: [
      { key: 'A', text: '$90$' },
      { key: 'B', text: '$110$' },
      { key: 'C', text: '$130$' },
      { key: 'D', text: '$150$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong><br>- <strong>Bước 1 (Không gian mẫu):</strong> Để đi từ $A(0,0)$ đến $B(6,4)$, robot cần thực hiện đúng $6$ bước $R$ và $4$ bước $U$ (tổng $10$ bước).<br>Số quỹ đạo tùy ý là: $N_{\\text{tổng}} = C_{6+4}^4 = C_{10}^4 = 210$ đường.<br>- <strong>Bước 2 (Số quỹ đạo bị cấm - đi qua $N(3,2)$):</strong><br>- Quá trình đi từ $A(0,0)$ đến $N(3,2)$: Cần $3$ bước $R$ và $2$ bước $U \\implies C_{3+2}^2 = C_5^2 = 10$ đường.<br>- Quá trình đi từ $N(3,2)$ đến $B(6,4)$: Cần $6-3=3$ bước $R$ và $4-2=2$ bước $U \\implies C_{3+2}^2 = C_5^2 = 10$ đường.<br>- Số đường đi qua $N$ là: $10 \\times 10 = 100$ đường.<br>- <strong>Bước 3 (Kết luận):</strong> Số quỹ đạo không đi qua $N$ là: $210 - 100 = 110$ đường.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pdb12',
    number: 12,
    type: 'mcq',
    skill: 'Đếm chuỗi ký tự mật khẩu có điều kiện chẵn lẻ và chữ số đầu',
    points: 0.5,
    text: 'Một hệ thống an ninh yêu cầu thiết lập mật khẩu gồm $8$ ký tự được chọn từ tập chữ số $\\{0, 1, 2, \\dots, 9\\}$ (các chữ số được phép lặp lại). Mật khẩu được gọi là an toàn nếu chứa đúng $4$ chữ số lẻ, $4$ chữ số chẵn và chữ số đầu tiên của mật khẩu không được phép là chữ số $0$. Hệ thống có thể tạo ra bao nhiêu mật khẩu an toàn?',
    options: [
      { key: 'A', text: '$19140625$' },
      { key: 'B', text: '$24609375$' },
      { key: 'C', text: '$27343750$' },
      { key: 'D', text: '$31250000$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Tập chữ số lẻ $L = \\{1, 3, 5, 7, 9\\}$ ($5$ phần tử); Tập chữ số chẵn $C = \\{0, 2, 4, 6, 8\\}$ ($5$ phần tử).<br>Phân rã thành $2$ trường hợp dựa trên chữ số đầu tiên $a_1$:<br>- <strong>Trường hợp 1: Chữ số $a_1$ là chữ số LẺ</strong> ($5$ cách chọn $a_1$).<br>+ Chọn $3$ vị trí cho $3$ chữ số lẻ còn lại trong $7$ vị trí sau: $C_7^3 = 35$ cách.<br>+ Điền $3$ chữ số lẻ vào $3$ vị trí đó (cho phép lặp): $5^3 = 125$ cách.<br>+ Điền $4$ chữ số chẵn vào $4$ vị trí còn lại (kể cả số $0$): $5^4 = 625$ cách.<br>+ Số mật khẩu TH1: $5 \\times 35 \\times 125 \\times 625 = 13671875$.<br>- <strong>Trường hợp 2: Chữ số $a_1$ là chữ số CHẴN KHÁC $0$</strong> ($4$ cách chọn $a_1 \\in \\{2, 4, 6, 8\\}$).<br>+ Chọn $4$ vị trí cho $4$ chữ số lẻ trong $7$ vị trí sau: $C_7^4 = 35$ cách.<br>+ Điền $4$ chữ số lẻ vào $4$ vị trí đó: $5^4 = 625$ cách.<br>+ Điền $3$ chữ số chẵn vào $3$ vị trí chẵn còn lại: $5^3 = 125$ cách.<br>+ Số mật khẩu TH2: $4 \\times 35 \\times 625 \\times 125 = 10937500$.<br>Tổng số mật khẩu an toàn là: $13671875 + 10937500 = 24609375$ mật khẩu.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pdb13',
    number: 13,
    type: 'mcq',
    skill: 'Bổ đề Kaplansky chọn phần tử không kề nhau trên chu trình vòng',
    points: 0.5,
    text: 'Có $15$ người ngồi xung quanh một chiếc bàn tròn. Cần chọn ra một nhóm $5$ người để thành lập ban ban điều hành sao cho không có bất kỳ hai người nào trong nhóm ngồi cạnh nhau. Hỏi có bao nhiêu cách chọn?',
    options: [
      { key: 'A', text: '$252$' },
      { key: 'B', text: '$378$' },
      { key: 'C', text: '$462$' },
      { key: 'D', text: '$525$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Sử dụng Bổ đề Kaplansky chọn $k$ đối tượng không kề nhau từ $n$ đối tượng xếp trên một chu trình vòng:<br>$$K(n, k) = \\frac{n}{n - k} C_{n - k}^k.$$<br>Thay $n = 15$ và $k = 5$ vào công thức:<br>$$K(15, 5) = \\frac{15}{15 - 5} C_{15 - 5}^5 = \\frac{15}{10} C_{10}^5 = \\frac{3}{2} \\times 252 = 378 \\text{ (cách)}.$$<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'pdb14',
    number: 14,
    type: 'mcq',
    skill: 'Dãy chuyển trạng thái / Lớp thặng dư modulo 3 trong phép đếm',
    points: 0.5,
    text: 'Cho tập hợp $X = \\{1, 2, 3, 4, 5, 6, 7\\}$. Lập ngẫu nhiên một số tự nhiên gồm $4$ chữ số từ các chữ số thuộc $X$ (các chữ số được phép lặp lại). Xác suất để chọn được một số chia hết cho $3$ được viết dưới dạng phân số tối giản $\\frac{a}{b}$. Tính giá trị $T = a + b$.',
    options: [
      { key: 'A', text: '$2401$' },
      { key: 'B', text: '$3201$' },
      { key: 'C', text: '$3602$' },
      { key: 'D', text: '$4802$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong><br>- Không gian mẫu: Số các số tự nhiên có $4$ chữ số lập từ $X$ là $|\\Omega| = 7^4 = 2401$.<br>- Phân hoạch tập $X$ theo các lớp thặng dư mod $3$:<br>$A_0 = \\{3, 6\\}$ ($2$ chữ số chia hết cho 3);<br>$A_1 = \\{1, 4, 7\\}$ ($3$ chữ số dư 1);<br>$A_2 = \\{2, 5\\}$ ($2$ chữ số dư 2).<br>- Gọi $s_0(n), s_1(n), s_2(n)$ lần lượt là số chuỗi độ dài $n$ có tổng các chữ số chia $3$ dư $0, 1, 2$.<br>Hệ thức chuyển trạng thái:<br>\\begin{align*} s_0(n) &= 2 s_0(n-1) + 2 s_1(n-1) + 3 s_2(n-1) \\\\ s_1(n) &= 3 s_0(n-1) + 2 s_1(n-1) + 2 s_2(n-1) \\\\ s_2(n) &= 2 s_0(n-1) + 3 s_1(n-1) + 2 s_2(n-1) \\end{align*}<br>- Giá trị khởi tạo với $n = 1$: $s_0(1) = 2, s_1(1) = 3, s_2(1) = 2$.<br>+ $n = 2 \\implies s_0(2) = 2(2) + 2(3) + 3(2) = 16$; $s_1(2) = 16$; $s_2(2) = 17$.<br>+ $n = 3 \\implies s_0(3) = 2(16) + 2(16) + 3(17) = 115$; $s_1(3) = 114$; $s_2(3) = 114$.<br>+ $n = 4 \\implies s_0(4) = 2(115) + 2(114) + 3(114) = 800$.<br>- Xác suất biến cố $P = \\frac{800}{2401}$ (phân số tối giản do $2401 = 7^4$ và $800$ không chia hết cho $7$).<br>Suy ra $a = 800, b = 2401 \\implies T = a + b = 800 + 2401 = 3201$.<br><strong>Đáp án đúng: B.</strong>',
  },
];

// PHẦN II. TỰ LUẬN (2 CÂU - 3,0 ĐIỂM, 1.5Đ/CÂU)
const SHORTANS_QUESTIONS_PHEP_DEM_DE_B: QuestionShortAns[] = [
  {
    id: 'pdb15',
    number: 15,
    type: 'shortans',
    skill: 'Kỹ thuật buộc khối và chèn khe trong bài toán xếp vị trí',
    points: 1.5,
    text: 'Một nhóm gồm $9$ sinh viên (gồm $5$ sinh viên ngành Toán học, $2$ sinh viên ngành Vật lý và $2$ sinh viên ngành Hóa học) được xếp ngồi vào một dãy gồm $9$ chiếc ghế hàng ngang.<br><br><strong>a) (0,5 điểm)</strong> Tính số cách xếp sao cho $5$ sinh viên ngành Toán học luôn ngồi cạnh nhau.<br><strong>b) (0,5 điểm)</strong> Tính số cách xếp sao cho các sinh viên cùng ngành luôn ngồi cạnh nhau.<br><strong>c) (0,5 điểm)</strong> Tính số cách xếp sao cho không có bất kỳ hai sinh viên ngành Hóa học nào ngồi cạnh nhau.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'a) 14400 cách; b) 2880 cách; c) 282240 cách',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const has14400 = clean.includes('14400');
      const has2880 = clean.includes('2880');
      const has282240 = clean.includes('282240');
      return (has14400 && has2880) || (has14400 && has282240) || (has2880 && has282240);
    },
    explanation:
      '<strong>Lời giải chi tiết và Thang điểm (1.5 điểm):</strong><br><br><strong>a) [0,5 điểm]</strong><br>- Gom $5$ SV Toán học thành khối $X_{\\text{Toán}}$. Số cách hoán vị $5$ SV này trong khối là $5! = 120$ cách.<br>- Tập hợp phần tử cần xếp bao gồm khối $X_{\\text{Toán}}$ và $4$ SV còn lại ($2$ Lý + $2$ Hóa), tổng cộng $5$ phần tử.<br>- Số cách hoán vị $5$ phần tử này vào hàng ngang là $5! = 120$ cách.<br>- Tổng số cách xếp là: $120 \\times 120 = 14400$ cách.<br><br><strong>b) [0,5 điểm]</strong><br>- Gom $5$ SV Toán thành khối $X_{\\text{Toán}}$ ($5! = 120$ cách hoán vị).<br>- Gom $2$ SV Lý thành khối $X_{\\text{Lý}}$ ($2! = 2$ cách hoán vị).<br>- Gom $2$ SV Hóa thành khối $X_{\\text{Hóa}}$ ($2! = 2$ cách hoán vị).<br>- Hoán vị $3$ khối $X_{\\text{Toán}}, X_{\\text{Lý}}, X_{\\text{Hóa}}$ trên hàng ngang có $3! = 6$ cách.<br>Tổng số cách xếp là: $120 \\times 2 \\times 2 \\times 6 = 2880$ cách.<br><br><strong>c) [0,5 điểm]</strong><br>- Tạm thời bỏ qua $2$ SV Hóa, tiến hành xếp $7$ SV còn lại ($5$ Toán + $2$ Lý) thành hàng ngang. Số cách xếp là $7! = 5040$ cách.<br>- $7$ SV này tạo ra $8$ khe hở an toàn (kể cả hai đầu): $\\underline{\\quad} S_1 \\underline{\\quad} S_2 \\underline{\\quad} S_3 \\underline{\\quad} S_4 \\underline{\\quad} S_5 \\underline{\\quad} S_6 \\underline{\\quad} S_7 \\underline{\\quad}$.<br>- Chọn $2$ khe trong $8$ khe và xếp $2$ SV Hóa vào có $A_8^2 = 56$ cách.<br>- Tổng số cách xếp thỏa mãn là: $5040 \\times 56 = 282240$ cách.',
  },
  {
    id: 'pdb16',
    number: 16,
    type: 'shortans',
    skill: 'Phương pháp đếm bằng hai cách (Double Counting) trên đồ thị',
    points: 1.5,
    text: 'Trong một hội nghị khoa học gồm $n$ đại biểu ($n > 25$). Giữa hai đại biểu bất kỳ chỉ có hai trạng thái: quen nhau hoặc không quen nhau. Dữ liệu thống kê cho thấy:<br>1. Mỗi đại biểu quen đúng $24$ đại biểu khác.<br>2. Cứ hai đại biểu quen nhau thì có đúng $15$ đại biểu khác quen với cả hai người đó.<br>3. Cứ hai đại biểu không quen nhau thì có đúng $16$ đại biểu khác quen với cả hai người đó.<br><br>Bằng phương pháp Đếm bằng hai cách (Double Counting), hãy xác định số lượng đại biểu $n$ tham dự hội nghị.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'n = 37 đại biểu',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      return clean.includes('37') || clean.includes('n=37');
    },
    explanation:
      '<strong>Lời giải chi tiết và Thang điểm (1.5 điểm):</strong><br><br><strong>Bước 1 (Mô hình hóa):</strong> Coi hội nghị là một đồ thị đơn vô hướng $G=(V,E)$ với $|V|=n$ đỉnh đại diện cho $n$ đại biểu. Hai đỉnh nối với nhau bởi một cạnh nếu hai đại biểu tương ứng quen nhau. Bậc của mỗi đỉnh $d(v) = 24$ với mọi $v \\in V$. (0.25đ)<br><br><strong>Bước 2 (Thiết lập cấu trúc đếm):</strong> Xét tập hợp $T$ gồm tất cả các bộ ba có thứ tự $(C, \\{A, B\\})$ sao cho $C$ quen cả $A$ và $B$ ($A \\neq B$). (0.25đ)<br><br><strong>Bước 3 (Đếm theo Cách 1 - Cố định đỉnh trung tâm $C$):</strong> Cố định đại biểu $C$. Vì $C$ quen đúng $24$ người nên số cặp $\\{A, B\\}$ mà $C$ quen cả hai là $C_{24}^2 = \\frac{24 \\times 23}{2} = 276$. Lấy tổng trên toàn bộ $n$ đại biểu $C$, lực lượng tập $T$ là: $$|T| = 276n \\quad (1). \\quad (0.25\\text{đ})$$<br><strong>Bước 4 (Đếm theo Cách 2 - Cố định cặp đỉnh $\\{A, B\\}$):</strong><br>- Số cặp quen nhau $\\{A, B\\}$ là $|E| = \\frac{24n}{2} = 12n$. Theo giả thiết (2), mỗi cặp quen nhau có $15$ người quen chung $C$. Số bộ từ nhóm này là $12n \\times 15 = 180n$. (0.25đ)<br>- Số cặp không quen nhau $\\{A, B\\}$ là $C_n^2 - 12n = \\frac{n(n-1)}{2} - 12n$. Theo giả thiết (3), mỗi cặp không quen nhau có $16$ người quen chung $C$. Số bộ từ nhóm này là $16 \\left( \\frac{n(n-1)}{2} - 12n \\right) = 8n(n-1) - 192n$. (0.25đ)<br>Tổng số bộ theo cách 2 là: $|T| = 180n + 8n(n-1) - 192n = 8n(n-1) - 12n \\quad (2)$.<br><br><strong>Bước 5 (Cân bằng hai cách đếm và Kết luận):</strong><br>Từ (1) và (2) ta có phương trình: $$276n = 8n(n-1) - 12n.$$ Do $n > 25 > 0$, chia cả hai vế cho $n$: $$276 = 8(n-1) - 12 \\iff 288 = 8(n-1) \\iff n-1 = 36 \\iff n = 37.$$ Vậy số lượng đại biểu tham dự hội nghị là $n = 37$. (0.25đ)',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan10PhepDemToHopDeBPage() {
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
    MCQ_QUESTIONS_PHEP_DEM_DE_B.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ originalKey: opt.key, text: opt.text })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS_PHEP_DEM_DE_B.map((q) => ({
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
  const totalQuestions = MCQ_QUESTIONS_PHEP_DEM_DE_B.length + SHORTANS_QUESTIONS_PHEP_DEM_DE_B.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 6. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS-TOHOP-DE-B';
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
    MCQ_QUESTIONS_PHEP_DEM_DE_B.forEach((q) => {
      const studentChoice = mcqAnswers[q.id];
      if (studentChoice === q.correct) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (2 câu Tự luận, 1.5đ/câu)
    SHORTANS_QUESTIONS_PHEP_DEM_DE_B.forEach((q) => {
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
      bai_thi: 'ĐỀ KIỂM TRA ĐỊNH KỲ TOÁN HỌC - PHÉP ĐẾM VÀ ĐẠI SỐ TỔ HỢP [ĐỀ B]',
      diem: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS_PHEP_DEM_DE_B.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_PHEP_DEM_DE_B.length}`,
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
        Task_ID: 'KIEM_TRA_PHEP_DEM_TO_HOP_DE_B',
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
          bai_thi: 'ĐỀ KIỂM TRA TOÁN HỌC - PHÉP ĐẾM VÀ ĐẠI SỐ TỔ HỢP [ĐỀ B]',
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
        MCQ_QUESTIONS_PHEP_DEM_DE_B.map((q) => ({
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
              ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN HỌC (45 PHÚT) -- ĐỀ B
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

          {SHORTANS_QUESTIONS_PHEP_DEM_DE_B.map((q) => {
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
