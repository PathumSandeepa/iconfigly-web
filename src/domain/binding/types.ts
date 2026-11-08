import { ResourceType } from "../resource/types";

export type BindingAccessMode = "READ_WRITE" | "READ";

export interface BoundResourceView {
  id?: string;
  binding_id: string;
  resource_id?: string;
  resource_slug?: string;
  resource_name?: string;
  slug?: string;
  name?: string;
  resource_type: ResourceType | string;
  access_mode: BindingAccessMode | string;
  connection_metadata?: Record<string, unknown>;
  notes?: string;
  bound_at?: string;
}

export interface CreateBindingCommand {
  environment_id: string;
  service_id: string;
  resource_id: string;
  access_mode: BindingAccessMode;
  notes?: string;
}
