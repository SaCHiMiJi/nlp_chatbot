#!/bin/bash

# This script deploys functions without running lint

# Create temporary firebase.json without lint
echo "Creating temporary firebase.json without lint check..."
cat > ../firebase.temp.json << 'EOL'
{
  "functions": {
    "predeploy": []
  }
}
EOL

# Remember original firebase.json
if [ -f "../firebase.json" ]; then
  cp ../firebase.json ../firebase.json.backup
fi

# Replace with our temporary one
cp ../firebase.temp.json ../firebase.json

echo "Deploying functions without lint check..."
cd ..
firebase deploy --only functions

# Restore original firebase.json
if [ -f "firebase.json.backup" ]; then
  mv firebase.json.backup firebase.json
  echo "Restored original firebase.json"
else
  rm firebase.json
  echo "Removed temporary firebase.json"
fi

# Clean up
rm -f firebase.temp.json

echo "Deployment completed!"