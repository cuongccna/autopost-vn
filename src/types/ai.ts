export interface ExistingPostSummary {
  id?: string;
  platform: string;
  content: string;
  postedAt: string;
  performance?: {
    reach?: number;
    engagement?: number;
    clicks?: number;
    conversions?: number;
  };
}

export interface AIContentPlanSlot {
  platform: string;
  time: string;
  angle: string;
  captionIdea: string;
  assets?: string[];
  recommendedHashtags?: string[];
  duplicateOf?: string[];
}

export interface AIContentPlanDay {
  date: string;
  theme: string;
  focus?: string;
  slots: AIContentPlanSlot[];
}

export interface AIContentPlanMetadata {
  timezone: string;
  cadence: string;
  campaignName?: string;
  notes?: string;
}

export interface AIContentPlanResponse {
  plan: AIContentPlanDay[];
  summary: string;
  recommendations: string[];
  duplicateWarnings?: string[];
  metadata?: AIContentPlanMetadata;
}

export interface AIContentPlannerRequest {
  campaignName?: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  cadencePerWeek: number;
  preferredPlatforms: string[];
  preferredTimes?: string[];
  goals?: string[];
  brandVoice?: string;
  targetAudience?: string;
  keyMessages?: string[];
  avoidThemes?: string[];
  existingPosts?: ExistingPostSummary[];
  manualContext?: string;
  aiContext?: Record<string, unknown>;
  instructions?: string;
}
