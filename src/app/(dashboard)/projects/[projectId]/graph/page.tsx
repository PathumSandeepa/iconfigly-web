"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { TopologyGraph, Environment } from "@/lib/types";

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
    async function loadEnvs() {
      try {
        const envs = await apiFetch<Environment[]>(`/projects/${projectId}/environments`);
        const list = Array.isArray(envs) ? envs : [];
        setEnvironments(list);
        if (list.length > 0) {
          setSelectedEnvId(list[0].id);
        }
      } catch {
        setEnvironments([]);
      }
    }
    loadEnvs();
  }, [projectId]);

  useEffect(() => {
    async function loadGraph() {
      if (!selectedEnvId) return;
      setLoading(true);
      try {
        const data = await apiFetch<TopologyGraph>(
          `/projects/${projectId}/graph?env_id=${selectedEnvId}`
        );
        setGraph(data);
      } catch {
        setGraph({ nodes: [], edges: [] });
      } finally {
        setLoading(false);
      }
    }
    loadGraph();
  }, [projectId, selectedEnvId]);

  const serviceNodes = (graph?.nodes || []).filter((n) => n.type === "SERVICE");
  const resourceNodes = (graph?.nodes || []).filter((n) => n.type === "RESOURCE");
  const edges = graph?.edges || [];

  const resourceConnectionCount = new Map<string, number>();
  for (const e of edges) {
    if (e.relation_type === "BINDING") {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Topology Graph</h1>
          <p className="text-sm text-slate-400 mt-1">
            Visual Directed Acyclic Graph (DAG) mapping microservices, shared resources, and caller dependencies.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => {
                setSelectedEnvId(env.id);
                setSelectedNodeId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
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
      ) : !graph || graph.nodes.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
          No services or infrastructure resources cataloged in this stage yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Microservices ({serviceNodes.length})
                </span>
                <span className="text-[11px] text-slate-500">Click a node to inspect edges</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serviceNodes.map((svc) => {
                  const isSelected = selectedNodeId === svc.id;
                  return (
                    <button
                      key={svc.id}
                      onClick={() => setSelectedNodeId(isSelected ? null : svc.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30"
                          : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">{svc.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          SVC
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 mt-1 block">
                        {svc.slug}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Infrastructure Resources ({resourceNodes.length})
                </span>
                <span className="text-[11px] text-slate-500">Amber tags indicate shared dependencies</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resourceNodes.map((res) => {
                  const isSelected = selectedNodeId === res.id;
                  const callers = resourceConnectionCount.get(res.id) || 0;
                  const isShared = callers > 1;

                  return (
                    <button
                      key={res.id}
                      onClick={() => setSelectedNodeId(isSelected ? null : res.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-emerald-600/20 border-emerald-500 ring-2 ring-emerald-500/30"
                          : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">{res.name}</span>
                        <div className="flex items-center gap-1.5">
                          {isShared && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Shared ({callers})
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {res.sub_type || "RES"}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 mt-1 block">
                        {res.slug}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Edge Inspector
              </h2>

              {selectedNode ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Selected Node
                    </span>
                    <div className="text-sm font-bold text-white mt-0.5">{selectedNode.name}</div>
                    <span className="text-xs font-mono text-indigo-400">{selectedNode.slug}</span>
                    <span className="block text-[10px] uppercase font-semibold text-slate-400 mt-1">
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
                              className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/60 text-xs"
                            >
                              <div className="flex items-center justify-between font-mono text-[11px]">
                                <span className="text-slate-300">{src?.slug || "unknown"}</span>
                                <span className="text-slate-500">&rarr;</span>
                                <span className="text-slate-300">{tgt?.slug || "unknown"}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                                <span>{e.relation_type}</span>
                                {e.protocol && (
                                  <span className="font-mono text-indigo-300">{e.protocol}</span>
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
                      className="block text-center py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors mt-4"
                    >
                      Open Single-Pane Context &rarr;
                    </Link>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  Select any service or resource on the left to inspect upstream and downstream edges.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
