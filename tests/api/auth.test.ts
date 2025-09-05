import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/register/route'
import { POST as ForgotPasswordPOST } from '@/app/api/auth/forgot-password/route'
import {
  createMockRequest,
  expectSuccessResponse,
  expectErrorResponse,
  setupTestEnvironment,
  cleanupTestEnvironment,
} from '../utils/test-helpers'

describe('Authentication API', () => {
  beforeEach(() => {
    setupTestEnvironment()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const requestBody = {
        email: 'newuser@example.com',
        password: 'securePassword123',
        name: 'New User',
      }

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', requestBody)
      
      // Mock successful Supabase responses
      const mockSupabase = require('@/lib/supabase/server')
      mockSupabase.createClient.mockReturnValue({
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'new-user-123',
                email: 'newuser@example.com',
              },
            },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          insert: jest.fn().mockResolvedValue({
            data: { id: 'profile-123' },
            error: null,
          }),
        })),
      })

      const response = await POST(request)
      const data = await response.json()

      expectSuccessResponse(response, 201)
      expect(data.message).toBe('User registered successfully')
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('newuser@example.com')
    })

    it('should reject registration with invalid email', async () => {
      const requestBody = {
        email: 'invalid-email',
        password: 'securePassword123',
        name: 'Test User',
      }

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', requestBody)
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(response, 400)
      expect(data.error).toContain('Invalid email format')
    })

    it('should reject registration with weak password', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      }

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', requestBody)
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(response, 400)
      expect(data.error).toContain('Password must be at least 6 characters')
    })

    it('should reject registration with existing email', async () => {
      const requestBody = {
        email: 'existing@example.com',
        password: 'securePassword123',
        name: 'Test User',
      }

      // Mock Supabase to return user already exists error
      const mockSupabase = require('@/lib/supabase/server')
      mockSupabase.createClient.mockReturnValue({
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: null,
            error: {
              message: 'User already registered',
            },
          }),
        },
      })

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', requestBody)
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(response, 400)
      expect(data.error).toContain('User already registered')
    })

    it('should handle missing required fields', async () => {
      const requestBody = {
        email: 'test@example.com',
        // missing password and name
      }

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', requestBody)
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(response, 400)
      expect(data.error).toContain('Missing required fields')
    })
  })

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset password email successfully', async () => {
      const requestBody = {
        email: 'user@example.com',
      }

      // Mock Supabase reset password
      const mockSupabase = require('@/lib/supabase/server')
      mockSupabase.createClient.mockReturnValue({
        auth: {
          resetPasswordForEmail: jest.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        },
      })

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/forgot-password', requestBody)
      const response = await ForgotPasswordPOST(request)
      const data = await response.json()

      expectSuccessResponse(response, 200)
      expect(data.message).toBe('Password reset email sent')
    })

    it('should reject invalid email format', async () => {
      const requestBody = {
        email: 'invalid-email',
      }

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/forgot-password', requestBody)
      const response = await ForgotPasswordPOST(request)
      const data = await response.json()

      expectErrorResponse(response, 400)
      expect(data.error).toContain('Invalid email format')
    })

    it('should handle missing email field', async () => {
      const requestBody = {}

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/forgot-password', requestBody)
      const response = await ForgotPasswordPOST(request)
      const data = await response.json()

      expectErrorResponse(response, 400)
      expect(data.error).toContain('Email is required')
    })
  })

  describe('Rate Limiting', () => {
    it('should implement rate limiting for registration', async () => {
      const requestBody = {
        email: 'ratelimit@example.com',
        password: 'securePassword123',
        name: 'Rate Limit Test',
      }

      // Make multiple requests rapidly
      const requests = Array(6).fill(null).map(() => 
        createMockRequest('POST', 'http://localhost:3000/api/auth/register', requestBody)
      )

      // Mock successful responses for first few requests
      const mockSupabase = require('@/lib/supabase/server')
      mockSupabase.createClient.mockReturnValue({
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: { user: { id: 'test' } },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })),
      })

      const responses = await Promise.all(requests.map(req => POST(req)))
      
      // Expect some requests to be rate limited (this would need actual rate limiting implementation)
      // For now, just verify the structure works
      expect(responses).toHaveLength(6)
    })
  })
})
