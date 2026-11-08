"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const setup = await apiFetch<{ initialized: boolean }>("/setup/status");
        if (!mounted) return;
        if (!setup.initialized) {
          router.replace("/setup");
          return;
        }

        try {
          await apiFetch("/auth/me");
          if (mounted) {
            router.replace("/dashboard");
          }
        } catch {
          if (mounted) {
            router.replace("/login");
          }
        }
      } catch {
        if (mounted) {
          router.replace("/login");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {loading && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Loading iconfigly...</p>
        </div>
      )}
    </div>
  );
}
