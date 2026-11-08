"use client";

import React, { useEffect, useState, use } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { ResourceEntity, Environment, Team, ResourceType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent } from "@/components/ui/card";
import { Database, Plus, Users, Layers } from "lucide-react";

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

  const fetchResources = async () => {
    try {
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
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [envsData, teamsData] = await Promise.all([
          apiFetch<Environment[]>(`/projects/${projectId}/environments`).catch(() => []),
          apiFetch<Team[]>("/teams").catch(() => []),
        ]);
        if (mounted) {
          setEnvironments(Array.isArray(envsData) ? envsData : []);
          setTeams(Array.isArray(teamsData) ? teamsData : []);
        }

        let url = `/projects/${projectId}/resources`;
        const queryParams = new URLSearchParams();
        if (selectedEnvId !== "all") queryParams.set("env_id", selectedEnvId);
        if (selectedType !== "all") queryParams.set("type", selectedType);
        const qs = queryParams.toString();
        if (qs) url += `?${qs}`;

        const resData = await apiFetch<ResourceEntity[]>(url).catch(() => []);
        if (mounted) {
          setResources(Array.isArray(resData) ? resData : []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
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

    let parsedMetadata = {};
    try {
      parsedMetadata = JSON.parse(metadataJson);
    } catch {
      setError("Connection metadata must be valid JSON");
      setIsSubmitting(false);
      return;
    }

    try {
      await apiFetch(`/projects/${projectId}/resources`, {
        method: "POST",
        body: JSON.stringify({
          environment_id: envId,
          name,
          slug,
          resource_type: resourceType,
          owner_team_id: ownerTeamId || undefined,
          connection_metadata: parsedMetadata,
        }),
      });
      setShowRegisterModal(false);
      setName("");
      setSlug("");
      setEnvId("");
      setOwnerTeamId("");
      await fetchResources();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to provision resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const envMap = new Map(environments.map((e) => [e.id, e.name]));
  const teamMap = new Map(teams.map((t) => [t.id, t.name]));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-400" />
            <span>Infrastructure Resources</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Databases, caches, message brokers, and cloud backends bound to runtime stages.
          </p>
        </div>

        <Button
          onClick={() => setShowRegisterModal(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Provision Resource</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={selectedEnvId}
          onChange={(e) => setSelectedEnvId(e.target.value)}
          className="w-56"
        >
          <option value="all">All Environments</option>
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.name} ({env.slug})
            </option>
          ))}
        </Select>

        <Select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-48"
        >
          <option value="all">All Resource Types</option>
          <option value="POSTGRES">POSTGRES</option>
          <option value="MYSQL">MYSQL</option>
          <option value="REDIS">REDIS</option>
          <option value="KAFKA">KAFKA</option>
          <option value="S3">S3</option>
          <option value="EXTERNAL_API">EXTERNAL_API</option>
          <option value="CUSTOM">CUSTOM</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading infrastructure...</div>
          ) : resources.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No infrastructure resources cataloged. Click &quot;+ Provision Resource&quot; to register backends.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Owner Squad</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-semibold text-white">
                      {res.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {res.slug}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="font-mono text-[10px]">
                        {res.resource_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        <span>{envMap.get(res.environment_id) || res.environment_id.slice(0, 8)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-2.5 h-2.5" />
                        <span>
                          {res.owner_team_id ? teamMap.get(res.owner_team_id) || "Squad Assigned" : "Global"}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 font-mono text-[11px]">
                      v{res.version}
                    </TableCell>
                    <TableCell className="text-slate-500 text-[11px] font-mono text-right">
                      {new Date(res.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showRegisterModal}
        onOpenChange={setShowRegisterModal}
        title="Provision Infrastructure Resource"
        description="Register a stateful data store, queue, or external service bound strictly to an environment."
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="res-env">Runtime Environment</Label>
            <Select
              id="res-env"
              required
              value={envId}
              onChange={(e) => setEnvId(e.target.value)}
            >
              <option value="">-- Choose Environment Stage --</option>
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name} ({env.slug})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="res-name">Resource Name</Label>
            <Input
              id="res-name"
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="Payments Postgres Database"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="res-slug">Slug Identifier</Label>
            <Input
              id="res-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="payments-db"
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="res-type">Resource Type</Label>
            <Select
              id="res-type"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value as ResourceType)}
            >
              <option value="POSTGRES">POSTGRES (Relational Database)</option>
              <option value="MYSQL">MYSQL (Relational Database)</option>
              <option value="REDIS">REDIS (In-Memory Cache)</option>
              <option value="KAFKA">KAFKA (Event Streaming Broker)</option>
              <option value="S3">S3 (Object Storage Bucket)</option>
              <option value="EXTERNAL_API">EXTERNAL_API (Third-Party SaaS)</option>
              <option value="CUSTOM">CUSTOM</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="res-owner-team">Owner Squad</Label>
            <Select
              id="res-owner-team"
              required
              value={ownerTeamId}
              onChange={(e) => setOwnerTeamId(e.target.value)}
            >
              <option value="">-- Select Owner Team --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="res-meta">Connection Metadata (JSON)</Label>
            <textarea
              id="res-meta"
              rows={3}
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              className="flex w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white shadow-sm font-mono placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRegisterModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !envId || !ownerTeamId}
              size="sm"
            >
              {isSubmitting ? "Provisioning..." : "Provision Resource"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
