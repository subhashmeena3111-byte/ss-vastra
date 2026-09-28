#!/bin/bash
set -e

echo "=== SS VASTRA Auto-Sync to GitHub & Vercel ==="

GITHUB_REPO="subhashmeena3111-byte/ss-vastra.git"
TOKEN="${1:-$GITHUB_TOKEN}"

# Stage all files
git add .

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    echo "No new local changes to commit."
else
    COMMIT_MSG="chore: update store catalog and features $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    echo "Committed changes: $COMMIT_MSG"
fi

if [ -n "$TOKEN" ]; then
    echo "Configuring GitHub origin with authentication token..."
    git remote set-url origin "https://${TOKEN}@github.com/${GITHUB_REPO}"
fi

echo "Pushing code to GitHub main branch..."
git branch -M main
git push -u origin main

echo ""
echo "==========================================================="
echo "✅ Successfully pushed code to GitHub: https://github.com/${GITHUB_REPO}"
echo "🚀 If your Vercel project is connected to this repo, Vercel"
echo "   will automatically detect this commit and deploy live within 30s!"
echo "==========================================================="

