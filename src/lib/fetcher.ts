export class ApiClientError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body: ApiEnvelope<T> | null = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    throw new ApiClientError(res.status, body?.error ?? `Request failed (${res.status})`);
  }
  return body.data as T;
}