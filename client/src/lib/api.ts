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

if (!API_URL) {
  console.warn("VITE_API_URL is not defined in environment variables.");
}

function getAuthHeaders() {
  const token = localStorage.getItem("lumina_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

export async function uploadDocumentToRAG(file: File): Promise<{ doc_id: number; status: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/documents/upload`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Upload failed, file already exists in database");
  }

  return response.json();
}

export async function listDocuments(): Promise<Array<{ doc_id: number; filename: string; status: string; created_at: string }>> {
  const response = await fetch(`${API_URL}/api/documents/`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch documents");
  }

  return response.json();
}

export async function deleteDocument(docId: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/documents/${docId}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Deletion failed");
  }
}

export async function generateFromRAG(prompt: string, documentIds: number[] = []): Promise<{
  answer: string;
  keywords: string[];
  sources: { text: string; doc_id: number; score: number }[];
}> {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ prompt, doc_ids: documentIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Generation failed");
  }

  return response.json();
}

export async function generateCourse(data: {
  topic: string;
  learning_goal: string;
  difficulty: string;
  passing_score: number;
  doc_ids: number[];
  additional_instructions?: string;
}): Promise<any> {
  const response = await fetch(`${API_URL}/api/courses/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Course generation failed");
  }

  return response.json();
}

export async function getMe(): Promise<User> {
  const response = await fetch(`${API_URL}/api/users/me`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
}

export async function updateMe(payload: Partial<User>): Promise<User> {
  const response = await fetch(`${API_URL}/api/users/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
}

export async function updateMyPassword(current_password: string, new_password: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/users/me/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ current_password, new_password }),
  });
  if (!response.ok) throw new Error("Failed to update password");
}

export async function listUsers(): Promise<User[]> {
  const response = await fetch(`${API_URL}/api/users`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

export async function updateUser(userId: number, payload: Partial<User>): Promise<User> {
  const response = await fetch(`${API_URL}/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to update user");
  return response.json();
}

export async function deleteUser(userId: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/users/${userId}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to delete user");
}

export async function activateUser(userId: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/users/${userId}/activate`, {
    method: "PUT",
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to activate user");
}

export async function deactivateUser(userId: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/users/${userId}/deactivate`, {
    method: "PUT",
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to deactivate user");
}

export async function register(payload: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_role?: string;
}): Promise<void> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }
}