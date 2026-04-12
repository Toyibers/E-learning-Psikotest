import { supabase } from './supabase';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'student';
  created_at: string;
  profile_photo?: string;
}

export interface Question {
  id: string;
  module_id: string;
  text: string; // HTML content
  options: string[]; // Array of strings
  correct_answer: number; // index of the correct option
}

export interface Module {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  attempt_limit?: number;
  questions?: Question[];
  created_at: string;
}

export interface AttemptDetail {
  question_id: string;
  is_correct: boolean;
  user_answer: number | null;
  correct_answer: number;
}

export interface Attempt {
  id: string;
  user_id: string;
  module_id: string;
  score: number;
  created_at: string;
  details?: AttemptDetail[];
  module?: Module;
  user?: User;
}

// Session Helpers (Keep currentUser in localStorage for simplicity)
export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem('currentUser');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
};

// Supabase Data Fetching
export const fetchModules = async () => {
  const { data, error } = await supabase
    .from('modules')
    .select('*, questions(*)');
  if (error) throw error;
  return data as Module[];
};

export const fetchModuleById = async (id: string) => {
  const { data, error } = await supabase
    .from('modules')
    .select('*, questions(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Module;
};

export const fetchUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  if (error) throw error;
  return data as User[];
};

export const fetchAttempts = async () => {
  const { data, error } = await supabase
    .from('attempts')
    .select('*, module:modules(*), user:users(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Attempt[];
};

export const fetchStudentAttempts = async (userId: string) => {
  const { data, error } = await supabase
    .from('attempts')
    .select('*, module:modules(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Attempt[];
};

export const saveAttempt = async (attempt: Omit<Attempt, 'id' | 'created_at'>, details: Omit<AttemptDetail, 'id'>[]) => {
  const { data: attemptData, error: attemptError } = await supabase
    .from('attempts')
    .insert([{
      user_id: attempt.user_id,
      module_id: attempt.module_id,
      score: attempt.score
    }])
    .select()
    .single();

  if (attemptError) throw attemptError;

  const detailsToInsert = details.map(d => ({
    attempt_id: attemptData.id,
    question_id: d.question_id,
    is_correct: d.is_correct,
    user_answer: d.user_answer,
    correct_answer: d.correct_answer
  }));

  const { error: detailsError } = await supabase
    .from('attempt_details')
    .insert(detailsToInsert);

  if (detailsError) throw detailsError;

  return attemptData;
};

