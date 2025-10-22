import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Stablecoin } from "../generated/schema";

export function getStablecoin(address: Address): Stablecoin {
  let token = Stablecoin.load(address);

  if (token) return token;

  token = new Stablecoin(address);

  token.minted = BigInt.fromI32(0);
  token.burned = BigInt.fromI32(0);
  token.claimed = BigInt.fromI32(0);
  token.accruedYield = BigInt.fromI32(0);
  token.lastUpdate = 0;

  return token;
}
