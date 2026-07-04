// Database types for Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'teacher' | 'student'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'teacher' | 'student'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'teacher' | 'student'
          updated_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          title: string
          description: string | null
          subject: string
          grade: string
          time_limit: number | null
          status: 'draft' | 'published' | 'archived'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          subject: string
          grade: string
          time_limit?: number | null
          status?: 'draft' | 'published' | 'archived'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          subject?: string
          grade?: string
          time_limit?: number | null
          status?: 'draft' | 'published' | 'archived'
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          type: 'fill_in_blank' | 'multiple_choice' | 'math_expression' | 'true_false'
          question_text: string
          latex: string | null
          spoken: string | null
          options: Json | null
          correct_answer: string
          hint: string | null
          difficulty: 'easy' | 'medium' | 'hard'
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          type: 'fill_in_blank' | 'multiple_choice' | 'math_expression' | 'true_false'
          question_text: string
          latex?: string | null
          spoken?: string | null
          options?: Json | null
          correct_answer: string
          hint?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          type?: 'fill_in_blank' | 'multiple_choice' | 'math_expression' | 'true_false'
          question_text?: string
          latex?: string | null
          spoken?: string | null
          options?: Json | null
          correct_answer?: string
          hint?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          order_index?: number
        }
      }
      quiz_sessions: {
        Row: {
          id: string
          quiz_id: string
          user_id: string
          started_at: string
          completed_at: string | null
          score: number | null
          total_questions: number
          correct_count: number | null
        }
        Insert: {
          id?: string
          quiz_id: string
          user_id: string
          started_at?: string
          completed_at?: string | null
          score?: number | null
          total_questions?: number
          correct_count?: number | null
        }
        Update: {
          id?: string
          quiz_id?: string
          user_id?: string
          completed_at?: string | null
          score?: number | null
          correct_count?: number | null
        }
      }
      responses: {
        Row: {
          id: string
          session_id: string
          question_id: string
          answer: string
          is_correct: boolean
          time_spent: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          answer: string
          is_correct: boolean
          time_spent: number
          created_at?: string
        }
        Update: {
          id?: string
          answer?: string
          is_correct?: boolean
          time_spent?: number
        }
      }
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type Quiz = Database['public']['Tables']['quizzes']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type QuizSession = Database['public']['Tables']['quiz_sessions']['Row']
export type Response = Database['public']['Tables']['responses']['Row']
