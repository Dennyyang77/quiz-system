import { useState } from 'react';
import { ClipboardPaste, Loader2, AlertCircle } from 'lucide-react';
import { QuestionReview } from './QuestionReview';
import { generateQuizFromText } from '../../lib/gemini';
import type { GeneratedQuiz } from '../../lib/gemini';

interface TextPasteImporterProps {
  onQuizImported: (quiz: GeneratedQuiz) => void;
}

export function TextPasteImporter({ onQuizImported }: TextPasteImporterProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [previewQuiz, setPreviewQuiz] = useState<GeneratedQuiz | null>(null);

  const handlePaste = async () => {
    if (!text.trim()) return;

    setIsProcessing(true);
    setError('');

    try {
      const quiz = await generateQuizFromText(text, undefined);
      setPreviewQuiz(quiz);
    } catch (e) {
      setError(e instanceof Error ? e.message : '處理失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (previewQuiz) {
      onQuizImported(previewQuiz);
      setPreviewQuiz(null);
      setText('');
    }
  };

  const handleCancel = () => {
    setPreviewQuiz(null);
  };

  // Show review if quiz generated
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
      <h3 className="text-xl font-bold mb-2">文字貼上匯入</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        貼上 math_transfer.py 產出的文字內容，AI 會自動解析成題目
      </p>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-64 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                   dark:bg-gray-700 dark:text-white font-mono text-sm
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        placeholder={`貼上考卷文字內容，例如：

第一題 x等於負3， y等於1為下列哪一個二元一次方程式的解？
(Ａ) x 加2 y等於負1
(Ｂ) x 減2 y等於1
(Ｃ) x 加2 y等於5
(Ｄ) x 減2 y等於負5

第二題 計算 根號16 等於多少？
...`}
        aria-label="貼上考卷文字內容"
      />

      {/* Character count */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-500">
          {text.length} 字元
        </span>
        <button
          onClick={() => setText('')}
          className="text-xs text-gray-500 hover:text-red-500"
        >
          清空
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Process button */}
      <button
        onClick={handlePaste}
        disabled={isProcessing || !text.trim()}
        className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-medium
                   hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            AI 解析中...
          </>
        ) : (
          <>
            <ClipboardPaste size={20} />
            開始 AI 解析
          </>
        )}
      </button>

      {/* Usage hint */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          💡 <strong>使用方式</strong>：先用 math_transfer.py 將 PDF 考卷轉成文字，
          複製 Word 檔內容貼到這裡，AI 會自動將 NVDA 格式的文字轉成可作答的題目。
        </p>
      </div>
    </div>
  );
}
