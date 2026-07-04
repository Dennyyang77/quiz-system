import { useState } from 'react';
import { Plus, Trash2, GripVertical, Eye, EyeOff, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { AccessibleMath } from '../math/AccessibleMath';
import { FillInBlank, MultipleChoice, MathExpression, TrueFalse } from './index';

// Types
type QuestionType = 'fill_in_blank' | 'multiple_choice' | 'math_expression' | 'true_false';
type Difficulty = 'easy' | 'medium' | 'hard';

interface EditorOption {
  id: string;
  text: string;
  latex?: string;
  spoken?: string;
}

interface EditorQuestion {
  id: string;
  type: QuestionType;
  question: string;
  latex: string;
  spoken: string;
  options: EditorOption[];
  correctAnswer: string;
  difficulty: Difficulty;
  hint?: string;
}

interface QuestionEditorProps {
  onSave: (questions: EditorQuestion[]) => void;
  initialQuestions?: EditorQuestion[];
}

// Question type labels (Chinese)
const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'fill_in_blank', label: '填充題' },
  { value: 'multiple_choice', label: '選擇題' },
  { value: 'math_expression', label: '數學計算題' },
  { value: 'true_false', label: '是非題' },
];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function createEmptyQuestion(): EditorQuestion {
  return {
    id: `q_${Date.now()}`,
    type: 'multiple_choice',
    question: '',
    latex: '',
    spoken: '',
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ],
    correctAnswer: 'A',
    difficulty: 'medium',
  };
}

export function QuestionEditor({ onSave, initialQuestions = [] }: QuestionEditorProps) {
  const [questions, setQuestions] = useState<EditorQuestion[]>(
    initialQuestions.length > 0 ? initialQuestions : [createEmptyQuestion()]
  );
  const [showPreview, setShowPreview] = useState(false);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<EditorQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  const moveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return;
    const newQuestions = [...questions];
    const [moved] = newQuestions.splice(from, 1);
    newQuestions.splice(to, 0, moved);
    setQuestions(newQuestions);
  };

  const handleSave = () => {
    onSave(questions);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold">題目編輯器</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label={showPreview ? '隱藏預覽' : '顯示預覽'}
          >
            {showPreview ? <EyeOff size={20} /> : <Eye size={20} />}
            {showPreview ? '隱藏預覽' : '顯示預覽'}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            <Check size={20} />
            儲存試卷
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-8">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            total={questions.length}
            showPreview={showPreview}
            onUpdate={(updates) => updateQuestion(index, updates)}
            onRemove={() => removeQuestion(index)}
            onMoveUp={() => moveQuestion(index, index - 1)}
            onMoveDown={() => moveQuestion(index, index + 1)}
          />
        ))}
      </div>

      {/* Add Question Button */}
      <button
        onClick={addQuestion}
        className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl
                   flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400
                   hover:border-blue-500 hover:text-blue-500 transition-colors"
      >
        <Plus size={24} />
        新增題目
      </button>
    </div>
  );
}

// --- Individual Question Card ---

interface QuestionCardProps {
  question: EditorQuestion;
  index: number;
  total: number;
  showPreview: boolean;
  onUpdate: (updates: Partial<EditorQuestion>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function QuestionCard({
  question,
  index,
  total,
  showPreview,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: QuestionCardProps) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GripVertical className="text-gray-400 cursor-grab" />
          <span className="text-lg font-bold text-blue-600">
            第 {index + 1} 題
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFFICULTY_COLORS[question.difficulty]}`}>
            {question.difficulty === 'easy' ? '簡單' : question.difficulty === 'medium' ? '中等' : '困難'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
            aria-label="上移題目"
          >
            <ChevronUp size={18} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
            aria-label="下移題目"
          >
            <ChevronDown size={18} />
          </button>
          <select
            value={question.difficulty}
            onChange={(e) => onUpdate({ difficulty: e.target.value as Difficulty })}
            className="ml-2 px-3 py-1 rounded border text-sm dark:bg-gray-700 dark:border-gray-600"
            aria-label="難度"
          >
            <option value="easy">簡單</option>
            <option value="medium">中等</option>
            <option value="hard">困難</option>
          </select>
          <button
            onClick={onRemove}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
            aria-label="刪除題目"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Question Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">題目類型</label>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                const updates: Partial<EditorQuestion> = { type: type.value };
                // Reset answer & options when switching type
                if (type.value === 'true_false') {
                  updates.correctAnswer = 'true';
                } else if (type.value === 'fill_in_blank' || type.value === 'math_expression') {
                  updates.correctAnswer = '';
                } else if (type.value === 'multiple_choice') {
                  updates.correctAnswer = 'A';
                  if (!question.options || question.options.length === 0) {
                    updates.options = [
                      { id: 'A', text: '' },
                      { id: 'B', text: '' },
                      { id: 'C', text: '' },
                      { id: 'D', text: '' },
                    ];
                  }
                }
                onUpdate(updates);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors
                ${question.type === type.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Question Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">題目內容（文字）</label>
        <textarea
          value={question.question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-colors"
          rows={2}
          placeholder="輸入題目文字..."
        />
      </div>

      {/* LaTeX Input + Live Render */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">數學式（LaTeX）</label>
        <input
          type="text"
          value={question.latex}
          onChange={(e) => onUpdate({ latex: e.target.value })}
          className="w-full p-3 border rounded-lg font-mono dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-colors"
          placeholder="例如: \\frac{1}{2} + \\frac{1}{3}"
        />
        {question.latex && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 block mb-1">LaTeX 預覽</span>
            <AccessibleMath latex={question.latex} spoken={question.spoken || question.question} display />
          </div>
        )}
      </div>

      {/* Spoken Text (NVDA) */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">語音朗讀文字（給 NVDA 讀取）</label>
        <input
          type="text"
          value={question.spoken}
          onChange={(e) => onUpdate({ spoken: e.target.value })}
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-colors"
          placeholder="例如: 二分之一 加 三分之一 等於多少"
        />
        <p className="text-xs text-gray-500 mt-1">
          這段文字會被 NVDA 螢幕閱讀器朗讀，請用自然的中文描述數學式
        </p>
      </div>

      {/* Hint (optional) */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">提示（選填）</label>
        <input
          type="text"
          value={question.hint || ''}
          onChange={(e) => onUpdate({ hint: e.target.value })}
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-colors"
          placeholder="輸入提示文字..."
        />
      </div>

      {/* Multiple Choice Options */}
      {question.type === 'multiple_choice' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">選項</label>
          <div className="space-y-2">
            {question.options.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <span className="w-8 font-bold text-center">{option.id}.</span>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => {
                    const newOptions = question.options.map((o) =>
                      o.id === option.id ? { ...o, text: e.target.value } : o
                    );
                    onUpdate({ options: newOptions });
                  }}
                  className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-colors"
                  placeholder={`選項 ${option.id}`}
                />
                {option.latex !== undefined && (
                  <input
                    type="text"
                    value={option.latex}
                    onChange={(e) => {
                      const newOptions = question.options.map((o) =>
                        o.id === option.id ? { ...o, latex: e.target.value } : o
                      );
                      onUpdate({ options: newOptions });
                    }}
                    className="w-32 p-2 border rounded font-mono text-sm dark:bg-gray-700 dark:border-gray-600"
                    placeholder="選項 LaTeX"
                  />
                )}
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={question.correctAnswer === option.id}
                  onChange={() => onUpdate({ correctAnswer: option.id })}
                  className="w-5 h-5 text-blue-600"
                  aria-label={`設為正確答案 ${option.id}`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            點擊選項旁的圓圈來設定正確答案
          </p>
        </div>
      )}

      {/* Correct Answer for other types */}
      {question.type !== 'multiple_choice' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">正確答案</label>
          {question.type === 'true_false' ? (
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={question.correctAnswer === 'true'}
                  onChange={() => onUpdate({ correctAnswer: 'true' })}
                  className="w-5 h-5 text-blue-600"
                />
                正確
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={question.correctAnswer === 'false'}
                  onChange={() => onUpdate({ correctAnswer: 'false' })}
                  className="w-5 h-5 text-blue-600"
                />
                錯誤
              </label>
            </div>
          ) : (
            <input
              type="text"
              value={question.correctAnswer}
              onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-colors"
              placeholder="輸入正確答案"
            />
          )}
        </div>
      )}

      {/* Live Preview */}
      {showPreview && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium mb-3 text-gray-600 dark:text-gray-400">預覽</h4>
          <PreviewQuestion question={question} />
        </div>
      )}
    </div>
  );
}

// --- Preview: renders the question using actual quiz components ---

function PreviewQuestion({ question }: { question: EditorQuestion }) {
  const mockAnswer = (id: string, answer: string) => {
    console.log('Preview answer:', id, answer);
  };

  if (question.type === 'fill_in_blank') {
    return (
      <FillInBlank
        questionId={question.id}
        latex={question.latex || question.question}
        spoken={question.spoken || question.question}
        hint={question.hint}
        onAnswer={mockAnswer}
      />
    );
  }

  if (question.type === 'multiple_choice') {
    const options = question.options.map((o) => ({
      id: o.id,
      text: o.text || o.id,
      latex: o.latex,
      spoken: o.spoken,
    }));
    return (
      <MultipleChoice
        questionId={question.id}
        latex={question.latex || question.question}
        spoken={question.spoken || question.question}
        options={options}
        onAnswer={mockAnswer}
      />
    );
  }

  if (question.type === 'math_expression') {
    return (
      <MathExpression
        questionId={question.id}
        problem={question.question}
        problemLatex={question.latex || question.question}
        problemSpoken={question.spoken || question.question}
        expectedAnswer={question.correctAnswer}
        onAnswer={(id, answer, isCorrect) => console.log('Preview answer:', id, answer, isCorrect)}
      />
    );
  }

  if (question.type === 'true_false') {
    return (
      <TrueFalse
        questionId={question.id}
        statement={question.question}
        onAnswer={mockAnswer as (questionId: string, answer: 'true' | 'false') => void}
      />
    );
  }

  return null;
}

// Re-export types for consumers
export type { EditorQuestion, QuestionType, Difficulty, EditorOption };
