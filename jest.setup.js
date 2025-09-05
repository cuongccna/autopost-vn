// Jest setup for API testing
import { loadEnvConfig } from '@next/env'

// Load environment variables for testing
loadEnvConfig(process.cwd(), '.env.test')

// Mock NextAuth for testing
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

// Mock environment variables if needed
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret'

// Global test timeout
jest.setTimeout(30000)
