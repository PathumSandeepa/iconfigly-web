"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { Team } from "@/lib/types";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = async () => {
    try {
      const data = await apiFetch<Team[]>("/teams");
      setTeams(Array.isArray(data) ? data : []);
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generated);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch<Team>("/teams", {
        method: "POST",
        body: JSON.stringify({ name, slug, description }),
      });
      setShowCreateModal(false);
      setName("");
      setSlug("");
      setDescription("");
      await loadTeams();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to create team");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Teams</h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize engineering squads, microservice owners, and access delegates.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          + Create Team
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No teams created yet. Click "+ Create Team" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-6 font-semibold">Team Name</th>
                  <th className="py-3.5 px-6 font-semibold">Slug</th>
                  <th className="py-3.5 px-6 font-semibold">Description</th>
                  <th className="py-3.5 px-6 font-semibold">Members</th>
                  <th className="py-3.5 px-6 font-semibold">Created</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-white">{t.name}</td>
                    <td className="py-4 px-6 font-mono text-slate-400">{t.slug}</td>
                    <td className="py-4 px-6 text-slate-400 max-w-xs truncate">
                      {t.description || "—"}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                        {t.member_count} {t.member_count === 1 ? "member" : "members"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/teams/${t.id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Create New Team</h2>
            <p className="text-xs text-slate-400 mb-4">
              Teams own services and hold scoped access permissions across environments.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Payments Squad"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="payments-squad"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Owns checkout, billing, and fraud detection microservices"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
