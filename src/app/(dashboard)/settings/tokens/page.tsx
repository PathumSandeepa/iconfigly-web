"use client";

import React, { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { PersonalAccessToken } from "@/lib/types";

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

  const loadTokens = async () => {
    try {
      const data = await apiFetch<PersonalAccessToken[]>("/auth/tokens");
      setTokens(Array.isArray(data) ? data : []);
    } catch {
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
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
      await loadTokens();
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
      await loadTokens();
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
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Personal Access Tokens (PAT)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authenticate CI/CD pipelines, CLI utilities, and automation scripts.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setShowGenerateModal(true);
          }}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          + Generate Token
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading tokens...</div>
        ) : tokens.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No active personal access tokens. Generate one for CLI or CI/CD access.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-6 font-semibold">Token Name</th>
                  <th className="py-3.5 px-6 font-semibold">Key Prefix</th>
                  <th className="py-3.5 px-6 font-semibold">Created</th>
                  <th className="py-3.5 px-6 font-semibold">Expires</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tokens.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-white">{t.name}</td>
                    <td className="py-4 px-6 font-mono text-slate-400">
                      {t.prefix || "icfg_pat_..."}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {t.expires_at ? new Date(t.expires_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleRevoke(t.id)}
                        className="text-rose-400 hover:text-rose-300 font-semibold"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Generate Personal Access Token</h2>
            <p className="text-xs text-slate-400 mb-4">
              Tokens inherit your organization roles and cannot bypass permissions.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Token Name</label>
                <input
                  type="text"
                  required
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="GitHub Actions CI Runner"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Expiration (Days)
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={365}>1 Year</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Generating..." : "Generate Token"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createdRawToken && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <span>Security Warning: Copy Your Token</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Make sure to copy your personal access token now. You will not be able to see it again!
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 break-all select-all">
              {createdRawToken}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Prefix: {createdRawToken.slice(0, 12)}...
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  {copied ? "Copied!" : "Copy Token"}
                </button>
                <button
                  onClick={() => setCreatedRawToken(null)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
