import QuizExam from './QuizExam';

export const metadata = {
  title: 'Bài Thi Trắc Nghiệm Trực Tuyến',
  description: 'Giao diện làm bài thi trắc nghiệm kết nối Google Apps Script Webhook',
};

export default function Page() {
  return <QuizExam />;
}
