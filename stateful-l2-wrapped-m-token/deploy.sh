#!/bin/bash
set -e

#
# This script deploys a Goldsky subgraph for a wrapped-m-token project.
# It requires one argument: network.
#
# ```bash
# ./deploy.sh network
# ```
#
# The information for deployment (network, address, startBlock) is read from networks.json based
# on network. Version is read from networks.json as well.
#

# Check for dependencies: jq and goldsky
if ! command -v jq &>/dev/null; then
  echo "jq is required. Please install it."
  echo "e.g., 'brew install jq'"
  exit 1
fi
if ! command -v goldsky &>/dev/null; then
  echo "goldsky is required. Please install it."
  echo "e.g., 'npm install -g @goldskycom/cli'"
  exit 1
fi

if [ -z "$1" ]; then
  echo "Missing network argument. Usage: $0 <network>"
  echo "  <network> is a key from networks.json (e.g., arbitrum, linea)"
  exit 1
fi

NETWORK="$1"
VERSION=$(jq -r ".[\"$NETWORK\"].version" networks.json)

echo "📋 Using version from networks.json: $VERSION"

# Read config from networks.json using jq
CONFIG=$(jq -r ".[\"$NETWORK\"]" networks.json)
if [ "$CONFIG" == "null" ]; then
  echo "Huh, could not find network '$NETWORK' in networks.json"
  exit 1
fi

NAME=$(echo "$CONFIG" | jq -r '.name')
DEPLOY_ID="wrapped-m-token-$NETWORK"

echo "🧼 Cleaning up..."
rm -rf ./build ./generated

echo "📝 Generating subgraph.yaml from template for $NAME on $NETWORK, version $VERSION..."
echo "$CONFIG" | ./node_modules/.bin/mustache - subgraph.template.yaml >subgraph.yaml

echo "👷‍♀️ Building..."
yarn codegen
yarn build

echo "🚀 Deploying subgraph..."
goldsky subgraph deploy "$DEPLOY_ID"/"$VERSION" --path .

# Sync version in package.json and networks.json
npm version "$VERSION" --no-git-tag-version --allow-same-version >/dev/null
jq --arg network "$NETWORK" --arg version "$VERSION" '.[$network].version = $version' networks.json >tmp.$$.json && mv tmp.$$.json networks.json

echo "✅ Deployment complete"
