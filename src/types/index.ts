export interface UrlData {
  id: number;
  original_url: string;
  short_code: string;
  created_at: string;
  click_count: number;
  expires_at?: string;
  domain_id?: number;
}

// Rename Domain to CustomDomain or DomainData
export interface CustomDomain {
  id: number;
  domain: string;
  user_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShortenRequest {
  url: string;
  domain?: string;
  customCode?: string;
}

export interface ShortenResponse {
  success: boolean;
  data: {
    originalUrl: string;
    shortCode: string;
    shortUrl: string;
    domain: string;
  };
}
