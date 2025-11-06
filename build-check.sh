#!/bin/bash
# Quick build check script - shows only important info

echo "🔨 Building Next.js app..."
echo ""

# Run build and capture output
BUILD_OUTPUT=$(npm run build 2>&1)

# Check if build succeeded
if echo "$BUILD_OUTPUT" | grep -q "✓ Compiled successfully"; then
    echo "✅ BUILD SUCCESS"
    echo ""
    
    # Show summary stats
    echo "$BUILD_OUTPUT" | grep -E "(Route|Page|Static|Size|First Load JS)"
    
    exit 0
else
    echo "❌ BUILD FAILED"
    echo ""
    
    # Show only actual errors
    echo "$BUILD_OUTPUT" | grep -E "Error:|Failed|error TS"
    
    exit 1
fi
