import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../services/auth.service.js";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "multacheck_token";
const LAST_TENANT_SLUG_KEY = "multacheck_last_tenant_slug";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    const u = await authApi.fetchMe();
    setUser(u);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setReady(true);
      return;
    }

    authApi
      .fetchMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password, tenantSlug) => {
    const slug = tenantSlug?.trim().toLowerCase();
    const data = await authApi.loginRequest(email, password, slug);
    localStorage.setItem(TOKEN_KEY, data.token);
    if (slug) localStorage.setItem(LAST_TENANT_SLUG_KEY, slug);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email, password, companyName, companySlug) => {
    const data = await authApi.registerRequest(
      email,
      password,
      companyName,
      companySlug
    );
    localStorage.setItem(TOKEN_KEY, data.token);
    if (data.user?.tenantSlug) {
      localStorage.setItem(LAST_TENANT_SLUG_KEY, data.user.tenantSlug);
    }
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignorar red caída */
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout, refreshUser }),
    [user, ready, login, register, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
