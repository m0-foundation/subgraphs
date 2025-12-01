# Token Supply Tracker

## Methodology

### Total supply

The total supply is calculated by summing the amount of tokens minted and subtracting the amount of tokens burned.

## Deployment

This subgraph can be deployed to different networks for various contracts by using a templating system. The deployment process is managed by the `deploy.sh` script, which uses `jq` and `mustache` to generate the final `subgraph.yaml` from a template.

### Requirements

Before deploying, you must have the following tools installed:

- `goldsky`: The Goldsky CLI for deploying subgraphs. Check the [Goldsky documentation](https://docs.goldsky.com/) for installation instructions.
- `jq`: A command-line JSON processor.

`goldsky` can be installed via npm:

```bash
npm install -g @goldskycom/cli
```

For `jq`, You can typically install it with Homebrew (macOS) or another package manager:

```bash
brew install jq
```

### Process

The `deploy.sh` script reads a deployment configuration from `networks.json` based on the deploy identifier you provide. It then uses this configuration to populate a `subgraph.template.yaml` file, generating a `subgraph.yaml` file tailored for the specific contract and network. Finally, it builds and deploys the subgraph.

### Example

To deploy the `musd-mainnet` configuration, run the following command:

```bash
./deploy.sh musd-mainnet
```

This will generate a `subgraph.yaml` file tailored for the specific contract and network, build the subgraph, and deploy it to the specified network.

### Supporting a new contract or chain

Add a new entry to the `networks.json` file. E.g.:

```json
{
  "deploy-id": {
    "name": "Contract Name",
    "network": "network-name",
    "address": "contract-address",
    "startBlock": start-block,
    "version": "version"
  }
}
```

And deploy it with:

```bash
./deploy.sh deploy-id
```
