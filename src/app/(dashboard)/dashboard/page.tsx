"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { AuditLog, Team, ServiceEntity, ResourceEntity } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  FolderKanban,
  Users,
  Cpu,
  Database,
  ArrowRight,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPage() {
  const { actor, projects, currentProject } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [services, setServices] = useState<ServiceEntity[]>([]);
  const [resources, setResources] = useState<ResourceEntity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (!actor) return;
      try {
        const [teamsData, auditData] = await Promise.all([
          apiFetch<Team[]>("/teams").catch(() => []),
          apiFetch<{ items: AuditLog[] }>(
            `/audit-logs?organization_id=${actor.organization_id}&limit=10`
          ).catch(() => ({ items: [] })),
        ]);

        if (mounted) {
          setTeams(Array.isArray(teamsData) ? teamsData : []);
          setAuditLogs(auditData.items || []);
        }

        if (currentProject?.id) {
          const [servicesData, resourcesData] = await Promise.all([
            apiFetch<ServiceEntity[]>(`/projects/${currentProject.id}/services`).catch(() => []),
            apiFetch<ResourceEntity[]>(`/projects/${currentProject.id}/resources`).catch(() => []),
          ]);
          if (mounted) {
            setServices(Array.isArray(servicesData) ? servicesData : []);
            setResources(Array.isArray(resourcesData) ? resourcesData : []);
          }
        } else if (mounted) {
          setServices([]);
          setResources([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [actor, currentProject]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            System Overview
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Real-time topology, cross-environment resource bindings, and cryptographic telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 font-mono text-[11px] gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Cluster Healthy</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                Control Plane Node
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="my-6">
            <span className="text-xs text-zinc-400 block font-mono">Active Tenant</span>
            <div className="text-2xl font-bold tracking-tight text-white mt-1">
              {currentProject ? currentProject.name : "Acme Fintech"}
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-2 flex items-center gap-2">
              <span>Env: DEV &bull; QA &bull; UAT &bull; PROD</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800 text-xs">
            <span className="text-zinc-400 font-mono">SHA-256 Ledger</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Chained & Verified
            </span>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-6 rounded-3xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                Total Projects
              </span>
              <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-3">
              {projects.length}
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block">
              Active application partitions
            </span>
          </Card>

          <Card className="p-6 rounded-3xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                Active Teams
              </span>
              <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-3">
              {teams.length}
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block">
              Cross-functional engineering squads
            </span>
          </Card>

          <Card className="p-6 rounded-3xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                Cataloged Services
              </span>
              <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-3">
              {services.length}
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block">
              {currentProject ? `Registered in ${currentProject.name}` : "Across active project"}
            </span>
          </Card>

          <Card className="p-6 rounded-3xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                Infrastructure Resources
              </span>
              <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-3">
              {resources.length}
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block">
              Databases, caches, and event streams
            </span>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/teams"
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                  Create Team
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Manage engineering leads
                </span>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {currentProject && (
            <>
              <Link
                href={`/projects/${currentProject.id}/services`}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                      Register Service
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Add to microservice catalog
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                href={`/projects/${currentProject.id}/resources`}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                      Provision Resource
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Postgres, Redis, Kafka
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                href={`/projects/${currentProject.id}/access`}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                      Inspect RBAC
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Who Has Access checker
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </>
          )}
        </div>
      </div>

      <Card className="rounded-3xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
          <div>
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <span>Immutable Audit Activity</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Cryptographically hash-chained telemetry stream
            </CardDescription>
          </div>
          <Link
            href="/audit"
            className="text-xs font-semibold text-zinc-900 dark:text-white hover:underline underline-offset-4 inline-flex items-center gap-1"
          >
            <span>View Full Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500">Loading audit events...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500">No telemetry recorded yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">SHA-256 Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {log.action}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {log.target_type}
                      </Badge>
                      <span className="ml-2 font-mono text-[11px] text-zinc-500">
                        {log.target_slug || (log.target_id ? log.target_id.slice(0, 8) : "—")}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-zinc-500">
                      {(log.actor_user_id || log.actor_id || log.actor_type || "SYSTEM").slice(0, 12)}...
                    </TableCell>
                    <TableCell className="text-zinc-500 text-[11px] font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {(log.entry_hash || "—").slice(0, 16)}...
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
