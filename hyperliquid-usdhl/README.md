# hyperliquid-usdh

Subgraph that tracks USDhl yield claim events on Hyperliquid.

Useful links

- [USDhl contract on Hyperscan](https://www.hyperscan.com/token/0xb50A96253aBDF803D85efcDce07Ad8becBc52BD5)
- [$M Token contract on Hyperscan](https://www.hyperscan.com/token/0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b)

## Quick start

Install dependencies

```sh
yarn
```

Update generated code

```sh
yarn codegen
```

Deploy via [Goldsky](https://goldsky.com)

> Goldsky CLI and valid log in is required. [See more](https://docs.goldsky.com/subgraphs/deploying-subgraphs#install-goldskys-cli-and-log-in)

```sh
yarn deploy <VERSION>

# e.g.,
yarn deploy 0.1.0
```
