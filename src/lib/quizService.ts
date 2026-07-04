import { supabase } from './supabase';

// Since we removed auth, we use a fixed teacher ID for now
// In production, this would come from auth
const DEMO_TEACHER_ID = '00000000-0000-0000-0000-000000000000';

export interface QuizData {
  id?: string;
  title: string;
  subject: string;
  grade: string;
  description?: string;
  time_limit?: number;
  status?: 'draft' | 'published' | 'archived';
  questions?: QuestionData[];
}

export interface QuestionData {
  id?: string;
  quiz_id?: string;
  type: 'fill_in_blank' | 'multiple_choice' | 'math_expression' | 'true_false';
  question_text: string;
  latex?: string | null;
  spoken?: string | null;
  options?: any;
  correct_answer: string;
  hint?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard';
  order_index?: number;
}

// Ensure the demo teacher exists in the database
export async function ensureDemoTeacher() {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', DEMO_TEACHER_ID)
    .single();

  if (!data) {
    await supabase.from('users').insert({
      id: DEMO_TEACHER_ID,
      email: 'teacher@demo.com',
      name: '示範老師',
      role: 'teacher',
    });
  }
}

// Save a complete quiz with questions to Supabase
export async function saveQuiz(quizData: QuizData): Promise<{ data: any; error: any }> {
  // Ensure teacher exists first
  await ensureDemoTeacher();

  // 1. Insert quiz
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      title: quizData.title,
      subject: quizData.subject,
      grade: quizData.grade,
      description: quizData.description,
      time_limit: quizData.time_limit || null,
      status: quizData.status || 'published',
      created_by: DEMO_TEACHER_ID,
    })
    .select()
    .single();

  if (quizError) return { data: null, error: quizError };
  if (!quiz) return { data: null, error: { message: 'Failed to create quiz' } };

  // 2. Insert questions
  if (quizData.questions && quizData.questions.length > 0) {
    const questions = quizData.questions.map((q, index) => ({
      quiz_id: quiz.id,
      type: q.type,
      question_text: q.question_text,
      latex: q.latex || null,
      spoken: q.spoken || null,
      options: q.options || null,
      correct_answer: q.correct_answer,
      hint: q.hint || null,
      difficulty: q.difficulty || 'medium',
      order_index: index,
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questions);

    if (questionsError) return { data: null, error: questionsError };
  }

  return { data: quiz, error: null };
}

// Get all published quizzes
export async function getPublishedQuizzes(): Promise<QuizData[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching quizzes:', error);
    return [];
  }

  return data || [];
}

// Get a single quiz with its questions
export async function getQuizWithQuestions(quizId: string): Promise<{ quiz: any; questions: QuestionData[] } | null> {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single();

  if (quizError || !quiz) return null;

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true });

  if (questionsError) return null;

  return { quiz, questions: questions || [] };
}

// Delete a quiz
export async function deleteQuiz(quizId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId);

  return { error };
}

// Get all quizzes (for admin)
export async function getAllQuizzes(): Promise<any[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all quizzes:', error);
    return [];
  }

  return data || [];
}
