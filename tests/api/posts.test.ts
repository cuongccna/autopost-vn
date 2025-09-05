import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/posts/route'
import {
  createTestUser,
  createTestPost,
  createAuthenticatedRequest,
  createMockRequest,
  expectSuccessResponse,
  expectErrorResponse,
  setupTestEnvironment,
  cleanupTestEnvironment,
} from '../utils/test-helpers'

describe('Posts API', () => {
  beforeEach(() => {
    setupTestEnvironment()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })

  describe('GET /api/posts', () => {
    it('should fetch user posts successfully', async () => {
      const testUser = createTestUser()
      const testPosts = [createTestPost(), createTestPost({ id: 'post-2', title: 'Second Post' })]

      // Mock authenticated session
      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue({
        user: testUser,
      })

      // Mock Supabase response
      const mockSupabase = require('@/lib/supabase/server')
      mockSupabase.createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                data: testPosts,
                error: null,
              })),
            })),
          })),
        })),
      })

      const request = createAuthenticatedRequest('GET', 'http://localhost:3000/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expectSuccessResponse(response, 200)
      expect(data.posts).toHaveLength(2)
      expect(data.posts[0].title).toBe('Test Post')
      expect(data.posts[1].title).toBe('Second Post')
    })

    it('should require authentication', async () => {
      // Mock no session
      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue(null)

      const request = createMockRequest('GET', 'http://localhost:3000/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expectErrorResponse(response, 401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle database errors', async () => {
      const testUser = createTestUser()

      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue({ user: testUser })

      // Mock database error
      const mockSupabase = require('@/lib/supabase/server')
      mockSupabase.createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                data: null,
                error: { message: 'Database connection failed' },
              })),
            })),
          })),
        })),
      })

      const request = createAuthenticatedRequest('GET', 'http://localhost:3000/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expectErrorResponse(response, 500)
      expect(data.error).toContain('Failed to fetch posts')
    })
  })

  describe('POST /api/posts', () => {
    it('should create a new post successfully', async () => {
      const testUser = createTestUser()
      const newPost = {
        title: 'New Test Post',
        content: 'This is a new test post content',
        providers: ['facebook', 'instagram'],
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
      }

      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue({ user: testUser })

      const mockSupabase = require('@/lib/supabase/server')
      mockSupabase.createClient.mockReturnValue({
        from: jest.fn(() => ({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { ...newPost, id: 'new-post-123', user_id: testUser.id },
                error: null,
              })),
            })),
          })),
        })),
      })

      const request = createAuthenticatedRequest('POST', 'http://localhost:3000/api/posts', newPost)
      const response = await POST(request)
      const data = await response.json()

      expectSuccessResponse(response, 201)
      expect(data.post.title).toBe('New Test Post')
      expect(data.post.providers).toEqual(['facebook', 'instagram'])
      expect(data.message).toBe('Post created successfully')
    })

    it('should validate required fields', async () => {
      const testUser = createTestUser()
      const invalidPost = {
        // missing title and content
        providers: ['facebook'],
      }

      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue({ user: testUser })

      const request = createAuthenticatedRequest('POST', 'http://localhost:3000/api/posts', invalidPost)
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(response, 400)
      expect(data.error).toContain('Title and content are required')
    })

    it('should validate scheduled_at is in the future', async () => {
      const testUser = createTestUser()
      const invalidPost = {
        title: 'Test Post',
        content: 'Test content',
        providers: ['facebook'],
        scheduled_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      }

      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue({ user: testUser })

      const request = createAuthenticatedRequest('POST', 'http://localhost:3000/api/posts', invalidPost)
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(response, 400)
      expect(data.error).toContain('Scheduled time must be in the future')
    })

    it('should validate providers array', async () => {
      const testUser = createTestUser()
      const invalidPost = {
        title: 'Test Post',
        content: 'Test content',
        providers: ['invalid-provider'],
      }

      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue({ user: testUser })

      const request = createAuthenticatedRequest('POST', 'http://localhost:3000/api/posts', invalidPost)
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(response, 400)
      expect(data.error).toContain('Invalid provider')
    })
  })

  describe('PUT /api/posts', () => {
    it('should update an existing post successfully', async () => {
      const testUser = createTestUser()
      const existingPost = createTestPost()
      const updateData = {
        id: existingPost.id,
        title: 'Updated Post Title',
        content: 'Updated content',
      }

      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue({ user: testUser })

      const mockSupabase = require('@/lib/supabase/server')
      mockSupabase.createClient.mockReturnValue({
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { ...existingPost, ...updateData },
                  error: null,
                })),
              })),
            })),
          })),
        })),
      })

      const request = createAuthenticatedRequest('PUT', 'http://localhost:3000/api/posts', updateData)
      const response = await PUT(request)
      const data = await response.json()

      expectSuccessResponse(response, 200)
      expect(data.post.title).toBe('Updated Post Title')
      expect(data.message).toBe('Post updated successfully')
    })

    it('should prevent updating other users posts', async () => {
      const testUser = createTestUser()
      const otherUserPost = createTestPost({ user_id: 'other-user-456' })

      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue({ user: testUser })

      // Mock database to return no results (post not found for this user)
      const mockSupabase = require('@/lib/supabase/server')
      mockSupabase.createClient.mockReturnValue({
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: null,
                  error: { message: 'Row not found' },
                })),
              })),
            })),
          })),
        })),
      })

      const updateData = {
        id: otherUserPost.id,
        title: 'Malicious Update',
      }

      const request = createAuthenticatedRequest('PUT', 'http://localhost:3000/api/posts', updateData)
      const response = await PUT(request)
      const data = await response.json()

      expectErrorResponse(response, 404)
      expect(data.error).toContain('Post not found')
    })
  })

  describe('DELETE /api/posts', () => {
    it('should delete a post successfully', async () => {
      const testUser = createTestUser()
      const postToDelete = createTestPost()

      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue({ user: testUser })

      const mockSupabase = require('@/lib/supabase/server')
      mockSupabase.createClient.mockReturnValue({
        from: jest.fn(() => ({
          delete: jest.fn(() => ({
            eq: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/posts?id=' + postToDelete.id, {
        method: 'DELETE',
      })
      ;(request as any).auth = { user: testUser }

      const response = await DELETE(request)
      const data = await response.json()

      expectSuccessResponse(response, 200)
      expect(data.message).toBe('Post deleted successfully')
    })

    it('should require post ID for deletion', async () => {
      const testUser = createTestUser()

      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue({ user: testUser })

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expectErrorResponse(response, 400)
      expect(data.error).toContain('Post ID is required')
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed JSON in POST request', async () => {
      const testUser = createTestUser()

      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue({ user: testUser })

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      })

      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(response, 400)
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle very long content', async () => {
      const testUser = createTestUser()
      const longContent = 'a'.repeat(10000) // Very long content

      const mockGetServerSession = require('next-auth/next').getServerSession
      mockGetServerSession.mockResolvedValue({ user: testUser })

      const postData = {
        title: 'Long Content Test',
        content: longContent,
        providers: ['facebook'],
      }

      const request = createAuthenticatedRequest('POST', 'http://localhost:3000/api/posts', postData)
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(response, 400)
      expect(data.error).toContain('Content too long')
    })
  })
})
