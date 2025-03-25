import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Module {
  id: number;
  name: string;
}

export interface Teacher {
  id: number;
  name: string | null;
  modules: Module[];
}

export interface User {
  id: number;
  full_name: string;
  image: string;
  phone: string;
  email: string;
  role: string;
  teachers: Teacher[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  hydrate: () => void;
}

const DEFAULT_IMAGE = "https://placehold.co/600x400";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoaded: false,

      login: (token, user) => {
        const userWithImage = {
          ...user,
          image: user.image || DEFAULT_IMAGE,
        };

        set({
          token,
          user: userWithImage,
          isAuthenticated: true,
          isLoaded: true,
        });

        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(userWithImage));
      },

      logout: async () => {
        const token = localStorage.getItem("authToken");

        try {
          const response = await fetch("https://safezone-co.top/api/v1/dashboard/logout", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            set({ token: null, user: null, isAuthenticated: false, isLoaded: false });
            localStorage.removeItem("auth-storage");
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");

            window.location.href = "/ar/auth/login";
          } else {
            console.error("Logout failed", await response.json());
          }
        } catch (error) {
          console.error("Logout error", error);
        }
      },

      hydrate: () => {
        const storedState = get();
        set({ isLoaded: true, isAuthenticated: !!storedState.token });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoaded = true;
      },
    }
  )
);

export default useAuthStore;
