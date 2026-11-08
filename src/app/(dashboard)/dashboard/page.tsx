"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { AuditLog, Team, ServiceEntity, ResourceEntity } from "@/lib/types";

export default function DashboardPage() {
  const { actor, projects, currentProject } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [services, setServices] = useState<ServiceEntity[]>([]);
  const [resources, setResources] = useState<ResourceEntity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!actor) return;
      try {
        const [teamsData, auditData] = await Promise.all([
          apiFetch<Team[]>("/teams").catch(() => []),
          apiFetch<{ items: AuditLog[] }>(
            `/audit-logs?organization_id=${actor.organization_id}&limit=10`
          ).catch(() => ({ items: [] })),
        ]);

        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setAuditLogs(auditData.items || []);

        if (currentProject?.id) {
          const [servicesData, resourcesData] = await Promise.all([
            apiFetch<ServiceEntity[]>(`/projects/${currentProject.id}/services`).catch(() => []),
            apiFetch<ResourceEntity[]>(`/projects/${currentProject.id}/resources`).catch(() => []),
          ]);
          setServices(Array.isArray(servicesData) ? servicesData : []);
          setResources(Array.isArray(resourcesData) ? resourcesData : []);
        } else {
          setServices([]);
          setResources([]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [actor, currentProject]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Overview</h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time metrics, infrastructure topology, and governance telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Projects
          </span>
          <div className="text-3xl font-extrabold text-white mt-2">{projects.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active application domains</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Teams
          </span>
          <div className="text-3xl font-extrabold text-white mt-2">{teams.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Cross-functional squads</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Cataloged Services
          </span>
          <div className="text-3xl font-extrabold text-white mt-2">{services.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {currentProject ? `In ${currentProject.name}` : "Across active project"}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Infrastructure Resources
          </span>
          <div className="text-3xl font-extrabold text-white mt-2">{resources.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Databases, caches, and queues
          </span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/teams"
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-colors block"
          >
            <div className="font-semibold text-sm">Create Team</div>
            <div className="text-xs text-slate-400 mt-1">Manage leads and member roles</div>
          </Link>

          {currentProject && (
            <>
              <Link
                href={`/projects/${currentProject.id}/services`}
                className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-colors block"
              >
                <div className="font-semibold text-sm">Register Service</div>
                <div className="text-xs text-slate-400 mt-1">Add microservice to project catalog</div>
              </Link>

              <Link
                href={`/projects/${currentProject.id}/resources`}
                className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-colors block"
              >
                <div className="font-semibold text-sm">Provision Resource</div>
                <div className="text-xs text-slate-400 mt-1">Register DB or cache dependency</div>
              </Link>

              <Link
                href={`/projects/${currentProject.id}/access`}
                className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-colors block"
              >
                <div className="font-semibold text-sm">Inspect RBAC</div>
                <div className="text-xs text-slate-400 mt-1">Who Has Access inspector</div>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Recent Immutable Audit Activity</h2>
            <p className="text-xs text-slate-400">Cryptographically hash-chained telemetry stream</p>
          </div>
          <Link
            href="/audit"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            View Full Explorer &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading audit events...</div>
        ) : auditLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No audit events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Target Type</th>
                  <th className="pb-3 font-semibold">Target Slug</th>
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Hash Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-mono font-medium text-slate-200">{log.action}</td>
                    <td className="py-3 text-slate-400">{log.target_type}</td>
                    <td className="py-3 text-slate-300 font-mono">{log.target_slug || "—"}</td>
                    <td className="py-3 text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                        {log.entry_hash.slice(0, 8)}...
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
