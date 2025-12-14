export type PublishStatus =
  | "idle"
  | "validating"
  | "validation_failed"
  | "publishing"
  | "published"
  | "failed"
  | "rolling_back"
  | "rolled_back";

export type PublishJob = {
  id: string;
  customer_id: string;
  initiated_by: string;
  status: PublishStatus;
  started_at: string;
  completed_at?: string;
  error?: string;
  changes_summary?: ChangesSummary;
  version: number;
  previous_version?: number;
};

export type ChangesSummary = {
  tabs_added: number;
  tabs_removed: number;
  tabs_modified: number;
  widgets_added: number;
  widgets_removed: number;
  widgets_modified: number;
  screens_modified: string[];
  theme_changed: boolean;
  branding_changed: boolean;
};

export type PublishLogEntry = {
  id: string;
  job_id: string;
  event: string;
  timestamp: string;
  data?: Record<string, unknown>;
};

export type ConfigVersion = {
  id: string;
  customer_id: string;
  version: number;
  config_snapshot: Record<string, unknown>;
  created_by: string;
  created_at: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export type ValidationError = {
  code: string;
  path: string;
  message: string;
};

export type ValidationWarning = {
  code: string;
  path: string;
  message: string;
};
