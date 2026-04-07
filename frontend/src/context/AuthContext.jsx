import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("ahp_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("ahp_token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem("ahp_user", JSON.stringify(data));
      })
      .catch(() => {
        localStorage.removeItem("ahp_token");
        localStorage.removeItem("ahp_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistAuth = (payload) => {
    localStorage.setItem("ahp_token", payload.access_token);
    localStorage.setItem("ahp_user", JSON.stringify(payload.user));
    setUser(payload.user);
  };

  const login = async (form) => {
    const { data } = await api.post("/auth/login", form);
    persistAuth(data);
    navigate("/", { replace: true });
  };

  const signup = async (form) => {
    const { data } = await api.post("/auth/signup", form);
    persistAuth(data);
    navigate("/", { replace: true });
  };

  const logout = () => {
    localStorage.removeItem("ahp_token");
    localStorage.removeItem("ahp_user");
    localStorage.removeItem("ahp_latest_results");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      setUser,
      isAuthenticated: Boolean(user),
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
