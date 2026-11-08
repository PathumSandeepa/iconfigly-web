export type TeamRole = "LEAD" | "MEMBER";

export interface Team {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  description: string;
  member_count: number;
  service_count?: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  role: TeamRole;
  created_at: string;
}

export interface CreateTeamCommand {
  name: string;
  slug?: string;
  description?: string;
}

export interface AddTeamMemberCommand {
  user_id: string;
  role: TeamRole;
}
