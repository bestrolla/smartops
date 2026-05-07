import React, { createContext, useContext, useState, ReactNode } from "react";
import api from "./api";
import { toast } from 'react-toastify';

interface User {
  tenantId: string;
  roles?: any[];
  [key: string]: any;
}

interface AuthContextType {
  auth: {
    token: string | null;
    user: User | null;
    tenantId: string | null;
    roles: any[];
    permissions: any[];
  };
  login: (usernameOrEmail: string, password: string, tenantId: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem("token"),
    user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null,
    tenantId: localStorage.getItem("tenantId"),
    roles: [],
    permissions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (usernameOrEmail: string, password: string, tenant: string) => {
    setLoading(true);
    setError("");
    try {
      const loginPayload = usernameOrEmail.includes("@")
        ? { email: usernameOrEmail, password }
        : { username: usernameOrEmail, password };
      const response = await api.post("/auth/login", loginPayload, {
        headers: tenant ? { "X-Tenant-ID": tenant } : {},
      });
      const { token, user } = response.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("tenantId", user.tenantId);
      setAuth({
        token,
        user,
        tenantId: user.tenantId,
        roles: user.roles || [],
        permissions: (user.roles || []).reduce((acc: any[], role: any) => {
          return [...acc, ...(role.permissions || [])];
        }, []),
      });
      toast.success('¡Inicio de sesión exitoso!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Error al iniciar sesión";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenantId");
    setAuth({
      token: null,
      user: null,
      tenantId: null,
      roles: [],
      permissions: [],
    });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};