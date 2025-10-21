#!/bin/bash
set -e  # stop if any command fails

if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

if [ -z "$ALCHEMY_DEPLOY_KEY" ]; then
  echo "Error: ALCHEMY_DEPLOY_KEY environment variable not set."
  echo "Set it with: export ALCHEMY_DEPLOY_KEY=your_key_here"
  exit 1
fi

VERSION="$1"

echo "🧼 Cleaning up..."
rm -rf ./build ./generated

echo "👷‍♀️ Building subgraph..."
yarn codegen
yarn build

echo "🚀 Deploying subgraph with version: $VERSION"
yarn graph deploy usdz-arbitrum \
  --version-label "$VERSION" \
  --node https://subgraphs.alchemy.com/api/subgraphs/deploy \
  --deploy-key "$ALCHEMY_DEPLOY_KEY" \
  --ipfs https://ipfs.satsuma.xyz

echo "✅ Deployment complete"
