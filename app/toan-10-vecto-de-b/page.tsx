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
// DỮ LIỆU ĐỀ THI TOÁN 10 - ĐỀ B (45 PHÚT)
// CHỦ ĐỀ: KHÁI NIỆM VECTƠ, TỔNG & HIỆU, TÍCH VECTƠ VỚI MỘT SỐ
// ==========================================

// PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN (14 CÂU - 7,0 ĐIỂM, 0.5Đ/CÂU)
const MCQ_QUESTIONS_VECTO_DE_B: QuestionMCQ[] = [
  {
    id: 'vc1',
    number: 1,
    type: 'mcq',
    skill: 'Khái niệm hai vectơ bằng nhau',
    points: 0.5,
    text: 'Phát biểu nào sau đây là <strong>đúng</strong> khi nói về hai vectơ bằng nhau?',
    options: [
      { key: 'A', text: 'Hai vectơ bằng nhau khi và chỉ khi chúng cùng độ dài' },
      { key: 'B', text: 'Hai vectơ bằng nhau khi và chỉ khi chúng cùng phương và cùng độ dài' },
      { key: 'C', text: 'Hai vectơ bằng nhau khi và chỉ khi chúng cùng hướng và cùng độ dài' },
      { key: 'D', text: 'Hai vectơ bằng nhau khi và chỉ khi giá của chúng song song với nhau' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Theo định nghĩa, hai vectơ $\\vec{a}$ và $\\vec{b}$ được gọi là bằng nhau nếu chúng cùng hướng và cùng độ dài, ký hiệu $\\vec{a} = \\vec{b}$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'vc2',
    number: 2,
    type: 'mcq',
    skill: 'Xác định các cặp vectơ bằng nhau trong hình bình hành',
    points: 0.5,
    text: 'Cho hình bình hành $ABCD$. Vectơ nào sau đây bằng với vectơ $\\vec{AD}$?',
    options: [
      { key: 'A', text: '$\\vec{DA}$' },
      { key: 'B', text: '$\\vec{BC}$' },
      { key: 'C', text: '$\\vec{CB}$' },
      { key: 'D', text: '$\\vec{AC}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vì $ABCD$ là hình bình hành nên hai cạnh $AD$ và $BC$ song song và bằng nhau ($AD = BC$). Hai vectơ $\\vec{AD}$ và $\\vec{BC}$ cùng hướng và cùng độ dài, do đó $\\vec{AD} = \\vec{BC}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'vc3',
    number: 3,
    type: 'mcq',
    skill: 'Khái niệm vectơ đối',
    points: 0.5,
    text: 'Cho hai điểm phân biệt $P$ và $Q$. Vectơ đối của vectơ $\\vec{PQ}$ là:',
    options: [
      { key: 'A', text: '$\\vec{PQ}$' },
      { key: 'B', text: '$\\vec{QP}$' },
      { key: 'C', text: '$-\\vec{QP}$' },
      { key: 'D', text: '$\\vec{0}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vectơ đối của vectơ $\\vec{a}$ là vectơ ngược hướng và có cùng độ dài với $\\vec{a}$, ký hiệu là $-\\vec{a}$. Vectơ đối của $\\vec{PQ}$ là $-\\vec{PQ} = \\vec{QP}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'vc4',
    number: 4,
    type: 'mcq',
    skill: 'Quy tắc ba điểm phép cộng vectơ',
    points: 0.5,
    text: 'Với ba điểm bất kỳ $M, N, P$, đẳng thức nào sau đây luôn đúng?',
    options: [
      { key: 'A', text: '$\\vec{MN} + \\vec{MP} = \\vec{NP}$' },
      { key: 'B', text: '$\\vec{MN} + \\vec{NP} = \\vec{MP}$' },
      { key: 'C', text: '$\\vec{MN} - \\vec{NP} = \\vec{MP}$' },
      { key: 'D', text: '$\\vec{MN} + \\vec{PN} = \\vec{MP}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo quy tắc ba điểm (quy tắc phép cộng tam giác), với ba điểm $M, N, P$ bất kỳ ta luôn có: $\\vec{MN} + \\vec{NP} = \\vec{MP}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'vc5',
    number: 5,
    type: 'mcq',
    skill: 'Quy tắc hình bình hành phép cộng vectơ',
    points: 0.5,
    text: 'Cho hình bình hành $MNPQ$. Khẳng định nào sau đây <strong>đúng</strong>?',
    options: [
      { key: 'A', text: '$\\vec{MN} + \\vec{MQ} = \\vec{QN}$' },
      { key: 'B', text: '$\\vec{MN} + \\vec{MQ} = \\vec{MP}$' },
      { key: 'C', text: '$\\vec{MN} + \\vec{MP} = \\vec{MQ}$' },
      { key: 'D', text: '$\\vec{NM} + \\vec{NQ} = \\vec{MP}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo quy tắc hình bình hành, với hình bình hành $MNPQ$ có hai cạnh xuất phát từ đỉnh $M$ là $MN$ và $MQ$, đường chéo xuất phát từ $M$ là $MP$, ta có $\\vec{MN} + \\vec{MQ} = \\vec{MP}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'vc6',
    number: 6,
    type: 'mcq',
    skill: 'Quy tắc hiệu hai vectơ chung gốc',
    points: 0.5,
    text: 'Với ba điểm $O, C, D$ bất kỳ, biểu thức $\\vec{OD} - \\vec{OC}$ bằng:',
    options: [
      { key: 'A', text: '$\\vec{DO}$' },
      { key: 'B', text: '$\\vec{CD}$' },
      { key: 'C', text: '$\\vec{DC}$' },
      { key: 'D', text: '$\\vec{CO}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo quy tắc hiệu hai vectơ có cùng gốc $O$, ta có $\\vec{OD} - \\vec{OC} = \\vec{CD}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'vc7',
    number: 7,
    type: 'mcq',
    skill: 'Tính độ dài tổng hai vectơ trong tam giác vuông cân',
    points: 0.5,
    text: 'Cho tam giác $ABC$ vuông cân tại $A$ có $AB = AC = a$. Độ dài của vectơ $\\vec{AB} + \\vec{AC}$ bằng:',
    options: [
      { key: 'A', text: '$a$' },
      { key: 'B', text: '$2a$' },
      { key: 'C', text: '$a\\sqrt{2}$' },
      { key: 'D', text: '$\\dfrac{a\\sqrt{2}}{2}$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Dựng hình bình hành $ABDC$. Vì tam giác $ABC$ vuông cân tại $A$ nên $ABDC$ là hình vuông có cạnh bằng $a$.<br>Theo quy tắc hình bình hành, ta có $\\vec{AB} + \\vec{AC} = \\vec{AD}$.<br>Độ dài đường chéo hình vuông $AD = \\sqrt{a^2 + a^2} = a\\sqrt{2}$.<br>Do đó $|\\vec{AB} + \\vec{AC}| = |\\vec{AD}| = a\\sqrt{2}$.<br><strong>Đáp án đúng: C.</strong>',
  },
  {
    id: 'vc8',
    number: 8,
    type: 'mcq',
    skill: 'Khái niệm tích vectơ với một số thực âm',
    points: 0.5,
    text: 'Cho vectơ $\\vec{a} \\neq \\vec{0}$. Khẳng định nào sau đây <strong>đúng</strong> đối với vectơ $\\vec{u} = -3\\vec{a}$?',
    options: [
      { key: 'A', text: '$\\vec{u}$ cùng hướng với $\\vec{a}$ và $|\\vec{u}| = 3|\\vec{a}|$' },
      { key: 'B', text: '$\\vec{u}$ ngược hướng với $\\vec{a}$ và $|\\vec{u}| = 3|\\vec{a}|$' },
      { key: 'C', text: '$\\vec{u}$ ngược hướng với $\\vec{a}$ và $|\\vec{u}| = -3|\\vec{a}|$' },
      { key: 'D', text: '$\\vec{u}$ cùng hướng với $\\vec{a}$ và $|\\vec{u}| = -3|\\vec{a}|$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo định nghĩa tích của một số với một vectơ: Vì $k = -3 < 0$ nên vectơ $\\vec{u} = -3\\vec{a}$ ngược hướng với $\\vec{a}$ và có độ dài $|\\vec{u}| = |-3| \\cdot |\\vec{a}| = 3|\\vec{a}|$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'vc9',
    number: 9,
    type: 'mcq',
    skill: 'Tính chất vectơ của trung điểm đoạn thẳng',
    points: 0.5,
    text: 'Cho tam giác $ABC$ có $I$ là trung điểm của cạnh $AB$. Khẳng định nào sau đây <strong>sai</strong>?',
    options: [
      { key: 'A', text: '$\\vec{IA} + \\vec{IB} = \\vec{0}$' },
      { key: 'B', text: '$\\vec{AI} = \\vec{IB}$' },
      { key: 'C', text: '$\\vec{CA} + \\vec{CB} = 2\\vec{CI}$' },
      { key: 'D', text: '$\\vec{IA} = \\vec{IB}$' },
    ],
    correct: 'D',
    explanation:
      '<strong>Lời giải:</strong> Vì $I$ là trung điểm của $AB$ nên hai vectơ $\\vec{IA}$ và $\\vec{IB}$ có cùng độ dài nhưng ngược hướng nhau ($\\vec{IA} = -\\vec{IB}$). Do đó khẳng định $\\vec{IA} = \\vec{IB}$ là sai.<br><strong>Đáp án đúng: D.</strong>',
  },
  {
    id: 'vc10',
    number: 10,
    type: 'mcq',
    skill: 'Phân tích vectơ trọng tâm tam giác theo hai vectơ cạnh',
    points: 0.5,
    text: 'Cho tam giác $ABC$ có trọng tâm $G$. Phân tích vectơ $\\vec{AG}$ theo hai vectơ $\\vec{AB}$ và $\\vec{AC}$ được kết quả là:',
    options: [
      { key: 'A', text: '$\\vec{AG} = \\vec{AB} + \\vec{AC}$' },
      { key: 'B', text: '$\\vec{AG} = \\dfrac{1}{3}\\vec{AB} + \\dfrac{1}{3}\\vec{AC}$' },
      { key: 'C', text: '$\\vec{AG} = \\dfrac{1}{2}\\vec{AB} + \\dfrac{1}{2}\\vec{AC}$' },
      { key: 'D', text: '$\\vec{AG} = \\dfrac{2}{3}\\vec{AB} + \\dfrac{2}{3}\\vec{AC}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Gọi $M$ là trung điểm của $BC$, ta có $\\vec{AM} = \\dfrac{1}{2}(\\vec{AB} + \\vec{AC})$.<br>Vì $G$ là trọng tâm tam giác $ABC$ nên $\\vec{AG} = \\dfrac{2}{3}\\vec{AM} = \\dfrac{2}{3} \\cdot \\dfrac{1}{2}(\\vec{AB} + \\vec{AC}) = \\dfrac{1}{3}\\vec{AB} + \\dfrac{1}{3}\\vec{AC}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'vc11',
    number: 11,
    type: 'mcq',
    skill: 'Biểu diễn vectơ theo hai vectơ không cùng phương khi chia đoạn thẳng theo tỉ số',
    points: 0.5,
    text: 'Cho tam giác $ABC$. Gọi $M$ là điểm trên cạnh $BC$ sao cho $BM = 3MC$. Biểu diễn vectơ $\\vec{AM}$ theo hai vectơ $\\vec{AB}$ và $\\vec{AC}$ là:',
    options: [
      { key: 'A', text: '$\\vec{AM} = \\dfrac{3}{4}\\vec{AB} + \\dfrac{1}{4}\\vec{AC}$' },
      { key: 'B', text: '$\\vec{AM} = \\dfrac{1}{4}\\vec{AB} + \\dfrac{3}{4}\\vec{AC}$' },
      { key: 'C', text: '$\\vec{AM} = \\dfrac{1}{3}\\vec{AB} + \\dfrac{2}{3}\\vec{AC}$' },
      { key: 'D', text: '$\\vec{AM} = \\dfrac{2}{3}\\vec{AB} + \\dfrac{1}{3}\\vec{AC}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Vì $M \\in BC$ và $BM = 3MC$ nên $BM = \\dfrac{3}{4}BC \\implies \\vec{BM} = \\dfrac{3}{4}\\vec{BC}$.<br>Ta có $\\vec{AM} = \\vec{AB} + \\vec{BM} = \\vec{AB} + \\dfrac{3}{4}\\vec{BC} = \\vec{AB} + \\dfrac{3}{4}(\\vec{AC} - \\vec{AB}) = \\dfrac{1}{4}\\vec{AB} + \\dfrac{3}{4}\\vec{AC}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'vc12',
    number: 12,
    type: 'mcq',
    skill: 'Tính độ dài hiệu hai vectơ trong tam giác vuông cân',
    points: 0.5,
    text: 'Cho tam giác $ABC$ vuông cân tại $B$ có $AB = BC = a$. Độ dài của vectơ $\\vec{BA} - \\vec{BC}$ bằng:',
    options: [
      { key: 'A', text: '$0$' },
      { key: 'B', text: '$a\\sqrt{2}$' },
      { key: 'C', text: '$a$' },
      { key: 'D', text: '$2a$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong> Theo quy tắc hiệu hai vectơ chung gốc, ta có $\\vec{BA} - \\vec{BC} = \\vec{CA}$.<br>Do tam giác $ABC$ vuông cân tại $B$ có $AB = BC = a$ nên cạnh huyền $AC = \\sqrt{a^2 + a^2} = a\\sqrt{2}$.<br>Vậy $|\\vec{BA} - \\vec{BC}| = |\\vec{CA}| = AC = a\\sqrt{2}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'vc13',
    number: 13,
    type: 'mcq',
    skill: 'Phân tích vectơ phức hợp qua hệ thức vectơ xác định các điểm',
    points: 0.5,
    text: 'Cho tam giác $ABC$. Gọi $M$ là điểm thỏa mãn $2\\vec{MA} + \\vec{MB} = \\vec{0}$ và $N$ là điểm thỏa mãn $\\vec{NA} + 3\\vec{NC} = \\vec{0}$. Biểu diễn vectơ $\\vec{MN}$ theo $\\vec{AB}$ và $\\vec{AC}$ là:',
    options: [
      { key: 'A', text: '$\\vec{MN} = \\dfrac{1}{3}\\vec{AB} + \\dfrac{3}{4}\\vec{AC}$' },
      { key: 'B', text: '$\\vec{MN} = -\\dfrac{1}{3}\\vec{AB} + \\dfrac{3}{4}\\vec{AC}$' },
      { key: 'C', text: '$\\vec{MN} = -\\dfrac{2}{3}\\vec{AB} + \\dfrac{1}{4}\\vec{AC}$' },
      { key: 'D', text: '$\\vec{MN} = \\dfrac{2}{3}\\vec{AB} - \\dfrac{3}{4}\\vec{AC}$' },
    ],
    correct: 'B',
    explanation:
      '<strong>Lời giải:</strong><br>- Từ $2\\vec{MA} + \\vec{MB} = \\vec{0} \\iff 2\\vec{MA} + (\\vec{MA} + \\vec{AB}) = \\vec{0} \\iff 3\\vec{MA} + \\vec{AB} = \\vec{0} \\iff \\vec{AM} = \\dfrac{1}{3}\\vec{AB}$.<br>- Từ $\\vec{NA} + 3\\vec{NC} = \\vec{0} \\iff \\vec{NA} + 3(\\vec{NA} + \\vec{AC}) = \\vec{0} \\iff 4\\vec{NA} + 3\\vec{AC} = \\vec{0} \\iff \\vec{AN} = \\dfrac{3}{4}\\vec{AC}$.<br>- Ta có $\\vec{MN} = \\vec{AN} - \\vec{AM} = \\dfrac{3}{4}\\vec{AC} - \\dfrac{1}{3}\\vec{AB} = -\\dfrac{1}{3}\\vec{AB} + \\dfrac{3}{4}\\vec{AC}$.<br><strong>Đáp án đúng: B.</strong>',
  },
  {
    id: 'vc14',
    number: 14,
    type: 'mcq',
    skill: 'Tính độ lớn của hợp lực vuông góc trong vật lý',
    points: 0.5,
    text: 'Hai lực $\\vec{F}_1$ và $\\vec{F}_2$ cùng tác dụng vào một vật đặt tại điểm $O$, biết độ lớn của $\\vec{F}_1$ là $5\\text{ N}$, độ lớn của $\\vec{F}_2$ là $12\\text{ N}$ và góc giữa hai lực bằng $90^\\circ$. Độ lớn của hợp lực $\\vec{F} = \\vec{F}_1 + \\vec{F}_2$ bằng:',
    options: [
      { key: 'A', text: '$17\\text{ N}$' },
      { key: 'B', text: '$7\\text{ N}$' },
      { key: 'C', text: '$13\\text{ N}$' },
      { key: 'D', text: '$60\\text{ N}$' },
    ],
    correct: 'C',
    explanation:
      '<strong>Lời giải:</strong> Vì góc giữa hai lực $\\vec{F}_1$ và $\\vec{F}_2$ là $90^\\circ$ ($\\vec{F}_1 \\perp \\vec{F}_2$), nên hình bình hành tạo bởi hai lực là hình chữ nhật.<br>Độ lớn của hợp lực $\\vec{F}$ bằng đường chéo hình chữ nhật:<br>$|\\vec{F}| = \\sqrt{|\\vec{F}_1|^2 + |\\vec{F}_2|^2} = \\sqrt{5^2 + 12^2} = \\sqrt{169} = 13\\text{ N}$.<br><strong>Đáp án đúng: C.</strong>',
  },
];

// PHẦN II. TỰ LUẬN (2 CÂU - 3,0 ĐIỂM, 1.5Đ/CÂU)
const SHORTANS_QUESTIONS_VECTO_DE_B: QuestionShortAns[] = [
  {
    id: 'vc15',
    number: 15,
    type: 'shortans',
    skill: 'Chứng minh các hệ thức vectơ về trọng tâm tam giác',
    points: 1.5,
    text: 'Cho tam giác $ABC$ có trọng tâm là điểm $G$.<br><br><strong>a) (0,75 điểm)</strong> Chứng minh rằng $\\vec{GA} + \\vec{GB} + \\vec{GC} = \\vec{0}$.<br><strong>b) (0,75 điểm)</strong> Gọi $M$ là một điểm bất kỳ trên mặt phẳng. Chứng minh rằng $\\vec{MA} + \\vec{MB} + \\vec{MC} = 3\\vec{MG}$.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'a) GA + GB + GC = 0; b) MA + MB + MC = 3MG (với mọi điểm M)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const hasZero = clean.includes('=0') || clean.includes('vecto0') || clean.includes('0');
      const has3MG = clean.includes('3mg') || clean.includes('3*mg');
      return has3MG || (hasZero && clean.includes('mg'));
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>- Gọi $I$ là trung điểm của cạnh $BC$. Theo tính chất trung điểm: $\\vec{GB} + \\vec{GC} = 2\\vec{GI}$. (0,25đ)<br>- Vì $G$ là trọng tâm tam giác $ABC$ nên $\\vec{GA} = -2\\vec{GI} \\iff \\vec{GA} + 2\\vec{GI} = \\vec{0}$. (0,25đ)<br>- Do đó $\\vec{GA} + \\vec{GB} + \\vec{GC} = \\vec{GA} + 2\\vec{GI} = \\vec{0}$ (đpcm). (0,25đ)<br><br><strong>b) (0,75 điểm)</strong><br>- Chèn điểm $G$ vào từng vectơ: $\\vec{MA} = \\vec{MG} + \\vec{GA}, \\vec{MB} = \\vec{MG} + \\vec{GB}, \\vec{MC} = \\vec{MG} + \\vec{GC}$. (0,25đ)<br>- Cộng vế với vế: $\\vec{MA} + \\vec{MB} + \\vec{MC} = 3\\vec{MG} + (\\vec{GA} + \\vec{GB} + \\vec{GC})$. (0,25đ)<br>- Vì $\\vec{GA} + \\vec{GB} + \\vec{GC} = \\vec{0}$ nên $\\vec{MA} + \\vec{MB} + \\vec{MC} = 3\\vec{MG}$ (đpcm). (0,25đ)',
  },
  {
    id: 'vc16',
    number: 16,
    type: 'shortans',
    skill: 'Ứng dụng vectơ giải bài toán cân bằng lực trong vật lý',
    points: 1.5,
    text: 'Một vật chịu tác dụng đồng thời của ba lực $\\vec{F}_1, \\vec{F}_2, \\vec{F}_3$ cùng đặt tại điểm $O$ và vật ở trạng thái cân bằng. Biết rằng hai lực $\\vec{F}_1$ và $\\vec{F}_2$ có cùng độ lớn bằng $12\\text{ N}$, góc tạo bởi hai lực $\\vec{F}_1$ và $\\vec{F}_2$ bằng $120^\\circ$.<br><br><strong>a) (0,75 điểm)</strong> Tính độ lớn của hợp lực $\\vec{F}_{12} = \\vec{F}_1 + \\vec{F}_2$.<br><strong>b) (0,75 điểm)</strong> Xác định hướng và độ lớn của lực $\\vec{F}_3$.',
    placeholder: 'Nhập đáp án... (VD: 15, -3/4, 2.5)',
    correctDisplay: 'F12 = 12 N; F3 = 12 N (ngược hướng với F12)',
    validator: (val: string) => {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      const has12 = clean.includes('12') || clean.includes('12n');
      const hasDirection =
        clean.includes('nguochuong') ||
        clean.includes('ngượchướng') ||
        clean.includes('doi') ||
        clean.includes('đối') ||
        clean.includes('-f12');
      return has12 && (hasDirection || clean.includes('f3=12') || clean.includes('f12=12'));
    },
    explanation:
      '<strong>Lời giải chi tiết và thang điểm:</strong><br><br><strong>a) (0,75 điểm)</strong><br>- Dựng hình bình hành $OADB$ với $\\vec{OA} = \\vec{F}_1, \\vec{OB} = \\vec{F}_2$. Hợp lực $\\vec{F}_{12} = \\vec{OD}$. (0,25đ)<br>- Vì $OA = OB = 12\\text{ N}$ và $\\widehat{AOB} = 120^\\circ \\implies \\widehat{AOD} = 60^\\circ$. Tam giác $OAD$ là tam giác đều cạnh $12\\text{ N}$. (0,25đ)<br>- Do đó độ lớn hợp lực $F_{12} = |\\vec{F}_{12}| = 12\\text{ N}$. (0,25đ)<br><br><strong>b) (0,75 điểm)</strong><br>- Vật cân bằng: $\\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 = \\vec{0} \\iff \\vec{F}_{12} + \\vec{F}_3 = \\vec{0} \\iff \\vec{F}_3 = -\\vec{F}_{12}$. (0,25đ)<br>- Hướng: Lực $\\vec{F}_3$ ngược hướng với hợp lực $\\vec{F}_{12}$. (0,25đ)<br>- Độ lớn: $F_3 = |\\vec{F}_3| = |\\vec{F}_{12}| = 12\\text{ N}$. (0,25đ)',
  },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function Toan10VectoDeBPage() {
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
    MCQ_QUESTIONS_VECTO_DE_B.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ originalKey: opt.key, text: opt.text })),
    }))
  );

  // Thuật toán xáo trộn mảng đáp án (Shuffle Array - Fisher-Yates) bên trong useEffect
  useEffect(() => {
    const shuffled = MCQ_QUESTIONS_VECTO_DE_B.map((q) => ({
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
  const totalQuestions = MCQ_QUESTIONS_VECTO_DE_B.length + SHORTANS_QUESTIONS_VECTO_DE_B.length;
  const totalAnswered = answeredMCQCount + answeredShortCount;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // 6. XỬ LÝ NỘP BÀI (SUBMIT) & GỬI WEBHOOK GAS / N8N
  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    const ten = tenHocSinh.trim() || 'Học sinh ẩn danh';
    const ma = maHocSinh.trim() || 'HS10-VECTO-DE-B';
    const lop = lopNhom.trim() || 'Lớp 10';

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
    MCQ_QUESTIONS_VECTO_DE_B.forEach((q) => {
      const studentChoice = mcqAnswers[q.id];
      if (studentChoice === q.correct) {
        calculatedScore += q.points;
        correctMCQ += 1;
      } else {
        wrongSkills.push(q.skill);
      }
    });

    // Chấm Phần II (2 câu Tự luận, 1.5đ/câu)
    SHORTANS_QUESTIONS_VECTO_DE_B.forEach((q) => {
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
      bai_thi: 'ĐỀ KIỂM TRA ĐỊNH KỲ TOÁN 10 - VECTƠ VÀ CÁC PHÉP TOÁN [ĐỀ B]',
      diem: finalScore,
      so_cau_dung_mcq: `${correctMCQ}/${MCQ_QUESTIONS_VECTO_DE_B.length}`,
      so_cau_dung_short: `${correctShort}/${SHORTANS_QUESTIONS_VECTO_DE_B.length}`,
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
        Task_ID: 'KIEM_TRA_VECTO_TOAN_10_DE_B',
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
          bai_thi: 'ĐỀ KIỂM TRA TOÁN 10 - VECTƠ [ĐỀ B]',
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
        MCQ_QUESTIONS_VECTO_DE_B.map((q) => ({
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
            <span className="inline-block px-3 py-1 bg-teal-50 text-teal-800 text-xs font-semibold uppercase tracking-wider rounded-full mb-2">
              Hệ thống khảo sát trực tuyến Integra &bull; Toán 10
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ MÔN TOÁN LỚP 10 -- ĐỀ B
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
              Chủ đề: Khái niệm về vectơ, Tổng và hiệu của hai vectơ, Tích của vectơ với một số
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 disabled:bg-slate-100"
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
                placeholder="HS10-VC01"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 disabled:bg-slate-100"
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
                placeholder="10A1"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 disabled:bg-slate-100"
              />
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-teal-50/80 border border-teal-200 rounded-xl">
              <span className="text-xs font-medium text-teal-800">Thời gian còn lại</span>
              <span
                className={`text-xl font-bold font-mono ${
                  timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-teal-950'
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
                className="h-full bg-teal-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        {/* KẾT QUẢ SAU KHI NỘP BÀI */}
        {isSubmitted && (
          <section className="bg-white rounded-2xl shadow-md border-2 border-teal-600 p-6 sm:p-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                  Đã hoàn thành &bull; Chấm điểm tự động
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-2">
                  Kết quả bài thi: {tenHocSinh || 'Học sinh'} ({lopNhom || 'Lớp 10'})
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Đúng {soCauDungMCQ}/14 câu Trắc nghiệm &bull; Đúng {soCauDungShort}/2 câu Tự luận
                </p>
              </div>
              <div className="text-center sm:text-right bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-200 min-w-[140px]">
                <span className="text-xs uppercase text-slate-500 font-semibold block">Điểm số</span>
                <span className="text-4xl font-extrabold text-teal-700">{diemSo}</span>
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
          <div className="bg-teal-800 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
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
                    <span className="px-2.5 py-1 bg-teal-100 text-teal-900 text-xs font-bold rounded-md">
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
                        'border-teal-600 bg-teal-50/80 text-teal-950 font-semibold ring-2 ring-teal-500/20';
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
                              ? 'bg-teal-600 text-white'
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
                    <div className="flex items-center gap-1.5 font-bold text-teal-900 mb-1">
                      <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
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

          {SHORTANS_QUESTIONS_VECTO_DE_B.map((q) => {
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
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 disabled:bg-slate-100"
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
                    <div className="flex items-center gap-1.5 font-bold text-teal-900 mb-1">
                      <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
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
              className="w-full sm:w-80 py-4 px-6 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-teal-600/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
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
