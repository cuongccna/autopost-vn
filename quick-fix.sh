#!/bin/bash
# One-command fix for VPS deployment

set -e  # Exit on error

echo "🚀 AutoPost VN - VPS Deployment Fix"
echo "===================================="
echo ""

# Clean
echo "🧹 Cleaning..."
rm -rf .next node_modules .swc

# Install
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --quiet

# Build
echo "🔨 Building..."
npm run build

# Verify
if [ -f ".next/prerender-manifest.json" ]; then
    echo ""
    echo "✅ BUILD SUCCESS!"
    echo ""
    echo "Start server with:"
    echo "  npm run start"
    echo ""
else
    echo ""
    echo "❌ BUILD FAILED"
    echo "Missing prerender-manifest.json"
    exit 1
fi
