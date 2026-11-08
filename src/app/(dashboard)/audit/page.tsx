"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { AuditLog, VerifyApiResponse, VerifyResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
import { FileText, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";

export default function AuditPage() {
  const { actor } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!actor?.organization_id) return;
    let mounted = true;
    void (async () => {
      try {
        const q = new URLSearchParams();
        q.set("organization_id", actor.organization_id);
        q.set("limit", "50");
        if (actionFilter) q.set("action", actionFilter);
        if (targetTypeFilter) q.set("target_type", targetTypeFilter);

        const data = await apiFetch<{ items: AuditLog[] }>(`/audit-logs?${q.toString()}`);
        if (mounted) setLogs(data.items || []);
      } catch {
        if (mounted) setLogs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [actor?.organization_id, actionFilter, targetTypeFilter]);

  const handleVerifyChain = async () => {
    if (!actor?.organization_id) return;
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const data = await apiFetch<VerifyApiResponse>(
        `/audit-logs/verify?organization_id=${actor.organization_id}`
      );
      setVerifyResult({
        verified: (data.valid ?? data.verified) ?? false,
        total_checked: data.total_count ?? data.total_checked ?? 0,
        tampered_index: data.tampered_index,
        message: data.reason || data.message,
      });
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Cryptographically sealed SHA-256 hash-chained telemetry for zero-trust compliance.
          </p>
        </div>

        <Button
          onClick={handleVerifyChain}
          disabled={isVerifying}
          variant="default"
          className="gap-2"
        >
          {isVerifying ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
              <span>Verifying Hash Chain...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Hash Chain Integrity</span>
            </>
          )}
        </Button>
      </div>

      {verifyResult && (
        <Alert
          variant={verifyResult.verified ? "success" : "destructive"}
          className="flex items-center justify-between p-4 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                verifyResult.verified ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
              }`}
            >
              {verifyResult.verified ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
            <div>
              <AlertTitle className="text-sm font-bold">
                {verifyResult.verified
                  ? "Cryptographic Hash Chain Validated"
                  : "Tamper Detection Alert!"}
              </AlertTitle>
              <AlertDescription className="text-[11px]">
                {verifyResult.verified
                  ? `Successfully validated SHA-256 hash chain linkages across all ${verifyResult.total_checked} sequential audit blocks.`
                  : verifyResult.message ||
                    `Hash mismatch detected at index ${verifyResult.tampered_index}. Chain integrity compromised!`}
              </AlertDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setVerifyResult(null)}
            className="text-xs opacity-75 hover:opacity-100"
          >
            Dismiss
          </Button>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="text"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          placeholder="Filter by action (e.g. org.initialized, binding.created)..."
          className="w-80 font-mono"
        />

        <Select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          className="w-52"
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
        </Select>
      </div>

      <Card className="rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500">Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500">
              No audit logs matched query criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Actor ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Entry Hash (SHA-256)</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {log.action}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-zinc-900 dark:text-white">{log.target_type}</span>
                      <span className="block font-mono text-[11px] text-zinc-500">
                        {log.target_slug || (log.target_id ? log.target_id.slice(0, 8) : "—")}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-zinc-500">
                      {(log.actor_user_id || log.actor_id || log.actor_type || "SYSTEM").slice(0, 12)}...
                    </TableCell>
                    <TableCell className="text-zinc-500 text-[11px] font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {(log.entry_hash || "—").slice(0, 16)}...
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="text-zinc-900 dark:text-white hover:underline underline-offset-4 font-semibold h-8"
                      >
                        <span>Inspect &rarr;</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
        title={selectedLog?.action || "Audit Record Detail"}
        description={
          selectedLog
            ? `${new Date(selectedLog.created_at).toLocaleString()} • IP: ${selectedLog.ip_address}`
            : undefined
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block font-mono">
                Cryptographic Hash Linkages
              </span>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block font-semibold">Previous Block Hash:</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 text-[11px] break-all">
                  {selectedLog.prev_hash}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block font-semibold">Entry SHA-256 Hash:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px] break-all">
                  {selectedLog.entry_hash}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5 font-mono">
                Metadata Payload
              </span>
              <pre className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 overflow-x-auto max-h-56">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] text-zinc-500 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="font-semibold block text-zinc-700 dark:text-zinc-300">Target ID:</span>
                <span className="font-mono">{selectedLog.target_id}</span>
              </div>
              <div>
                <span className="font-semibold block text-zinc-700 dark:text-zinc-300">Actor Principal:</span>
                <span className="font-mono">
                  {selectedLog.actor_user_id || selectedLog.actor_id || selectedLog.actor_type || "SYSTEM"}
                </span>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
