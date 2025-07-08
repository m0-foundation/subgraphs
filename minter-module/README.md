# Deployed Sub Graph
https://subgraph.satsuma-prod.com/the-things-team--3422500/minter-module-mainnet/playground

`query{dailyAccruedMinterRates(orderBy: id, orderDirection: desc){id minter owedMStartOfDay owedMEndOfDay accruedMinterRate dailyTotalMintAmount dailyTotalBurnAmount dailyTotalPenaltyAmount}}`

# Notes
Due to the involved block handler, the sync with the old existing blocks takes a long time.
Deactivating the block handler in the subgraph.yaml can be useful during tests to speed up other logic.