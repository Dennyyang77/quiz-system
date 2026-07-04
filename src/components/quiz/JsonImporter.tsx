import { useState, useCallback } from 'react';
import { FileJson, AlertCircle } from 'lucide-react';
import { QuestionReview } from './QuestionReview';
import type { GeneratedQuiz } from '../../lib/gemini';

interface JsonImporterProps {
  onQuizImported: (quiz: GeneratedQuiz) => void;
}

export function JsonImporter({ onQuizImported }: JsonImporterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [previewQuiz, setPreviewQuiz] = useState<GeneratedQuiz | null>(null);

  // Expected JSON format (for documentation / validation)
  const EXAMPLE_JSON = `{
  "quiz_title": "七年級數學第二次段考",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "下列何者為 x² + 3x - 4 = 0 的解？",
      "latex": "x^2 + 3x - 4 = 0",
      "spoken": "x的2次方 加 3x 減 4 等於 0，下列何者為其解？",
      "options": [
        { "id": "A", "text": "x = 1", "latex": "x=1", "spoken": "x等於1" },
        { "id": "B", "text": "x = -4", "latex": "x=-4", "spoken": "x等於負4" },
        { "id": "C", "text": "x = 2", "latex": "x=2", "spoken": "x等於2" },
        { "id": "D", "text": "x = -1", "latex": "x=-1", "spoken": "x等於負1" }
      ],
      "correct_answer": "A",
      "difficulty": "medium"
    },
    {
      "type": "fill_in_blank",
      "question": "計算：二分之一加三分之一等於多少？",
      "latex": "\\\\frac{1}{2} + \\\\frac{1}{3} = ?",
      "spoken": "二分之一 加 三分之一 等於多少？",
      "correct_answer": "5/6",
      "difficulty": "easy"
    }
  ]
}`;

  const validateQuiz = (data: unknown): GeneratedQuiz => {
    if (!data || typeof data !== 'object') {
      throw new Error('JSON 格式不正確');
    }

    const quiz = data as Record<string, unknown>;

    if (!quiz.quiz_title || typeof quiz.quiz_title !== 'string') {
      throw new Error('缺少 quiz_title 欄位');
    }

    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      throw new Error('缺少 questions 陣列或沒有題目');
    }

    const validTypes = ['fill_in_blank', 'multiple_choice', 'math_expression', 'true_false'];

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i] as Record<string, unknown>;
      if (!q.type || !validTypes.includes(q.type as string)) {
        throw new Error(`第 ${i + 1} 題的 type 不正確：${q.type}`);
      }
      if (!q.question || typeof q.question !== 'string') {
        throw new Error(`第 ${i + 1} 題缺少 question 欄位`);
      }
      if (!q.correct_answer || typeof q.correct_answer !== 'string') {
        throw new Error(`第 ${i + 1} 題缺少 correct_answer 欄位`);
      }
      if (!q.spoken || typeof q.spoken !== 'string') {
        throw new Error(`第 ${i + 1} 題缺少 spoken 欄位（NVDA 朗讀文字）`);
      }
    }

    return quiz as unknown as GeneratedQuiz;
  };

  const handleFile = useCallback((file: File) => {
    setError('');

    if (!file.name.endsWith('.json')) {
      setError('請上傳 .json 檔案');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        const quiz = validateQuiz(data);
        setPreviewQuiz(quiz);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'JSON 解析失敗');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirm = () => {
    if (previewQuiz) {
      onQuizImported(previewQuiz);
      setPreviewQuiz(null);
    }
  };

  const handleCancel = () => {
    setPreviewQuiz(null);
  };

  // Show review if quiz loaded
  if (previewQuiz) {
    return (
      <QuestionReview
        quiz={previewQuiz}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl">
      <h3 className="text-xl font-bold mb-2">JSON 檔匯入</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        上傳 JSON 格式的題目檔案，快速匯入整份試卷
      </p>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-8 border-2 border-dashed rounded-xl text-center transition-colors
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
          }`}
      >
        <input
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
          id="json-upload"
        />
        <FileJson className="mx-auto text-blue-500 mb-3" size={48} />
        <label htmlFor="json-upload" className="cursor-pointer">
          <span className="text-blue-600 hover:underline">點擊上傳 JSON</span>
          <span className="text-gray-600 dark:text-gray-400"> 或拖放檔案到此處</span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Format reference */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline">
          📋 查看 JSON 格式範例
        </summary>
        <pre className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs overflow-x-auto">
          {EXAMPLE_JSON}
        </pre>
      </details>
    </div>
  );
}
