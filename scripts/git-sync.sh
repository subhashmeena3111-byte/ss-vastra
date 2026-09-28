#!/bin/bash
set -e

echo "=== SS VASTRA Auto-Sync to GitHub ==="

# Check git status
git add .
if git diff-index --quiet HEAD --; then
    echo "No local changes to commit."
else
    COMMIT_MSG="chore: auto-sync update $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    echo "Committed changes: $COMMIT_MSG"
fi

if git remote get-url origin > /dev/null 2>&1; then
    echo "Pushing to GitHub..."
    git push origin main
    echo "Successfully pushed to GitHub!"
else
    echo "Remote origin not configured."
fi
