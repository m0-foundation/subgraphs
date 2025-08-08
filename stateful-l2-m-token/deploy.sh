#!/bin/bash
set -e  # stop if any command fails

if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

VERSION="$1"

echo "🧼 Cleaning up..."
rm -rf ./build

echo "👷‍♀️ Building subgraph..."
yarn codegen
yarn build

echo "🚀 Deploying subgraph with version: $VERSION"
goldsky subgraph deploy "m-token-hyperliquid/$VERSION" --path .

echo "✅ Deployment complete"
