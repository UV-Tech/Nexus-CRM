export type OrgRole = "owner" | "admin" | "agent";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  intake_token: string;
  created_by: string | null;
  created_at: string;
  suspended_at?: string | null;
  onboarded_at?: string | null;
  business_type?: string | null;
  webhook_secret?: string;
}

export interface AuditEntry {
  id: string;
  organization_id: string | null;
  actor_id: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface PipelineStage {
  id: string;
  organization_id: string;
  name: string;
  position: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  stage_id: string | null;
  assigned_to: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  value: number | null;
  notes: string | null;
  custom_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type CustomFieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "checkbox";

export interface CustomFieldDefinition {
  id: string;
  organization_id: string;
  key: string;
  label: string;
  field_type: CustomFieldType;
  options: string[];
  position: number;
  created_at: string;
}

export interface LeadActivity {
  id: string;
  organization_id: string;
  lead_id: string;
  author_id: string | null;
  type: string;
  body: string | null;
  created_at: string;
}
