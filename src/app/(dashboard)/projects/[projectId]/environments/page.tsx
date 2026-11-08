"use client";

import React, { useEffect, useState, use } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Environment } from "@/lib/types";

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

  const loadEnvironments = async () => {
    try {
      const data = await apiFetch<Environment[]>(`/projects/${projectId}/environments`);
      setEnvironments(Array.isArray(data) ? data : []);
    } catch {
      setEnvironments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnvironments();
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
      await loadEnvironments();
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
        <h1 className="text-2xl font-bold tracking-tight text-white">Environment Pipeline</h1>
        <p className="text-sm text-slate-400 mt-1">
          Ordered runtime stages enforcing progressive promotion policies and production guardrails.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading pipeline stages...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {environments.map((env, index) => (
            <div
              key={env.id}
              className={`p-6 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between ${
                env.is_production ? "border-amber-500/40 shadow-lg shadow-amber-950/20" : "border-slate-800"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Tier {env.tier_order}
                  </span>
                  {env.is_production ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                      Production
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] uppercase font-semibold">
                      Non-Prod
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <h2 className="text-xl font-extrabold text-white">{env.name}</h2>
                  <span className="font-mono text-xs text-slate-400">{env.slug}</span>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Promotion Order:</span>
                    <span className="font-semibold text-slate-200">Stage {index + 1} of 4</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Required Approvals:</span>
                    <span className="font-semibold text-slate-200">
                      {env.required_approvals}{" "}
                      {env.required_approvals === 1 ? "sign-off" : "sign-offs"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleEditClick(env)}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  Configure Governance
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingEnv && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">
              Configure {editingEnv.name} ({editingEnv.slug})
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Update promotion policies and production protection threshold.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Required Approvals
                </label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={requiredApprovals}
                  onChange={(e) => setRequiredApprovals(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Number of independent peer reviews required before promoting changes to this stage.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isProd"
                  checked={isProduction}
                  onChange={(e) => setIsProduction(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isProd" className="text-xs font-medium text-slate-200">
                  Mark as Production Environment
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingEnv(null)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save Policies"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
