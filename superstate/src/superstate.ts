import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../generated/Superstate/Superstate";
import { BalanceMeta, Transfer } from "../generated/schema";
import {
  createBalanceSnapshot,
  getHolder,
  hourBucket,
  toMicroseconds,
} from "./utils";
import { USTB_WALLETS } from "./ustbWallets";

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

// Runs on every block; snapshot unclaimed balance at 00:00, 08:00, 16:00 UTC
export function handleBlock(block: ethereum.Block): void {
  const currentSnapshotTime = hourBucket(block.timestamp);

  // Run only if new snapshot time detected
  let meta = BalanceMeta.load("singleton");
  if (meta == null) {
    meta = new BalanceMeta("singleton");
    meta.lastHour = 0;
  } else if (meta.lastHour == currentSnapshotTime) {
    return;
  }

  // Update Minters balance
  const length = USTB_WALLETS.length;
  for (let i = 0; i < length; i++) {
    const minterAddress = Address.fromString(USTB_WALLETS[i]);
    const holder = getHolder(minterAddress);

    // Emit BalanceSnapshot for the hour's balance
    createBalanceSnapshot({
      address: minterAddress,
      amount: holder.balance,
      blockNumber: block.number,
    });
  }

  // Update tracker
  meta.lastHour = currentSnapshotTime as i32;
  meta.save();
}
