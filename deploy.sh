#!/bin/bash
set -e

CAPROVER_URL="https://captain.maplecommons.ca"

deploy() {
  local app=$1
  local dockerfile=$2
  echo "{\"schemaVersion\":2,\"dockerfilePath\":\"$dockerfile\"}" > captain-definition
  tar -czf /tmp/caprover-deploy.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*/node_modules' \
    --exclude='*/dist' \
    --exclude='*.tar.gz' \
    .
  caprover deploy --caproverUrl "$CAPROVER_URL" --appName "$app" --tarFile /tmp/caprover-deploy.tar.gz
}

deploy dev-waiver          "./apps/waiver/Dockerfile"
deploy dev-valid-waivers   "./apps/waiver-admin/Dockerfile"
deploy dev-waiver-uploads  "./apps/waiver-upload/Dockerfile"
deploy dev-volunteer-waiver "./apps/pilot-waiver/Dockerfile"

# Restore default
echo '{"schemaVersion":2,"dockerfilePath":"./apps/waiver/Dockerfile"}' > captain-definition

echo "All apps deployed."
