import { useState } from 'react';

interface TrueFalseProps {
  questionId: string;
  statement: string;
  onAnswer: (questionId: string, answer: 'true' | 'false') => void;
}

export function TrueFalse({ questionId, statement, onAnswer }: TrueFalseProps) {
  const [selected, setSelected] = useState<'true' | 'false' | null>(null);

  return (
    <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      {/* Statement */}
      <p className="text-lg mb-6 font-medium">{statement}</p>

      {/* True/False options */}
      <fieldset className="space-y-3">
        <legend className="sr-only">判斷題：請選擇對或錯</legend>

        {(['true', 'false'] as const).map((value) => (
          <label
            key={value}
            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer
                       transition-all duration-200
                       ${selected === value
                         ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                         : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                       }`}
          >
            <input
              type="radio"
              name={questionId}
              value={value}
              checked={selected === value}
              onChange={() => {
                setSelected(value);
                onAnswer(questionId, value);
              }}
              className="w-5 h-5 text-blue-600"
            />
            <span className="ml-3 text-lg font-medium">
              {value === 'true' ? '○ 正確' : '✗ 錯誤'}
            </span>
          </label>
        ))}
      </fieldset>

      {/* Screen reader feedback */}
      <div aria-live="polite" className="sr-only">
        {selected && `你選擇了：${selected === 'true' ? '正確' : '錯誤'}`}
      </div>
    </div>
  );
}
