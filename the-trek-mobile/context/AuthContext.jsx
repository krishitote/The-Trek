import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiLogin, apiRegister } from "../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const savedUser = await AsyncStorage.getItem("user");
      const savedToken = await AsyncStorage.getItem("token");
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setSession({ token: savedToken });
      }
      setLoading(false);
    })();
  }, []);

  const login = async (data) => {
    const { user: u, token } = await apiLogin(data);
    setUser(u);
    setSession({ token });
    await AsyncStorage.setItem("user", JSON.stringify(u));
    await AsyncStorage.setItem("token", token);
  };

  const register = async (data) => {
    const { user: u, token } = await apiRegister(data);
    setUser(u);
    setSession({ token });
    await AsyncStorage.setItem("user", JSON.stringify(u));
    await AsyncStorage.setItem("token", token);
  };

  const logout = async () => {
    setUser(null);
    setSession(null);
    await AsyncStorage.multiRemove(["user", "token"]);
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
