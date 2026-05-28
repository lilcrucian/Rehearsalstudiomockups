// Authentication utilities
import type { User } from './api';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const CURRENT_USER_KEY = 'currentUser';

// Fetch role directly from Supabase REST API, bypassing Edge Function
export async function fetchRoleFromDB(userId: string): Promise<'client' | 'admin'> {
  try {
    const res = await fetch(
      `https://${projectId}.supabase.co/rest/v1/users?select=role&id=eq.${userId}`,
      {
        headers: {
          apikey: publicAnonKey,
          Authorization: `Bearer ${publicAnonKey}`,
        },
      }
    );
    if (!res.ok) return 'client';
    const data = await res.json();
    return data?.[0]?.role ?? 'client';
  } catch {
    return 'client';
  }
}

export function saveCurrentUser(user: User) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('userUpdated'));
}

export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function isAdmin(): boolean {
  return getCurrentUser()?.role === 'admin';
}
