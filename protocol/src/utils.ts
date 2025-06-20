import { BigInt } from "@graphprotocol/graph-ts";

/**
 * Get the unique day number from a timestamp.
 */
export function dayFromTimestamp(timestamp: BigInt): BigInt {
  let secondsInDay = 86400;
  let dayNumber = timestamp.toI32() / secondsInDay;

  return BigInt.fromI32(dayNumber);
}
