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
  Activity,
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Activity className="w-6 h-6 text-indigo-400" />
          <span>System Overview</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time metrics, infrastructure topology, and governance telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Total Projects
            </span>
            <FolderKanban className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{projects.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active application domains</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Active Teams
            </span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{teams.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Cross-functional squads</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Cataloged Services
            </span>
            <Cpu className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{services.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {currentProject ? `In ${currentProject.name}` : "Across active project"}
          </span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Infrastructure Resources
            </span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{resources.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Databases, caches, and queues
          </span>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/teams"
              className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-200 transition-all block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-white">Create Team</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div className="text-xs text-slate-400 mt-1">Manage leads and member roles</div>
            </Link>

            {currentProject && (
              <>
                <Link
                  href={`/projects/${currentProject.id}/services`}
                  className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-200 transition-all block group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white">Register Service</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Add microservice to project catalog</div>
                </Link>

                <Link
                  href={`/projects/${currentProject.id}/resources`}
                  className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-200 transition-all block group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white">Provision Resource</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Register DB or cache dependency</div>
                </Link>

                <Link
                  href={`/projects/${currentProject.id}/access`}
                  className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-200 transition-all block group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white">Inspect RBAC</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Who Has Access inspector</div>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Recent Immutable Audit Activity</span>
            </CardTitle>
            <CardDescription>Cryptographically hash-chained telemetry stream</CardDescription>
          </div>
          <Link
            href="/audit"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
          >
            <span>View Full Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading audit events...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No telemetry recorded yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">SHA-256 Block Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono font-medium text-slate-200">
                      {log.action}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {log.target_type}
                      </Badge>
                      <span className="ml-2 font-mono text-[11px] text-slate-400">
                        {log.target_slug || (log.target_id ? log.target_id.slice(0, 8) : "—")}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-400">
                      {(log.actor_user_id || log.actor_id || log.actor_type || "SYSTEM").slice(0, 12)}...
                    </TableCell>
                    <TableCell className="text-slate-500 text-[11px] font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success" className="font-mono text-[10px]">
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
