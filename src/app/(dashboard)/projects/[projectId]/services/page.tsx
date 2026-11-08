"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { ServiceEntity, Team } from "@/lib/types";
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
import { Cpu, Plus, Search, ArrowUpRight, Users } from "lucide-react";

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

  const fetchServices = async () => {
    try {
      const data = await apiFetch<ServiceEntity[]>(`/projects/${projectId}/services`);
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [servicesData, teamsData] = await Promise.all([
          apiFetch<ServiceEntity[]>(`/projects/${projectId}/services`).catch(() => []),
          apiFetch<Team[]>("/teams").catch(() => []),
        ]);
        if (mounted) {
          setServices(Array.isArray(servicesData) ? servicesData : []);
          setTeams(Array.isArray(teamsData) ? teamsData : []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
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
      await fetchServices();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to register microservice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const teamMap = new Map(teams.map((t) => [t.id, t.name]));
  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-indigo-400" />
            <span>Microservice Catalog</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Service inventory, squad ownership, and runtime dependency graph.
          </p>
        </div>

        <Button
          onClick={() => setShowRegisterModal(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Register Service</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search microservices by name or slug..."
            className="pl-9 font-sans"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading catalog...</div>
          ) : filteredServices.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No microservices registered yet. Click &quot;+ Register Service&quot; to catalog applications.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Owner Squad</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cataloged At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-semibold text-white">
                      {service.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {service.slug}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Users className="w-2.5 h-2.5" />
                        <span>{teamMap.get(service.owner_team_id) || "Squad Unassigned"}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 max-w-xs truncate">
                      {service.description || "—"}
                    </TableCell>
                    <TableCell className="text-slate-500 text-[11px] font-mono">
                      {new Date(service.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/projects/${projectId}/services/${service.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <span>Single-Pane Context</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
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
        title="Register New Microservice"
        description="Cataloging a service establishes its ownership boundary and unlocks environment bindings."
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="svc-name">Service Name</Label>
            <Input
              id="svc-name"
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="Payment Gateway"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-slug">Slug Identifier</Label>
            <Input
              id="svc-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="payment-service"
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-team">Owner Squad</Label>
            <Select
              id="svc-team"
              required
              value={ownerTeamId}
              onChange={(e) => setOwnerTeamId(e.target.value)}
            >
              <option value="">-- Choose Owning Team --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-desc">Description</Label>
            <textarea
              id="svc-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Handles credit cards, wire transfers, and fraud analysis"
              className="flex w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 font-sans"
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
              disabled={isSubmitting || !ownerTeamId}
              size="sm"
            >
              {isSubmitting ? "Registering..." : "Register Service"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
