"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const { currentProject } = useAuth();
  const projId = currentProject?.id;

  const globalLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Teams", href: "/teams" },
    { label: "User Directory", href: "/users" },
  ];

  const projectLinks = projId
    ? [
        { label: "Environments", href: `/projects/${projId}/environments` },
        { label: "Microservices", href: `/projects/${projId}/services` },
        { label: "Infrastructure", href: `/projects/${projId}/resources` },
        { label: "Topology Graph", href: `/projects/${projId}/graph` },
        { label: "Access Control", href: `/projects/${projId}/access` },
      ]
    : [];

  const platformLinks = [
    { label: "Audit Logs", href: "/audit" },
    { label: "API Tokens", href: "/settings/tokens" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Organization
          </span>
          <nav className="space-y-1">
            {globalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Project Catalog
          </span>
          {projId ? (
            <nav className="space-y-1">
              {projectLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : (
            <div className="px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-slate-500">
              Select or create a project to manage microservices and resources.
            </div>
          )}
        </div>

        <div>
          <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Governance & Security
          </span>
          <nav className="space-y-1">
            {platformLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/80 px-2 text-[10px] text-slate-500 flex items-center justify-between">
        <span>iconfigly v1.0-alpha</span>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
      </div>
    </aside>
  );
}
