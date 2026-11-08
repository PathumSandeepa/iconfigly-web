"use client";

import React, { useEffect, useState, use } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { ResourceEntity, Environment, Team, ResourceType } from "@/lib/types";

export default function ResourcesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [resources, setResources] = useState<ResourceEntity[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [envId, setEnvId] = useState("");
  const [ownerTeamId, setOwnerTeamId] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("POSTGRES");
  const [metadataJson, setMetadataJson] = useState('{\n  "host": "postgres.internal",\n  "port": 5432,\n  "db": "core_db"\n}');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [envsData, teamsData] = await Promise.all([
        apiFetch<Environment[]>(`/projects/${projectId}/environments`),
        apiFetch<Team[]>("/teams"),
      ]);
      setEnvironments(Array.isArray(envsData) ? envsData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);

      let url = `/projects/${projectId}/resources`;
      const queryParams = new URLSearchParams();
      if (selectedEnvId !== "all") queryParams.set("env_id", selectedEnvId);
      if (selectedType !== "all") queryParams.set("type", selectedType);
      const qs = queryParams.toString();
      if (qs) url += `?${qs}`;

      const resData = await apiFetch<ResourceEntity[]>(url);
      setResources(Array.isArray(resData) ? resData : []);
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, selectedEnvId, selectedType]);

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
    if (!envId) return;
    setError(null);
    setIsSubmitting(true);

    let parsedMeta: Record<string, unknown> = {};
    try {
      parsedMeta = JSON.parse(metadataJson);
    } catch {
      setError("Connection metadata must be valid JSON.");
      setIsSubmitting(false);
      return;
    }

    try {
      await apiFetch(`/projects/${projectId}/resources`, {
        method: "POST",
        body: JSON.stringify({
          environment_id: envId,
          owner_team_id: ownerTeamId || undefined,
          slug,
          name,
          resource_type: resourceType,
          connection_metadata: parsedMeta,
        }),
      });
      setShowRegisterModal(false);
      setName("");
      setSlug("");
      setEnvId("");
      setOwnerTeamId("");
      await loadData();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to provision resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const envMap = new Map(environments.map((e) => [e.id, e]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Infrastructure Resources
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cataloged databases, caches, queues, and object storage scoped by stage.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setShowRegisterModal(true);
          }}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          + Provision Resource
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedEnvId}
          onChange={(e) => setSelectedEnvId(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Environments</option>
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.name} ({env.slug})
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Resource Types</option>
          <option value="POSTGRES">PostgreSQL</option>
          <option value="MYSQL">MySQL</option>
          <option value="REDIS">Redis</option>
          <option value="KAFKA">Apache Kafka</option>
          <option value="S3">Amazon S3 / Blob</option>
          <option value="EXTERNAL_API">External API</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No infrastructure resources found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-6 font-semibold">Resource</th>
                  <th className="py-3.5 px-6 font-semibold">Type</th>
                  <th className="py-3.5 px-6 font-semibold">Environment</th>
                  <th className="py-3.5 px-6 font-semibold">Owner Team</th>
                  <th className="py-3.5 px-6 font-semibold">Connection Metadata</th>
                  <th className="py-3.5 px-6 font-semibold">Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {resources.map((r) => {
                  const env = envMap.get(r.environment_id);
                  const team = r.owner_team_id ? teamMap.get(r.owner_team_id) : null;
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-white">{r.name}</div>
                        <span className="font-mono text-slate-400 text-[11px]">{r.slug}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">
                          {r.resource_type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {env ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              env.is_production
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {env.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {team ? team.name : <span className="text-slate-500">Unassigned</span>}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                        {JSON.stringify(r.connection_metadata || {})}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-mono">v{r.version}</td>
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
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Provision Resource Dependency</h2>
            <p className="text-xs text-slate-400 mb-4">
              Catalog a database, queue, or storage engine scoped to an environment.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Environment Stage
                  </label>
                  <select
                    required
                    value={envId}
                    onChange={(e) => setEnvId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select stage...</option>
                    {environments.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Resource Type
                  </label>
                  <select
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value as ResourceType)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  >
                    <option value="POSTGRES">POSTGRES</option>
                    <option value="MYSQL">MYSQL</option>
                    <option value="REDIS">REDIS</option>
                    <option value="KAFKA">KAFKA</option>
                    <option value="S3">S3</option>
                    <option value="EXTERNAL_API">EXTERNAL_API</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resource Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Payments Postgres Database"
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
                  placeholder="payments-postgres"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Owner Squad (Optional)
                </label>
                <select
                  value={ownerTeamId}
                  onChange={(e) => setOwnerTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Connection Metadata (JSON)
                </label>
                <textarea
                  rows={4}
                  required
                  value={metadataJson}
                  onChange={(e) => setMetadataJson(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-amber-400 mt-1 block">
                  Security Guardrail: Do NOT include raw passwords, tokens, or secret keys here.
                </span>
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
                  disabled={isSubmitting || !envId}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Provisioning..." : "Provision Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
