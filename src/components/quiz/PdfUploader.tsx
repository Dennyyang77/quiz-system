import { useState, useCallback } from 'react';
import { Upload, File, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { generateQuizFromPdf, type GeneratedQuiz } from '../../lib/gemini';
import { QuestionReview } from './QuestionReview';

interface PdfUploaderProps {
  onQuizGenerated: (quiz: GeneratedQuiz) => void;
  apiKey?: string;
}

export function PdfUploader({ onQuizGenerated }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);

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

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
      setError('');
    } else {
      setError('請上傳 PDF 檔案');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('請上傳 PDF 檔案');
    }
  };

  const processPdf = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setProgress('');

    try {
      const quiz = await generateQuizFromPdf(file, setProgress);
      setGeneratedQuiz(quiz);
    } catch (e) {
      setError(e instanceof Error ? e.message : '處理失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (generatedQuiz) {
      onQuizGenerated(generatedQuiz);
      setGeneratedQuiz(null);
      setFile(null);
    }
  };

  const handleCancel = () => {
    setGeneratedQuiz(null);
    setFile(null);
  };

  // Show review screen if quiz is generated
  if (generatedQuiz) {
    return (
      <QuestionReview
        quiz={generatedQuiz}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl">
      <h3 className="text-xl font-bold mb-4">PDF 自動生成試卷</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        上傳數學考卷 PDF，AI 會自動轉換為可作答的題目
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
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="pdf-upload"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <File className="text-blue-600" size={32} />
            <span className="font-medium">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              aria-label="移除檔案"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto text-gray-400 mb-3" size={48} />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:underline">
                點擊上傳
              </span>
              <span className="text-gray-600 dark:text-gray-400"> 或拖放 PDF 檔案到此處</span>
            </label>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Process button */}
      {file && (
        <button
          onClick={processPdf}
          disabled={isProcessing}
          className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-medium
                     hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              處理中...
            </>
          ) : (
            <>
              <Check size={20} />
              開始 AI 處理
            </>
          )}
        </button>
      )}

      {/* Progress */}
      {isProcessing && progress && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg">
          {progress}
        </div>
      )}
    </div>
  );
}
