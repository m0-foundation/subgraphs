# m-earner-spoke-network

This a subgraph indexer to index $M token on "Spoke networks".

On Spoke networks, we don't push the rate on `IndexUpdate` events. All Ethereum L2s, Hyperliquid and Solana base their yield accrual on the bridged index updates only.

Check the examples in the [`scripts` folder](./scripts/) to learn how to use it to compute accrued yield

## How to deploy to new networks

This subgraph can be deployed to different spoke networks. Make sure to check the following lines:

On `subgraph.yml`,

1. Set `network` to the right chain. E.g., `arbitrum`.
1. Set `startBlock` to the block height at which the $M contract was created.

On `deploy.sh`,

1. Update the deploy script to match Subgraph service (Alchemy Satsuma, Goldsky, The Graph).

Currently, the `deploy.sh` script points to Alchemy Satsuma. Usage example

```sh
export ALCHEMY_DEPLOY_KEY=your_key_here

yarn deploy 0.1.0
```
