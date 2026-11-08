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
import { Cpu, Database, Plus, Network, ArrowLeft, Trash2 } from "lucide-react";

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
    let mounted = true;
    void (async () => {
      try {
        const envs = await apiFetch<Environment[]>(`/projects/${projectId}/environments`);
        const list = Array.isArray(envs) ? envs : [];
        if (mounted) {
          setEnvironments(list);
          if (list.length > 0 && !selectedEnvSlug) {
            setSelectedEnvSlug(list[0].slug);
          }
        }
      } catch {
        if (mounted) setEnvironments([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId, selectedEnvSlug]);

  const fetchContext = async () => {
    if (!selectedEnvSlug) return;
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
    }
  };

  useEffect(() => {
    if (!selectedEnvSlug) return;
    let mounted = true;
    void (async () => {
      try {
        const data = await apiFetch<ServiceContextView>(
          `/projects/${projectId}/services/${serviceSlug}/context?env=${selectedEnvSlug}`
        );
        if (mounted) {
          setContext(data);
          if (data?.environment?.id) {
            const [resList, svcList] = await Promise.all([
              apiFetch<ResourceEntity[]>(
                `/projects/${projectId}/resources?env_id=${data.environment.id}`
              ).catch(() => []),
              apiFetch<ServiceEntity[]>(`/projects/${projectId}/services`).catch(() => []),
            ]);
            if (mounted) {
              setAvailableResources(Array.isArray(resList) ? resList : []);
              setAllServices(Array.isArray(svcList) ? svcList : []);
            }
          }
        }
      } catch {
        if (mounted) setContext(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId, serviceSlug, selectedEnvSlug]);

  const handleBindResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bindResourceId) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      const selectedResource = availableResources.find((r) => r.id === bindResourceId);
      const currentEnv = environments.find((e) => e.slug === selectedEnvSlug);
      const targetEnvId =
        selectedResource?.environment_id ||
        context?.environment?.id ||
        currentEnv?.id;

      await apiFetch(`/projects/${projectId}/bindings`, {
        method: "POST",
        body: JSON.stringify({
          environment_id: targetEnvId,
          service_id: context?.service?.id,
          resource_id: bindResourceId,
          access_mode: bindAccessMode,
        }),
      });
      setShowBindModal(false);
      setBindResourceId("");
      await fetchContext();
    } catch (err) {
      const apiErr = err as ApiError;
      setActionError(apiErr.detail || apiErr.title || "Failed to bind infrastructure resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBinding = async (bindingId: string) => {
    if (!confirm("Are you sure you want to disconnect this resource binding?")) return;
    try {
      await apiFetch(`/projects/${projectId}/bindings/${bindingId}`, {
        method: "DELETE",
      });
      await fetchContext();
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || apiErr.title || "Failed to remove binding");
    }
  };

  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depCalleeId) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      await apiFetch(`/projects/${projectId}/dependencies`, {
        method: "POST",
        body: JSON.stringify({
          environment_id: context?.environment?.id,
          caller_service_id: context?.service?.id,
          callee_service_id: depCalleeId,
          protocol: depProtocol,
        }),
      });
      setShowDepModal(false);
      setDepCalleeId("");
      await fetchContext();
    } catch (err) {
      const apiErr = err as ApiError;
      setActionError(apiErr.detail || apiErr.title || "Failed to add service dependency");
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherServices = allServices.filter((s) => s.id !== context?.service?.id);
  const boundResourceIds = new Set(
    (context?.bound_resources || []).map((b) => b.resource_id || b.id || "")
  );
  const unattachedResources = availableResources.filter((r) => !boundResourceIds.has(r.id));

  const dependencies = [
    ...(context?.upstream_dependencies || []).map((d) => ({
      dependency_id: d.service_id,
      service_id: d.service_id,
      service_slug: d.service_slug,
      service_name: d.service_name,
      protocol: d.protocol,
      direction: "UPSTREAM" as const,
      created_at: new Date().toISOString(),
    })),
    ...(context?.downstream_dependencies || []).map((d) => ({
      dependency_id: d.service_id,
      service_id: d.service_id,
      service_slug: d.service_slug,
      service_name: d.service_name,
      protocol: d.protocol,
      direction: "DOWNSTREAM" as const,
      created_at: new Date().toISOString(),
    })),
    ...(context?.dependencies || []),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link
          href={`/projects/${projectId}/services`}
          className="hover:text-white transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Microservices</span>
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-medium font-mono">{serviceSlug}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Cpu className="w-6 h-6 text-indigo-400" />
              <span>{context?.service?.name || serviceSlug}</span>
            </h1>
            <Badge variant="outline" className="font-mono">
              {serviceSlug}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Single-Pane Service Context: runtime dependencies, ownership, and effective permissions.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 self-start md:self-auto overflow-x-auto">
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => setSelectedEnvSlug(env.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
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
          Service context could not be resolved for stage &quot;{selectedEnvSlug}&quot;.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block font-mono">
                Owner Team
              </span>
              <div className="font-semibold text-white mt-1 text-sm">
                {context.owner_team?.name || "Unassigned"}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {context.owner_team?.slug}
              </span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block font-mono">
                Active Stage
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold text-white text-sm">
                  {context.environment?.name}
                </span>
                {context.environment?.is_production ? (
                  <Badge variant="destructive">PROD</Badge>
                ) : (
                  <Badge variant="secondary">Tier {context.environment?.tier_order}</Badge>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block font-mono">
                Effective RBAC Role
              </span>
              <div className="mt-1">
                <Badge variant="default" className="text-xs font-bold py-1">
                  {context.caller_effective_role || "VIEWER"}
                </Badge>
              </div>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block font-mono">
                Audit Checkpoint
              </span>
              <div className="mt-1 text-xs text-slate-300">
                {context.latest_audit_entry || context.last_activity ? (
                  <>
                    <span className="font-mono text-indigo-400 font-medium">
                      {(context.latest_audit_entry || context.last_activity)?.action}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 font-mono">
                      {new Date(
                        (context.latest_audit_entry || context.last_activity)!.timestamp
                      ).toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">No recorded changes</span>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>Bound Infrastructure Dependencies ({context.bound_resources?.length || 0})</span>
                </CardTitle>
                <CardDescription>
                  Shared databases, caches, and streaming brokers bound in {context.environment.name}.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setActionError(null);
                  setShowBindModal(true);
                }}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Bind Resource</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!context.bound_resources || context.bound_resources.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No infrastructure resources bound to {context.service.name} in this stage.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Access Mode</TableHead>
                      <TableHead>Connection Metadata</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(context.bound_resources || []).map((res) => (
                      <TableRow key={res.binding_id}>
                        <TableCell>
                          <div className="font-semibold text-white">{res.resource_name || res.name}</div>
                          <span className="font-mono text-[11px] text-slate-400">
                            {res.resource_slug || res.slug}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {res.resource_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={res.access_mode === "READ_WRITE" ? "success" : "secondary"}
                          >
                            {res.access_mode}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-slate-400 max-w-xs truncate">
                          {JSON.stringify(res.connection_metadata || {})}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveBinding(res.binding_id)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 h-8"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            <span>Unbind</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-400" />
                  <span>Microservice Dependencies ({dependencies.length})</span>
                </CardTitle>
                <CardDescription>
                  Upstream callers and downstream RPC/HTTP/Event endpoints in {context.environment.name}.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionError(null);
                  setShowDepModal(true);
                }}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Dependency</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {dependencies.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No upstream or downstream service dependencies mapped in this stage.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Direction</TableHead>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Protocol</TableHead>
                      <TableHead className="text-right">Established</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dependencies.map((dep) => (
                      <TableRow key={dep.dependency_id}>
                        <TableCell>
                          <Badge
                            variant={dep.direction === "UPSTREAM" ? "info" : "default"}
                            className="font-mono text-[10px]"
                          >
                            {dep.direction === "UPSTREAM" ? "Caller → Us" : "Us → Callee"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-white">{dep.service_name}</div>
                          <span className="font-mono text-[11px] text-slate-400">
                            {dep.service_slug}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {dep.protocol}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-[11px] font-mono text-right">
                          {dep.created_at ? new Date(dep.created_at).toLocaleDateString() : "—"}
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
        open={showBindModal}
        onOpenChange={setShowBindModal}
        title="Bind Infrastructure Resource"
        description={`Bind ${context?.service.name || "service"} to a resource provisioned in stage ${context?.environment.name || "stage"}.`}
      >
        {actionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleBindResource} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bind-resource">Select Resource</Label>
            <Select
              id="bind-resource"
              required
              value={bindResourceId}
              onChange={(e) => setBindResourceId(e.target.value)}
            >
              <option value="">Select an infrastructure resource...</option>
              {unattachedResources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.slug} - {r.resource_type})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bind-access">Access Mode</Label>
            <Select
              id="bind-access"
              value={bindAccessMode}
              onChange={(e) => setBindAccessMode(e.target.value as "READ_WRITE" | "READ")}
            >
              <option value="READ_WRITE">Read & Write</option>
              <option value="READ">Read-Only</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowBindModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !bindResourceId}
              size="sm"
            >
              {isSubmitting ? "Binding..." : "Confirm Binding"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={showDepModal}
        onOpenChange={setShowDepModal}
        title="Add Downstream Callee Dependency"
        description={`Declare that ${context?.service.name || "service"} calls another microservice in stage ${context?.environment.name || "stage"}.`}
      >
        {actionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleAddDependency} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dep-callee">Target Microservice</Label>
            <Select
              id="dep-callee"
              required
              value={depCalleeId}
              onChange={(e) => setDepCalleeId(e.target.value)}
            >
              <option value="">Choose downstream service...</option>
              {otherServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.slug})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dep-protocol">Communication Protocol</Label>
            <Select
              id="dep-protocol"
              value={depProtocol}
              onChange={(e) =>
                setDepProtocol(e.target.value as "HTTP" | "GRPC" | "KAFKA" | "EVENT")
              }
            >
              <option value="HTTP">HTTP/REST</option>
              <option value="GRPC">gRPC / Protocol Buffers</option>
              <option value="KAFKA">Kafka Event Bus</option>
              <option value="EVENT">Async Event</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDepModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !depCalleeId}
              size="sm"
            >
              {isSubmitting ? "Mapping..." : "Add Dependency"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
