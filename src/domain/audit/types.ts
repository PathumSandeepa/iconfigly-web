export interface AuditLog {
  id: string;
  organization_id: string;
  environment_id?: string | null;
  action: string;
  actor_type: string;
  actor_id?: string;
  actor_user_id?: string | null;
  target_type: string;
  target_id: string;
  target_slug?: string;
  prev_hash: string;
  entry_hash: string;
  metadata: Record<string, unknown>;
  created_at: string;
  ip_address: string;
}

export interface VerifyApiResponse {
  valid?: boolean;
  verified?: boolean;
  total_count?: number;
  total_checked?: number;
  broken_at_id?: string;
  tampered_index?: number;
  reason?: string;
  message?: string;
}

export interface VerifyResult {
  verified: boolean;
  total_checked: number;
  tampered_index?: number;
  message?: string;
}

export interface AuditQueryFilter {
  organization_id: string;
  action?: string;
  target_type?: string;
  limit?: number;
  cursor?: string;
}
