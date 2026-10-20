import { useCallback, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, saveToken } from "./api";
import { AuthContext } from "./auth-context";

/** Keeps track of the logged-in user and offers login / register / logout to the whole app. */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a token is saved we must check it with the server before we know who the user is
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api("/me")
      .then((data) => setUser(data.user))
      .catch((err) => {
        // Only forget the token when the server rejected it (expired, or user deleted);
        // a plain "server is down" error should not log anyone out.
        if (err.status === 401 || err.status === 404) clearToken();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api("/login", { method: "POST", body: { email, password } });
    saveToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (name, email, password) => {
      await api("/register", { method: "POST", body: { name, email, password } });
      return login(email, password); // sign the new user in straight away
    },
    [login]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === "admin", login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}