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
  logout: () => void;
  hydrate: () => void;
}

// ✅ Add Default Image URL
const DEFAULT_IMAGE = "https://placehold.co/600x400";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoaded: false, 

      // ✅ Enhanced Login Action with Default Image
      login: (token, user) => {
        // Check if the user image exists, if not set a default image
        const userWithImage = {
          ...user,
          image : DEFAULT_IMAGE,
        };

        set({ token, user: userWithImage, isAuthenticated: true, isLoaded: true });
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(userWithImage));
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, isLoaded: false });
        localStorage.removeItem("auth-storage");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "/ar/auth/login"; // Redirect to login page
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
