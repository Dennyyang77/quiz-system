import { useState } from 'react';
import { AccessibleMath } from '../math/AccessibleMath';

interface Option {
  id: string;           // A, B, C, D
  text: string;         // Option text
  latex?: string;       // Optional LaTeX for math
  spoken?: string;      // Optional spoken version
}

interface MultipleChoiceProps {
  questionId: string;
  latex: string;
  spoken: string;
  options: Option[];
  onAnswer: (questionId: string, answer: string) => void;
}

export function MultipleChoice({ questionId, latex, spoken, options, onAnswer }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      {/* Question */}
      <div className="mb-6">
        <AccessibleMath latex={latex} spoken={spoken} display />
      </div>

      {/* Options as radio buttons in a fieldset */}
      <fieldset className="space-y-3">
        <legend className="sr-only">請選擇正確答案</legend>

        {options.map((option) => (
          <label
            key={option.id}
            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer
                       transition-all duration-200
                       ${selected === option.id
                         ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                         : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                       }`}
          >
            <input
              type="radio"
              name={questionId}
              value={option.id}
              checked={selected === option.id}
              onChange={() => {
                setSelected(option.id);
                onAnswer(questionId, option.id);
              }}
              className="w-5 h-5 text-blue-600 border-gray-300
                         focus:ring-blue-500 focus:ring-2"
            />
            <span className="ml-3 text-lg font-medium">
              {option.id}. {option.text}
            </span>

            {/* Optional math rendering */}
            {option.latex && option.spoken && (
              <span className="ml-2">
                <AccessibleMath latex={option.latex} spoken={option.spoken} />
              </span>
            )}
          </label>
        ))}
      </fieldset>

      {/* Screen reader feedback */}
      <div aria-live="polite" className="sr-only">
        {selected && `你選擇了選項 ${selected}`}
      </div>
    </div>
  );
}
