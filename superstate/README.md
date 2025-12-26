# Superstate Subgraph

This subgraph provides on-chain data for the USTB holdings from the Minters in the $M Protocol.

You can find the wallets we track [here](./src//ustbWallets.ts).

## Deployment

This Subgraph is deployed like so:

```bash
./deploy.sh <version>
```

Example:

```bash
./deploy.sh 0.1.0
```

Please bump the version number as needed.

### Requirements

Before deploying, you must have the following tools installed:

- `Yarn`: A package manager for JavaScript. You can install it from [here](https://yarnpkg.com/getting-started/install).
- `goldsky`: The Goldsky CLI for deploying subgraphs. Check the [Goldsky documentation](https://docs.goldsky.com/) for installation instructions.

`goldsky` can be installed via npm:

```bash
npm install -g @goldskycom/cli
```

## Adding new USTB Wallets

To add new USTB wallets to be tracked by this subgraph, follow these steps:

1. Add the new wallet address to the USTB_WALLETS array in `src/ustbWallets.ts`.
1. Use Subgraph's Grafting feature to backfill historical data for the new wallets. Refer to the [Subgraph Grafting Documentation](https://thegraph.com/docs/en/developer/grafting/) for detailed instructions on how to perform grafting.
