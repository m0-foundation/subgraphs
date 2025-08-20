# stateful-l2-m-token

This a subgraph indexer to index $M token on "Spoke networks".

On Spoke networks, we don't push the rate on `IndexUpdate` events. All Ethereum L2s, Hyperliquid and Solana base their yield accrual on the bridged index updates only.

## How to compute accrued yield using this indexer

You can find a script in the `script` folder which contains the logic to compute periodic yields. This section will guide how to run it.

Notice that this Indexer is meant for our Spoke networks. We don't push rate information to spoke networks on `IndexUpdates`. The script gets the rate information from the `stateful-m-token` subgraph.

You'll need to deploy both subgraphs to use it. Alternatively, you can hardcode the rate value if all you need is the total accrued yield (check the second example below).

1. Set env vars

   ```sh
   cp .env.example .env
   ```

1. Run the script

   Example: Daily yields of [Noble (USDN)](https://dashboard.m0.org/stablecoins/noble) from 3 May 2025 to 19 Aug 2025.

   ```sh
   yarn run:script \
       0x83Ae82Bd4054e815fB7B189C39D9CE670369ea16 \
       1755618977 \
       169 \
       86400
   ```

   Example: Total accrued yield for [Noble (USDN)](https://dashboard.m0.org/stablecoins/noble) until 19 Aug 2025.

   ```sh
   yarn run:script \
       0x83Ae82Bd4054e815fB7B189C39D9CE670369ea16 \
       1755618977 \
       1 \
       14640977
   ```

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
