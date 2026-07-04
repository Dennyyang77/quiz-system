import { useState } from 'react';
import { AccessibleMath } from '../math/AccessibleMath';

interface MathExpressionProps {
  questionId: string;
  problem: string;          // Full problem statement
  problemLatex: string;      // LaTeX for visual
  problemSpoken: string;     // Chinese for NVDA
  expectedAnswer: string;    // Expected answer (for validation)
  onAnswer: (questionId: string, answer: string, isCorrect: boolean) => void;
  showResult?: boolean;      // Show correct/incorrect after answer
}

export function MathExpression({
  questionId,
  problem,
  problemLatex,
  problemSpoken,
  expectedAnswer,
  onAnswer,
  showResult = false,
}: MathExpressionProps) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);

    // Normalize for comparison (trim, lowercase)
    const normalizedAnswer = answer.trim();
    const normalizedExpected = expectedAnswer.trim();
    const isCorrect = normalizedAnswer === normalizedExpected;

    onAnswer(questionId, normalizedAnswer, isCorrect);
  };

  return (
    <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      {/* Problem statement */}
      <p className="text-lg mb-4">{problem}</p>

      {/* Math expression - dual channel */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <AccessibleMath latex={problemLatex} spoken={problemSpoken} display />
      </div>

      {/* Answer input */}
      <label htmlFor={`${questionId}-answer`} className="block font-medium mb-2">
        計算答案：
      </label>
      <div className="flex gap-3">
        <input
          type="text"
          id={`${questionId}-answer`}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={submitted}
          className="flex-1 p-4 text-lg border-2 border-gray-300 rounded-lg
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                     dark:bg-gray-700 dark:border-gray-600 dark:text-white
                     disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="輸入你的計算結果..."
        />
        <button
          onClick={handleSubmit}
          disabled={submitted || !answer.trim()}
          className="px-6 py-4 bg-blue-600 text-white rounded-lg font-medium
                     hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                     transition-colors"
        >
          送出
        </button>
      </div>

      {/* Result feedback - ARIA live region */}
      {showResult && submitted && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-4 p-4 rounded-lg ${
            answer.trim() === expectedAnswer.trim()
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {answer.trim() === expectedAnswer.trim()
            ? `✓ 正確！答案是 ${expectedAnswer}`
            : `✗ 不正確。正確答案是 ${expectedAnswer}`}
        </div>
      )}
    </div>
  );
}
