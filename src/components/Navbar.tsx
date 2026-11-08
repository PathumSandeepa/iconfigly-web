"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Project } from "@/lib/types";

export function Navbar() {
  const { actor, projects, currentProject, setCurrentProject, refreshProjects, logout } = useAuth();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [projName, setProjName] = useState("");
  const [projSlug, setProjSlug] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setProjName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setProjSlug(generated);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsCreating(true);
    try {
      const created = await apiFetch<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: projName,
          slug: projSlug,
          description: projDesc,
        }),
      });
      await refreshProjects();
      setCurrentProject(created);
      setShowNewProjectModal(false);
      setProjName("");
      setProjSlug("");
      setProjDesc("");
    } catch (err: unknown) {
      const apiErr = err as { detail?: string; title?: string };
      setModalError(apiErr.detail || apiErr.title || "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base">
              i
            </div>
            <span className="font-bold text-white tracking-tight text-lg">iconfigly</span>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Project:</span>
            {projects.length > 0 ? (
              <select
                value={currentProject?.id || ""}
                onChange={(e) => {
                  if (e.target.value === "new") {
                    setShowNewProjectModal(true);
                  } else {
                    const found = projects.find((p) => p.id === e.target.value);
                    if (found) setCurrentProject(found);
                  }
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value="new">+ Create Project...</option>
              </select>
            ) : (
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 font-medium transition-colors"
              >
                + Create First Project
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">{actor?.email}</span>
            {actor?.is_super_admin && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Super Admin
              </span>
            )}
          </div>

          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Create New Project</h2>
            <p className="text-xs text-slate-400 mb-4">
              Creating a project automatically provisions DEV, QA, UAT, and PROD environments.
            </p>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={handleNameChange}
                  placeholder="Core Banking"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={projSlug}
                  onChange={(e) => setProjSlug(e.target.value)}
                  placeholder="core-banking"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Primary ledger and transactions ecosystem"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
