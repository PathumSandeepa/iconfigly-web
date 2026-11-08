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
  ShieldCheck,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (typeof document !== "undefined") {
      document.cookie = "iconfigly_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;";
      document.cookie = "iconfigly_csrf=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;";
    }

    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
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
              Control Plane
            </span>
          </div>
        </div>

        <ThemeToggle />
      </header>

      <main className="flex items-center justify-center py-10 w-full max-w-5xl mx-auto">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 transition-colors">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Sign In
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              Enter your credentials to manage microservices, infrastructure bindings, and scoped RBAC.
            </p>
          </div>

          <div className="mb-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
                Quick Fill Credentials
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("alice@acme.local", "AdminPassword123!")}
                className="flex flex-col text-left p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
              >
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Alice (Admin)
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                  alice@acme.local
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("bob@acme.local", "BobPassword123!")}
                className="flex flex-col text-left p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
              >
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Bob (Developer)
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                  bob@acme.local
                </span>
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 rounded-xl">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="pl-10 h-11 rounded-xl"
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
                  className="pl-10 pr-10 h-11 rounded-xl font-mono"
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-zinc-900 text-white hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 font-medium text-xs transition-colors mt-2"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              First time configuring the cluster?{" "}
            </span>
            <Link
              href="/setup"
              className="text-xs font-semibold text-zinc-900 dark:text-white hover:underline underline-offset-4"
            >
              Run Setup &rarr;
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
