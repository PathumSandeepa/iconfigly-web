"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { TeamMember, User } from "@/lib/types";

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

  const loadTeamData = async () => {
    try {
      const data = await apiFetch<TeamDetailsResponse>(`/teams/${teamId}`);
      setDetails(data);
    } catch {
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiFetch<User[]>("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    loadTeamData();
    loadUsers();
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
      await loadTeamData();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to add member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the team?")) return;
    try {
      await apiFetch(`/teams/${teamId}/members/${userId}`, { method: "DELETE" });
      await loadTeamData();
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || apiErr.title || "Failed to remove member");
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading team details...
      </div>
    );
  }

  if (!details) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-slate-400">Team not found.</p>
        <Link href="/teams" className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
          &larr; Back to Teams
        </Link>
      </div>
    );
  }

  const existingMemberUserIds = new Set(details.members.map((m) => m.user_id));
  const availableUsers = users.filter((u) => !existingMemberUserIds.has(u.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/teams" className="hover:text-slate-200">
          Teams
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-medium">{details.team.name}</span>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">{details.team.name}</h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {details.team.slug}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            {details.team.description || "No description provided."}
          </p>
        </div>

        <button
          onClick={() => setShowAddMemberModal(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          + Add Member
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white">Team Roster</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Leads can manage team members and grant permissions on services owned by this team.
          </p>
        </div>

        {details.members.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No members in this team yet. Click "+ Add Member" to assign users.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3 px-6 font-semibold">User</th>
                  <th className="py-3 px-6 font-semibold">Email</th>
                  <th className="py-3 px-6 font-semibold">Role</th>
                  <th className="py-3 px-6 font-semibold">Added At</th>
                  <th className="py-3 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {details.members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-white">{m.user_full_name}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-400">{m.user_email}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          m.role === "LEAD"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="text-rose-400 hover:text-rose-300 font-semibold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Add Team Member</h2>
            <p className="text-xs text-slate-400 mb-4">
              Select an organization user to join {details.team.name}.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">User</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Team Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("MEMBER")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      selectedRole === "MEMBER"
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("LEAD")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      selectedRole === "LEAD"
                        ? "bg-amber-600/30 border-amber-500 text-amber-200"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Team Lead
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedUserId}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
