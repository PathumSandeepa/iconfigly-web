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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShieldCheck, Plus, RefreshCw, Trash2 } from "lucide-react";

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

  const fetchBaseData = async () => {
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
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [bData, envsData, svcsData, resData, teamsData, usersData] = await Promise.all([
          apiFetch<RoleBinding[]>(`/projects/${projectId}/access/bindings`).catch(() => []),
          apiFetch<Environment[]>(`/projects/${projectId}/environments`).catch(() => []),
          apiFetch<ServiceEntity[]>(`/projects/${projectId}/services`).catch(() => []),
          apiFetch<ResourceEntity[]>(`/projects/${projectId}/resources`).catch(() => []),
          apiFetch<Team[]>("/teams").catch(() => []),
          apiFetch<User[]>("/users").catch(() => []),
        ]);

        if (mounted) {
          setBindings(Array.isArray(bData) ? bData : []);
          setEnvironments(Array.isArray(envsData) ? envsData : []);
          setServices(Array.isArray(svcsData) ? svcsData : []);
          setResources(Array.isArray(resData) ? resData : []);
          setTeams(Array.isArray(teamsData) ? teamsData : []);
          setUsers(Array.isArray(usersData) ? usersData : []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
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
      let mounted = true;
      void (async () => {
        if (!inspectScopeId) return;
        setInspectLoading(true);
        try {
          const data = await apiFetch<EffectivePermission[]>(
            `/projects/${projectId}/access/inspect?scope_type=${inspectScopeType}&scope_id=${inspectScopeId}`
          );
          if (mounted) setEffectivePermissions(Array.isArray(data) ? data : []);
        } catch {
          if (mounted) setEffectivePermissions([]);
        } finally {
          if (mounted) setInspectLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }
  }, [activeTab, inspectScopeType, inspectScopeId, projectId]);

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
      await fetchBaseData();
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
      await fetchBaseData();
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || apiErr.title || "Failed to revoke binding");
    }
  };

  const userMap = new Map(users.map((u) => [u.id, u]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>Scoped Access Control (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hierarchical authorization matrix and &quot;Who Has Access?&quot; audit inspector.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab("BINDINGS")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "BINDINGS"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Role Bindings
            </button>
            <button
              onClick={() => setActiveTab("INSPECT")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "INSPECT"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Who Has Access?
            </button>
          </div>

          {activeTab === "BINDINGS" && (
            <Button
              onClick={() => {
                setActionError(null);
                setShowGrantModal(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Grant Role</span>
            </Button>
          )}
        </div>
      </div>

      {activeTab === "BINDINGS" ? (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading role bindings...</div>
            ) : bindings.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No custom role bindings assigned in this project hierarchy yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Subject Type</TableHead>
                    <TableHead>Granted Role</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bindings.map((b) => {
                    const subjectName =
                      b.subject_type === "USER"
                        ? userMap.get(b.subject_id)?.email || b.subject_id
                        : teamMap.get(b.subject_id)?.name || b.subject_id;

                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-semibold text-white">{subjectName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {b.subject_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="font-mono text-[10px]">
                            {b.role_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-slate-400">
                          {b.scope_type}
                        </TableCell>
                        <TableCell className="text-slate-500 text-[11px] font-mono">
                          {b.expires_at ? new Date(b.expires_at).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(b.id)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 h-8"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            <span>Revoke</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">
                Inspect Scope Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inspect-level">Scope Level</Label>
                  <Select
                    id="inspect-level"
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
                  >
                    <option value="PROJECT">Project Wide</option>
                    <option value="ENVIRONMENT">Environment Stage</option>
                    <option value="SERVICE">Microservice</option>
                    <option value="RESOURCE">Infrastructure Resource</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="inspect-target">Select Target Aggregate</Label>
                  {inspectScopeType === "PROJECT" ? (
                    <div className="flex h-9 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 items-center">
                      Active Project Scope
                    </div>
                  ) : inspectScopeType === "ENVIRONMENT" ? (
                    <Select
                      id="inspect-target"
                      value={inspectScopeId}
                      onChange={(e) => setInspectScopeId(e.target.value)}
                    >
                      {environments.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.slug})
                        </option>
                      ))}
                    </Select>
                  ) : inspectScopeType === "SERVICE" ? (
                    <Select
                      id="inspect-target"
                      value={inspectScopeId}
                      onChange={(e) => setInspectScopeId(e.target.value)}
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.slug})
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Select
                      id="inspect-target"
                      value={inspectScopeId}
                      onChange={(e) => setInspectScopeId(e.target.value)}
                    >
                      {resources.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.slug} - {r.resource_type})
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-white">Effective Access Matrix</CardTitle>
                <CardDescription>
                  Deny-by-default algorithm evaluated up the ancestor hierarchy.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadInspection}
                className="gap-1.5 text-indigo-400 hover:text-indigo-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Inspector</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {inspectLoading ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  Evaluating RBAC hierarchy...
                </div>
              ) : effectivePermissions.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No users or teams have explicit or inherited access to this target scope.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Subject Type</TableHead>
                      <TableHead>Effective Role</TableHead>
                      <TableHead>Inheritance Path</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {effectivePermissions.map((ep, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-white">
                          {ep.subject_name || ep.subject_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {ep.subject_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="font-mono text-[10px]">
                            {ep.role_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ep.is_inherited ? (
                            <Badge variant="warning" className="font-sans normal-case text-xs">
                              Inherited from {ep.source_scope || "ancestor scope"}
                            </Badge>
                          ) : (
                            <Badge variant="success" className="font-sans normal-case text-xs">
                              Direct Grant
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog
        open={showGrantModal}
        onOpenChange={setShowGrantModal}
        title="Grant Scoped Role"
        description="Assign a role to a squad or individual user at a specific resource scope."
      >
        {actionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleGrant} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="grant-subject-type">Subject Type</Label>
            <Select
              id="grant-subject-type"
              value={subjectType}
              onChange={(e) => {
                setSubjectType(e.target.value as "USER" | "TEAM");
                setSubjectId("");
              }}
            >
              <option value="TEAM">Engineering Squad</option>
              <option value="USER">Individual User</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grant-subject">
              Select {subjectType === "TEAM" ? "Squad" : "User"}
            </Label>
            <Select
              id="grant-subject"
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
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
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grant-role">Role</Label>
            <Select
              id="grant-role"
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
            >
              <option value="DEVELOPER">DEVELOPER</option>
              <option value="SERVICE_LEAD">SERVICE_LEAD</option>
              <option value="ENV_ADMIN">ENV_ADMIN</option>
              <option value="VIEWER">VIEWER</option>
              <option value="ORG_ADMIN">ORG_ADMIN</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grant-scope">Scope Target</Label>
            <Select
              id="grant-scope"
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
            >
              <option value="PROJECT">Project Wide</option>
              <option value="ENVIRONMENT">Environment</option>
              <option value="SERVICE">Specific Microservice</option>
              <option value="RESOURCE">Specific Resource</option>
            </Select>
          </div>

          {scopeType !== "PROJECT" && (
            <div className="space-y-1.5">
              <Label htmlFor="grant-scope-id">Select Specific Resource</Label>
              <Select
                id="grant-scope-id"
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
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
              </Select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowGrantModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !subjectId}
              size="sm"
            >
              {isSubmitting ? "Granting..." : "Grant Role"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
