export type SubjectType = "USER" | "TEAM";
export type RoleName = "ORG_ADMIN" | "ENV_ADMIN" | "SERVICE_LEAD" | "DEVELOPER" | "VIEWER";
export type ScopeType = "ORG" | "PROJECT" | "ENVIRONMENT" | "SERVICE" | "RESOURCE";

export interface RoleBinding {
  id: string;
  organization_id: string;
  subject_type: SubjectType;
  subject_id: string;
  role_name: RoleName;
  scope_type: ScopeType;
  scope_id: string;
  granted_by?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export interface EffectivePermission {
  subject_type: SubjectType;
  subject_id: string;
  subject_name?: string;
  role_name: string;
  scope_type: string;
  scope_id: string;
  is_inherited: boolean;
  source_scope?: string;
}

export interface CreateRoleBindingCommand {
  subject_type: SubjectType;
  subject_id: string;
  role_name: RoleName;
  scope_type: ScopeType;
  scope_id: string;
  expires_at?: string | null;
}
