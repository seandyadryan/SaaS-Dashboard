import { create } from "zustand";

const AUTH_STORAGE_KEY = "neurax_admin_session";

type AdminSession = {
  username: string;
  name: string;
  role: "Superuser";
  issuedAt: string;
};

type AuthState = {
  session: AdminSession | null;
  login: (username: string, password: string) => boolean;
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
  login: (username, password) => {
    if (username !== "admin" || password !== "P@ssw0rd") {
      return false;
    }

    const session: AdminSession = {
      username: "admin",
      name: "NeuraX Superuser",
      role: "Superuser",
      issuedAt: new Date().toISOString(),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    set({ session });
    return true;
  },
  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("neurax_admin_token");
    set({ session: null });
  },
}));
