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

  const refreshActor = useCallback(async () => {
    try {
      const data = await apiFetch<Actor>("/auth/me");
      setActor(data);
      if (typeof window !== "undefined" && data?.csrf_token) {
        (window as unknown as { __CSRF_TOKEN__?: string }).__CSRF_TOKEN__ = data.csrf_token;
      }
    } catch {
      setActor(null);
    }
  }, []);

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
    (async () => {
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

  useEffect(() => {
    if (actor) {
      refreshProjects();
    }
  }, [actor, refreshProjects]);

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
