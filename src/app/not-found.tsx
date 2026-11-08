import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl font-black text-zinc-900 dark:text-white font-mono tracking-tighter">404</div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Resource Not Found</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          The requested control plane endpoint or resource view does not exist or has been relocated.
        </p>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button variant="default" size="sm" className="gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
