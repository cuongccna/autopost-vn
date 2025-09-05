import { NextRequest } from 'next/server'

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createTestPost = (overrides = {}) => ({
  id: 'test-post-123',
  title: 'Test Post',
  content: 'This is a test post content',
  user_id: 'test-user-123',
  providers: ['facebook', 'instagram'],
  scheduled_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  status: 'scheduled',
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createTestAccount = (overrides = {}) => ({
  id: 'test-account-123',
  user_id: 'test-user-123',
  provider: 'facebook',
  provider_account_id: 'fb-123456',
  access_token: 'encrypted-access-token',
  refresh_token: 'encrypted-refresh-token',
  token_expires_at: new Date(Date.now() + 3600000).toISOString(),
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
})

// Mock request helpers
export const createMockRequest = (method: string, url: string, body?: any) => {
  const request = new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return request
}

export const createAuthenticatedRequest = (method: string, url: string, body?: any, userId = 'test-user-123') => {
  const request = createMockRequest(method, url, body)
  // Mock authenticated session
  ;(request as any).auth = {
    user: {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
    },
  }
  return request
}

// Response helpers
export const expectSuccessResponse = (response: Response, expectedStatus = 200) => {
  expect(response.status).toBe(expectedStatus)
  expect(response.headers.get('content-type')).toContain('application/json')
}

export const expectErrorResponse = (response: Response, expectedStatus = 400) => {
  expect(response.status).toBe(expectedStatus)
  expect(response.headers.get('content-type')).toContain('application/json')
}

// Database mock helpers
export const mockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
})

export const mockSupabaseSelect = (data: any[]) => ({
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      single: jest.fn(() => mockSupabaseResponse(data[0])),
      data,
      error: null,
    })),
    data,
    error: null,
  })),
})

export const mockSupabaseInsert = (data: any) => ({
  insert: jest.fn(() => mockSupabaseResponse(data)),
})

export const mockSupabaseUpdate = (data: any) => ({
  update: jest.fn(() => ({
    eq: jest.fn(() => mockSupabaseResponse(data)),
  })),
})

export const mockSupabaseDelete = () => ({
  delete: jest.fn(() => ({
    eq: jest.fn(() => mockSupabaseResponse(null)),
  })),
})

// Test environment helpers
export const setupTestEnvironment = () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-purposes'
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters'
}

export const cleanupTestEnvironment = () => {
  // Clean up any test data or mocks
  jest.clearAllMocks()
}
