import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { type GeneratedQuiz } from '../../lib/gemini';
import { AccessibleMath } from '../math/AccessibleMath';

interface QuestionReviewProps {
  quiz: GeneratedQuiz;
  onConfirm: () => void;
  onCancel: () => void;
}

export function QuestionReview({ quiz, onConfirm, onCancel }: QuestionReviewProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set([0]));
  const [editedQuestions, setEditedQuestions] = useState<GeneratedQuiz['questions']>(quiz.questions);

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const updateQuestion = (index: number, updates: Partial<GeneratedQuiz['questions'][0]>) => {
    const newQuestions = [...editedQuestions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setEditedQuestions(newQuestions);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'multiple_choice': '選擇題',
      'fill_in_blank': '填充題',
      'math_expression': '數學計算題',
      'true_false': '是非題',
    };
    return labels[type] || type;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      'easy': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'hard': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[difficulty] || '';
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold">審核生成的試卷</h3>
          <p className="text-gray-600 dark:text-gray-400">
            試卷標題：{quiz.quiz_title}（共 {editedQuestions.length} 題）
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor('medium')}`}>
          {editedQuestions.length} 題
        </span>
      </div>

      {/* Questions list */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {editedQuestions.map((question, index) => (
          <div
            key={index}
            className="border rounded-lg overflow-hidden dark:border-gray-700"
          >
            {/* Question header */}
            <button
              onClick={() => toggleQuestion(index)}
              className="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-blue-600">第 {index + 1} 題</span>
                <span className="text-sm text-gray-500">{getTypeLabel(question.type)}</span>
              </div>
              {expandedQuestions.has(index) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {/* Expanded content */}
            {expandedQuestions.has(index) && (
              <div className="p-4 space-y-4">
                {/* Question preview */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="font-medium mb-2">{question.question}</p>
                  {question.latex && (
                    <div className="my-2">
                      <AccessibleMath latex={question.latex} spoken={question.spoken} />
                    </div>
                  )}
                </div>

                {/* Options for multiple choice */}
                {question.type === 'multiple_choice' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded ${
                          opt.id === question.correct_answer
                            ? 'bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                            : 'bg-gray-50 dark:bg-gray-900'
                        }`}
                      >
                        <span className="font-medium">{opt.id}.</span> {opt.text}
                        {opt.latex && (
                          <span className="ml-2">
                            <AccessibleMath latex={opt.latex} spoken={opt.spoken || opt.text} />
                          </span>
                        )}
                        {opt.id === question.correct_answer && (
                          <span className="ml-2 text-green-600 text-sm">✓ 正確答案</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer for other types */}
                {question.type !== 'multiple_choice' && (
                  <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded">
                    正確答案：{question.correct_answer}
                  </div>
                )}

                {/* Edit fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">題目文字</label>
                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) => updateQuestion(index, { question: e.target.value })}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">正確答案</label>
                    <input
                      type="text"
                      value={question.correct_answer}
                      onChange={(e) => updateQuestion(index, { correct_answer: e.target.value })}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium
                     hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
        >
          <X size={20} />
          取消
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium
                     hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <Check size={20} />
          確認匯入
        </button>
      </div>
    </div>
  );
}
