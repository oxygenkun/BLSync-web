export type ConfigFieldType =
  | "integer"
  | "number"
  | "string"
  | "boolean"
  | "select"
  | "secret"
  | "favorite-list";

export interface ConfigFieldSchema {
  key: string;
  label: string;
  type: ConfigFieldType;
  description?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  required?: boolean;
  item_fields?: ConfigFieldSchema[];
  postprocess_actions?: PostprocessAction["action"][];
}

export interface ConfigSectionSchema {
  key: string;
  title: string;
  description: string;
  fields: ConfigFieldSchema[];
}

export interface PostprocessAction {
  action: "move" | "remove" | "save";
  fid?: string;
}

export interface FavoriteListValue {
  fid: string;
  path: string;
  name: string;
  name_group: string;
  postprocess: PostprocessAction[] | null;
}

export interface ConfigValues {
  interval: number;
  request_timeout: number;
  max_concurrent_tasks: number;
  task_timeout: number;
  download_retry_limit: number;
  download_stall_timeout: number;
  download_url_refresh_retries: number;
  retry_failed_tasks: boolean;
  log_level: string;
  credential: Record<string, string | null>;
  favorite_list: Record<string, FavoriteListValue>;
  [key: string]: unknown;
}

export interface ConfigDocument {
  revision: string;
  values: ConfigValues;
  secret_status: Record<string, boolean>;
  sections: ConfigSectionSchema[];
  overridden_fields: string[];
  system: {
    config_file: string;
    data_path: string;
  };
}

