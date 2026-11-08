"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 shadow-2xl">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950/60">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">iconfigly</CardTitle>
              <CardDescription>First-Run Platform Initialization</CardDescription>
            </div>
          </div>
          <h1 className="text-base font-bold text-white tracking-tight">First-Run Platform Setup</h1>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                type="text"
                required
                value={orgName}
                onChange={handleNameChange}
                placeholder="Acme Cloud Corp"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-slug">Organization Slug</Label>
              <Input
                id="org-slug"
                type="text"
                required
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                placeholder="acme-cloud"
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="full-name">Superadmin Full Name</Label>
              <Input
                id="full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Superadmin Email</Label>
              <Input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Master Password</Label>
              <Input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={"\u2022".repeat(12)}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 h-11"
              size="lg"
            >
              {isSubmitting ? "Initializing Control Plane..." : "Initialize Organization"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
