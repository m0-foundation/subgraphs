#!/bin/bash
set -e

if [ -z "$ALCHEMY_DEPLOY_KEY" ]; then
  echo "Error: ALCHEMY_DEPLOY_KEY environment variable not set."
  exit 1
fi

# Check for dependencies: jq and mustache
if ! command -v jq &> /dev/null; then
  echo "jq is required. Please install it."
  echo "e.g., 'brew install jq'"
  exit 1
fi

if [ -z "$1" ]; then
  echo "Usage: $0 <deploy-id>"
  echo "  <deploy-id> is a key from networks.json (e.g., musd-mainnet)"
  exit 1
fi

DEPLOY_ID="$1"

# Read config from networks.json using jq
CONFIG=$(jq -r ".[\"$DEPLOY_ID\"]" networks.json)
if [ "$CONFIG" == "null" ]; then
  echo "Huh, could not find deploy ID '$DEPLOY_ID' in networks.json"
  exit 1
fi

NETWORK=$(echo "$CONFIG" | jq -r '.network')
ADDRESS=$(echo "$CONFIG" | jq -r '.address')
START_BLOCK=$(echo "$CONFIG" | jq -r '.startBlock')
VERSION=$(echo "$CONFIG" | jq -r '.version')
NAME=$(echo "$CONFIG" | jq -r '.name')

echo "🧼 Cleaning up..."
rm -rf ./build ./generated

echo "📝 Generating subgraph.yaml from template for $NAME on $NETWORK, version $VERSION..."
# Create a JSON object for mustache from the variables
MUSTACHE_JSON=$(jq -n \
  --arg network "$NETWORK" \
  --arg address "$ADDRESS" \
  --arg startBlock "$START_BLOCK" \
  '{network: $network, address: $address, startBlock: $startBlock}')

echo "$MUSTACHE_JSON" | mustache - subgraph.template.yaml > subgraph.yaml

echo "👷‍♀️ Building..."
yarn codegen
yarn build

echo "🚀 Deploying subgraph..."
yarn graph deploy "$DEPLOY_ID" \
  --version-label "$VERSION" \
  --node https://subgraphs.alchemy.com/api/subgraphs/deploy \
  --deploy-key "$ALCHEMY_DEPLOY_KEY" \
  --ipfs https://ipfs.satsuma.xyz

echo "✅ Deployment complete"
