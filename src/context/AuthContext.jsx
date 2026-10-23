// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { Center, Spinner } from "@chakra-ui/react";
import { apiLogin, apiRegister, apiRefreshToken, apiLogout } from "../services/api";

export const AuthContext = createContext();

function tokenExpiresSoon(token, marginMs = 60 * 1000) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return !payload.exp || payload.exp * 1000 - Date.now() < marginMs;
  } catch {
    return true;
  }
}

function clearStoredSession() {
  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("token");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the saved session, refreshing its access token first if it has expired
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const savedUser = localStorage.getItem("user");
      const savedAccessToken = localStorage.getItem("accessToken");
      const savedRefreshToken = localStorage.getItem("refreshToken");

      if (savedUser && savedAccessToken && savedRefreshToken) {
        try {
          let accessToken = savedAccessToken;
          if (tokenExpiresSoon(accessToken)) {
            ({ accessToken } = await apiRefreshToken(savedRefreshToken));
            localStorage.setItem("accessToken", accessToken);
          }
          if (!cancelled) {
            setUser(JSON.parse(savedUser));
            setSession({ accessToken, refreshToken: savedRefreshToken });
          }
        } catch (err) {
          console.error("Could not restore session:", err);
          clearStoredSession();
        }
      }
      if (!cancelled) setLoading(false);
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-refresh access token before expiry
  useEffect(() => {
    if (!session?.accessToken || !session?.refreshToken) return;
    
    const refresh = async () => {
      try {
        const { accessToken } = await apiRefreshToken(session.refreshToken);
        setSession(prev => prev && { ...prev, accessToken });
        localStorage.setItem("accessToken", accessToken);
      } catch (err) {
        console.error('Token refresh failed:', err);
        // If refresh fails, log out user
        logout();
      }
    };

    // Refresh token 1 minute before expiry (14 min for 15 min token)
    const refreshInterval = setInterval(refresh, 14 * 60 * 1000);

    // Browsers throttle timers in background tabs, so re-check when the tab wakes up
    const onVisible = () => {
      if (document.visibilityState === "visible" && tokenExpiresSoon(localStorage.getItem("accessToken") || "")) {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session?.refreshToken]);

  const login = async ({ username, password }) => {
    try {
      const { user: userData, accessToken, refreshToken } = await apiLogin({ username, password });
      
      setUser(userData);
      setSession({ accessToken, refreshToken });
      
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      throw new Error(err.message || "Login failed");
    }
  };

  const register = async (payload) => {
    try {
      const { user: userData, accessToken, refreshToken } = await apiRegister(payload);
      
      setUser(userData);
      setSession({ accessToken, refreshToken });
      
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      
      return true;
    } catch (err) {
      console.error("Registration failed:", err);
      throw new Error(err.message || "Registration failed");
    }
  };

  const logout = async () => {
    try {
      // Call logout API to invalidate refresh token
      if (session?.refreshToken) {
        await apiLogout(session.refreshToken);
      }
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      // Clear local state regardless of API success
      setUser(null);
      setSession(null);
      clearStoredSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, session, login, register, logout, loading }}>
      {loading ? (
        <Center minH="100vh">
          <Spinner size="xl" color="green.500" />
        </Center>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
