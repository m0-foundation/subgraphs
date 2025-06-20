import { BigInt } from "@graphprotocol/graph-ts";

export const SECONDS_PER_DAY = BigInt.fromI32(86400);

/**
 * Get the unique day number from a timestamp.
 */
export function dayFromTimestamp(timestamp: BigInt): BigInt {
  let dayNumber = timestamp.div(SECONDS_PER_DAY);

  return dayNumber;
}
