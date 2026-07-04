import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_QUIZZES } from './QuizListPage';
import { QuestionEditor } from '../components/quiz/QuestionEditor';
import { JsonImporter } from '../components/quiz/JsonImporter';
import { TextPasteImporter } from '../components/quiz/TextPasteImporter';
import { PdfUploader } from '../components/quiz/PdfUploader';
import type { EditorQuestion } from '../components/quiz/QuestionEditor';
import type { GeneratedQuiz } from '../lib/gemini';
import { saveQuiz, getAllQuizzes, deleteQuiz as deleteQuizFromDb, getQuizStats, type QuizStats } from '../lib/quizService';

type ImportTab = 'manual' | 'json' | 'text' | 'pdf';

interface DbQuiz {
  id: string;
  title: string;
  subject: string;
  grade: string;
  description: string;
  time_limit: number;
  status: string;
  created_at: string;
}

const TAB_CONFIG: { key: ImportTab; label: string; icon: string }[] = [
  { key: 'manual', label: '手動建立', icon: '✏️' },
  { key: 'json', label: 'JSON 匯入', icon: '📋' },
  { key: 'text', label: '文字貼上', icon: '📝' },
  { key: 'pdf', label: 'PDF 上傳', icon: '📄' },
];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<ImportTab>('manual');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [dbQuizzes, setDbQuizzes] = useState<DbQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QuizStats>({ totalAttempts: 0, averageScore: 0, passRate: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    const quizzes = await getAllQuizzes();
    setDbQuizzes(quizzes);
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const data = await getQuizStats();
    setStats(data);
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    loadQuizzes();
    loadStats();
  }, [loadQuizzes, loadStats]);

  const handleManualSave = async (questions: EditorQuestion[]) => {
    setSaveStatus('儲存中...');
    const title = window.prompt('請輸入試卷標題：', '數學測驗');
    if (!title) { setSaveStatus(''); return; }

    const result = await saveQuiz({
      title,
      subject: '數學',
      grade: '七下',
      questions: questions.map((q, i) => ({
        type: q.type,
        question_text: q.question || q.spoken,
        latex: q.latex || null,
        spoken: q.spoken || null,
        options: q.type === 'multiple_choice' ? q.options : null,
        correct_answer: q.correctAnswer,
        hint: q.hint || null,
        difficulty: q.difficulty,
        order_index: i,
      })),
    });

    if (result.error) {
      setSaveStatus(`儲存失敗：${result.error.message}`);
    } else {
      setSaveStatus('儲存成功！');
      loadQuizzes();
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleQuizImported = async (quiz: GeneratedQuiz) => {
    setSaveStatus('儲存中...');
    const result = await saveQuiz({
      title: quiz.quiz_title,
      subject: '數學',
      grade: '七下',
      questions: quiz.questions.map((q, i) => ({
        type: q.type as any,
        question_text: q.question,
        latex: q.latex || null,
        spoken: q.spoken || null,
        options: q.options || null,
        correct_answer: q.correct_answer,
        hint: q.hint || null,
        difficulty: q.difficulty || 'medium',
        order_index: i,
      })),
    });

    if (result.error) {
      setSaveStatus(`儲存失敗：${result.error.message}`);
    } else {
      setSaveStatus('匯入成功！');
      loadQuizzes();
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!window.confirm(`確定要刪除「${quizTitle}」嗎？此操作無法復原。`)) return;
    const { error } = await deleteQuizFromDb(quizId);
    if (error) {
      setSaveStatus(`刪除失敗：${error.message}`);
    } else {
      setSaveStatus('刪除成功！');
      loadQuizzes();
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header aria-labelledby="admin-heading">
        <h2 id="admin-heading" className="text-2xl font-bold text-gray-900">
          教師管理後台
        </h2>
        <p className="mt-1 text-gray-600">
          管理測驗內容、查看學生作答統計。
        </p>
      </header>

      {/* Summary Cards */}
      <section aria-labelledby="stats-heading">
        <h3 id="stats-heading" className="sr-only">統計摘要</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" role="group" aria-label="總作答次數">
            <p className="text-sm font-medium text-gray-500">總作答次數</p>
            {statsLoading ? (
              <p className="mt-1 text-2xl text-gray-400">載入中...</p>
            ) : stats.totalAttempts === 0 ? (
              <p className="mt-1 text-2xl text-gray-400">尚無作答資料</p>
            ) : (
              <p className="mt-1 text-4xl font-bold tabular-nums text-gray-900" aria-label={`${stats.totalAttempts} 次`}>
                {stats.totalAttempts}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" role="group" aria-label="平均分數">
            <p className="text-sm font-medium text-gray-500">平均分數</p>
            {statsLoading ? (
              <p className="mt-1 text-2xl text-gray-400">載入中...</p>
            ) : stats.totalAttempts === 0 ? (
              <p className="mt-1 text-2xl text-gray-400">—</p>
            ) : (
              <p className="mt-1 text-4xl font-bold tabular-nums text-gray-900" aria-label={`${stats.averageScore} 分`}>
                {stats.averageScore}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" role="group" aria-label="整體通過率">
            <p className="text-sm font-medium text-gray-500">整體通過率</p>
            {statsLoading ? (
              <p className="mt-1 text-2xl text-gray-400">載入中...</p>
            ) : stats.totalAttempts === 0 ? (
              <p className="mt-1 text-2xl text-gray-400">—</p>
            ) : (
              <p className="mt-1 text-4xl font-bold tabular-nums text-gray-900" aria-label={`${stats.passRate} 百分比`}>
                {stats.passRate}%
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Create New Quiz — Tabbed Section */}
      <section aria-labelledby="create-heading">
        <div className="flex items-center justify-between mb-4">
          <h3 id="create-heading" className="text-xl font-bold text-gray-900">
            建立新測驗
          </h3>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="建立新測驗"
            onClick={() => setActiveTab('manual')}
          >
            + 建立新測驗
          </button>
        </div>

        {/* Tab Bar */}
        <div role="tablist" aria-label="建立測驗方式" className="flex gap-1 border-b border-gray-200 mb-4">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                ${activeTab === tab.key
                  ? 'bg-white border border-gray-200 border-b-white text-blue-700 -mb-px'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Save Status */}
        {saveStatus && (
          <div
            role="status"
            aria-live="polite"
            className={`mt-3 rounded-lg px-4 py-3 text-sm font-medium ${
              saveStatus.includes('失敗')
                ? 'bg-red-50 text-red-700'
                : saveStatus.includes('儲存中') || saveStatus.includes('匯入中')
                ? 'bg-blue-50 text-blue-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {saveStatus}
          </div>
        )}

        {/* Tab Panels */}
        <div
          role="tabpanel"
          id="tabpanel-manual"
          aria-labelledby="tab-manual"
          hidden={activeTab !== 'manual'}
        >
          {activeTab === 'manual' && (
            <QuestionEditor onSave={handleManualSave} />
          )}
        </div>

        <div
          role="tabpanel"
          id="tabpanel-json"
          aria-labelledby="tab-json"
          hidden={activeTab !== 'json'}
        >
          {activeTab === 'json' && (
            <JsonImporter onQuizImported={handleQuizImported} />
          )}
        </div>

        <div
          role="tabpanel"
          id="tabpanel-text"
          aria-labelledby="tab-text"
          hidden={activeTab !== 'text'}
        >
          {activeTab === 'text' && (
            <TextPasteImporter onQuizImported={handleQuizImported} />
          )}
        </div>

        <div
          role="tabpanel"
          id="tabpanel-pdf"
          aria-labelledby="tab-pdf"
          hidden={activeTab !== 'pdf'}
        >
          {activeTab === 'pdf' && (
            <PdfUploader onQuizGenerated={handleQuizImported} />
          )}
        </div>
      </section>

      {/* Quiz List with Stats */}
      <section aria-labelledby="quiz-manage-heading">
        <h3 id="quiz-manage-heading" className="text-xl font-bold text-gray-900 mb-4">
          測驗管理
        </h3>

        {loading ? (
          <p className="text-gray-500 py-4">載入中...</p>
        ) : dbQuizzes.length === 0 ? (
          <p className="text-gray-500 py-4">尚無測驗資料。請先建立新測驗。</p>
        ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            aria-label="測驗管理列表"
          >
            <thead>
              <tr className="border-b border-gray-200">
                <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-700">測驗名稱</th>
                <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">狀態</th>
                <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">限時</th>
                <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-700">建立時間</th>
                <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {dbQuizzes.map((quiz) => {
                const quizMeta = MOCK_QUIZZES.find(q => q.id === quiz.id);
                return (
                  <tr
                    key={quiz.id}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/quiz/${quiz.id}`}
                        className="font-medium text-blue-600 hover:underline focus:outline-none focus:underline"
                        aria-label={`預覽測驗：${quiz.title}`}
                      >
                        {quiz.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {quiz.subject} · {quiz.grade}
                        {quizMeta && ` · ${quizMeta.questionCount} 題`}
                        {quiz.time_limit ? ` · ${quiz.time_limit} 分鐘` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        quiz.status === 'published' ? 'bg-green-100 text-green-800' :
                        quiz.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {quiz.status === 'published' ? '已發布' :
                         quiz.status === 'draft' ? '草稿' : '已封存'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {quiz.time_limit ? `${quiz.time_limit} 分` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(quiz.created_at).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="rounded-md px-3 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={`編輯測驗：${quiz.title}`}
                          onClick={() => setActiveTab('manual')}
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          className="rounded-md px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label={`刪除測驗：${quiz.title}`}
                          onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </section>

      {/* Back to Quiz List */}
      <nav aria-label="管理功能" className="border-t border-gray-200 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus:underline"
          aria-label="返回測驗列表"
        >
          ← 返回測驗列表
        </Link>
      </nav>
    </div>
  );
}
