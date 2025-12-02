import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  TransferSnapshot,
  ReceivedSnapshot,
  SentSnapshot,
  SupplySnapshot,
  YieldSnapshot,
  HoldersSnapshot,
} from "../generated/schema";

// timeseries entities' id is set automatically by subgraph
// @see https://thegraph.com/docs/en/subgraphs/best-practices/timeseries/
const TIMESERIES_ID = 1;

class CreateTransferSnapshotArgs {
  sender: Bytes;
  recipient: Bytes;
  amount: BigInt;
  blockNumber: BigInt;
  transactionHash: Bytes;
  logIndex: BigInt;
}
export function createTransferSnapshot(
  args: CreateTransferSnapshotArgs,
): TransferSnapshot {
  const snap = new TransferSnapshot(TIMESERIES_ID);
  snap.sender = args.sender;
  snap.recipient = args.recipient;
  snap.amount = args.amount;
  snap.blockNumber = args.blockNumber;
  snap.transactionHash = args.transactionHash;
  snap.logIndex = args.logIndex;
  snap.save();

  return snap;
}

class CreateReceivedSnapshotArgs {
  account: Bytes;
  amount: BigInt;
  blockNumber: BigInt;
  transactionHash: Bytes;
  logIndex: BigInt;
}
export function createReceivedSnapshot(
  args: CreateReceivedSnapshotArgs,
): ReceivedSnapshot {
  const snap = new ReceivedSnapshot(TIMESERIES_ID);
  snap.account = args.account;
  snap.amount = args.amount;
  snap.blockNumber = args.blockNumber;
  snap.transactionHash = args.transactionHash;
  snap.logIndex = args.logIndex;
  snap.save();

  return snap;
}

class CreateSentSnapshotArgs {
  account: Bytes;
  amount: BigInt;
  blockNumber: BigInt;
  transactionHash: Bytes;
  logIndex: BigInt;
}
export function createSentSnapshot(args: CreateSentSnapshotArgs): SentSnapshot {
  const snap = new SentSnapshot(TIMESERIES_ID);
  snap.account = args.account;
  snap.amount = args.amount;
  snap.blockNumber = args.blockNumber;
  snap.transactionHash = args.transactionHash;
  snap.logIndex = args.logIndex;
  snap.save();

  return snap;
}

class CreateSupplySnapshotArgs {
  amount: BigInt;
  stablecoin: Bytes;
  blockNumber: BigInt;
  transactionHash: Bytes;
  logIndex: BigInt;
  delta: BigDecimal;
  operation: string; // Operation enum string
}
export function createSupplySnapshot(
  args: CreateSupplySnapshotArgs,
): SupplySnapshot {
  const snap = new SupplySnapshot(TIMESERIES_ID);
  snap.amount = args.amount;
  snap.stablecoin = args.stablecoin;
  snap.blockNumber = args.blockNumber;
  snap.transactionHash = args.transactionHash;
  snap.logIndex = args.logIndex;
  snap.delta = args.delta;
  snap.operation = args.operation;
  snap.save();

  return snap;
}

class CreateYieldSnapshotArgs {
  amount: BigInt;
  claimed: BigInt;
  unclaimed: BigInt;
  blockNumber: BigInt;
}
export function createYieldSnapshot(
  args: CreateYieldSnapshotArgs,
): YieldSnapshot {
  const snap = new YieldSnapshot(TIMESERIES_ID);
  snap.amount = args.amount;
  snap.claimed = args.claimed;
  snap.unclaimed = args.unclaimed;
  snap.blockNumber = args.blockNumber;
  snap.save();

  return snap;
}

class CreateHoldersSnapshotArgs {
  amount: i32;
  blockNumber: BigInt;
  transactionHash: Bytes;
  logIndex: BigInt;
}
// Holders count timeseries
export function createHoldersSnapshot(
  args: CreateHoldersSnapshotArgs,
): HoldersSnapshot {
  const snap = new HoldersSnapshot(TIMESERIES_ID);
  snap.amount = args.amount;
  snap.blockNumber = args.blockNumber;
  snap.transactionHash = args.transactionHash;
  snap.logIndex = args.logIndex;
  snap.save();

  return snap;
}
