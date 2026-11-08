export type UserStatus = "ACTIVE" | "DISABLED";

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  status: UserStatus;
  created_at: string;
}

export interface Actor {
  user_id: string;
  organization_id: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  team_ids: string[];
  lead_team_ids: string[];
  auth_method: string;
  csrf_token: string;
}

export interface CreateUserCommand {
  email: string;
  full_name: string;
  password?: string;
  is_super_admin?: boolean;
}
