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

export interface Organization {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  status: "ACTIVE" | "DISABLED";
  created_at: string;
}

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
  role: "LEAD" | "MEMBER";
  created_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Environment {
  id: string;
  project_id: string;
  slug: string;
  name: string;
  tier_order: number;
  is_production: boolean;
  required_approvals: number;
  created_at: string;
}

export interface ServiceEntity {
  id: string;
  project_id: string;
  owner_team_id: string;
  slug: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export type ResourceType =
  | "POSTGRES"
  | "MYSQL"
  | "REDIS"
  | "KAFKA"
  | "S3"
  | "EXTERNAL_API"
  | "CUSTOM";

export interface ResourceEntity {
  id: string;
  project_id: string;
  environment_id: string;
  owner_team_id?: string | null;
  slug: string;
  name: string;
  resource_type: ResourceType;
  connection_metadata: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface BoundResourceView {
  binding_id: string;
  resource_id: string;
  resource_slug: string;
  resource_name: string;
  resource_type: ResourceType;
  access_mode: "READ_WRITE" | "READ";
  connection_metadata: Record<string, unknown>;
  bound_at: string;
}

export interface ServiceDependencyView {
  dependency_id: string;
  direction: "UPSTREAM" | "DOWNSTREAM";
  service_id: string;
  service_slug: string;
  service_name: string;
  protocol: "HTTP" | "GRPC" | "KAFKA" | "EVENT";
  created_at: string;
}

export interface ServiceContextView {
  service: ServiceEntity;
  owner_team: {
    id: string;
    slug: string;
    name: string;
  };
  environment: {
    id: string;
    slug: string;
    name: string;
    tier_order: number;
    is_production: boolean;
  };
  bound_resources: BoundResourceView[];
  dependencies: ServiceDependencyView[];
  caller_effective_role: string;
  last_activity?: {
    action: string;
    actor_id: string;
    timestamp: string;
  } | null;
}

export interface RoleBinding {
  id: string;
  organization_id: string;
  subject_type: "USER" | "TEAM";
  subject_id: string;
  role_name: "ORG_ADMIN" | "ENV_ADMIN" | "SERVICE_LEAD" | "DEVELOPER" | "VIEWER";
  scope_type: "ORG" | "PROJECT" | "ENVIRONMENT" | "SERVICE" | "RESOURCE";
  scope_id: string;
  granted_by?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export interface EffectivePermission {
  subject_type: "USER" | "TEAM";
  subject_id: string;
  subject_name?: string;
  role_name: string;
  scope_type: string;
  scope_id: string;
  is_inherited: boolean;
  source_scope?: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  environment_id?: string | null;
  action: string;
  actor_type: string;
  actor_id: string;
  target_type: string;
  target_id: string;
  target_slug: string;
  prev_hash: string;
  entry_hash: string;
  metadata: Record<string, unknown>;
  created_at: string;
  ip_address: string;
}

export interface PersonalAccessToken {
  id: string;
  user_id: string;
  name: string;
  prefix: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
}

export interface TopologyNode {
  id: string;
  type: "SERVICE" | "RESOURCE";
  slug: string;
  name: string;
  sub_type?: string;
}

export interface TopologyEdge {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: "BINDING" | "DEPENDENCY";
  protocol?: string;
}

export interface TopologyGraph {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}
