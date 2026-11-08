"use client";

import React, { useEffect, useState, use } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Environment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Layers, Settings } from "lucide-react";

export default function EnvironmentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [requiredApprovals, setRequiredApprovals] = useState(0);
  const [isProduction, setIsProduction] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvironments = async () => {
    try {
      const data = await apiFetch<Environment[]>(`/projects/${projectId}/environments`);
      setEnvironments(Array.isArray(data) ? data : []);
    } catch {
      setEnvironments([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const data = await apiFetch<Environment[]>(`/projects/${projectId}/environments`);
        if (mounted) setEnvironments(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setEnvironments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const handleEditClick = (env: Environment) => {
    setEditingEnv(env);
    setRequiredApprovals(env.required_approvals);
    setIsProduction(env.is_production);
    setError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnv) return;
    setError(null);
    setIsUpdating(true);
    try {
      await apiFetch(`/projects/${projectId}/environments/${editingEnv.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          required_approvals: Number(requiredApprovals),
          is_production: Boolean(isProduction),
        }),
      });
      setEditingEnv(null);
      await fetchEnvironments();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to update environment");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
          <span>Environment Pipeline</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Ordered runtime stages enforcing progressive promotion policies and production guardrails.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-500">Loading pipeline stages...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {environments.map((env, index) => (
            <Card
              key={env.id}
              className={`flex flex-col justify-between rounded-3xl transition-all ${
                env.is_production
                  ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
                    Tier {env.tier_order}
                  </span>
                  {env.is_production ? (
                    <Badge variant="destructive">Production</Badge>
                  ) : (
                    <Badge variant="secondary">Non-Prod</Badge>
                  )}
                </div>

                <div className="mt-3">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{env.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {env.slug.toUpperCase()}
                    </Badge>
                    <span className="font-mono text-[11px] text-zinc-500">{env.slug}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Promotion Order:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Stage {index + 1} of {environments.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Required Approvals:</span>
                    <Badge variant="outline">{env.required_approvals} sign-offs</Badge>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(env)}
                  className="w-full gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure Stage</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(editingEnv)}
        onOpenChange={(open) => {
          if (!open) setEditingEnv(null);
        }}
        title={`Configure ${editingEnv?.name || "Stage"}`}
        description="Update promotion gating parameters and production classification."
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="env-approvals">Required Approvals</Label>
            <Input
              id="env-approvals"
              type="number"
              min={0}
              max={10}
              value={requiredApprovals}
              onChange={(e) => setRequiredApprovals(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="is_production"
              checked={isProduction}
              onChange={(e) => setIsProduction(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            />
            <Label htmlFor="is_production" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
              Mark stage as live Production environment
            </Label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditingEnv(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              size="sm"
            >
              {isUpdating ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
