"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { ServiceEntity, Team } from "@/lib/types";

export default function ServicesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [services, setServices] = useState<ServiceEntity[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [ownerTeamId, setOwnerTeamId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServices = async () => {
    try {
      const data = await apiFetch<ServiceEntity[]>(`/projects/${projectId}/services`);
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const data = await apiFetch<Team[]>("/teams");
      setTeams(Array.isArray(data) ? data : []);
    } catch {
      setTeams([]);
    }
  };

  useEffect(() => {
    loadServices();
    loadTeams();
  }, [projectId]);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerTeamId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch(`/projects/${projectId}/services`, {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          description,
          owner_team_id: ownerTeamId,
        }),
      });
      setShowRegisterModal(false);
      setName("");
      setSlug("");
      setDescription("");
      setOwnerTeamId("");
      await loadServices();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to register microservice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Microservice Catalog</h1>
          <p className="text-sm text-slate-400 mt-1">
            Registered microservices, ownership boundaries, and deployment endpoints.
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          + Register Service
        </button>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search microservices by name or slug..."
          className="w-full max-w-md px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            {search ? "No microservices match your search." : "No microservices registered yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-6 font-semibold">Service Name</th>
                  <th className="py-3.5 px-6 font-semibold">Slug</th>
                  <th className="py-3.5 px-6 font-semibold">Owner Team</th>
                  <th className="py-3.5 px-6 font-semibold">Description</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Single-Pane View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((s) => {
                  const team = teamMap.get(s.owner_team_id);
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-medium text-white">{s.name}</td>
                      <td className="py-4 px-6 font-mono text-slate-400">{s.slug}</td>
                      <td className="py-4 px-6">
                        {team ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 font-semibold text-[11px]">
                            {team.name}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400 max-w-sm truncate">
                        {s.description || "—"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/projects/${projectId}/services/${s.slug}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 font-semibold transition-colors inline-block"
                        >
                          Context View &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Register Microservice</h2>
            <p className="text-xs text-slate-400 mb-4">
              Add a deployable service aggregate to this project catalog.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Payment Gateway"
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
                  placeholder="payment-gateway"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Owner Squad
                </label>
                <select
                  required
                  value={ownerTeamId}
                  onChange={(e) => setOwnerTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select owner squad...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Handles credit cards, wire transfers, and fraud analysis"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !ownerTeamId}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Register Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
