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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!actor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors">
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
