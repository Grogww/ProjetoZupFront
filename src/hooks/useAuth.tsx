import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { fetchMe, mapRoles, logout as logoutApi, type BackendUser } from "@/lib/auth-api";
import { tokens } from "@/lib/api";

export type AppRole = "cidadao" | "prefeitura" | "agua_saneamento" | "energia_luz" | "admin";
export type OrganRole = "prefeitura" | "agua_saneamento" | "energia_luz";

interface AuthContextValue {
  user: BackendUser | null;
  roles: AppRole[];
  organ: OrganRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  setSessionUser: (user: BackendUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [organ, setOrgan] = useState<OrganRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const u = await fetchMe();
      setUser(u);
      const r = mapRoles(u);
      setRoles(r.roles);
      setOrgan(r.organ);
    } catch {
      setUser(null);
      setRoles([]);
      setOrgan(null);
      tokens.clear();
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (tokens.access) await loadMe();
      setLoading(false);
    })();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "zup_access_token") {
        if (e.newValue) loadMe();
        else { setUser(null); setRoles([]); setOrgan(null); }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadMe]);

  const signOut = async () => {
    logoutApi();
    setUser(null);
    setRoles([]);
    setOrgan(null);
  };

  const setSessionUser = (u: BackendUser) => {
    setUser(u);
    const r = mapRoles(u);
    setRoles(r.roles);
    setOrgan(r.organ);
  };

  return (
    <AuthContext.Provider value={{ user, roles, organ, loading, signOut, refreshRoles: loadMe, setSessionUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const isInstitutional = (roles: AppRole[]) =>
  roles.some(r => r === "prefeitura" || r === "agua_saneamento" || r === "energia_luz" || r === "admin");

export const isAdmin = (roles: AppRole[]) => roles.includes("admin");
