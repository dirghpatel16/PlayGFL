import { User } from "@/lib/types/models";

const storageKey = "gfl_user";

export function saveMockUser(user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(user));
}

export function getMockUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(storageKey);
  return raw ? (JSON.parse(raw) as User) : null;
}

export function clearMockUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey);
}
