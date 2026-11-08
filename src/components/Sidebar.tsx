"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Layers,
  Cpu,
  Database,
  Network,
  ShieldCheck,
  FileText,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { currentProject } = useAuth();
  const projId = currentProject?.id;

  const globalLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Teams", href: "/teams", icon: Users },
    { label: "User Directory", href: "/users", icon: UserCheck },
  ];

  const projectLinks = projId
    ? [
        { label: "Environments", href: `/projects/${projId}/environments`, icon: Layers },
        { label: "Microservices", href: `/projects/${projId}/services`, icon: Cpu },
        { label: "Infrastructure", href: `/projects/${projId}/resources`, icon: Database },
        { label: "Topology Graph", href: `/projects/${projId}/graph`, icon: Network },
        { label: "Access Control", href: `/projects/${projId}/access`, icon: ShieldCheck },
      ]
    : [];

  const platformLinks = [
    { label: "Audit Logs", href: "/audit", icon: FileText },
    { label: "API Tokens", href: "/settings/tokens", icon: KeyRound },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-[#18181b] text-zinc-300 border-r border-zinc-800 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 font-mono">
            Organization
          </span>
          <nav className="space-y-1">
            {globalLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                    active
                      ? "bg-white/10 text-white font-semibold"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("w-4 h-4", active ? "text-white" : "text-zinc-500")} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 font-mono">
            Project Catalog
          </span>
          {projId ? (
            <nav className="space-y-1">
              {projectLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                      active
                        ? "bg-white/10 text-white font-semibold"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", active ? "text-white" : "text-zinc-500")} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          ) : (
            <div className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-500 leading-relaxed font-sans">
              Select or create a project to manage microservices and resources.
            </div>
          )}
        </div>

        <div>
          <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 font-mono">
            Governance & Security
          </span>
          <nav className="space-y-1">
            {platformLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                    active
                      ? "bg-white/10 text-white font-semibold"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("w-4 h-4", active ? "text-white" : "text-zinc-500")} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800 px-2 text-[10px] text-zinc-500 flex items-center justify-between font-mono">
        <span>iconfigly v1.0</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-[10px]">online</span>
        </span>
      </div>
    </aside>
  );
}
