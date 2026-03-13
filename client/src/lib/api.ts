const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function uploadDocumentToRAG(file: File, userId: number = 1): Promise<{ doc_id: number; status: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/documents/upload?user_id=${userId}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Upload failed");
  }

  return response.json();
}

export async function generateFromRAG(prompt: string, userId: number = 1): Promise<{
  answer: string;
  keywords: string[];
  sources: { text: string; doc_id: number; score: number }[];
}> {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, user_id: userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Generation failed");
  }

  return response.json();
}