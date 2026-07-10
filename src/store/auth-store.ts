import { create } from "zustand";
import { apiClient } from "@/lib/api";

const AUTH_STORAGE_KEY = "neurax_admin_session";

type AdminSession = {
  username: string;
  name: string;
  role: "Superuser";
  issuedAt: string;
};

type AuthState = {
  session: AdminSession | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

function getInitialSession(): AdminSession | null {
  const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as AdminSession;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  session: getInitialSession(),
  login: async (username, password) => {
    try {
      const response = await apiClient.post<{ session: AdminSession; token: string }>("/auth/login", {
        username,
        password,
      });
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data.session));
      localStorage.setItem("neurax_admin_token", response.data.token);
      set({ session: response.data.session });
      return true;
    } catch {
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("neurax_admin_token");
    set({ session: null });
  },
}));
