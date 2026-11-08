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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Network className="w-6 h-6 text-indigo-400" />
            <span>Topology Graph</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual Directed Acyclic Graph (DAG) mapping microservices, shared resources, and caller dependencies.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 self-start md:self-auto overflow-x-auto">
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => {
                setSelectedEnvId(env.id);
                setSelectedNodeId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedEnvId === env.id
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
          Rendering topology nodes and edges...
        </div>
      ) : !graph?.nodes || graph.nodes.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No services or infrastructure resources cataloged in this stage yet.
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Microservices ({serviceNodes.length})</span>
                </CardTitle>
                <span className="text-[11px] text-slate-500">Click a node to inspect edges</span>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {serviceNodes.map((svc) => {
                    const isSelected = selectedNodeId === svc.id;
                    return (
                      <button
                        key={svc.id}
                        onClick={() => setSelectedNodeId(isSelected ? null : svc.id)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30"
                            : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white text-xs">{svc.name}</span>
                          <Badge variant="default" className="text-[9px]">
                            SVC
                          </Badge>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 mt-1 block">
                          {svc.slug}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Infrastructure Resources ({resourceNodes.length})</span>
                </CardTitle>
                <span className="text-[11px] text-slate-500">Amber tags indicate shared dependencies</span>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resourceNodes.map((res) => {
                    const isSelected = selectedNodeId === res.id;
                    const callers = resourceConnectionCount.get(res.id) || 0;
                    const isShared = callers > 1;

                    return (
                      <button
                        key={res.id}
                        onClick={() => setSelectedNodeId(isSelected ? null : res.id)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600/20 border-emerald-500 ring-2 ring-emerald-500/30"
                            : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white text-xs">{res.name}</span>
                          <div className="flex items-center gap-1.5">
                            {isShared && (
                              <Badge variant="warning" className="text-[9px]">
                                Shared ({callers})
                              </Badge>
                            )}
                            <Badge variant="success" className="text-[9px]">
                              {res.sub_type || "RES"}
                            </Badge>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 mt-1 block">
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">
                  Edge Inspector
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
                        Selected Node
                      </span>
                      <div className="text-sm font-bold text-white mt-1">{selectedNode.name}</div>
                      <span className="text-xs font-mono text-indigo-400 block">{selectedNode.slug}</span>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500 mt-1 font-mono">
                        Type: {selectedNode.type}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-300 block mb-2">
                        Active Connections ({connectedEdges.length})
                      </span>
                      {connectedEdges.length === 0 ? (
                        <div className="text-xs text-slate-500">No edges connected to this node.</div>
                      ) : (
                        <div className="space-y-2">
                          {connectedEdges.map((e) => {
                            const src = graph.nodes.find((n) => n.id === e.source_id);
                            const tgt = graph.nodes.find((n) => n.id === e.target_id);
                            return (
                              <div
                                key={e.id}
                                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                              >
                                <div className="flex items-center justify-between font-mono text-[11px]">
                                  <span className="text-slate-300 font-semibold">{src?.slug || "unknown"}</span>
                                  <span className="text-slate-500">&rarr;</span>
                                  <span className="text-slate-300 font-semibold">{tgt?.slug || "unknown"}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
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
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors mt-2"
                      >
                        <span>Open Single-Pane Context</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">
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
