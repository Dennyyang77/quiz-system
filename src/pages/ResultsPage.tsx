import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMockQuizQuestions } from './QuizListPage';
import type { Question } from '../hooks/useQuiz';

interface ResultItem {
  questionId: string;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
}

interface QuizResults {
  results: ResultItem[];
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: number;
  wrongQuestions: ResultItem[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} 分 ${s} 秒`;
}

function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBg(percentage: number): string {
  if (percentage >= 80) return 'bg-green-50 border-green-200';
  if (percentage >= 60) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

export function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [results, setResults] = useState<QuizResults | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!id) return;

    // Try to load results from sessionStorage (set by QuizTakingPage)
    const stored = sessionStorage.getItem(`quiz-results-${id}`);
    if (stored) {
      try {
        setResults(JSON.parse(stored));
      } catch {
        // Corrupted data, fall through
      }
    }

    // Load questions for review display
    const quiz = getMockQuizQuestions(id);
    if (quiz) {
      setQuestions(quiz.questions);
    }
  }, [id]);

  if (!results) {
    return (
      <div className="space-y-6 py-10 text-center">
        <p className="text-lg text-gray-600" role="status">
          找不到測驗結果，請重新開始測驗。
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="返回測驗列表"
        >
          返回測驗列表
        </Link>
      </div>
    );
  }

  const scoreColor = getScoreColor(results.percentage);
  const scoreBg = getScoreBg(results.percentage);

  return (
    <div className="space-y-8">
      {/* Score Summary */}
      <section
        aria-labelledby="score-heading"
        className={`rounded-xl border-2 p-8 text-center ${scoreBg}`}
      >
        <h2 id="score-heading" className="sr-only">測驗成績</h2>

        <p className="text-lg font-medium text-gray-700">
          測驗結果
        </p>

        <p
          className={`mt-2 text-7xl font-bold tabular-nums ${scoreColor}`}
          aria-label={`得分：${results.percentage} 分`}
          role="text"
        >
          {results.percentage}
          <span className="text-4xl" aria-hidden="true">分</span>
          <span className="sr-only">分</span>
        </p>

        <dl className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-base text-gray-600">
          <div>
            <dt className="sr-only">答對題數</dt>
            <dd>
              答對 <strong className="text-gray-900">{results.correctCount}</strong> 題，
              共 <strong className="text-gray-900">{results.totalQuestions}</strong> 題
            </dd>
          </div>
          <div>
            <dt className="sr-only">答錯題數</dt>
            <dd>
              答錯 <strong className="text-gray-900">{results.wrongQuestions.length}</strong> 題
            </dd>
          </div>
          <div>
            <dt className="sr-only">作答時間</dt>
            <dd>
              用時 <strong className="text-gray-900">{formatTime(results.timeSpent)}</strong>
            </dd>
          </div>
        </dl>
      </section>

      {/* All Questions Review */}
      <section aria-labelledby="review-heading">
        <h3 id="review-heading" className="text-xl font-bold text-gray-900 mb-4">
          逐題檢視
        </h3>
        <ol className="space-y-3" aria-label="所有題目作答結果">
          {results.results.map((r, idx) => {
            const question = questions.find(q => q.id === r.questionId);
            return (
              <li
                key={r.questionId}
                className={`rounded-lg border p-4 ${
                  r.correct
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
                aria-label={`第 ${idx + 1} 題：${r.correct ? '答對' : '答錯'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      第 {idx + 1} 題
                      {question && <span className="ml-2 text-gray-600">— {question.spoken}</span>}
                    </p>
                    <dl className="mt-1 text-sm text-gray-600">
                      <div className="flex gap-2">
                        <dt>你的答案：</dt>
                        <dd className={r.correct ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                          {r.userAnswer || '（未作答）'}
                        </dd>
                      </div>
                      {!r.correct && (
                        <div className="flex gap-2">
                          <dt>正確答案：</dt>
                          <dd className="font-semibold text-green-700">{r.correctAnswer}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                      r.correct
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                    aria-hidden="true"
                  >
                    {r.correct ? '✓' : '✗'}
                  </span>
                  <span className="sr-only">{r.correct ? '答對' : '答錯'}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Wrong Questions Review */}
      {results.wrongQuestions.length > 0 && (
        <section aria-labelledby="wrong-heading" className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
          <h3 id="wrong-heading" className="text-xl font-bold text-red-800 mb-4">
            錯題複習
          </h3>
          <p className="mb-4 text-red-700">
            以下是你答錯的題目，請仔細複習正確答案：
          </p>
          <ol className="space-y-4" aria-label="錯題列表">
            {results.wrongQuestions.map((r) => {
              const question = questions.find(q => q.id === r.questionId);
              return (
                <li
                  key={r.questionId}
                  className="rounded-lg border border-red-200 bg-white p-4"
                >
                  <p className="font-medium text-gray-900">
                    題目 {question?.spoken || r.questionId}
                  </p>
                  {question?.hint && (
                    <p className="mt-1 text-sm text-gray-500">提示：{question.hint}</p>
                  )}
                  <dl className="mt-2 text-sm">
                    <div className="flex gap-2">
                      <dt className="text-red-700">你的答案：</dt>
                      <dd className="font-semibold text-red-700">{r.userAnswer || '（未作答）'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-green-700">正確答案：</dt>
                      <dd className="font-semibold text-green-700">{r.correctAnswer}</dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Actions */}
      <nav aria-label="結果頁操作" className="flex flex-wrap gap-4 border-t border-gray-200 pt-6">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="返回測驗列表，選擇其他測驗"
        >
          返回測驗列表
        </Link>
        {id && (
          <Link
            to={`/quiz/${id}`}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="重新測驗同一份試卷"
          >
            重新測驗
          </Link>
        )}
      </nav>
    </div>
  );
}
