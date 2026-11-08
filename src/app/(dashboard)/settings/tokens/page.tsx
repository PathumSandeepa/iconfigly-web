"use client";

import React, { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { PersonalAccessToken } from "@/lib/types";
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
import { KeyRound, Plus, Copy, Check, ShieldAlert, Trash2 } from "lucide-react";

interface CreatePATResponse {
  raw_token: string;
  token: PersonalAccessToken;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<PersonalAccessToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [createdRawToken, setCreatedRawToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTokens = async () => {
    try {
      const data = await apiFetch<PersonalAccessToken[]>("/auth/tokens");
      setTokens(Array.isArray(data) ? data : []);
    } catch {
      setTokens([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const data = await apiFetch<PersonalAccessToken[]>("/auth/tokens");
        if (mounted) setTokens(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setTokens([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await apiFetch<CreatePATResponse>("/auth/tokens", {
        method: "POST",
        body: JSON.stringify({
          name: tokenName,
          expires_in_days: Number(expiresInDays),
        }),
      });
      setCreatedRawToken(res.raw_token);
      setShowGenerateModal(false);
      setTokenName("");
      setExpiresInDays(30);
      await fetchTokens();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to generate personal access token");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (tokenId: string) => {
    if (!confirm("Are you sure you want to revoke this token? Any script using it will fail.")) {
      return;
    }
    try {
      await apiFetch(`/auth/tokens/${tokenId}`, { method: "DELETE" });
      await fetchTokens();
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || apiErr.title || "Failed to revoke token");
    }
  };

  const handleCopy = () => {
    if (!createdRawToken) return;
    navigator.clipboard.writeText(createdRawToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <KeyRound className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
            <span>Personal Access Tokens (PAT)</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Programmatic bearer tokens for CLI tooling and automated CI/CD runners.
          </p>
        </div>

        <Button
          onClick={() => setShowGenerateModal(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Generate Token</span>
        </Button>
      </div>

      {createdRawToken && (
        <Alert variant="warning" className="border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 rounded-2xl">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200 block text-xs">
                Copy your personal access token now.
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-300/80 block mt-0.5">
                For security reasons, this token will never be displayed again.
              </span>
              <code className="block mt-2 p-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-950 font-mono text-xs text-emerald-400 break-all select-all">
                {createdRawToken}
              </code>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreatedRawToken(null)}
                className="text-xs"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </Alert>
      )}

      <Card className="rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500">Loading tokens...</div>
          ) : tokens.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500">
              No personal access tokens generated. Click &quot;+ Generate Token&quot; to create a CLI token.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => {
                  const isRevoked = Boolean(token.revoked_at);
                  const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
                  return (
                    <TableRow key={token.id}>
                      <TableCell className="font-semibold text-zinc-900 dark:text-white">
                        {token.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {token.prefix}...
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isRevoked ? (
                          <Badge variant="destructive">Revoked</Badge>
                        ) : isExpired ? (
                          <Badge variant="warning">Expired</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-[11px] font-mono">
                        {token.expires_at ? new Date(token.expires_at).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-[11px] font-mono">
                        {new Date(token.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isRevoked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(token.id)}
                            className="text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-8"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            <span>Revoke</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        title="Generate Personal Access Token"
        description="Tokens inherit your user permissions across all authorized organization and project scopes."
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pat-name">Token Description</Label>
            <Input
              id="pat-name"
              type="text"
              required
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g. CI/CD Pipeline Runner, CLI Desktop"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pat-expiry">Token Expiration</Label>
            <Select
              id="pat-expiry"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
            >
              <option value={7}>7 Days</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
              <option value={365}>1 Year</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowGenerateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
            >
              {isSubmitting ? "Generating..." : "Generate Token"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
