export interface Organization {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

export interface SetupInitializeCommand {
  org_name: string;
  org_slug: string;
  admin_email: string;
  admin_full_name: string;
  admin_password: string;
}

export interface SetupInitializeResponse {
  organization: Organization;
  user: {
    id: string;
    organization_id: string;
    email: string;
    full_name: string;
    is_super_admin: boolean;
  };
  csrf_token: string;
}
