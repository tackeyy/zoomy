// Zoom OAuth Token Response
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// Zoom Meeting (create request body)
export interface CreateMeetingRequest {
  topic: string;
  type: 2; // Scheduled meeting
  start_time: string; // ISO 8601
  duration: number; // minutes
  timezone: string;
}

// Zoom Meeting (response from API)
export interface Meeting {
  id: number;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  join_url: string;
  start_url: string;
  created_at: string;
}

// Zoom List Meetings Response
export interface ListMeetingsResponse {
  page_count: number;
  page_number: number;
  page_size: number;
  total_records: number;
  meetings: Meeting[];
}

// Zoom Meeting (update request body)
export interface UpdateMeetingRequest {
  topic?: string;
  start_time?: string;
  duration?: number;
  timezone?: string;
}

// App config from .env
export interface AppConfig {
  accountId: string;
  clientId: string;
  clientSecret: string;
  timezone: string;
  dateFormat: string;
  topicTemplate: string;
  topicTemplateNoWith: string;
}
