"use client";

import React, { useEffect, useState, use } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import {
  RoleBinding,
  EffectivePermission,
  Environment,
  ServiceEntity,
  ResourceEntity,
  Team,
  User,
} from "@/lib/types";

export default function AccessPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [activeTab, setActiveTab] = useState<"BINDINGS" | "INSPECT">("BINDINGS");

  const [bindings, setBindings] = useState<RoleBinding[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [services, setServices] = useState<ServiceEntity[]>([]);
  const [resources, setResources] = useState<ResourceEntity[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [inspectScopeType, setInspectScopeType] = useState<string>("PROJECT");
  const [inspectScopeId, setInspectScopeId] = useState<string>(projectId);
  const [effectivePermissions, setEffectivePermissions] = useState<EffectivePermission[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  const [showGrantModal, setShowGrantModal] = useState(false);
  const [subjectType, setSubjectType] = useState<"USER" | "TEAM">("TEAM");
  const [subjectId, setSubjectId] = useState("");
  const [roleName, setRoleName] = useState<
    "ORG_ADMIN" | "ENV_ADMIN" | "SERVICE_LEAD" | "DEVELOPER" | "VIEWER"
  >("DEVELOPER");
  const [scopeType, setScopeType] = useState<"PROJECT" | "ENVIRONMENT" | "SERVICE" | "RESOURCE">(
    "PROJECT"
  );
  const [scopeId, setScopeId] = useState(projectId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadBaseData = async () => {
    try {
      const [bData, envsData, svcsData, resData, teamsData, usersData] = await Promise.all([
        apiFetch<RoleBinding[]>(`/projects/${projectId}/access/bindings`),
        apiFetch<Environment[]>(`/projects/${projectId}/environments`),
        apiFetch<ServiceEntity[]>(`/projects/${projectId}/services`),
        apiFetch<ResourceEntity[]>(`/projects/${projectId}/resources`),
        apiFetch<Team[]>("/teams"),
        apiFetch<User[]>("/users"),
      ]);

      setBindings(Array.isArray(bData) ? bData : []);
      setEnvironments(Array.isArray(envsData) ? envsData : []);
      setServices(Array.isArray(svcsData) ? svcsData : []);
      setResources(Array.isArray(resData) ? resData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch {
      setBindings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, [projectId]);

  const loadInspection = async () => {
    if (!inspectScopeId) return;
    setInspectLoading(true);
    try {
      const data = await apiFetch<EffectivePermission[]>(
        `/projects/${projectId}/access/inspect?scope_type=${inspectScopeType}&scope_id=${inspectScopeId}`
      );
      setEffectivePermissions(Array.isArray(data) ? data : []);
    } catch {
      setEffectivePermissions([]);
    } finally {
      setInspectLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "INSPECT") {
      loadInspection();
    }
  }, [activeTab, inspectScopeType, inspectScopeId]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !scopeId) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      await apiFetch(`/projects/${projectId}/access/bindings`, {
        method: "POST",
        body: JSON.stringify({
          subject_type: subjectType,
          subject_id: subjectId,
          role_name: roleName,
          scope_type: scopeType,
          scope_id: scopeId,
        }),
      });
      setShowGrantModal(false);
      setSubjectId("");
      await loadBaseData();
    } catch (err) {
      const apiErr = err as ApiError;
      setActionError(apiErr.detail || apiErr.title || "Failed to grant role binding");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (bindingId: string) => {
    if (!confirm("Are you sure you want to revoke this role binding?")) return;
    try {
      await apiFetch(`/projects/${projectId}/access/bindings/${bindingId}`, {
        method: "DELETE",
      });
      await loadBaseData();
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || apiErr.title || "Failed to revoke binding");
    }
  };

  const userMap = new Map(users.map((u) => [u.id, u]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Scoped Access Control (RBAC)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Hierarchical authorization matrix and "Who Has Access?" audit inspector.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab("BINDINGS")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "BINDINGS"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Role Bindings
            </button>
            <button
              onClick={() => setActiveTab("INSPECT")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "INSPECT"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Who Has Access?
            </button>
          </div>

          {activeTab === "BINDINGS" && (
            <button
              onClick={() => {
                setActionError(null);
                setShowGrantModal(true);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              + Grant Role
            </button>
          )}
        </div>
      </div>

      {activeTab === "BINDINGS" ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading role bindings...</div>
          ) : bindings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No custom role bindings assigned in this project hierarchy yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                    <th className="py-3.5 px-6 font-semibold">Subject</th>
                    <th className="py-3.5 px-6 font-semibold">Subject Type</th>
                    <th className="py-3.5 px-6 font-semibold">Granted Role</th>
                    <th className="py-3.5 px-6 font-semibold">Scope</th>
                    <th className="py-3.5 px-6 font-semibold">Expires</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bindings.map((b) => {
                    const subjectName =
                      b.subject_type === "USER"
                        ? userMap.get(b.subject_id)?.email || b.subject_id
                        : teamMap.get(b.subject_id)?.name || b.subject_id;

                    return (
                      <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6 font-medium text-white">{subjectName}</td>
                        <td className="py-4 px-6">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {b.subject_type}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                            {b.role_name}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                          {b.scope_type}
                        </td>
                        <td className="py-4 px-6 text-slate-500">
                          {b.expires_at ? new Date(b.expires_at).toLocaleDateString() : "Never"}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleRevoke(b.id)}
                            className="text-rose-400 hover:text-rose-300 font-semibold"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Inspect Scope Target
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Scope Level
                </label>
                <select
                  value={inspectScopeType}
                  onChange={(e) => {
                    const st = e.target.value;
                    setInspectScopeType(st);
                    if (st === "PROJECT") setInspectScopeId(projectId);
                    else if (st === "ENVIRONMENT" && environments.length > 0)
                      setInspectScopeId(environments[0].id);
                    else if (st === "SERVICE" && services.length > 0)
                      setInspectScopeId(services[0].id);
                    else if (st === "RESOURCE" && resources.length > 0)
                      setInspectScopeId(resources[0].id);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="PROJECT">Project Wide</option>
                  <option value="ENVIRONMENT">Environment Stage</option>
                  <option value="SERVICE">Microservice</option>
                  <option value="RESOURCE">Infrastructure Resource</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Target Aggregate
                </label>
                {inspectScopeType === "PROJECT" ? (
                  <div className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-xs text-slate-300">
                    Active Project Scope
                  </div>
                ) : inspectScopeType === "ENVIRONMENT" ? (
                  <select
                    value={inspectScopeId}
                    onChange={(e) => setInspectScopeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {environments.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.slug})
                      </option>
                    ))}
                  </select>
                ) : inspectScopeType === "SERVICE" ? (
                  <select
                    value={inspectScopeId}
                    onChange={(e) => setInspectScopeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.slug})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={inspectScopeId}
                    onChange={(e) => setInspectScopeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.slug} - {r.resource_type})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Effective Access Matrix</h3>
                <p className="text-xs text-slate-400">
                  Deny-by-default algorithm evaluated up the ancestor hierarchy.
                </p>
              </div>
              <button
                onClick={loadInspection}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Refresh Inspector
              </button>
            </div>

            {inspectLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Evaluating RBAC hierarchy...
              </div>
            ) : effectivePermissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No users or teams have explicit or inherited access to this target scope.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                      <th className="py-3 px-6 font-semibold">Subject</th>
                      <th className="py-3 px-6 font-semibold">Subject Type</th>
                      <th className="py-3 px-6 font-semibold">Effective Role</th>
                      <th className="py-3 px-6 font-semibold">Inheritance Path</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {effectivePermissions.map((ep, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-3.5 px-6 font-medium text-white">
                          {ep.subject_name || ep.subject_id}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-[10px] text-slate-400">
                          {ep.subject_type}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {ep.role_name}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          {ep.is_inherited ? (
                            <span className="text-amber-400 font-medium">
                              Inherited from {ep.source_scope || "ancestor scope"}
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-medium">Direct Grant</span>
                          )}
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

      {showGrantModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Grant Scoped Role</h2>
            <p className="text-xs text-slate-400 mb-4">
              Assign a role to a squad or individual user at a specific resource scope.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleGrant} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubjectType("TEAM");
                      setSubjectId("");
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      subjectType === "TEAM"
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Engineering Squad
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubjectType("USER");
                      setSubjectId("");
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      subjectType === "USER"
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Individual User
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select {subjectType === "TEAM" ? "Squad" : "User"}
                </label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select subject...</option>
                  {subjectType === "TEAM"
                    ? teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.slug})
                        </option>
                      ))
                    : users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.email})
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                <select
                  value={roleName}
                  onChange={(e) =>
                    setRoleName(
                      e.target.value as
                        | "ORG_ADMIN"
                        | "ENV_ADMIN"
                        | "SERVICE_LEAD"
                        | "DEVELOPER"
                        | "VIEWER"
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="DEVELOPER">DEVELOPER</option>
                  <option value="SERVICE_LEAD">SERVICE_LEAD</option>
                  <option value="ENV_ADMIN">ENV_ADMIN</option>
                  <option value="VIEWER">VIEWER</option>
                  <option value="ORG_ADMIN">ORG_ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Scope Target
                </label>
                <select
                  value={scopeType}
                  onChange={(e) => {
                    const st = e.target.value as "PROJECT" | "ENVIRONMENT" | "SERVICE" | "RESOURCE";
                    setScopeType(st);
                    if (st === "PROJECT") setScopeId(projectId);
                    else if (st === "ENVIRONMENT" && environments.length > 0)
                      setScopeId(environments[0].id);
                    else if (st === "SERVICE" && services.length > 0)
                      setScopeId(services[0].id);
                    else if (st === "RESOURCE" && resources.length > 0)
                      setScopeId(resources[0].id);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="PROJECT">Project Wide</option>
                  <option value="ENVIRONMENT">Environment</option>
                  <option value="SERVICE">Specific Microservice</option>
                  <option value="RESOURCE">Specific Resource</option>
                </select>
              </div>

              {scopeType !== "PROJECT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Specific Resource
                  </label>
                  <select
                    value={scopeId}
                    onChange={(e) => setScopeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {scopeType === "ENVIRONMENT" &&
                      environments.map((env) => (
                        <option key={env.id} value={env.id}>
                          {env.name} ({env.slug})
                        </option>
                      ))}
                    {scopeType === "SERVICE" &&
                      services.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.name} ({svc.slug})
                        </option>
                      ))}
                    {scopeType === "RESOURCE" &&
                      resources.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.name} ({res.slug})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !subjectId}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Granting..." : "Grant Binding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
