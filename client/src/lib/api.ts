const API_URL = import.meta.env.VITE_API_URL;

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
    throw new Error(error.detail || "Upload failed");
  }

  return response.json();
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