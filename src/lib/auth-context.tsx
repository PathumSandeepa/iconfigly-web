"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Actor, Project } from "./types";
import { apiFetch } from "./api";

interface AuthContextType {
  actor: Actor | null;
  isLoading: boolean;
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (proj: Project | null) => void;
  refreshActor: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  actor: null,
  isLoading: true,
  projects: [],
  currentProject: null,
  setCurrentProject: () => {},
  refreshActor: async () => {},
  refreshProjects: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [actor, setActor] = useState<Actor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const router = useRouter();

  const refreshProjects = useCallback(async () => {
    try {
      const data = await apiFetch<Project[]>("/projects");
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
      if (list.length > 0) {
        setCurrentProjectState((prev) => {
          if (prev && list.some((p) => p.id === prev.id)) {
            return prev;
          }
          const savedId = typeof window !== "undefined" ? localStorage.getItem("iconfigly_project_id") : null;
          const found = list.find((p) => p.id === savedId);
          return found || list[0];
        });
      }
    } catch {
      setProjects([]);
    }
  }, []);

  const refreshActor = useCallback(async () => {
    try {
      const data = await apiFetch<{
        user?: { id: string; organization_id: string; email: string; full_name: string; is_super_admin: boolean };
        actor?: Actor;
        csrf_token?: string;
      }>("/auth/me");

      const act = data?.actor;
      const user = data?.user;
      if (act || user) {
        const fullActor: Actor = {
          user_id: act?.user_id || user?.id || "",
          organization_id: act?.organization_id || user?.organization_id || "",
          email: act?.email || user?.email || "",
          full_name: act?.full_name || user?.full_name || "",
          is_super_admin: act?.is_super_admin ?? user?.is_super_admin ?? false,
          team_ids: act?.team_ids || [],
          lead_team_ids: act?.lead_team_ids || [],
          auth_method: act?.auth_method || "SESSION",
          csrf_token: data?.csrf_token || act?.csrf_token || "",
        };
        setActor(fullActor);
        if (typeof window !== "undefined" && fullActor.csrf_token) {
          (window as unknown as { __CSRF_TOKEN__?: string }).__CSRF_TOKEN__ = fullActor.csrf_token;
        }
        await refreshProjects();
      } else {
        setActor(null);
        setProjects([]);
      }
    } catch {
      setActor(null);
      setProjects([]);
    }
  }, [refreshProjects]);

  const setCurrentProject = (proj: Project | null) => {
    setCurrentProjectState(proj);
    if (typeof window !== "undefined") {
      if (proj) {
        localStorage.setItem("iconfigly_project_id", proj.id);
      } else {
        localStorage.removeItem("iconfigly_project_id");
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        await refreshActor();
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshActor]);

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      setActor(null);
      if (typeof window !== "undefined") {
        (window as unknown as { __CSRF_TOKEN__?: string }).__CSRF_TOKEN__ = undefined;
      }
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        actor,
        isLoading,
        projects,
        currentProject,
        setCurrentProject,
        refreshActor,
        refreshProjects,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
