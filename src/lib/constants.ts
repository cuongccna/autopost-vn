export const PROVIDERS = {
  fb: { 
    label: 'Facebook Page', 
    tag: 'FB', 
    chip: 'bg-blue-100 text-blue-700',
    apiKey: 'facebook'
  },
  ig: { 
    label: 'Instagram Biz', 
    tag: 'IG', 
    chip: 'bg-pink-100 text-pink-700',
    apiKey: 'instagram'
  },
  zalo: { 
    label: 'Zalo OA', 
    tag: 'ZL', 
    chip: 'bg-sky-100 text-sky-700',
    apiKey: 'zalo'
  },
} as const;

export type ProviderKey = keyof typeof PROVIDERS;

// Helper function to convert UI provider keys to API keys
export const mapProvidersToAPI = (providers: string[]): string[] => {
  return providers.map(provider => {
    const providerConfig = PROVIDERS[provider as ProviderKey];
    return providerConfig?.apiKey || provider;
  });
};

export const POST_STATUS = {
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published', 
  FAILED: 'failed',
} as const;

export type PostStatus = typeof POST_STATUS[keyof typeof POST_STATUS];
