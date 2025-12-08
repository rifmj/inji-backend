#!/bin/bash

# Define local and remote directories
LOCAL_DIRECTORY="/Users/rifatjumagulov/workspace/nur/apps/shop/inji-backend"
REMOTE_USER="ubuntu"
REMOTE_HOST="194.32.142.137"
REMOTE_DIRECTORY="/home/ubuntu/inji/server"
REMOTE_PROJECT_DIR="$REMOTE_DIRECTORY/inji-backend"

# Removing remote directory
echo "Cleaning remote directory..."
ssh "$REMOTE_USER@$REMOTE_HOST" "rm -rf $REMOTE_DIRECTORY && mkdir -p $REMOTE_DIRECTORY"

# Execute rsync command to copy files
# Using trailing slash on source to copy contents, not the directory itself
echo "Copying files to server..."
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'scripts' \
  --exclude 'dist' \
  --exclude '.env' \
  --exclude 'yarn-error.log' \
  --exclude '*.log' \
  "$LOCAL_DIRECTORY/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PROJECT_DIR/"

# Verify that src directory was copied
echo "Verifying src directory exists..."
ssh "$REMOTE_USER@$REMOTE_HOST" "test -d $REMOTE_PROJECT_DIR/src && echo '✓ src/ directory exists' || echo '✗ ERROR: src/ directory missing!'"

# Remove .git if it exists (shouldn't, but just in case)
echo "Removing .git directory if present..."
ssh "$REMOTE_USER@$REMOTE_HOST" "rm -rf $REMOTE_PROJECT_DIR/.git"

# After rsync, execute yarn build and pm2 restart in the remote directory
echo "Building and restarting service..."
ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_PROJECT_DIR && yarn && npx prisma generate && yarn build && yarn start:pm2:prod"

echo "✓ Deployment completed successfully."
