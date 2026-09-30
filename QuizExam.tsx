'use client';

import React, { useState } from 'react';

// --- TYPES & INTERFACES ---
export interface OptionItem {
  key: 'A' | 'B' | 'C' | 'D';
  content: string;
}

export interface Question {
  id: number;
  text: string;
  options: OptionItem[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  skill?: string;
}

export interface UserAnswerDetail {
  questionId: number;
  selectedOption: string;
  correctAnswer: string;
  isCorrect: boolean;
}

// Đã điều chỉnh khớp 100% với cấu trúc API nhận điểm trên Google Apps Script
export interface WebhookPayload {
  action: string;
  data: {
    Student_ID: string;
    Task_ID: string;
    Diem_So: number;
    Thoi_Gian_Lam: number;
    Chi_Tiet_Phan_Hoi: string;
  };
}

// --- DỮ LIỆU CÂU HỎI TRẮC NGHIỆM GIẢ ĐỊNH ---
const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Cho hàm số y = f(x) có đạo hàm f'(x) = 3x² - 6x. Số điểm cực trị của hàm số đã cho là:",
    options: [
      { key: 'A', content: '0' },
      { key: 'B', content: '1' },
      { key: 'C', content: '2' },
      { key: 'D', content: '3' },
    ],
    correctAnswer: 'C',
    explanation: "Giải phương trình f'(x) = 0 ⇔ 3x(x - 2) = 0 ⇔ x = 0 hoặc x = 2. Hai nghiệm đơn phân biệt nên hàm số có 2 điểm cực trị.",
    skill: 'Đạo hàm và Cực trị',
  },
  {
    id: 2,
    text: 'Họ nguyên hàm của hàm số f(x) = cos(x) là:',
    options: [
      { key: 'A', content: 'sin(x) + C' },
      { key: 'B', content: '-sin(x) + C' },
      { key: 'C', content: 'cos(x) + C' },
      { key: 'D', content: '-cos(x) + C' },
    ],
    correctAnswer: 'A',
    explanation: 'Ta có ∫ cos(x) dx = sin(x) + C.',
    skill: 'Nguyên hàm - Tích phân',
  },
  {
    id: 3,
    text: 'Trong không gian Oxyz, cho vectơ u = 2i - 3j + k. Tọa độ của vectơ u là:',
    options: [
      { key: 'A', content: '(2; -3; 0)' },
      { key: 'B', content: '(2; -3; 1)' },
      { key: 'C', content: '(-3; 2; 1)' },
      { key: 'D', content: '(2; 3; 1)' },
    ],
    correctAnswer: 'B',
    explanation: 'Theo định nghĩa hệ tọa độ trong không gian, u = x*i + y*j + z*k ⇒ u = (2; -3; 1).',
    skill: 'Hình học Không gian Oxyz',
  },
  {
    id: 4,
    text: 'Tập nghiệm của bất phương trình log₂(x - 1) < 3 là:',
    options: [
      { key: 'A', content: '(-∞; 9)' },
      { key: 'B', content: '(1; 9)' },
      { key: 'C', content: '(1; 8)' },
      { key: 'D', content: '(0; 9)' },
    ],
    correctAnswer: 'B',
    explanation: 'Điều kiện: x - 1 > 0 ⇔ x > 1. Bất phương trình ⇔ x - 1 < 2³ = 8 ⇔ x < 9. Kết hợp điều kiện ta có S = (1; 9).',
    skill: 'Phương trình & Bất phương trình Mũ - Logarit',
  },
  {
    id: 5,
    text: 'Cho cấp số cộng (uₙ) có số hạng đầu u₁ = 3 và công sai d = 2. Giá trị của số hạng thứ năm u₅ bằng:',
    options: [
      { key: 'A', content: '11' },
      { key: 'B', content: '13' },
      { key: 'C', content: '15' },
      { key: 'D', content: '9' },
    ],
    correctAnswer: 'A',
    explanation: 'Công thức số hạng tổng quát của cấp số cộng: u₅ = u₁ + 4d = 3 + 4 * 2 = 11.',
    skill: 'Cấp số cộng và Cấp số nhân',
  },
];

const WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbwFjkENCxOPVJcFo8OmXuLad5kcMEC9_Uu48hF045AO0yC8-TnHivEI0ohfUHZkJQlN/exec';

export default function QuizExam() {
  // --- STATE ---
  const [maHS, setMaHS] = useState<string>('');
  const [maDe, setMaDe] = useState<string>('MD-101');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Chọn đáp án
  const handleSelectOption = (questionId: number, optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted) return; // Khóa sau khi đã nộp bài
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
    setStatusMessage(null);
  };

  // Tiến độ làm bài
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = SAMPLE_QUESTIONS.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // --- HÀM XỬ LÝ NỘP BÀI ---
  const handleSubmit = async () => {
    setStatusMessage(null);

    // 1. Kiểm tra thông tin bắt buộc
    if (!maHS.trim()) {
      setStatusMessage({
        type: 'warning',
        text: 'Vui lòng nhập Mã Học Sinh (Mã HS) trước khi nộp bài!',
      });
      return;
    }

    if (!maDe.trim()) {
      setStatusMessage({
        type: 'warning',
        text: 'Vui lòng nhập Mã Đề thi!',
      });
      return;
    }

    // Cảnh báo nếu chưa trả lời hết câu hỏi
    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(
        `Bạn mới hoàn thành ${answeredCount}/${totalQuestions} câu hỏi. Bạn có chắc chắn muốn nộp bài ngay bây giờ không?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);

    try {
      // 2. Gom đáp án & Tính điểm giả định
      let count = 0;
      const danhSachDapAn: UserAnswerDetail[] = SAMPLE_QUESTIONS.map((q) => {
        const selected = selectedAnswers[q.id] || '';
        const isCorrect = selected === q.correctAnswer;
        if (isCorrect) count++;
        return {
          questionId: q.id,
          selectedOption: selected,
          correctAnswer: q.correctAnswer,
          isCorrect,
        };
      });

      // Điểm giả định thang 10, làm tròn 2 chữ số thập phân
      const diemGiaDinh = parseFloat(((count / totalQuestions) * 10).toFixed(2));
      setCorrectCount(count);
      setCalculatedScore(diemGiaDinh);

      // 3. Chuyển danh sách đáp án thành chuỗi JSON
      const chuoiJsonDapAn = JSON.stringify(danhSachDapAn);

      // 4. Cấu hình payload theo chuẩn đã định nghĩa trên GAS
      const payloadToSend: WebhookPayload = {
        action: 'submit_test',
        data: {
          Student_ID: maHS.trim(),
          Task_ID: maDe.trim(),
          Diem_So: diemGiaDinh,
          Thoi_Gian_Lam: 0, // Cấu hình thời gian làm bài thực tế sau nếu cần
          Chi_Tiet_Phan_Hoi: chuoiJsonDapAn,
        },
      };

      // 5. Gọi hàm fetch gửi POST request chuẩn REST API đến Webhook URL
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payloadToSend),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setStatusMessage({
          type: 'success',
          text: `Nộp bài thành công! Điểm của bạn: ${diemGiaDinh}/10 (${count}/${totalQuestions} câu đúng). Dữ liệu đã được lưu trữ an toàn.`,
        });
      } else {
        throw new Error(`Máy chủ phản hồi mã lỗi: ${response.status}`);
      }
    } catch (err: unknown) {
      console.error('Lỗi khi gửi bài:', err);
      setIsSubmitted(true);
      setStatusMessage({
        type: 'error',
        text: `Đã chấm bài xong trên máy khách (${calculatedScore ?? '...'} điểm). Tuy nhiên quá trình gửi đến Webhook gặp lỗi. Vui lòng kiểm tra lại kết nối mạng.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Làm lại bài
  const handleReset = () => {
    if (window.confirm('Bạn có muốn làm lại bài thi từ đầu?')) {
      setSelectedAnswers({});
      setIsSubmitted(false);
      setCalculatedScore(null);
      setCorrectCount(0);
      setStatusMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER & THÔNG TIN BÀI THI */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 rounded-full mb-2">
                Hệ Thống Khảo Sát & Đánh Giá Năng Lực
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Bài Thi Trắc Nghiệm Trực Tuyến
              </h1>
            </div>
            <div className="text-right sm:text-right">
              <span className="text-xs text-slate-500 block">Thời gian làm bài</span>
              <span className="text-lg font-bold text-indigo-600">Tự do</span>
            </div>
          </div>

          {/* CÁC Ô NHẬP: MÃ HS, MÃ ĐỀ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div>
              <label htmlFor="input-ma-hs" className="block text-sm font-semibold text-slate-700 mb-1">
                Mã Học Sinh (Mã HS) <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-ma-hs"
                type="text"
                placeholder="VD: HS2026-089"
                value={maHS}
                onChange={(e) => setMaHS(e.target.value)}
                disabled={isSubmitted || isSubmitting}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                required
              />
            </div>

            <div>
              <label htmlFor="input-ma-de" className="block text-sm font-semibold text-slate-700 mb-1">
                Mã Đề Thi <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-ma-de"
                type="text"
                placeholder="VD: MD-101"
                value={maDe}
                onChange={(e) => setMaDe(e.target.value)}
                disabled={isSubmitted || isSubmitting}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>

          {/* THANH TIẾN ĐỘ */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs text-slate-600 font-medium mb-1.5">
              <span>Đã trả lời: {answeredCount}/{totalQuestions} câu</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        {/* THÔNG BÁO TRẠNG THÁI */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-sm border flex items-start gap-3 transition-all ${statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : statusMessage.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
          >
            <span className="text-lg">
              {statusMessage.type === 'success' ? '🎉' : statusMessage.type === 'warning' ? '⚠️' : '❌'}
            </span>
            <div className="flex-1 font-medium">{statusMessage.text}</div>
          </div>
        )}

        {/* THẺ KẾT QUẢ KHI ĐÃ NỘP BÀI */}
        {isSubmitted && calculatedScore !== null && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-blue-100 text-sm font-medium">Bảng Điểm Bài Thi</span>
              <h2 className="text-3xl font-extrabold mt-1">
                {calculatedScore} <span className="text-xl font-normal text-blue-200">/ 10 điểm</span>
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Đúng {correctCount}/{totalQuestions} câu hỏi ({Math.round((correctCount / totalQuestions) * 100)}%)
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-blue-50 transition shadow-sm text-sm"
            >
              Làm lại bài
            </button>
          </div>
        )}

        {/* DANH SÁCH CÂU HỎI TRẮC NGHIỆM */}
        <main className="space-y-5">
          {SAMPLE_QUESTIONS.map((q, idx) => {
            const currentSelected = selectedAnswers[q.id];
            const isAnswered = Boolean(currentSelected);

            return (
              <article
                key={q.id}
                className={`bg-white rounded-2xl shadow-sm border p-6 transition-all ${isSubmitted
                    ? currentSelected === q.correctAnswer
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-rose-300 bg-rose-50/20'
                    : isAnswered
                      ? 'border-blue-200 ring-1 ring-blue-100'
                      : 'border-slate-200'
                  }`}
              >
                {/* TIÊU ĐỀ CÂU HỎI */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {q.skill || 'Toán học'}
                    </span>
                  </div>

                  {/* HUY HIỆU ĐÚNG/SAI KHI ĐÃ NỘP BÀI */}
                  {isSubmitted && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${currentSelected === q.correctAnswer
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                        }`}
                    >
                      {currentSelected === q.correctAnswer ? '✓ Chính xác' : '✕ Chưa đúng'}
                    </span>
                  )}
                </div>

                <p className="text-slate-800 font-medium text-base leading-relaxed mb-4">
                  {q.text}
                </p>

                {/* DANH SÁCH 4 PHƯƠNG ÁN LỰA CHỌN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt) => {
                    const isChecked = currentSelected === opt.key;
                    const isCorrectKey = opt.key === q.correctAnswer;

                    let optionStyle =
                      'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700';

                    if (isSubmitted) {
                      if (isCorrectKey) {
                        optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500';
                      } else if (isChecked && !isCorrectKey) {
                        optionStyle = 'border-rose-400 bg-rose-50 text-rose-800 line-through';
                      } else {
                        optionStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                      }
                    } else if (isChecked) {
                      optionStyle = 'border-blue-600 bg-blue-50/60 text-blue-900 font-semibold ring-2 ring-blue-500/20';
                    }

                    return (
                      <label
                        key={opt.key}
                        onClick={() => handleSelectOption(q.id, opt.key)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${optionStyle} ${isSubmitted ? 'cursor-default' : ''
                          }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${isSubmitted && isCorrectKey
                              ? 'bg-emerald-600 text-white'
                              : isSubmitted && isChecked && !isCorrectKey
                                ? 'bg-rose-500 text-white'
                                : isChecked
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {opt.key}
                        </span>
                        <span className="text-sm leading-snug">{opt.content}</span>
                      </label>
                    );
                  })}
                </div>

                {/* GIẢI THÍCH CHI TIẾT SAU KHI NỘP BÀI */}
                {isSubmitted && q.explanation && (
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-100/80 text-xs text-slate-600 border border-slate-200 leading-relaxed">
                    <strong className="text-slate-800 font-semibold block mb-0.5">💡 Lời giải chi tiết:</strong>
                    {q.explanation}
                  </div>
                )}
              </article>
            );
          })}
        </main>

        {/* NÚT NỘP BÀI & HÀNH ĐỘNG DƯỚI CÙNG */}
        <footer className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4">
          <div className="text-sm text-slate-500 text-center sm:text-left">
            <span>Mã HS: </span>
            <strong className="text-slate-800">{maHS || '(chưa điền)'}</strong>
            <span className="mx-2">•</span>
            <span>Mã Đề: </span>
            <strong className="text-slate-800">{maDe || '(chưa điền)'}</strong>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isSubmitted ? (
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm transition shadow-sm"
              >
                Làm bài thi mới
              </button>
            ) : (
              <button
                id="btn-nop-bai"
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/20 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Đang nộp bài...</span>
                  </>
                ) : (
                  <span>Nộp bài & Gửi kết quả</span>
                )}
              </button>
            )}
          </div>
        </footer>

      </div>
    </div>
  );
}