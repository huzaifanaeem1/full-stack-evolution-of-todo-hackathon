export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  user_id: string;
  priority?: number;
  category?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  completed?: boolean;
  priority?: number;
  category?: string;
  due_date?: string;
  user_id: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: number;
  category?: string;
  due_date?: string;
}

export interface TaskPatch {
  completed?: boolean;
}

export interface UserCreate {
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}