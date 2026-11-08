"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function determineInitialRoute() {
      try {
        const setup = await apiFetch<{ initialized: boolean }>("/auth/setup-status");
        if (!setup.initialized) {
          router.replace("/setup");
          return;
        }

        try {
          await apiFetch("/auth/me");
          router.replace("/dashboard");
        } catch {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    determineInitialRoute();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      {loading && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading iconfigly...</p>
        </div>
      )}
    </div>
  );
}
