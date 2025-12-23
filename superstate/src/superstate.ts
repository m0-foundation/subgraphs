import { Transfer as TransferEvent } from "../generated/Superstate/Superstate";
import { BalanceMeta, Transfer } from "../generated/schema";
import {
  createBalanceSnapshot,
  getHolder,
  hourBucket,
  MINTERS,
  toMicroseconds,
} from "./utils";
import { Address, ethereum } from "@graphprotocol/graph-ts";

export function handleTransfer(event: TransferEvent): void {
  const entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  const fromHolder = getHolder(event.params.from);
  fromHolder.balance = fromHolder.balance.minus(event.params.value);
  fromHolder.lastUpdate = toMicroseconds(event.block.timestamp);
  fromHolder.save();

  createBalanceSnapshot({
    address: event.params.from,
    amount: fromHolder.balance,
    blockNumber: event.block.number,
  });

  const toHolder = getHolder(event.params.to);
  toHolder.balance = toHolder.balance.plus(event.params.value);
  toHolder.lastUpdate = toMicroseconds(event.block.timestamp);
  toHolder.save();

  createBalanceSnapshot({
    address: event.params.to,
    amount: toHolder.balance,
    blockNumber: event.block.number,
  });
}

// Create hourly snapshots of the holders of ours interested addresses (MINTERS)
export function handleBlock(block: ethereum.Block): void {
  const currentHour = hourBucket(block.timestamp);

  // Run only if new hour detected
  let meta = BalanceMeta.load("singleton");
  if (meta == null) {
    meta = new BalanceMeta("singleton");
    meta.lastHour = 0;
  } else if (meta.lastHour == currentHour) {
    return;
  }

  // Update Minters balance
  const length = MINTERS.length;
  for (let i = 0; i < length; i++) {
    const minterAddress = Address.fromString(MINTERS[i]);
    const holder = getHolder(minterAddress);

    // Emit BalanceSnapshot for the hour's balance
    createBalanceSnapshot({
      address: minterAddress,
      amount: holder.balance,
      blockNumber: block.number,
    });
  }

  // Update tracker
  meta.lastHour = currentHour as i32;
  meta.save();
}
