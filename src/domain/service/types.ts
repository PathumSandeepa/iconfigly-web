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

export type DependencyProtocol = "HTTP" | "GRPC" | "KAFKA" | "EVENT";

export interface ServiceDependencyView {
  dependency_id: string;
  direction?: "UPSTREAM" | "DOWNSTREAM";
  service_id: string;
  service_slug: string;
  service_name: string;
  protocol: DependencyProtocol | string;
  created_at?: string;
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
  bound_resources: {
    id?: string;
    binding_id: string;
    resource_id?: string;
    resource_slug?: string;
    resource_name?: string;
    slug?: string;
    name?: string;
    resource_type: string;
    access_mode: "READ_WRITE" | "READ" | string;
    connection_metadata?: Record<string, unknown>;
    notes?: string;
    bound_at?: string;
  }[];
  upstream_dependencies?: ServiceDependencyView[];
  downstream_dependencies?: ServiceDependencyView[];
  dependencies?: ServiceDependencyView[];
  caller_effective_role: string;
  latest_audit_entry?: {
    action: string;
    actor_user_id?: string;
    timestamp: string;
  } | null;
  last_activity?: {
    action: string;
    actor_id: string;
    timestamp: string;
  } | null;
}

export interface CreateServiceCommand {
  name: string;
  slug?: string;
  owner_team_id: string;
  description?: string;
}

export interface CreateDependencyCommand {
  environment_id: string;
  caller_service_id: string;
  callee_service_id: string;
  protocol: DependencyProtocol;
}
