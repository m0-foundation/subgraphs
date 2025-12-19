# Stateful L2 Wrapped M Token

This subgraph provides the following information for the Wrapped M Token on L2/spoke networks:

- Wrapped M Token balance snapshots
- M Token index updates
- Holder information and earnings status
- Transfers and claiming events
- Total supply and yield metrics

NOTE: On Spoke networks, we don't push the rate on `IndexUpdate` events. All Ethereum L2s, Hyperliquid and Solana base their yield accrual on the bridged index updates only.

## Deployment

Subgraphs are deployed like so:

```bash
./deploy.sh <network>
```

This subgraph can be deployed to different networks by using a templating system. The deployment process is managed by the `deploy.sh` script, which uses `jq` and `mustache` to generate the final `subgraph.yaml` from a template.

### Requirements

Before deploying, you must have the following tools installed:

- `goldsky`: The Goldsky CLI for deploying subgraphs. Check the [Goldsky documentation](https://docs.goldsky.com/) for installation instructions.
- `jq`: A command-line JSON processor.

`goldsky` can be installed via npm:

```bash
npm install -g @goldskycom/cli
```

For `jq`, you can typically install it with Homebrew (macOS) or another package manager:

```bash
brew install jq
```

The script also uses `mustache` which is included as a local npm dependency.

### Process

The `deploy.sh` script reads a deployment configuration from `networks.json` based on the network name you provide. It then uses this configuration to populate a `subgraph.template.yaml` file, generating a `subgraph.yaml` file tailored for the specific network. Finally, it builds and deploys the subgraph.

### Example

To deploy the `arbitrum` configuration, run the following command:

```bash
./deploy.sh arbitrum
```

This will generate a `subgraph.yaml` file tailored for the specific network, build the subgraph, and deploy it using the version specified in `networks.json`.

### Supporting a new network

Add a new entry to the `networks.json` file. E.g.:

```json
{
  "new-network": {
    "name": "Wrapped M Token New Network",
    "network": "network-name",
    "wrappedMTokenStartBlock": start-block-number,
    "mTokenStartBlock": start-block-number,
    "version": "0.1.0"
  }
}
```

And deploy it with:

```bash
./deploy.sh new-network
```

### Available Networks

Current supported networks can be found in `networks.json`.

The script automatically generates the appropriate deploy ID using the pattern `wrapped-m-token-{network}`.

## Scripts

This subgraph includes utility scripts in the `scripts/` folder to compute accrued yield for a given earner address. These scripts use the deployed subgraph data to calculate yield information.

### Available Scripts

#### `periodic-yield.ts`

Computes periodic yield values for a holder over multiple time periods.

**Usage:**

```bash
ts-node ./scripts/periodic-yield.ts <ADDRESS> <LATEST_EOD_TIMESTAMP> <PERIODS> <SECONDS_PER_PERIOD>
```

**Parameters:**

- `ADDRESS`: Case-insensitive Wrapped M Token holder address
- `LATEST_EOD_TIMESTAMP`: Unix/block timestamp marking end of most recent period
- `PERIODS`: Number of recent periods to return yield values for
- `SECONDS_PER_PERIOD`: Duration of each period in seconds (default: 86400 = 1 day)

**Example:** Daily yields for an address from May 13, 2026 to August 19, 2026:

```bash
ts-node ./scripts/periodic-yield.ts \
    0x0A1a1A107E45b7Ced86833863f482BC5f4ed82EF \
    1755618977 \
    99 \
    86400
```

#### `total-accrued-yield.ts`

Calculates total accrued yield for a holder until the current timestamp.

**Usage:**

```bash
ts-node ./scripts/total-accrued-yield.ts <ADDRESS>
```

**Parameters:**

- `ADDRESS`: Case-insensitive Wrapped M Token holder address

**Example:** Total accrued yield for an address:

```bash
ts-node ./scripts/total-accrued-yield.ts 0x0A1a1A107E45b7Ced86833863f482BC5f4ed82EF
```

### Environment Setup

Before running scripts, set up environment variables:

1. Copy the example environment file:

    ```bash
    cp .env.example .env
    ```

2. The scripts require the following environment variables:
    - `API_SUBGRAPH`: GraphQL endpoint for the deployed wrapped-m-token subgraph
    - `API_M_ETHEREUM`: GraphQL endpoint for mainnet stateful-m-token subgraph (for rate data)

### Important Notes

- This subgraph is designed for L2/spoke networks where rate information is not pushed in `IndexUpdate` events
- Scripts fetch rate information from the [`stateful-m-token` subgraph](../../stateful-m-token/) on mainnet
- Both subgraphs must be deployed for the scripts to work correctly
- Alternatively, you can hardcode rate values if you only need total accrued yield calculations

For complete usage details, see the [scripts README](./scripts/README).
