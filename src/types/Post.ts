export type PostStatus = 'scheduled' | 'published' | 'failed' | 'draft';

export interface Post {
  id: string;
  title: string;
  datetime: string;
  providers: string[];
  status: PostStatus;
  content?: string;
  error?: string;
  mediaUrls?: string[];
}
