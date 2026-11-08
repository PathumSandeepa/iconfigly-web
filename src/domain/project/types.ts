export interface Project {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  description: string;
  created_at: string;
}

export interface CreateProjectCommand {
  name: string;
  slug?: string;
  description?: string;
}
