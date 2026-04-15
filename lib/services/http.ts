export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const payload = (await res.json()) as { error?: string; message?: string };
      message = payload.error || payload.message || message;
    } catch {
      // Ignore JSON parse issues and preserve fallback message.
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
