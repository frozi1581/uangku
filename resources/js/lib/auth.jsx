import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi, setToken, getToken } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // Saat app dibuka, kalau ada token coba ambil profil.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        setUser(res.data.user);
        setCompany(res.data.company);
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await authApi.login({ email, password, device_name: "web" });
    setToken(res.data.token);
    setUser(res.data.user);
    setCompany(res.data.company);
    return res.data;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch (e) {
      /* abaikan */
    }
    setToken(null);
    setUser(null);
    setCompany(null);
  }

  return (
    <AuthCtx.Provider value={{ user, company, loading, login, logout, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
