"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { TeamMember, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, UserPlus, Users, Shield, Trash2 } from "lucide-react";

interface TeamDetailsResponse {
  team: {
    id: string;
    organization_id: string;
    slug: string;
    name: string;
    description: string;
    created_at: string;
  };
  members: TeamMember[];
}

export default function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const [details, setDetails] = useState<TeamDetailsResponse | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"LEAD" | "MEMBER">("MEMBER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamData = async () => {
    try {
      const data = await apiFetch<TeamDetailsResponse>(`/teams/${teamId}`);
      setDetails(data);
    } catch {
      setDetails(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [teamData, usersData] = await Promise.all([
          apiFetch<TeamDetailsResponse>(`/teams/${teamId}`).catch(() => null),
          apiFetch<User[]>("/users").catch(() => []),
        ]);
        if (mounted) {
          setDetails(teamData);
          setUsers(Array.isArray(usersData) ? usersData : []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [teamId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch(`/teams/${teamId}/members`, {
        method: "POST",
        body: JSON.stringify({
          user_id: selectedUserId,
          role: selectedRole,
        }),
      });
      setShowAddMemberModal(false);
      setSelectedUserId("");
      setSelectedRole("MEMBER");
      await fetchTeamData();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to add member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the squad roster?")) return;
    try {
      await apiFetch(`/teams/${teamId}/members/${userId}`, { method: "DELETE" });
      await fetchTeamData();
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || apiErr.title || "Failed to remove member");
    }
  };

  const currentMemberIds = new Set(details?.members.map((m) => m.user_id) || []);
  const availableUsers = users.filter((u) => !currentMemberIds.has(u.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          href="/teams"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Teams</span>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>{details?.team?.name || "Payments Team"}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Team Roster &bull; {details?.team?.description || "Squad ownership"}
          </p>
        </div>

        <Button
          onClick={() => setShowAddMemberModal(true)}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Member</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading roster...</div>
          ) : !details || details.members.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No members assigned to this squad yet. Click &quot;+ Add Member&quot; to assign engineers.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Squad Role</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-semibold text-white">
                      {member.user_full_name}
                    </TableCell>
                    <TableCell className="text-slate-300 font-mono text-[11px]">
                      {member.user_email}
                    </TableCell>
                    <TableCell>
                      {member.role === "LEAD" ? (
                        <Badge variant="warning" className="gap-1">
                          <Shield className="w-2.5 h-2.5" />
                          <span>LEAD</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary">MEMBER</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-[11px] font-mono">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 h-8 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        <span>Remove</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showAddMemberModal}
        onOpenChange={setShowAddMemberModal}
        title="Assign Squad Member"
        description="Squad leads possess administrative and catalog write privileges over squad-owned services."
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="member-user">Select Engineer</Label>
            <Select
              id="member-user"
              required
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">-- Choose User --</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="member-role">Roster Role</Label>
            <Select
              id="member-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as "LEAD" | "MEMBER")}
            >
              <option value="MEMBER">MEMBER (Standard developer access)</option>
              <option value="LEAD">LEAD (Squad administrator)</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddMemberModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedUserId}
              size="sm"
            >
              {isSubmitting ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
