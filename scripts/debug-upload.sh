#!/bin/bash
# Debug upload issues on VPS

echo "🔍 AutoPost VN - Upload Debug Script"
echo "===================================="
echo ""

# 1. Check uploads directory
echo "1️⃣ Checking uploads directory..."
if [ -d "public/uploads" ]; then
    echo "✅ public/uploads exists"
    ls -la public/uploads/
else
    echo "❌ public/uploads NOT FOUND"
    echo "Creating directories..."
    mkdir -p public/uploads/{images,videos,documents}
    chmod -R 777 public/uploads
    echo "✅ Created with full permissions"
fi
echo ""

# 2. Check disk space
echo "2️⃣ Checking disk space..."
df -h | grep -E "Filesystem|/var"
echo ""

# 3. Check API route file
echo "3️⃣ Checking API route..."
if [ -f "src/app/api/media/upload/route.ts" ]; then
    echo "✅ route.ts exists"
    echo "File size: $(du -h src/app/api/media/upload/route.ts | cut -f1)"
else
    echo "❌ route.ts NOT FOUND"
fi
echo ""

# 4. Check build output
echo "4️⃣ Checking build output..."
if [ -d ".next/server/app/api/media/upload" ]; then
    echo "✅ Built API route exists"
    ls -la .next/server/app/api/media/upload/
else
    echo "❌ Built route NOT FOUND - Need to rebuild!"
fi
echo ""

# 5. Check PM2 process
echo "5️⃣ Checking PM2 process..."
pm2 list | grep autopost
echo ""

# 6. Test create file
echo "6️⃣ Testing file write permission..."
TEST_FILE="public/uploads/test-$(date +%s).txt"
if echo "test" > "$TEST_FILE" 2>/dev/null; then
    echo "✅ Can write to uploads directory"
    rm "$TEST_FILE"
else
    echo "❌ CANNOT write to uploads directory"
    echo "Fixing permissions..."
    chmod -R 777 public/uploads
fi
echo ""

# 7. Check environment variables
echo "7️⃣ Checking environment variables..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "NEXT_PUBLIC_APP_URL: $(grep NEXT_PUBLIC_APP_URL .env | cut -d'=' -f2)"
    echo "MAX_VIDEO_SIZE: $(grep MAX_VIDEO_SIZE .env | cut -d'=' -f2 || echo 'not set')"
else
    echo "⚠️  .env file not found"
fi
echo ""

# 8. Check recent uploads
echo "8️⃣ Recent uploads (if any)..."
find public/uploads -type f -mtime -1 2>/dev/null | head -5
echo ""

# 9. Check logs for upload errors
echo "9️⃣ Recent upload errors in logs..."
pm2 logs autopost-vn --nostream --lines 50 | grep -i "upload\|media" | tail -10
echo ""

echo "===================================="
echo "✅ Debug complete!"
echo ""
echo "📋 Summary:"
echo "- If uploads directory missing: Created with 777 permissions"
echo "- If build output missing: Run 'npm run build'"
echo "- If permission errors: Fixed with chmod 777"
echo ""
echo "Next steps:"
echo "1. Run: npm run build"
echo "2. Run: pm2 restart autopost-vn"
echo "3. Try upload again"
echo "4. Check logs: pm2 logs autopost-vn --lines 100"
