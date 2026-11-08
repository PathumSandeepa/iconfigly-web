"use client";

import React, { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { User } from "@/lib/types";
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
import { UserCheck, UserPlus, Shield, Power } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await apiFetch<User[]>("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const data = await apiFetch<User[]>("/users");
        if (mounted) setUsers(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch<User>("/users", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
        }),
      });
      setShowCreateModal(false);
      setFullName("");
      setEmail("");
      setPassword("");
      await fetchUsers();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.title || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    if (
      !confirm(
        `Are you sure you want to set ${user.email} to ${nextStatus}? This will immediately revoke active sessions if disabled.`
      )
    ) {
      return;
    }

    try {
      await apiFetch(`/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchUsers();
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || apiErr.title || "Failed to toggle status");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-indigo-400" />
            <span>User Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage organization members, platform roles, and credential lifecycle.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add User</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading user directory...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No users found. Click &quot;+ Add User&quot; to provision developer accounts.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-semibold text-white">
                      {user.full_name}
                    </TableCell>
                    <TableCell className="font-mono text-slate-300 text-[11px]">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {user.is_super_admin ? (
                        <Badge variant="warning" className="gap-1">
                          <Shield className="w-2.5 h-2.5" />
                          <span>Super Admin</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Member</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.status === "ACTIVE" ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-[11px] font-mono">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {!user.is_super_admin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user)}
                          className={
                            user.status === "ACTIVE"
                              ? "text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 h-8"
                              : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 h-8"
                          }
                        >
                          <Power className="w-3.5 h-3.5 mr-1" />
                          <span>{user.status === "ACTIVE" ? "Deactivate" : "Activate"}</span>
                        </Button>
                      )}
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
        title="Provision New User"
        description="Newly provisioned users can sign in with their email and password."
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="user-fullname">Full Name</Label>
            <Input
              id="user-fullname"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Rivera"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-email">Email Address</Label>
            <Input
              id="user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-password">Initial Password</Label>
            <Input
              id="user-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={"\u2022".repeat(12)}
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
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
