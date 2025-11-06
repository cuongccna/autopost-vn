#!/bin/bash
# Diagnose deployment issues

echo "🔍 Next.js Deployment Diagnostic"
echo "================================"
echo ""

# Check Node version
echo "📌 Node.js version:"
node --version
echo ""

# Check npm version
echo "📌 npm version:"
npm --version
echo ""

# Check if in project directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project root"
    exit 1
fi

# Check .next folder
echo "📂 Build folder status:"
if [ -d ".next" ]; then
    echo "  ✅ .next/ exists"
    
    # Check critical files
    if [ -f ".next/BUILD_ID" ]; then
        echo "  ✅ BUILD_ID exists: $(cat .next/BUILD_ID)"
    else
        echo "  ❌ Missing BUILD_ID"
    fi
    
    if [ -f ".next/prerender-manifest.json" ]; then
        echo "  ✅ prerender-manifest.json exists"
    else
        echo "  ❌ Missing prerender-manifest.json (CRITICAL)"
    fi
    
    if [ -d ".next/server" ]; then
        echo "  ✅ server/ folder exists"
    else
        echo "  ❌ Missing server/ folder"
    fi
    
    if [ -f ".next/build-manifest.json" ]; then
        echo "  ✅ build-manifest.json exists"
    else
        echo "  ❌ Missing build-manifest.json"
    fi
else
    echo "  ❌ .next/ folder does not exist - Need to build"
fi
echo ""

# Check node_modules
echo "📦 Dependencies:"
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules/ exists"
else
    echo "  ❌ node_modules/ missing - Run: npm install"
fi
echo ""

# Check environment
echo "🔐 Environment files:"
if [ -f ".env.local" ]; then
    echo "  ✅ .env.local exists"
else
    echo "  ⚠️  .env.local missing"
fi

if [ -f ".env.production" ]; then
    echo "  ✅ .env.production exists"
else
    echo "  ℹ️  .env.production not found (optional)"
fi
echo ""

# Check next.config
echo "⚙️  Next.js config:"
if grep -q "output.*standalone" next.config.mjs 2>/dev/null; then
    echo "  ❌ Found 'output: standalone' - REMOVE THIS!"
else
    echo "  ✅ Config OK (no standalone output)"
fi
echo ""

# Recommendation
echo "📋 Recommendations:"
if [ ! -f ".next/prerender-manifest.json" ]; then
    echo "  1. Clean rebuild:"
    echo "     rm -rf .next node_modules"
    echo "     npm install"
    echo "     npm run build"
    echo ""
fi

if grep -q "output.*standalone" next.config.mjs 2>/dev/null; then
    echo "  2. Fix next.config.mjs:"
    echo "     Remove: output: 'standalone',"
    echo ""
fi

echo "  3. Start server:"
echo "     npm run start"
echo ""
