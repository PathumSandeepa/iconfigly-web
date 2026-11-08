"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { TopologyGraph, Environment } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Cpu, Database, ArrowRight } from "lucide-react";

export default function TopologyGraphPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<string>("");
  const [graph, setGraph] = useState<TopologyGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const envs = await apiFetch<Environment[]>(`/projects/${projectId}/environments`);
        const list = Array.isArray(envs) ? envs : [];
        if (mounted) {
          setEnvironments(list);
          if (list.length > 0 && !selectedEnvId) {
            setSelectedEnvId(list[0].id);
          }
        }
      } catch {
        if (mounted) setEnvironments([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId, selectedEnvId]);

  useEffect(() => {
    if (!selectedEnvId) return;
    let mounted = true;
    void (async () => {
      try {
        const data = await apiFetch<TopologyGraph>(
          `/projects/${projectId}/graph?env_id=${selectedEnvId}`
        );
        if (mounted) setGraph(data);
      } catch {
        if (mounted) setGraph({ nodes: [], edges: [] });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId, selectedEnvId]);

  const serviceNodes = (graph?.nodes || []).filter((n) => n.type === "SERVICE");
  const resourceNodes = (graph?.nodes || []).filter((n) => n.type === "RESOURCE");
  const edges = graph?.edges || [];

  const resourceConnectionCount = new Map<string, number>();
  for (const e of edges) {
    if (e.relation_type === "BINDING" || e.type === "BINDING") {
      resourceConnectionCount.set(
        e.target_id,
        (resourceConnectionCount.get(e.target_id) || 0) + 1
      );
    }
  }

  const selectedNode = (graph?.nodes || []).find((n) => n.id === selectedNodeId);
  const connectedEdges = edges.filter(
    (e) => e.source_id === selectedNodeId || e.target_id === selectedNodeId
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Network className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
            <span>Topology Graph</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Visual Directed Acyclic Graph (DAG) mapping microservices, shared resources, and caller dependencies.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 self-start md:self-auto overflow-x-auto">
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => {
                setSelectedEnvId(env.id);
                setSelectedNodeId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedEnvId === env.id
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {env.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-zinc-500">
          Rendering topology nodes and edges...
        </div>
      ) : !graph?.nodes || graph.nodes.length === 0 ? (
        <Card className="p-12 text-center text-xs text-zinc-500 rounded-3xl">
          No services or infrastructure resources cataloged in this stage yet.
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-3">
                <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Cpu className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                  <span>Microservices ({serviceNodes.length})</span>
                </CardTitle>
                <span className="text-[11px] text-zinc-400">Click a node to inspect edges</span>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {serviceNodes.map((svc) => {
                    const isSelected = selectedNodeId === svc.id;
                    return (
                      <button
                        key={svc.id}
                        onClick={() => setSelectedNodeId(isSelected ? null : svc.id)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold text-xs ${isSelected ? "text-white dark:text-zinc-900" : "text-zinc-900 dark:text-white"}`}>
                            {svc.name}
                          </span>
                          <Badge variant={isSelected ? "secondary" : "default"} className="text-[9px]">
                            SVC
                          </Badge>
                        </div>
                        <span className={`font-mono text-[11px] mt-1 block ${isSelected ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-500"}`}>
                          {svc.slug}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-3">
                <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Database className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                  <span>Infrastructure Resources ({resourceNodes.length})</span>
                </CardTitle>
                <span className="text-[11px] text-zinc-400">Amber tags indicate shared dependencies</span>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resourceNodes.map((res) => {
                    const isSelected = selectedNodeId === res.id;
                    const callers = resourceConnectionCount.get(res.id) || 0;
                    const isShared = callers > 1;

                    return (
                      <button
                        key={res.id}
                        onClick={() => setSelectedNodeId(isSelected ? null : res.id)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold text-xs ${isSelected ? "text-white dark:text-zinc-900" : "text-zinc-900 dark:text-white"}`}>
                            {res.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isShared && (
                              <Badge variant="warning" className="text-[9px]">
                                Shared ({callers})
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[9px]">
                              {res.sub_type || "RES"}
                            </Badge>
                          </div>
                        </div>
                        <span className={`font-mono text-[11px] mt-1 block ${isSelected ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-500"}`}>
                          {res.slug}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="rounded-3xl overflow-hidden">
              <CardHeader className="p-6 pb-3">
                <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                  Edge Inspector
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block font-mono">
                        Selected Node
                      </span>
                      <div className="text-sm font-bold text-zinc-900 dark:text-white mt-1">{selectedNode.name}</div>
                      <span className="text-xs font-mono text-zinc-500 block">{selectedNode.slug}</span>
                      <span className="block text-[10px] uppercase font-semibold text-zinc-400 mt-1 font-mono">
                        Type: {selectedNode.type}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block mb-2">
                        Active Connections ({connectedEdges.length})
                      </span>
                      {connectedEdges.length === 0 ? (
                        <div className="text-xs text-zinc-500">No edges connected to this node.</div>
                      ) : (
                        <div className="space-y-2">
                          {connectedEdges.map((e) => {
                            const src = graph.nodes.find((n) => n.id === e.source_id);
                            const tgt = graph.nodes.find((n) => n.id === e.target_id);
                            return (
                              <div
                                key={e.id}
                                className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
                              >
                                <div className="flex items-center justify-between font-mono text-[11px]">
                                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{src?.slug || "unknown"}</span>
                                  <span className="text-zinc-400">&rarr;</span>
                                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{tgt?.slug || "unknown"}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-500">
                                  <span>{e.relation_type || e.type || e.label}</span>
                                  {e.protocol && (
                                    <Badge variant="outline" className="font-mono text-[9px]">
                                      {e.protocol}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {selectedNode.type === "SERVICE" && (
                      <Link
                        href={`/projects/${projectId}/services/${selectedNode.slug}`}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl bg-zinc-900 text-white hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold transition-colors mt-2"
                      >
                        <span>Open Single-Pane Context</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-500">
                    Select any service or resource on the left to inspect upstream and downstream edges.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
