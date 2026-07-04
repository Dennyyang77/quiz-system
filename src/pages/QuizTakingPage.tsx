import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { getMockQuizQuestions } from './QuizListPage';
import { getQuizWithQuestions } from '../lib/quizService';
import { FillInBlank } from '../components/quiz/FillInBlank';
import { AccessibleMath } from '../components/math/AccessibleMath';
import type { Question } from '../hooks/useQuiz';

function MultipleChoiceQuestion({
  question,
  onAnswer,
  currentAnswer,
}: {
  question: Question;
  onAnswer: (id: string, answer: string) => void;
  currentAnswer?: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900" id={`q-${question.id}-label`}>
        {question.question}
      </p>
      <span className="sr-only">{question.spoken}</span>

      {question.hint && (
        <p className="text-sm text-gray-500">提示：{question.hint}</p>
      )}

      <fieldset aria-labelledby={`q-${question.id}-label`} className="mt-4">
        <legend className="sr-only">選擇一個答案</legend>
        <ul role="radiogroup" className="space-y-3">
          {question.options?.map((option) => (
            <li key={option.id}>
              <label
                className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-colors cursor-pointer ${
                  currentAnswer === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={currentAnswer === option.id}
                  onChange={() => onAnswer(question.id, option.id)}
                  className="h-5 w-5 shrink-0 text-blue-600 focus:ring-blue-500"
                  aria-label={option.spoken || option.text}
                />
                <span className="text-base text-gray-900">
                  {option.text}
                  {option.latex && (
                    <AccessibleMath latex={option.latex} spoken={option.spoken || option.text} />
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  );
}

function TrueFalseQuestion({
  question,
  onAnswer,
  currentAnswer,
}: {
  question: Question;
  onAnswer: (id: string, answer: string) => void;
  currentAnswer?: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900" id={`q-${question.id}-label`}>
        {question.question}
      </p>
      <span className="sr-only">{question.spoken}</span>

      {question.hint && (
        <p className="text-sm text-gray-500">提示：{question.hint}</p>
      )}

      <fieldset aria-labelledby={`q-${question.id}-label`} className="mt-4">
        <legend className="sr-only">選擇對或錯</legend>
        <div className="flex gap-4">
          {['對', '錯'].map((val) => (
            <label
              key={val}
              className={`flex items-center gap-3 rounded-lg border-2 px-6 py-4 transition-colors cursor-pointer ${
                currentAnswer === val
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={val}
                checked={currentAnswer === val}
                onChange={() => onAnswer(question.id, val)}
                className="h-5 w-5 shrink-0 text-blue-600 focus:ring-blue-500"
                aria-label={val === '對' ? '正確' : '錯誤'}
              />
              <span className="text-lg font-medium text-gray-900">{val}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function MathExpressionQuestion({
  question,
  onAnswer,
  currentAnswer,
}: {
  question: Question;
  onAnswer: (id: string, answer: string) => void;
  currentAnswer?: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900" id={`q-${question.id}-label`}>
        {question.question}
      </p>
      <span className="sr-only">{question.spoken}</span>

      {question.hint && (
        <p id={`${question.id}-hint`} className="text-sm text-gray-500">提示：{question.hint}</p>
      )}

      <label htmlFor={question.id} className="block font-medium mt-4 text-gray-700">
        請輸入你的答案：
      </label>
      <input
        type="text"
        id={question.id}
        value={currentAnswer || ''}
        onChange={(e) => onAnswer(question.id, e.target.value)}
        className="w-full max-w-xs rounded-lg border-2 border-gray-300 p-4 text-lg transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        placeholder="在此輸入答案..."
        aria-describedby={question.hint ? `${question.id}-hint` : undefined}
        autoComplete="off"
      />
      <div aria-live="polite" className="sr-only">
        {currentAnswer && `你輸入的答案是：${currentAnswer}`}
      </div>
    </div>
  );
}

function QuestionRenderer({
  question,
  onAnswer,
  currentAnswer,
}: {
  question: Question;
  onAnswer: (id: string, answer: string) => void;
  currentAnswer?: string;
}) {
  switch (question.type) {
    case 'fill_in_blank':
      return (
        <FillInBlank
          questionId={question.id}
          latex={question.question}
          spoken={question.spoken}
          hint={question.hint}
          onAnswer={onAnswer}
        />
      );
    case 'multiple_choice':
      return (
        <MultipleChoiceQuestion
          question={question}
          onAnswer={onAnswer}
          currentAnswer={currentAnswer}
        />
      );
    case 'true_false':
      return (
        <TrueFalseQuestion
          question={question}
          onAnswer={onAnswer}
          currentAnswer={currentAnswer}
        />
      );
    case 'math_expression':
      return (
        <MathExpressionQuestion
          question={question}
          onAnswer={onAnswer}
          currentAnswer={currentAnswer}
        />
      );
    default:
      return <p>不支援的題型</p>;
  }
}

function Timer({ startTime, timeLimit, onTimeUp }: { startTime: Date; timeLimit: number; onTimeUp: () => void }) {
  const [remaining, setRemaining] = useState(
    Math.max(0, timeLimit * 60 - Math.floor((Date.now() - startTime.getTime()) / 1000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const left = Math.max(0, timeLimit * 60 - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, timeLimit, onTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = remaining < 60;

  return (
    <div
      role="timer"
      aria-label={`剩餘時間：${minutes} 分 ${seconds} 秒`}
      aria-live="polite"
      className={`text-right font-mono text-lg font-semibold tabular-nums ${
        isUrgent ? 'text-red-600' : 'text-gray-700'
      }`}
    >
      <span aria-hidden="true">⏱ {display}</span>
      <span className="sr-only">剩餘時間：{minutes} 分 {seconds} 秒</span>
    </div>
  );
}

export function QuizTakingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, startQuiz, answerQuestion, nextQuestion, prevQuestion, getResults } = useQuiz();
  const [submitted, setSubmitted] = useState(false);

  // Initialize quiz on mount — try Supabase first, fall back to mock
  useEffect(() => {
    if (!id || state) return;

    async function loadQuiz() {
      // Try Supabase first
      const dbQuiz = await getQuizWithQuestions(id!);
      if (dbQuiz && dbQuiz.questions.length > 0) {
        const questions: Question[] = dbQuiz.questions.map(q => ({
          id: q.id || `q-${Math.random()}`,
          type: q.type,
          question: q.latex || q.question_text,
          spoken: q.spoken || q.question_text,
          options: Array.isArray(q.options) ? q.options : undefined,
          correctAnswer: q.correct_answer,
          hint: q.hint || undefined,
        }));
        startQuiz({
          id: dbQuiz.quiz.id,
          title: dbQuiz.quiz.title,
          questions,
          timeLimit: dbQuiz.quiz.time_limit || undefined,
        });
        return;
      }

      // Fall back to mock data
      const mockQuiz = getMockQuizQuestions(id!);
      if (mockQuiz && mockQuiz.questions.length > 0) {
        startQuiz(mockQuiz);
      } else {
        navigate('/');
      }
    }

    loadQuiz();
  }, [id, state, startQuiz, navigate]);

  const handleSubmit = () => {
    setSubmitted(true);
    if (state) {
      navigate(`/results/${state.quizId}`);
    }
  };

  const handleTimeUp = () => {
    setSubmitted(true);
    if (state) {
      navigate(`/results/${state.quizId}`);
    }
  };

  // Save results to sessionStorage before navigating
  useEffect(() => {
    if (submitted && state) {
      const results = getResults();
      if (results) {
        sessionStorage.setItem(`quiz-results-${state.quizId}`, JSON.stringify(results));
      }
    }
  }, [submitted, state, getResults]);

  if (!state) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-label="載入中">
        <p className="text-lg text-gray-500">正在載入測驗...</p>
      </div>
    );
  }

  const currentQuestion = state.questions[state.currentIndex];
  const answeredCount = Object.keys(state.answers).length;
  const totalCount = state.questions.length;
  const progressPercent = Math.round((answeredCount / totalCount) * 100);
  const isLastQuestion = state.currentIndex === totalCount - 1;

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <header aria-labelledby="quiz-title">
        <h2 id="quiz-title" className="text-2xl font-bold text-gray-900">
          {state.title}
        </h2>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-base text-gray-600" aria-live="polite">
            第 <strong>{state.currentIndex + 1}</strong> 題，共 <strong>{totalCount}</strong> 題
          </p>

          {state.timeLimit && (
            <Timer
              startTime={state.startTime}
              timeLimit={state.timeLimit}
              onTimeUp={handleTimeUp}
            />
          )}
        </div>

        {/* Progress Bar */}
        <div
          className="mt-4"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`作答進度：${answeredCount} 題已完成，共 ${totalCount} 題，${progressPercent}%`}
        >
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500" aria-hidden="true">
            {answeredCount} / {totalCount} 題已完成
          </p>
        </div>
      </header>

      {/* Question Area */}
      <section
        aria-label={`第 ${state.currentIndex + 1} 題`}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <QuestionRenderer
          question={currentQuestion}
          onAnswer={answerQuestion}
          currentAnswer={state.answers[currentQuestion.id]}
        />
      </section>

      {/* Navigation */}
      <nav aria-label="題目導航" className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={prevQuestion}
          disabled={state.currentIndex === 0}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="回到上一題"
        >
          上一題
        </button>

        <div className="flex gap-3">
          {/* Question index buttons for quick navigation */}
          <span className="sr-only" aria-live="polite">
            目前在第 {state.currentIndex + 1} 題
          </span>
        </div>

        {isLastQuestion ? (
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-green-600 px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label={`送出試卷，共 ${totalCount} 題，已完成 ${answeredCount} 題`}
          >
            送出試卷
          </button>
        ) : (
          <button
            type="button"
            onClick={nextQuestion}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="前往下一題"
          >
            下一題
          </button>
        )}
      </nav>

      {/* Back to list link */}
      <div className="border-t border-gray-200 pt-4">
        <Link
          to="/"
          className="text-sm text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus:underline"
          aria-label="放棄本次測驗，返回測驗列表"
        >
          ← 返回測驗列表
        </Link>
      </div>
    </div>
  );
}
