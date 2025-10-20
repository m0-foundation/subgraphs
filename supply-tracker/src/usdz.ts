import {
  Transfer as TransferEvent,
  YieldClaimed as YieldClaimedEvent,
} from "../generated/USDZ/USDZ";
import { Transfer, YieldClaimed } from "../generated/schema";

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.sender = event.params.sender;
  entity.recipient = event.params.recipient;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleYieldClaimed(event: YieldClaimedEvent): void {
  let entity = new YieldClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.yield_ = event.params.yield_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
