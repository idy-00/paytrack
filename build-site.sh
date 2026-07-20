#!/bin/bash
# Build PayTrack site: landing (root) + dashboard (/app)

set -e

echo "=== Building frontend dashboard ==="
cd "$(dirname "$0")/frontend"
npm run build

echo "=== Assembling final site ==="
cd "$(dirname "$0")"
rm -rf site
mkdir -p site/app

# Landing page at root
cp landing/paytrack-vitrine.html site/index.html

# Dashboard at /app
cp -r frontend/dist/* site/app/

# SPA fallback for Cloudflare Pages
cat > site/_redirects << 'EOF'
/app/*  /app/index.html  200
EOF

echo "=== Done! Deploy 'site/' folder to Cloudflare Pages ==="
echo "Site structure:"
echo "  / → landing page"
echo "  /app → dashboard React"
