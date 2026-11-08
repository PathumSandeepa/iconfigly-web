"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { AuditLog } from "@/lib/types";

interface VerifyResult {
  verified: boolean;
  total_checked: number;
  tampered_index?: number;
  message?: string;
}

export default function AuditPage() {
  const { actor } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const loadAuditLogs = async () => {
    if (!actor?.organization_id) return;
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set("organization_id", actor.organization_id);
      q.set("limit", "50");
      if (actionFilter) q.set("action", actionFilter);
      if (targetTypeFilter) q.set("target_type", targetTypeFilter);

      const data = await apiFetch<{ items: AuditLog[] }>(`/audit-logs?${q.toString()}`);
      setLogs(data.items || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [actor, actionFilter, targetTypeFilter]);

  const handleVerifyChain = async () => {
    if (!actor?.organization_id) return;
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const data = await apiFetch<VerifyResult>(
        `/audit-logs/verify?organization_id=${actor.organization_id}`
      );
      setVerifyResult(data);
    } catch {
      setVerifyResult({
        verified: false,
        total_checked: 0,
        message: "Failed to communicate with hash-chain verification engine",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Immutable Audit Trail</h1>
          <p className="text-sm text-slate-400 mt-1">
            Cryptographically sealed SHA-256 hash-chained telemetry for zero-trust compliance.
          </p>
        </div>

        <button
          onClick={handleVerifyChain}
          disabled={isVerifying}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-950/40"
        >
          {isVerifying ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying Hash Chain...</span>
            </>
          ) : (
            <span>Verify Hash Chain Integrity</span>
          )}
        </button>
      </div>

      {verifyResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            verifyResult.verified
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
              : "bg-rose-950/50 border-rose-800 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                verifyResult.verified ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
              }`}
            >
              {verifyResult.verified ? "✓" : "!"}
            </div>
            <div>
              <span className="font-bold text-sm block">
                {verifyResult.verified
                  ? "Cryptographic Hash Chain Validated"
                  : "Tamper Detection Alert!"}
              </span>
              <span className="text-[11px] opacity-90">
                {verifyResult.verified
                  ? `Successfully validated SHA-256 hash chain linkages across all ${verifyResult.total_checked} sequential audit blocks.`
                  : verifyResult.message ||
                    `Hash mismatch detected at index ${verifyResult.tampered_index}. Chain integrity compromised!`}
              </span>
            </div>
          </div>

          <button
            onClick={() => setVerifyResult(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          placeholder="Filter by action (e.g. org.initialized, binding.created)..."
          className="w-80 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
        />

        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Target Types</option>
          <option value="ORGANIZATION">ORGANIZATION</option>
          <option value="USER">USER</option>
          <option value="TEAM">TEAM</option>
          <option value="PROJECT">PROJECT</option>
          <option value="ENVIRONMENT">ENVIRONMENT</option>
          <option value="SERVICE">SERVICE</option>
          <option value="RESOURCE">RESOURCE</option>
          <option value="BINDING">BINDING</option>
          <option value="DEPENDENCY">DEPENDENCY</option>
          <option value="ROLE_BINDING">ROLE_BINDING</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No audit log entries found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-6 font-semibold">Action</th>
                  <th className="py-3.5 px-6 font-semibold">Target</th>
                  <th className="py-3.5 px-6 font-semibold">Actor ID</th>
                  <th className="py-3.5 px-6 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-6 font-semibold">Entry Hash (SHA-256)</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-medium text-slate-200">
                      {log.action}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-white">{log.target_type}</span>
                      <span className="block font-mono text-[11px] text-slate-400">
                        {log.target_slug || log.target_id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                      {log.actor_id.slice(0, 12)}...
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                        {log.entry_hash.slice(0, 16)}...
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-mono">{selectedLog.action}</h2>
                <span className="text-xs text-slate-400">
                  {new Date(selectedLog.created_at).toLocaleString()} &bull; IP: {selectedLog.ip_address}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Cryptographic Hash Linkages
                </span>
                <div>
                  <span className="text-slate-400 block font-semibold">Previous Block Hash:</span>
                  <span className="font-mono text-slate-300 text-[11px] break-all">
                    {selectedLog.prev_hash}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Entry SHA-256 Hash:</span>
                  <span className="font-mono text-emerald-400 text-[11px] break-all">
                    {selectedLog.entry_hash}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Metadata Payload
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <div>
                  <span className="font-semibold block text-slate-300">Target ID:</span>
                  <span className="font-mono">{selectedLog.target_id}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-300">Actor Principal:</span>
                  <span className="font-mono">{selectedLog.actor_id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
