export interface PersonalAccessToken {
  id: string;
  user_id: string;
  name: string;
  prefix: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
}

export interface CreateTokenCommand {
  name: string;
  scopes: string[];
  expires_in_days?: number;
}

export interface CreateTokenResponse {
  token: PersonalAccessToken;
  raw_token: string;
}
