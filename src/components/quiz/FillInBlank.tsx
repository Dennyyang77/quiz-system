import { useState } from 'react';
import { AccessibleMath } from '../math/AccessibleMath';

interface FillInBlankProps {
  questionId: string;
  latex: string;        // LaTeX math for visual
  spoken: string;       // Chinese for NVDA
  hint?: string;        // Optional hint text
  onAnswer: (questionId: string, answer: string) => void;
}

export function FillInBlank({ questionId, latex, spoken, hint, onAnswer }: FillInBlankProps) {
  const [value, setValue] = useState('');

  return (
    <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      {/* Question with accessible math */}
      <div className="mb-6">
        <AccessibleMath latex={latex} spoken={spoken} display />
      </div>

      {/* Hint for screen readers */}
      {hint && (
        <p id={`${questionId}-hint`} className="text-sm text-gray-500 mb-2">
          提示：{hint}
        </p>
      )}

      {/* Input field - MUST have proper label association */}
      <label htmlFor={questionId} className="block font-medium mb-2">
        請輸入你的答案：
      </label>
      <input
        type="text"
        id={questionId}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onAnswer(questionId, e.target.value);
        }}
        className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                   dark:bg-gray-700 dark:border-gray-600 dark:text-white
                   transition-colors"
        placeholder="在此輸入答案..."
        aria-describedby={hint ? `${questionId}-hint` : undefined}
        autoComplete="off"
      />

      {/* Screen reader feedback */}
      <div aria-live="polite" className="sr-only">
        {value && `你輸入的答案是：${value}`}
      </div>
    </div>
  );
}
