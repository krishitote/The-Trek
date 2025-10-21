// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { apiLogin, apiRegister } from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // <-- expose setUser
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setSession({ token: savedToken });
    }
    setLoading(false);
  }, []);

  const login = async ({ username, password }) => {
    try {
      const { user: userData, token } = await apiLogin({ username, password });
      setUser(userData);
      setSession({ token });
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      throw new Error(err.message || "Login failed");
    }
  };

  const register = async (payload) => {
    try {
      const { user: userData, token } = await apiRegister(payload);
      setUser(userData); // includes bmi
      setSession({ token });
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
      return true;
    } catch (err) {
      console.error("Registration failed:", err);
      throw new Error(err.message || "Registration failed");
    }
  };

  const logout = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, session, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
