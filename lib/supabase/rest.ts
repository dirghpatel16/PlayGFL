const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv(value: string | undefined, label: string) {
  if (!value) throw new Error(`${label} is not configured`);
  return value;
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);
}

export async function supabaseAuthRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${assertEnv(SUPABASE_URL, "SUPABASE_URL")}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: assertEnv(SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error_description || data?.msg || `Auth request failed: ${res.status}`);
  return data as T;
}

export async function supabaseAdminTable<T>(table: string, init?: RequestInit): Promise<T> {
  const url = `${assertEnv(SUPABASE_URL, "SUPABASE_URL")}/rest/v1/${table}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: assertEnv(SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
      Authorization: `Bearer ${assertEnv(SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `DB request failed: ${res.status}`);
  return data as T;
}

export async function supabaseUser(accessToken: string) {
  const url = `${assertEnv(SUPABASE_URL, "SUPABASE_URL")}/auth/v1/user`;
  const res = await fetch(url, {
    headers: {
      apikey: assertEnv(SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.msg || `Unable to fetch auth user`);
  return data as { id: string; email?: string; user_metadata?: Record<string, unknown>; email_confirmed_at?: string | null };
}
