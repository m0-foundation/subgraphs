import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Superstate as Contract } from "../generated/Superstate/Superstate";
import { dataSource } from "@graphprotocol/graph-ts";
import { Holder } from "../generated/schema";

export const MINTERS = [
  "0x235Adf84139701024eDbA844EbF76FA7eeD98A0c", // Bridge
  "0xA2A23E2B9c0ec3F5919Ca786E12a524d65CA8C26", // Bridge2
  "0x1575B5B8C4624FE0072626b7EbDc137aEf66247a", // Bridge3
  "0x802E28E166C3f19983E0Cf7688dCA0C2e70176A6", // Minter One
];

export function getHolder(address: Address): Holder {
  let token = Holder.load(address);
  if (token) return token;

  token = new Holder(address);
  token.address = address;
  token.balance = BigInt.fromI32(0);
  token.lastUpdate = 0;

  return token;
}

/**
 * Returns the start of the hour for a given timestamp
 *
 * @example
 * ```ts
 *  hourBucket(BigInt.fromI32(1698412800));
 *  // returns 1698412800
 * ```
 */
export function hourBucket(timestamp: BigInt): i64 {
  let startOfHour = timestamp.toI64();
  return startOfHour - (startOfHour % 3600); // floor to start of the hour
}

/**
 * ETH Call to return the unclaimed balanceOf for the holder
 * Calls `balanceOf()` on the contract.
 */
export function getBalanceOf(account: Address): BigInt {
  const contract = Contract.bind(dataSource.address());
  let balance = BigInt.fromI32(0);

  const res = contract.try_balanceOf(account);
  if (!res.reverted) {
    balance = res.value;
  }

  return balance;
}

// Timeseries entities' id and timestamp are automatically set by subgraph in microseconds. e.g., 1698412800000000
// However, event.block.timestamp is in seconds.
// This function converts seconds to microseconds to normalize the data.
export function toMicroseconds(timestamp: BigInt): i64 {
  return timestamp.times(BigInt.fromI32(1000000)).toI64();
}
