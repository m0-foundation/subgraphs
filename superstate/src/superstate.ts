import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  AdminBurn as AdminBurnEvent,
  Bridge as BridgeEvent,
  Mint as MintEvent,
  OffchainRedeem as OffchainRedeemEvent,
  Transfer as TransferEvent,
} from "../generated/Superstate/Superstate";
import {
  AdminBurn,
  BalanceMeta,
  BalanceSnapshot,
  Bridge,
  Mint,
  OffchainRedeem,
  Transfer,
} from "../generated/schema";
import {
  getBalanceOf,
  getHolder,
  hourBucket,
  MINTERS,
  toMicroseconds,
} from "./utils";

export function handleAdminBurn(event: AdminBurnEvent): void {
  let entity = new AdminBurn(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.burner = event.params.burner;
  entity.src = event.params.src;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleBridge(event: BridgeEvent): void {
  let entity = new Bridge(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.caller = event.params.caller;
  entity.src = event.params.src;
  entity.amount = event.params.amount;
  entity.ethDestinationAddress = event.params.ethDestinationAddress;
  entity.otherDestinationAddress = event.params.otherDestinationAddress;
  entity.chainId = event.params.chainId;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMint(event: MintEvent): void {
  let entity = new Mint(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.minter = event.params.minter;
  entity.to = event.params.to;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOffchainRedeem(event: OffchainRedeemEvent): void {
  let entity = new OffchainRedeem(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.burner = event.params.burner;
  entity.src = event.params.src;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

class CreateBalanceSnapshotArgs {
  address: Address;
  amount: BigInt;
  blockNumber: BigInt;
}
export function createBalanceSnapshot(
  args: CreateBalanceSnapshotArgs,
): BalanceSnapshot {
  const snap = new BalanceSnapshot(1); // automatically handled
  snap.address = args.address;
  snap.amount = args.amount;
  snap.blockNumber = args.blockNumber;
  snap.save();

  return snap;
}

// Runs on every block; snapshot unclaimed balance once per hour
export function handleBlock(block: ethereum.Block): void {
  let currentHour = hourBucket(block.timestamp);

  // Run only if new hour detected
  let meta = BalanceMeta.load("singleton");
  if (meta == null) {
    meta = new BalanceMeta("singleton");
    meta.lastHour = 0;
  }
  if (meta.lastHour == currentHour) {
    return;
  }

  // Update Minters balance
  for (let i = 0; i < MINTERS.length; i++) {
    const minterAddress = Address.fromString(MINTERS[i].address);
    const holder = getHolder(minterAddress);
    const balance = getBalanceOf(minterAddress);

    holder.balance = balance;
    holder.lastUpdate = toMicroseconds(block.timestamp);
    holder.save();

    // Emit BalanceSnapshot for the day's unclaimed balance
    createBalanceSnapshot({
      address: minterAddress,
      amount: balance,
      blockNumber: block.number,
    });
  }

  // Update tracker
  meta.lastHour = currentHour as i32;
  meta.save();
}
