import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Holder } from "../generated/schema";

export function getHolder(address: Address): Holder {
  let holder = Holder.load(address);

  if (holder) return holder;

  holder = new Holder(address);
  holder.received = BigInt.fromI32(0);
  holder.sent = BigInt.fromI32(0);
  holder.lastUpdate = 0;

  return holder;
}
