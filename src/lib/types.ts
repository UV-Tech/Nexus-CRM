export type OrgRole = "owner" | "admin" | "agent";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  intake_token: string;
  created_by: string | null;
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

export interface LeadActivity {
  id: string;
  organization_id: string;
  lead_id: string;
  author_id: string | null;
  type: string;
  body: string | null;
  created_at: string;
}
