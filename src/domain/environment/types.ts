export type EnvironmentTier = "DEV" | "QA" | "UAT" | "PROD";

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
