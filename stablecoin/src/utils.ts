import { BigInt } from "@graphprotocol/graph-ts";
import { Stablecoin as Contract } from "../generated/M0/Stablecoin";
import { dataSource } from "@graphprotocol/graph-ts";

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
 * ETH Call to return the unclaimed yield for the stablecoin
 * Calls `yield()` on the contract.
 */
export function getUnclaimedYield(): BigInt {
  const contract = Contract.bind(dataSource.address());
  let unclaimed = BigInt.fromI32(0);
  const res = contract.try_yield_();
  if (!res.reverted) {
    unclaimed = res.value;
  }

  return unclaimed;
}

export function calculateAccruedYield(
  claimed: BigInt,
  unclaimed: BigInt,
): BigInt {
  return claimed.plus(unclaimed);
}

// Timeseries entities' id and timestamp are automatically set by subgraph in microseconds. e.g., 1698412800000000
// However, event.block.timestamp is in seconds.
// This function converts seconds to microseconds to normalize the data.
export function toMicroseconds(timestamp: BigInt): i64 {
  return timestamp.times(BigInt.fromI32(1000000)).toI64();
}
