"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { Sparkles, LogOut, Plus, Shield } from "lucide-react";

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
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-950/50">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-tight text-base leading-none">iconfigly</span>
              <span className="text-[10px] text-slate-400 font-mono leading-none mt-1">control plane</span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Project:</span>
            {projects.length > 0 ? (
              <div className="relative">
                <Select
                  value={currentProject?.id || ""}
                  onChange={(e) => {
                    if (e.target.value === "new") {
                      setShowNewProjectModal(true);
                    } else {
                      const found = projects.find((p) => p.id === e.target.value);
                      if (found) setCurrentProject(found);
                    }
                  }}
                  className="w-48 bg-slate-900 border-slate-800 text-xs font-medium"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="new">+ Create Project...</option>
                </Select>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewProjectModal(true)}
                className="gap-1.5 text-indigo-300 border-indigo-900/60 hover:bg-indigo-950/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create First Project</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-slate-300 font-medium">{actor?.email}</span>
            {actor?.is_super_admin && (
              <Badge variant="warning" className="flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" />
                <span>Super Admin</span>
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="gap-1.5 text-slate-400 hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      <Dialog
        open={showNewProjectModal}
        onOpenChange={setShowNewProjectModal}
        title="Create New Project"
        description="Creating a project automatically provisions DEV, QA, UAT, and PROD environments."
      >
        {modalError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{modalError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              required
              value={projName}
              onChange={handleNameChange}
              placeholder="Core Banking"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-slug">Slug</Label>
            <Input
              id="project-slug"
              required
              value={projSlug}
              onChange={(e) => setProjSlug(e.target.value)}
              placeholder="core-banking"
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-desc">Description</Label>
            <textarea
              id="project-desc"
              rows={2}
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              placeholder="Primary ledger and transactions ecosystem"
              className="flex w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNewProjectModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              size="sm"
              variant="default"
            >
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
