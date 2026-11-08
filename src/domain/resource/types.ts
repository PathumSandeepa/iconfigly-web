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

export interface CreateResourceCommand {
  environment_id: string;
  name: string;
  slug?: string;
  resource_type: ResourceType;
  owner_team_id: string;
  connection_metadata?: Record<string, unknown>;
}
