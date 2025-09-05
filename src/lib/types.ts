export type ProviderKey = 'fb' | 'ig' | 'zalo';

export interface Post {
  id: string;
  title: string;
  content: string;
  datetime: string;
  providers: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  mediaUrls?: string[];
  error?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  published_at?: string;
}

export interface UploadedImage {
  id: string;
  file: File;
  publicUrl: string;
  path: string;
  uploading: boolean;
  error?: string;
}

export interface SocialAccount {
  id: string;
  provider: string;
  provider_account_id: string;
  user_id: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
  created_at: string;
}