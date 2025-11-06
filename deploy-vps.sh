#!/bin/bash
# Quick fix script for VPS deployment

echo "🔧 AutoPost VN - Quick Fix & Deploy"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Pull latest code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 2: Clean old build
echo -e "${YELLOW}🧹 Cleaning old build...${NC}"
rm -rf .next
echo -e "${GREEN}✓ Cleaned .next${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production=false
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 4: Build
echo -e "${YELLOW}🔨 Building app...${NC}"
npm run build 2>&1 | grep -E "(Compiled|Error:)" || npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Step 5: Check build output
echo -e "${YELLOW}🔍 Checking build output...${NC}"
if [ ! -d ".next/server" ]; then
    echo -e "${RED}❌ Build incomplete - .next/server missing${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build output OK${NC}"
echo ""

# Step 6: Restart PM2 (if using)
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}🔄 Restarting PM2...${NC}"
    pm2 restart autopost-vn || pm2 start npm --name "autopost-vn" -- start
    echo -e "${GREEN}✓ PM2 restarted${NC}"
else
    echo -e "${YELLOW}💡 PM2 not found. Start manually: npm run start${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "  - Check logs: pm2 logs autopost-vn"
echo "  - Check status: pm2 status"
echo "  - Visit: http://your-domain.com"
