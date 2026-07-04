import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Question } from '../hooks/useQuiz';
import { getPublishedQuizzes } from '../lib/quizService';

interface QuizMeta {
  id: string;
  title: string;
  subject: string;
  questionCount: number;
  timeLimit: number;
  description: string;
}

const MOCK_QUIZZES: QuizMeta[] = [
  {
    id: 'math-b1',
    title: '國中一年級 整數運算',
    subject: '數學',
    questionCount: 10,
    timeLimit: 20,
    description: '正負整數的加減乘除運算，包含絕對值與數線概念。',
  },
  {
    id: 'math-b2',
    title: '國中一年級 分數與小數',
    subject: '數學',
    questionCount: 8,
    timeLimit: 25,
    description: '分數的四則運算、約分、通分及小數換算。',
  },
  {
    id: 'math-b3',
    title: '國中二年級 一元一次方程式',
    subject: '數學',
    questionCount: 12,
    timeLimit: 30,
    description: '解一元一次方程式，包含移項、合併同類項與應用題。',
  },
  {
    id: 'math-b4',
    title: '國中二年級 二元一次聯立方程式',
    subject: '數學',
    questionCount: 10,
    timeLimit: 30,
    description: '代入消去法與加減消去法求解聯立方程式。',
  },
];

export function QuizListPage() {
  const [quizzes, setQuizzes] = useState<QuizMeta[]>(MOCK_QUIZZES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuizzes() {
      const published = await getPublishedQuizzes();
      if (published.length > 0) {
        const mapped: QuizMeta[] = published.map(q => ({
          id: q.id!,
          title: q.title,
          subject: q.subject || '數學',
          questionCount: 0,
          timeLimit: q.time_limit || 30,
          description: q.description || '',
        }));
        setQuizzes(mapped);
      }
      setLoading(false);
    }
    loadQuizzes();
  }, []);

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <section aria-labelledby="welcome-heading">
        <h2 id="welcome-heading" className="text-3xl font-bold tracking-tight text-gray-900">
          無障礙數學測驗系統
        </h2>
        <p className="mt-3 text-lg leading-relaxed text-gray-600">
          本系統專為視障學生設計，搭配 NVDA 螢幕閱讀器使用。
          每道題目皆提供語音朗讀說明，讓您能以聽覺方式理解數學題目並作答。
        </p>
        <p className="mt-2 text-gray-500">
          請選擇一份測驗開始作答。所有測驗皆有時間限制，請留意計時器。
        </p>
      </section>

      {/* Quiz List */}
      <section aria-labelledby="quiz-list-heading">
        <h3 id="quiz-list-heading" className="sr-only">可用測驗列表</h3>
        {loading ? (
          <p className="text-gray-500 py-8" role="status">正在載入測驗列表...</p>
        ) : (
        <ul role="list" className="space-y-4" aria-label="可用測驗">
          {quizzes.map((quiz) => (
            <li key={quiz.id}>
              <article
                className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500"
                aria-labelledby={`quiz-title-${quiz.id}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h4
                      id={`quiz-title-${quiz.id}`}
                      className="text-xl font-semibold text-gray-900"
                    >
                      {quiz.title}
                    </h4>
                    <p className="mt-1 text-gray-600">{quiz.description}</p>

                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <dt>科目：</dt>
                        <dd>{quiz.subject}</dd>
                      </div>
                      <div className="flex items-center gap-1">
                        <dt>題數：</dt>
                        <dd>{quiz.questionCount || '—'} 題</dd>
                      </div>
                      <div className="flex items-center gap-1">
                        <dt>限時：</dt>
                        <dd>{quiz.timeLimit} 分鐘</dd>
                      </div>
                    </dl>
                  </div>

                  <Link
                    to={`/quiz/${quiz.id}`}
                    aria-label={`開始測驗：${quiz.title}，限時 ${quiz.timeLimit} 分鐘`}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    開始測驗
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
        )}
      </section>

      {/* Admin Link */}
      <nav aria-label="管理功能" className="border-t border-gray-200 pt-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-base font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          aria-label="前往教師管理後台"
        >
          ⚙️ 教師管理後台
        </Link>
      </nav>
    </div>
  );
}

// Re-export mock quiz data for use by other pages
export { MOCK_QUIZZES };

// Also export a helper to get full mock quiz with questions
export function getMockQuizQuestions(quizId: string): { id: string; title: string; questions: Question[]; timeLimit: number } | null {
  const meta = MOCK_QUIZZES.find(q => q.id === quizId);
  if (!meta) return null;

  const QUESTIONS: Record<string, Question[]> = {
    'math-b1': [
      {
        id: 'b1-q1',
        type: 'fill_in_blank',
        question: '-3 + 5 = ?',
        spoken: '負 3 加 5 等於多少',
        correctAnswer: '2',
        hint: '先判斷正負，再計算差值',
      },
      {
        id: 'b1-q2',
        type: 'multiple_choice',
        question: '下列何者等於 -7？',
        spoken: '下列哪個選項等於負 7',
        options: [
          { id: 'a', text: '-3 + (-4)', spoken: '負 3 加負 4' },
          { id: 'b', text: '-3 + 4', spoken: '負 3 加 4' },
          { id: 'c', text: '3 + (-4)', spoken: '3 加負 4' },
          { id: 'd', text: '3 + 4', spoken: '3 加 4' },
        ],
        correctAnswer: 'a',
        hint: '兩個負數相加，結果仍為負數',
      },
      {
        id: 'b1-q3',
        type: 'true_false',
        question: '|-5| = -5',
        spoken: '負 5 的絕對值等於負 5，對或錯',
        correctAnswer: '錯',
        hint: '絕對值一定是非負數',
      },
      {
        id: 'b1-q4',
        type: 'fill_in_blank',
        question: '(-2) × 6 = ?',
        spoken: '負 2 乘以 6 等於多少',
        correctAnswer: '-12',
        hint: '正負相乘得負數',
      },
      {
        id: 'b1-q5',
        type: 'math_expression',
        question: '-8 ÷ (-2) = ?',
        spoken: '負 8 除以負 2 等於多少',
        correctAnswer: '4',
        hint: '負負相除得正數',
      },
    ],
    'math-b2': [
      {
        id: 'b2-q1',
        type: 'fill_in_blank',
        question: '1/2 + 1/3 = ?',
        spoken: '二分之一加三分之一等於多少，請以分數作答',
        correctAnswer: '5/6',
        hint: '先通分，分母為 6',
      },
      {
        id: 'b2-q2',
        type: 'multiple_choice',
        question: '0.75 等於哪個分數？',
        spoken: '0.75 等於哪個分數',
        options: [
          { id: 'a', text: '3/4', spoken: '四分之三' },
          { id: 'b', text: '2/3', spoken: '三分之二' },
          { id: 'c', text: '4/5', spoken: '五分之四' },
          { id: 'd', text: '7/10', spoken: '十分之七' },
        ],
        correctAnswer: 'a',
      },
      {
        id: 'b2-q3',
        type: 'fill_in_blank',
        question: '2/5 × 3/4 = ?',
        spoken: '五分之二乘以四分之三等於多少，請以最簡分數作答',
        correctAnswer: '3/10',
        hint: '分子乘分子，分母乘分母',
      },
    ],
    'math-b3': [
      {
        id: 'b3-q1',
        type: 'fill_in_blank',
        question: '解方程式：2x + 3 = 11，x = ?',
        spoken: '解方程式 2x 加 3 等於 11，x 等於多少',
        correctAnswer: '4',
        hint: '先移項，再除以係數',
      },
      {
        id: 'b3-q2',
        type: 'multiple_choice',
        question: '3x - 7 = 8 的解為何？',
        spoken: '3x 減 7 等於 8，x 等於多少',
        options: [
          { id: 'a', text: 'x = 5', spoken: 'x 等於 5' },
          { id: 'b', text: 'x = 3', spoken: 'x 等於 3' },
          { id: 'c', text: 'x = 1', spoken: 'x 等於 1' },
          { id: 'd', text: 'x = 15', spoken: 'x 等於 15' },
        ],
        correctAnswer: 'a',
      },
    ],
    'math-b4': [
      {
        id: 'b4-q1',
        type: 'fill_in_blank',
        question: '解聯立方程式：x + y = 7, x - y = 3，x = ?',
        spoken: '解聯立方程式 x 加 y 等於 7，x 減 y 等於 3，x 等於多少',
        correctAnswer: '5',
        hint: '兩式相加可消去 y',
      },
      {
        id: 'b4-q2',
        type: 'fill_in_blank',
        question: '承上題，y = ?',
        spoken: '承上題，y 等於多少',
        correctAnswer: '2',
        hint: '將 x 代回第一式',
      },
    ],
  };

  return {
    id: meta.id,
    title: meta.title,
    questions: QUESTIONS[quizId] || [],
    timeLimit: meta.timeLimit,
  };
}
