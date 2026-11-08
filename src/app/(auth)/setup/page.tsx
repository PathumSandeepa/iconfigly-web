"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Building2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          org_name: orgName,
          org_slug: orgSlug,
          organization_name: orgName,
          organization_slug: orgSlug,
          admin_full_name: fullName,
          full_name: fullName,
          admin_email: email,
          email,
          admin_password: password,
          password,
        }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to initialize organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8f9fa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors p-6">
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-xs">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">
              iconfigly
            </span>
            <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              Cluster Initialization
            </span>
          </div>
        </div>

        <ThemeToggle />
      </header>

      <main className="flex items-center justify-center py-10 w-full max-w-5xl mx-auto">
        <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 transition-colors">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Bootstrap Organization
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              Create the root tenant and provision the first super admin account.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 rounded-xl">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
                Organization Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="orgName" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Organization Name
                  </Label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <Input
                      id="orgName"
                      required
                      value={orgName}
                      onChange={handleNameChange}
                      placeholder="Acme Cloud Corp"
                      className="pl-10 h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="orgSlug" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Organization Slug
                  </Label>
                  <Input
                    id="orgSlug"
                    required
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    placeholder="acme-cloud"
                    className="h-10 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
                Super Admin Account
              </span>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <Input
                      id="fullName"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="pl-10 h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Work Email
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="pl-10 h-10 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="pl-10 pr-10 h-10 rounded-xl font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-zinc-900 text-white hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 font-medium text-xs transition-colors mt-2"
            >
              {isSubmitting ? "Initializing..." : "Initialize Organization"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Already initialized?{" "}
            </span>
            <Link
              href="/login"
              className="text-xs font-semibold text-zinc-900 dark:text-white hover:underline underline-offset-4"
            >
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-zinc-400 dark:text-zinc-600 font-mono py-2">
        iconfigly &bull; phase 1 developer control plane
      </footer>
    </div>
  );
}
