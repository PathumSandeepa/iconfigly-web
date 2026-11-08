"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, ArrowUpRight } from "lucide-react";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      const data = await apiFetch<Team[]>("/teams");
      setTeams(Array.isArray(data) ? data : []);
    } catch {
      setTeams([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const data = await apiFetch<Team[]>("/teams");
        if (mounted) setTeams(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setTeams([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generated);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch<Team>("/teams", {
        method: "POST",
        body: JSON.stringify({ name, slug, description }),
      });
      setShowCreateModal(false);
      setName("");
      setSlug("");
      setDescription("");
      await fetchTeams();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to create team");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Teams</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Squad-level microservice and resource ownership boundaries.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Team</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading squads...</div>
          ) : teams.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No teams created yet. Click &quot;+ Create Team&quot; to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-semibold text-white">
                      {team.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{team.slug}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 max-w-xs truncate">
                      {team.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {team.member_count} {team.member_count === 1 ? "member" : "members"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-[11px] font-mono">
                      {new Date(team.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/teams/${team.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <span>Manage</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create New Team"
        description="Teams own microservices, databases, and message brokers within project boundaries."
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="Payments Squad"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="team-slug">Slug</Label>
            <Input
              id="team-slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="payments-squad"
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="team-desc">Description</Label>
            <textarea
              id="team-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Owns checkout, billing, and fraud detection microservices"
              className="flex w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
            >
              {isSubmitting ? "Creating..." : "Create Team"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
