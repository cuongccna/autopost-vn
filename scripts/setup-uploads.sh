#!/bin/bash
# Setup uploads directory for AutoPost VN

echo "🚀 Setting up uploads directory..."

# Create uploads directory structure
mkdir -p public/uploads/images
mkdir -p public/uploads/videos
mkdir -p public/uploads/documents

# Set proper permissions (readable and writable by the app)
chmod -R 755 public/uploads

# Create .gitkeep files to preserve directory structure
touch public/uploads/images/.gitkeep
touch public/uploads/videos/.gitkeep
touch public/uploads/documents/.gitkeep

echo "✅ Uploads directory setup complete!"
echo ""
echo "Directory structure:"
tree public/uploads || ls -la public/uploads/

echo ""
echo "📝 Don't forget to add to .gitignore:"
echo "public/uploads/**"
echo "!public/uploads/**/.gitkeep"
