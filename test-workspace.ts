// Test script để tạo user và test workspace creation
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testWorkspaceCreation() {
  console.log('=== Testing Workspace Creation ===')
  
  // Test workspace creation với mock user ID
  const mockUserId = 'test-user-123'
  const userSlug = `user-${mockUserId.replace(/-/g, '').substring(0, 8)}`
  
  console.log('Testing with:', { mockUserId, userSlug })
  
  try {
    // Check if workspace exists
    const { data: workspace, error: workspaceError } = await supabase
      .from('AutoPostVN.workspaces')
      .select('id')
      .eq('slug', userSlug)
      .single()

    console.log('Workspace lookup:', { workspace, workspaceError })

    if (workspaceError && workspaceError.code === 'PGRST116') {
      console.log('No workspace found, creating new one...')
      
      // Create workspace
      const { data: newWorkspace, error: createError } = await supabase
        .from('AutoPostVN.workspaces')
        .insert({
          name: 'Test Workspace',
          slug: userSlug,
          description: 'Test workspace for debugging',
        })
        .select('id')
        .single()

      console.log('Workspace creation:', { newWorkspace, createError })
      
      if (createError) {
        console.error('❌ Failed to create workspace:', createError)
      } else {
        console.log('✅ Workspace created successfully:', newWorkspace)
      }
    } else if (workspace) {
      console.log('✅ Workspace already exists:', workspace)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testWorkspaceCreation()
