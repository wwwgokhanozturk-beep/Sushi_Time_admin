import { useAuthStore } from '@/store/authStore';

// Custom hook: reads auth store, exposes login/logout, redirects if unauthenticated
export function useAuth() {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();
  return { user, token, isAuthenticated, login, logout };
}
