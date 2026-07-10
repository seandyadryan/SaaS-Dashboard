import { create } from "zustand";
import { apiClient } from "@/lib/api";

const AUTH_STORAGE_KEY = "neurax_admin_session";

type AdminSession = {
  username: string;
  name: string;
  role: "Superuser";
  issuedAt: string;
};

export type LoginResult = {
  success: boolean;
  message?: string;
  attemptsRemaining?: number;
  retryAfterSeconds?: number;
  blockedUntil?: string;
};

type AuthState = {
  session: AdminSession | null;
  login: (username: string, password: string) => Promise<LoginResult>;
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
      return { success: true };
    } catch (error) {
      const apiError = error as {
        response?: {
          status?: number;
          data?: {
            error?: string;
            attemptsRemaining?: number;
            retryAfterSeconds?: number;
            blockedUntil?: string;
          };
        };
      };
      const data = apiError.response?.data;

      if (apiError.response?.status === 429) {
        return {
          success: false,
          message: "IP ini sementara diblokir karena terlalu banyak percobaan login gagal.",
          attemptsRemaining: data?.attemptsRemaining,
          retryAfterSeconds: data?.retryAfterSeconds,
          blockedUntil: data?.blockedUntil,
        };
      }

      return {
        success: false,
        message: "Username atau password salah.",
        attemptsRemaining: data?.attemptsRemaining,
      };
    }
  },
  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("neurax_admin_token");
    set({ session: null });
  },
}));
