#!/bin/bash
set -e  # stop if any command fails

if [ -z "$1" ]; then
  echo "Missing arguments. Usage: $0 <version>"
  exit 1
fi

if ! command -v goldsky &> /dev/null; then
  echo "goldsky is required. Please install it."
  echo "e.g., 'npm install -g @goldskycom/cli'"
  exit 1
fi

VERSION="$1"

echo "🧼 Cleaning up..."
rm -rf ./build ./generated

echo "👷‍♀️ Building subgraph..."
yarn codegen
yarn build

echo "🚀 Deploying subgraph with version: $VERSION"
goldsky subgraph deploy superstate/"$VERSION" --path .

echo "✅ Deployment complete"
