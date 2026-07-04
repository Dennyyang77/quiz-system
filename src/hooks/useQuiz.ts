import { useState, useCallback } from 'react';

export interface Question {
  id: string;
  type: 'fill_in_blank' | 'multiple_choice' | 'math_expression' | 'true_false';
  question: string;           // Text or LaTeX
  spoken: string;             // Chinese for NVDA
  options?: {                 // For multiple choice
    id: string;
    text: string;
    latex?: string;
    spoken?: string;
  }[];
  correctAnswer: string;
  hint?: string;
}

export interface QuizState {
  quizId: string;
  title: string;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  startTime: Date;
  timeLimit?: number;         // In minutes
}

export function useQuiz() {
  const [state, setState] = useState<QuizState | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const startQuiz = useCallback((quiz: { id: string; title: string; questions: Question[]; timeLimit?: number }) => {
    setState({
      quizId: quiz.id,
      title: quiz.title,
      questions: quiz.questions,
      currentIndex: 0,
      answers: {},
      startTime: new Date(),
      timeLimit: quiz.timeLimit,
    });
    setIsComplete(false);
  }, []);

  const answerQuestion = useCallback((questionId: string, answer: string) => {
    setState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        answers: { ...prev.answers, [questionId]: answer }
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState(prev => {
      if (!prev) return prev;
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.questions.length) {
        setIsComplete(true);
        return prev;
      }
      return { ...prev, currentIndex: nextIndex };
    });
  }, []);

  const prevQuestion = useCallback(() => {
    setState(prev => {
      if (!prev || prev.currentIndex === 0) return prev;
      return { ...prev, currentIndex: prev.currentIndex - 1 };
    });
  }, []);

  const getResults = useCallback(() => {
    if (!state) return null;

    const results = state.questions.map(q => ({
      questionId: q.id,
      correct: state.answers[q.id]?.trim() === q.correctAnswer.trim(),
      userAnswer: state.answers[q.id] || '',
      correctAnswer: q.correctAnswer,
    }));

    const correctCount = results.filter(r => r.correct).length;
    const totalQuestions = state.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const timeSpent = Math.round((Date.now() - state.startTime.getTime()) / 1000);

    return {
      results,
      correctCount,
      totalQuestions,
      percentage,
      timeSpent,
      wrongQuestions: results.filter(r => !r.correct),
    };
  }, [state]);

  return {
    state,
    isComplete,
    startQuiz,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    getResults,
  };
}
