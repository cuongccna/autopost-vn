import { NextRequest, NextResponse } from 'next/server'
import { sbServer } from '@/lib/supabase/server'

// Test workspace creation endpoint
export async function GET(_request: NextRequest) {
  try {

    
    const supabase = sbServer()
    
    // Test với mock user ID
    const mockUserId = 'test-user-12345'
    const userSlug = `user-${mockUserId.replace(/-/g, '').substring(0, 8)}`
    

    
    // Check if workspace exists
    let { data: workspace, error: workspaceError } = await supabase
      .from('autopostvn_workspaces')
      .select('id, name, slug')
      .eq('slug', userSlug)
      .single()



    if (workspaceError || !workspace) {

      
      // Create workspace
      const { data: newWorkspace, error: createError } = await supabase
        .from('autopostvn_workspaces')
        .insert({
          name: 'Test Workspace',
          slug: userSlug,
          description: 'Test workspace for debugging',
        })
        .select('id, name, slug')
        .single()


      
      if (createError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create workspace',
          details: createError,
          userSlug
        })
      }
      
      workspace = newWorkspace
    }
    

    
    return NextResponse.json({
      success: true,
      workspace,
      userSlug,
      message: 'Workspace test completed successfully'
    })
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

// Test provider validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providers } = body
    

    
    const validProviders = ['facebook', 'instagram', 'zalo']
    const isValid = providers?.every((p: string) => validProviders.includes(p))

    
    if (!isValid) {
      const invalid = providers?.filter((p: string) => !validProviders.includes(p))
      return NextResponse.json({
        success: false,
        error: 'Invalid provider. Allowed: ' + validProviders.join(', '),
        invalid,
        received: providers
      })
    }
    
    return NextResponse.json({
      success: true,
      providers,
      message: 'Provider validation passed'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Provider test failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
