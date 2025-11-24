// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { apiLogin, apiRegister, apiRefreshToken, apiLogout } from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedAccessToken = localStorage.getItem("accessToken");
    const savedRefreshToken = localStorage.getItem("refreshToken");
    
    if (savedUser && savedAccessToken && savedRefreshToken) {
      setUser(JSON.parse(savedUser));
      setSession({ 
        accessToken: savedAccessToken,
        refreshToken: savedRefreshToken 
      });
    }
    setLoading(false);
  }, []);

  // Auto-refresh access token before expiry
  useEffect(() => {
    if (!session?.accessToken || !session?.refreshToken) return;
    
    // Refresh token 1 minute before expiry (14 min for 15 min token)
    const refreshInterval = setInterval(async () => {
      try {
        const { accessToken } = await apiRefreshToken(session.refreshToken);
        setSession(prev => ({ ...prev, accessToken }));
        localStorage.setItem("accessToken", accessToken);
      } catch (err) {
        console.error('Token refresh failed:', err);
        // If refresh fails, log out user
        logout();
      }
    }, 14 * 60 * 1000); // 14 minutes
    
    return () => clearInterval(refreshInterval);
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
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      // Keep old token key for backward compatibility during migration
      localStorage.removeItem("token");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, session, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
