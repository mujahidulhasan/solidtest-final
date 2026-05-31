import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://erhfbvesfjzhuvvyylud.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaGZidmVzZmp6aHV2dnl5bHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODExMzYsImV4cCI6MjA5NDQ1NzEzNn0.iPfTtA-lMsbCb6v0uxyBAAKmncpP6_xuYGDkm1UQbmI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
      };
      question_sets: {
        Row: QuestionSet;
        Insert: Omit<QuestionSet, 'id' | 'created_at'>;
        Update: Partial<Omit<QuestionSet, 'id' | 'created_at'>>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id' | 'created_at'>;
        Update: Partial<Omit<Question, 'id' | 'created_at'>>;
      };
      question_images: {
        Row: QuestionImage;
        Insert: Omit<QuestionImage, 'id'>;
        Update: Partial<Omit<QuestionImage, 'id'>>;
      };
      mcq_options: {
        Row: MCQOption;
        Insert: Omit<MCQOption, 'id'>;
        Update: Partial<Omit<MCQOption, 'id'>>;
      };
      exam_attempts: {
        Row: ExamAttempt;
        Insert: Omit<ExamAttempt, 'id'>;
        Update: Partial<Omit<ExamAttempt, 'id'>>;
      };
      user_answers: {
        Row: UserAnswer;
        Insert: Omit<UserAnswer, 'id'>;
        Update: Partial<Omit<UserAnswer, 'id'>>;
      };
      admin_settings: {
        Row: AdminSettings;
        Insert: Omit<AdminSettings, 'id' | 'created_at'>;
        Update: Partial<Omit<AdminSettings, 'id' | 'created_at'>>;
      };
    };
  };
};

export interface Category {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  difficulty: string;
  created_at: string;
}

export interface QuestionSet {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  passing_marks: number;
  total_marks: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  difficulty: string;
  published: boolean;
  auto_submit: boolean;
  grace_period_seconds: number;
  show_timer: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  question_set_id: string;
  question_number: number;
  question_type: 'mcq' | 'numeric';
  marks: number;
  question_text: string;
  correct_answer: string;
  tolerance_percent: number;
  download_link: string | null;
  created_at: string;
}

export interface QuestionImage {
  id: string;
  question_id: string;
  image_url: string;
  display_order: number;
}

export interface MCQOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  display_order: number;
}

export interface ExamAttempt {
  id: string;
  question_set_id: string;
  attempt_code: string;
  score: number;
  percentage: number;
  passed: boolean;
  started_at: string;
  submitted_at: string | null;
  time_used: number;
}

export interface UserAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  marks_obtained: number;
}

export interface AdminSettings {
  id: string;
  admin_password_hash: string;
  allow_tab_switch: boolean;
  fullscreen_required: boolean;
  created_at: string;
}
