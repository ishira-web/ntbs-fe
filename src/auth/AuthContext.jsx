import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

// Pick up API base from Vite or CRA, fallback to localhost:5000
const API_BASE ="http://localhost:5000";

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("auth_token") || null);
  const [role, setRole] = useState(() => localStorage.getItem("auth_role") || null);
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    // Optionally refresh derived data from token
    const decoded = decodeJwt(token);
    if (decoded?.role && !role) setRole(decoded.role);
  }, [token]); // eslint-disable-line

  const getRedirectPath = (r) => (r === "donor" ? "/" : "/management");

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Login failed");
      }

      const data = await res.json();
      // Expected back: { token, role?, user? }
      const t = data.token;
      if (!t) throw new Error("No token returned from API");

      const decoded = decodeJwt(t) || {};
      const r = data.role || decoded.role;
      if (!r) throw new Error("No role in token/response");

      const u = data.user || {
        id: decoded.sub || decoded.id || null,
        hospitalId: decoded.hospitalId || null,
        donorId: decoded.donorId || null,
        email: decoded.email || email,
      };

      setToken(t);
      setRole(r);
      setUser(u);
      localStorage.setItem("auth_token", t);
      localStorage.setItem("auth_role", r);
      localStorage.setItem("auth_user", JSON.stringify(u));

      return { role: r, user: u, token: t };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_role");
    localStorage.removeItem("auth_user");
  };

  // Helper fetch that auto-attaches Authorization header
  const authFetch = async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", headers.get("Content-Type") || "application/json");
    const res = await fetch(url, { ...options, headers });
    return res;
  };

  const value = useMemo(
    () => ({
      token,
      role,
      user,
      loading,
      login,
      logout,
      authFetch,
      getRedirectPath,
      isAuthed: Boolean(token),
      isAdmin: role === "admin",
      isHospital: role === "hospital",
      isDonor: role === "donor",
    }),
    [token, role, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
