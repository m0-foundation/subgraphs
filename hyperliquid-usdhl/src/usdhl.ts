import {
  Transfer as TransferEvent,
  YieldClaimed as YieldClaimedEvent,
} from "../generated/USDHL/USDHL";
import { Transfer, YieldClaimed } from "../generated/schema";

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleYieldClaimed(event: YieldClaimedEvent): void {
  let entity = new YieldClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.amount = event.params.yield_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
