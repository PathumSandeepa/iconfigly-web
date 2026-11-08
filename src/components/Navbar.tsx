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
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, Plus, Shield, User, AlertTriangle } from "lucide-react";

export function Navbar() {
  const { actor, projects, currentProject, setCurrentProject, refreshProjects, logout } = useAuth();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [projName, setProjName] = useState("");
  const [projSlug, setProjSlug] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
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

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } finally {
      setIsSigningOut(false);
      setShowSignOutConfirm(false);
    }
  };

  const userInitials = (actor?.full_name || actor?.email || "User")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-bold text-sm shadow-xs">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-900 dark:text-white tracking-tight text-base leading-none">
                iconfigly
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono leading-none mt-1">
                control plane
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Project:</span>
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
                  className="w-48 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-medium"
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
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create First Project</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="flex items-center gap-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-[10px] flex items-center justify-center font-mono">
              {userInitials || <User className="w-3 h-3" />}
            </div>
            <span className="text-xs text-zinc-800 dark:text-zinc-200 font-medium">{actor?.email}</span>
            {actor?.is_super_admin && (
              <Badge variant="warning" className="flex items-center gap-1 text-[9px]">
                <Shield className="w-2.5 h-2.5" />
                <span>Super Admin</span>
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSignOutConfirm(true)}
            className="gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      <Dialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
        title="Sign Out of iconfigly"
        description="Are you sure you want to end your current session?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-zinc-600 dark:text-zinc-300 space-y-1">
              <p className="font-semibold text-zinc-900 dark:text-white">Active Session: {actor?.email}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Ending your session will clear your encrypted authentication cookie and return you to the sign-in screen.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSignOutConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isSigningOut}
              onClick={handleConfirmSignOut}
              className="gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isSigningOut ? "Signing Out..." : "Confirm Sign Out"}</span>
            </Button>
          </div>
        </div>
      </Dialog>

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
              className="flex w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3 py-2 text-xs text-zinc-900 dark:text-white shadow-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
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
