import { create } from "zustand";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
};

type UiState = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  theme: "dark" | "light";
  toasts: Toast[];
  setSidebarCollapsed: (value: boolean) => void;
  setMobileSidebarOpen: (value: boolean) => void;
  toggleTheme: () => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  theme: "dark",
  toasts: [],
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  setMobileSidebarOpen: (value) => set({ mobileSidebarOpen: value }),
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", theme === "dark");
      return { theme };
    }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }].slice(-4),
    })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
