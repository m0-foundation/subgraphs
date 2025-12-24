import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BalanceSnapshot, Holder } from "../generated/schema";

export function getHolder(address: Address): Holder {
  let holder = Holder.load(address);
  if (holder) return holder;

  holder = new Holder(address);
  holder.address = address;
  holder.balance = BigInt.fromI32(0);
  holder.lastUpdate = 0;

  return holder;
}

/**
 * Returns the closest of three daily snapshot times (0, 8, 16 hours UTC) for a given timestamp.
 * Rounds up if the timestamp is exactly halfway between two snapshot times.
 */
export function hourBucket(timestamp: BigInt): i64 {
  let ts = timestamp.toI64();
  let day = dayBucket(timestamp);

  let snap0 = day; // 00:00 UTC
  let snap8 = day + 8 * 3600; // 08:00 UTC
  let snap16 = day + 16 * 3600; // 16:00 UTC

  // Find the closest snapshot time
  if (ts < snap8 - 4 * 3600) {
    // Closer to 00:00 (before 04:00)
    return snap0;
  } else if (ts < snap16 - 4 * 3600) {
    // Closer to 08:00 (between 04:00 and 12:00)
    return snap8;
  } else {
    // Closer to 16:00 (after 12:00)
    return snap16;
  }
}

/**
 * Returns the start of the day for a given timestamp
 *
 * @example
 * ```ts
 *  dayBucket(BigInt.fromI32(1698412800));
 *  // returns 1698364800
 * ```
 */
export function dayBucket(timestamp: BigInt): i64 {
  let startOfDay = timestamp.toI64();
  return startOfDay - (startOfDay % 86400); // floor to start of the day
}

// Timeseries entities' id and timestamp are automatically set by subgraph in microseconds. e.g., 1698412800000000
// However, event.block.timestamp is in seconds.
// This function converts seconds to microseconds to normalize the data.
export function toMicroseconds(timestamp: BigInt): i64 {
  return timestamp.times(BigInt.fromI32(1000000)).toI64();
}

class CreateBalanceSnapshotArgs {
  address: Address;
  amount: BigInt;
  blockNumber: BigInt;
}
export function createBalanceSnapshot(
  args: CreateBalanceSnapshotArgs,
): BalanceSnapshot {
  // id and timestamp are automatically handled in timeseries entities
  const snap = new BalanceSnapshot(1);
  snap.address = args.address;
  snap.amount = args.amount;
  snap.blockNumber = args.blockNumber;
  snap.save();

  return snap;
}
