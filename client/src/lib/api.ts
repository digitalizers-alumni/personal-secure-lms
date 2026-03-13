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