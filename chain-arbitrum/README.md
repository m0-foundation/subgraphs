# Chain Arbitrum Subgraph

This subgraph tracks M0 tokens across multiple chains, specifically monitoring token events and supply changes. It's designed to be a multi-chain solution for all M0 tokens.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp env.example .env
# Edit .env with your Alchemy deploy key and version label
```

3. Generate AssemblyScript types from subgraph schema:
```bash
npm run codegen
```

4. Build the subgraph:
```bash
npm run build
```

## Deployment

Deploy to different networks using Alchemy Subgraphs:

### Arbitrum One
```bash
npm run deploy:arbitrum
```

### Mainnet
```bash
npm run deploy:mainnet
```

### Sepolia (Testnet)
```bash
npm run deploy:sepolia
```

### Local Development
```bash
npm run deploy-local
```

## Environment Variables

Create a `.env` file from `env.example` and configure:
- `VERSION_LABEL`: Version label for your deployment (e.g., v1.0.0)
- `DEPLOY_KEY`: Your Alchemy subgraph deploy key

## Events Tracked

- `Transfer(address,address,uint256)`: M0 token transfers
- `IndexUpdated(uint128)`: Emitted when the M0 token's index (total supply) is updated 