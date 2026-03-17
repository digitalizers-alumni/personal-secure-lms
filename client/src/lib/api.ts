export const API_URL = import.meta.env.VITE_API_URL || "";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  job_function?: string;
  user_role: string;
  is_active: boolean;
  is_deleted: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

export interface CoursePackage {
  title: string;
  lesson_content: string;
  quiz: QuizQuestion[];
  reward_title: string;
  reward_message: string;
}

export interface Course {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  content_markdown: string;
  generated_by_llm: boolean;
  list_src_docs_ids: number[];
  target_job_positions: string[];
  quiz?: QuizQuestion[];
  reward?: any;
  created_at: string;
  updated_at: string;
}

if (!API_URL) {
  console.warn("VITE_API_URL is not defined in environment variables.");
}

function getAuthHeaders() {
  const token = localStorage.getItem("lumina_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("lumina_token");
    window.location.href = "/login";
    throw new Error("Session expired. Redirecting to login...");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API Request failed with status ${response.status}`);
  }

  return response;
}

export async function uploadDocumentToRAG(file: File): Promise<{ doc_id: number; status: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });

  return response.json();
}

export async function listDocuments(): Promise<Array<{ doc_id: number; filename: string; status: string; created_at: string }>> {
  const response = await apiFetch("/api/documents/");
  return response.json();
}

export async function listCourses(): Promise<Course[]> {
  const response = await apiFetch("/api/courses/");
  return response.json();
}

export async function getCourse(id: string): Promise<Course> {
  const response = await apiFetch(`/api/courses/${id}`);
  return response.json();
}

export async function deleteDocument(docId: number): Promise<void> {
  await apiFetch(`/api/documents/${docId}`, {
    method: "DELETE",
  });
}

export async function generateFromRAG(prompt: string, documentIds: number[] = []): Promise<{
  answer: string;
  keywords: string[];
  sources: { text: string; doc_id: number; score: number }[];
}> {
  const response = await apiFetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, selected_doc_ids: documentIds }),
  });

  return response.json();
}

export async function generateCourse(data: {
  topic: string;
  learning_goal: string;
  difficulty: string;
  passing_score: number;
  num_questions: number;
  selected_doc_ids: number[];
  additional_instructions?: string;
}): Promise<Course> {
  const response = await apiFetch("/api/courses/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

export async function getMe(): Promise<User> {
  const response = await apiFetch("/api/users/me");
  return response.json();
}

export async function updateMe(payload: Partial<User>): Promise<User> {
  const response = await apiFetch("/api/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function updateMyPassword(current_password: string, new_password: string): Promise<void> {
  await apiFetch("/api/users/me/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password, new_password }),
  });
}

export async function listUsers(): Promise<User[]> {
  const response = await apiFetch("/api/users");
  return response.json();
}

export async function updateUser(userId: number, payload: Partial<User>): Promise<User> {
  const response = await apiFetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function deleteUser(userId: number): Promise<void> {
  await apiFetch(`/api/users/${userId}`, {
    method: "DELETE",
  });
}

export async function activateUser(userId: number): Promise<void> {
  await apiFetch(`/api/users/${userId}/activate`, {
    method: "PUT",
  });
}

export async function deactivateUser(userId: number): Promise<void> {
  await apiFetch(`/api/users/${userId}/deactivate`, {
    method: "PUT",
  });
}

export async function register(payload: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_role?: string;
}): Promise<void> {
  await apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}