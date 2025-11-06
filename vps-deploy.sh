#!/bin/bash
# Quick fix script for VPS deployment

echo "🔧 Fixing Next.js deployment on VPS..."
echo ""

# 1. Check current directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# 2. Clean everything
echo "🧹 Cleaning old build..."
rm -rf .next
rm -rf node_modules

# 3. Fresh install
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# 4. Build with verbose output
echo "🔨 Building app..."
npm run build:verbose 2>&1 | tee build.log

# 5. Check if build succeeded
if [ ! -f ".next/prerender-manifest.json" ]; then
    echo ""
    echo "❌ BUILD FAILED - Missing prerender-manifest.json"
    echo ""
    echo "Last 50 lines of build log:"
    tail -50 build.log
    exit 1
fi

# 6. Check required files
echo ""
echo "✅ Checking build output..."
ls -la .next/

if [ -f ".next/BUILD_ID" ] && [ -d ".next/server" ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   npm run start"
    echo ""
else
    echo ""
    echo "⚠️  Build might be incomplete"
    echo "Check build.log for details"
fi
