"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import {
  ServiceContextView,
  Environment,
  ResourceEntity,
  ServiceEntity,
} from "@/lib/types";

export default function ServiceContextPage({
  params,
}: {
  params: Promise<{ projectId: string; serviceSlug: string }>;
}) {
  const { projectId, serviceSlug } = use(params);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvSlug, setSelectedEnvSlug] = useState<string>("dev");
  const [context, setContext] = useState<ServiceContextView | null>(null);
  const [loading, setLoading] = useState(true);

  const [availableResources, setAvailableResources] = useState<ResourceEntity[]>([]);
  const [allServices, setAllServices] = useState<ServiceEntity[]>([]);
  const [showBindModal, setShowBindModal] = useState(false);
  const [showDepModal, setShowDepModal] = useState(false);

  const [bindResourceId, setBindResourceId] = useState("");
  const [bindAccessMode, setBindAccessMode] = useState<"READ_WRITE" | "READ">("READ_WRITE");
  const [depCalleeId, setDepCalleeId] = useState("");
  const [depProtocol, setDepProtocol] = useState<"HTTP" | "GRPC" | "KAFKA" | "EVENT">("HTTP");

  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadEnvs() {
      try {
        const envs = await apiFetch<Environment[]>(`/projects/${projectId}/environments`);
        const list = Array.isArray(envs) ? envs : [];
        setEnvironments(list);
        if (list.length > 0 && !selectedEnvSlug) {
          setSelectedEnvSlug(list[0].slug);
        }
      } catch {
        setEnvironments([]);
      }
    }
    loadEnvs();
  }, [projectId, selectedEnvSlug]);

  const loadContext = async () => {
    if (!selectedEnvSlug) return;
    setLoading(true);
    try {
      const data = await apiFetch<ServiceContextView>(
        `/projects/${projectId}/services/${serviceSlug}/context?env=${selectedEnvSlug}`
      );
      setContext(data);

      if (data?.environment?.id) {
        const [resList, svcList] = await Promise.all([
          apiFetch<ResourceEntity[]>(
            `/projects/${projectId}/resources?env_id=${data.environment.id}`
          ).catch(() => []),
          apiFetch<ServiceEntity[]>(`/projects/${projectId}/services`).catch(() => []),
        ]);
        setAvailableResources(Array.isArray(resList) ? resList : []);
        setAllServices(Array.isArray(svcList) ? svcList : []);
      }
    } catch {
      setContext(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
  }, [projectId, serviceSlug, selectedEnvSlug]);

  const handleBindResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!context || !bindResourceId) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      await apiFetch(`/projects/${projectId}/bindings`, {
        method: "POST",
        body: JSON.stringify({
          service_id: context.service.id,
          resource_id: bindResourceId,
          environment_id: context.environment.id,
          access_mode: bindAccessMode,
        }),
      });
      setShowBindModal(false);
      setBindResourceId("");
      await loadContext();
    } catch (err) {
      const apiErr = err as ApiError;
      setActionError(apiErr.detail || apiErr.title || "Failed to bind resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBinding = async (bindingId: string) => {
    if (!confirm("Are you sure you want to remove this resource binding?")) return;
    try {
      await apiFetch(`/projects/${projectId}/bindings/${bindingId}`, {
        method: "DELETE",
      });
      await loadContext();
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || apiErr.title || "Failed to remove binding");
    }
  };

  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!context || !depCalleeId) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      await apiFetch(`/projects/${projectId}/dependencies`, {
        method: "POST",
        body: JSON.stringify({
          caller_service_id: context.service.id,
          callee_service_id: depCalleeId,
          environment_id: context.environment.id,
          protocol: depProtocol,
        }),
      });
      setShowDepModal(false);
      setDepCalleeId("");
      await loadContext();
    } catch (err) {
      const apiErr = err as ApiError;
      setActionError(apiErr.detail || apiErr.title || "Failed to add service dependency");
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherServices = allServices.filter((s) => s.id !== context?.service.id);
  const boundResourceIds = new Set((context?.bound_resources || []).map((b) => b.resource_id));
  const unattachedResources = availableResources.filter((r) => !boundResourceIds.has(r.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href={`/projects/${projectId}/services`} className="hover:text-slate-200">
          Microservices
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-medium">{serviceSlug}</span>
      </div>

      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {context?.service?.name || serviceSlug}
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {serviceSlug}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Single-Pane Service Context: runtime dependencies, ownership, and effective permissions.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => setSelectedEnvSlug(env.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedEnvSlug === env.slug
                  ? env.is_production
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950"
                    : "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {env.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          Assembling single-pane context view...
        </div>
      ) : !context ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Service context could not be resolved for stage "{selectedEnvSlug}".
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Owner Team
              </span>
              <div className="font-semibold text-white mt-1 text-sm">
                {context.owner_team?.name || "Unassigned"}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {context.owner_team?.slug}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Active Stage
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold text-white text-sm">
                  {context.environment?.name}
                </span>
                {context.environment?.is_production ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase">
                    PROD
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] uppercase">
                    Tier {context.environment?.tier_order}
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Your Effective RBAC Role
              </span>
              <div className="mt-1">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs">
                  {context.caller_effective_role || "VIEWER"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Audit Checkpoint
              </span>
              <div className="mt-1 text-xs text-slate-300">
                {context.last_activity ? (
                  <>
                    <span className="font-mono text-indigo-400">
                      {context.last_activity.action}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {new Date(context.last_activity.timestamp).toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">No recorded changes</span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">
                  Bound Infrastructure Dependencies ({context.bound_resources.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Shared databases, caches, and streaming brokers bound in {context.environment.name}.
                </p>
              </div>
              <button
                onClick={() => {
                  setActionError(null);
                  setShowBindModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                + Bind Resource
              </button>
            </div>

            {context.bound_resources.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No infrastructure resources bound to {context.service.name} in this stage.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Resource Name</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Access Mode</th>
                      <th className="pb-3 font-semibold">Connection Metadata</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {context.bound_resources.map((res) => (
                      <tr key={res.binding_id} className="hover:bg-slate-800/30">
                        <td className="py-3.5">
                          <div className="font-medium text-white">{res.resource_name}</div>
                          <span className="font-mono text-[11px] text-slate-400">
                            {res.resource_slug}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">
                            {res.resource_type}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              res.access_mode === "READ_WRITE"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {res.access_mode}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                          {JSON.stringify(res.connection_metadata || {})}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleRemoveBinding(res.binding_id)}
                            className="text-rose-400 hover:text-rose-300 font-semibold"
                          >
                            Unbind
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">
                  Microservice Dependencies ({context.dependencies.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Upstream callers and downstream RPC/HTTP/Event endpoints in {context.environment.name}.
                </p>
              </div>
              <button
                onClick={() => {
                  setActionError(null);
                  setShowDepModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                + Add Dependency
              </button>
            </div>

            {context.dependencies.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No upstream or downstream service dependencies mapped in this stage.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Direction</th>
                      <th className="pb-3 font-semibold">Service Name</th>
                      <th className="pb-3 font-semibold">Protocol</th>
                      <th className="pb-3 font-semibold">Established</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {context.dependencies.map((dep) => (
                      <tr key={dep.dependency_id} className="hover:bg-slate-800/30">
                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                              dep.direction === "UPSTREAM"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            }`}
                          >
                            {dep.direction === "UPSTREAM" ? "Caller &rarr; Us" : "Us &rarr; Callee"}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="font-medium text-white">{dep.service_name}</div>
                          <span className="font-mono text-[11px] text-slate-400">
                            {dep.service_slug}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">
                            {dep.protocol}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-500">
                          {new Date(dep.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showBindModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Bind Infrastructure Resource</h2>
            <p className="text-xs text-slate-400 mb-4">
              Bind {context?.service.name} to a resource provisioned in stage {context?.environment.name}.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleBindResource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resource</label>
                <select
                  required
                  value={bindResourceId}
                  onChange={(e) => setBindResourceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select an infrastructure resource...</option>
                  {unattachedResources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.slug} - {r.resource_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Access Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBindAccessMode("READ_WRITE")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      bindAccessMode === "READ_WRITE"
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Read & Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setBindAccessMode("READ")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      bindAccessMode === "READ"
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Read-Only
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBindModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !bindResourceId}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Binding..." : "Confirm Binding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDepModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Add Downstream Callee Dependency</h2>
            <p className="text-xs text-slate-400 mb-4">
              Declare that {context?.service.name} calls another microservice in stage {context?.environment.name}.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAddDependency} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Service (Callee)
                </label>
                <select
                  required
                  value={depCalleeId}
                  onChange={(e) => setDepCalleeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select callee microservice...</option>
                  {otherServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Protocol</label>
                <select
                  value={depProtocol}
                  onChange={(e) =>
                    setDepProtocol(e.target.value as "HTTP" | "GRPC" | "KAFKA" | "EVENT")
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                >
                  <option value="HTTP">HTTP / REST</option>
                  <option value="GRPC">gRPC</option>
                  <option value="KAFKA">Kafka / Message Queue</option>
                  <option value="EVENT">Webhook / Event</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !depCalleeId}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Linking..." : "Establish Dependency"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
