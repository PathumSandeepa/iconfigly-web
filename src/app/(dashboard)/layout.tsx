"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { actor, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !actor) {
      router.push("/login");
    }
  }, [isLoading, actor, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!actor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
