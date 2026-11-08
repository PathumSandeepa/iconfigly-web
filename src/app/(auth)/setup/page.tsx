"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

export default function SetupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOrgName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setOrgSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await apiFetch("/auth/setup", {
        method: "POST",
        body: JSON.stringify({
          organization_name: orgName,
          organization_slug: orgSlug,
          full_name: fullName,
          email,
          password,
        }),
      });
      router.push("/dashboard");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to initialize organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
            i
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">iconfigly</h1>
            <p className="text-xs text-slate-400">First-Run Platform Initialization</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Organization Name
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={handleNameChange}
              placeholder="Acme Cloud Corp"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Organization Slug
            </label>
            <input
              type="text"
              required
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="acme-cloud"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-800" />

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Initializing Platform..." : "Initialize Organization"}
          </button>
        </form>
      </div>
    </div>
  );
}
