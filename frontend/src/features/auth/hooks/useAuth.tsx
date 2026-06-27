import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { apiClient } from "../../../core/api/apiClient";
import {
  clearStoredSession,
  disableDemoAutoLogin,
  getStoredToken,
  getStoredUser,
  isDemoAutoLoginDisabled,
  storeAuthSession,
  updateStoredUser,
  type AuthUser,
} from "../../../core/session/authSession";
import type { ProductRole } from "../../../core/auth/roles";
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

type AuthResponse = {
  user: AuthUser;
  token: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (payload: { email: string; password: string; rememberMe: boolean }) => Promise<AuthUser>;
  signup: (payload: { name: string; email: string; password: string }) => Promise<AuthUser>;
  loginDemo: () => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateRole: (role: ProductRole) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(
    () => Boolean(getStoredToken()) || (DEMO_MODE && !isDemoAutoLoginDisabled()),
  );

  async function applyAuthResponse(request: Promise<AuthResponse>) {
    const response = await request;
    storeAuthSession(response.token, response.user);
    setUser(response.user);
    return response.user;
  }

  async function refreshMe() {
    const response = await apiClient<{ user: AuthUser }>("/auth/me");
    updateStoredUser(response.user);
    setUser(response.user);
  }

  async function login(payload: { email: string; password: string; rememberMe: boolean }) {
    void payload.rememberMe;
    return applyAuthResponse(
      apiClient<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
        }),
      }),
    );
  }

  async function signup(payload: { name: string; email: string; password: string }) {
    return applyAuthResponse(
      apiClient<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
  }

  async function loginDemo() {
    return applyAuthResponse(
      apiClient<AuthResponse>("/auth/demo-login", {
        method: "POST",
      }),
    );
  }

  async function updateRole(role: ProductRole) {
    const response = await apiClient<{ user: AuthUser }>("/auth/role", {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    updateStoredUser(response.user);
    setUser(response.user);
  }

  async function logout() {
    try {
      await apiClient<{ success: boolean }>("/auth/logout", {
        method: "POST",
      });
    } finally {
      if (DEMO_MODE) {
        disableDemoAutoLogin();
      }
      clearStoredSession();
      setUser(null);
    }
  }

  useEffect(() => {
    const token = getStoredToken();

    let cancelled = false;

    async function bootstrap() {
      if (!token) {
        if (DEMO_MODE && !isDemoAutoLoginDisabled()) {
          try {
            const demoUser = await loginDemo();

            if (!cancelled) {
              setUser(demoUser);
            }
          } catch {
            if (!cancelled) {
              clearStoredSession();
              setUser(null);
            }
          } finally {
            if (!cancelled) {
              setIsLoading(false);
            }
          }

          return;
        }

        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient<{ user: AuthUser }>("/auth/me");

        if (cancelled) {
          return;
        }

        updateStoredUser(response.user);
        setUser(response.user);
      } catch {
        if (!cancelled) {
          clearStoredSession();
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleAuthExpired() {
      setUser(null);
    }

    window.addEventListener("ascend:auth-expired", handleAuthExpired);

    return () => {
      window.removeEventListener("ascend:auth-expired", handleAuthExpired);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(user && getStoredToken()),
      isLoading,
      user,
      login,
      signup,
      loginDemo,
      logout,
      refreshMe,
      updateRole,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
