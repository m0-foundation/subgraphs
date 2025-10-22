import {
  Address,
  BigInt,
  BigDecimal,
  ethereum,
  dataSource,
} from "@graphprotocol/graph-ts";
import {
  Transfer as TransferEvent,
  YieldClaimed as YieldClaimedEvent,
  USDZ as USDZContract,
} from "../generated/USDZ/USDZ";
import {
  TransferSnapshot,
  ReceivedSnapshot,
  SentSnapshot,
  SupplySnapshot,
  YieldSnapshot,
  YieldMeta,
} from "../generated/schema";
import { getStablecoin } from "./token";
import { getHolder } from "./holder";

// timeseries entities' id and timestamp is set automatically by subgraph
// @see https://thegraph.com/docs/en/subgraphs/best-practices/timeseries/
const TIMESERIES_ID = 1;

export function handleTransfer(event: TransferEvent): void {
  const ZERO_ADDRESS = Address.fromString(
    "0x0000000000000000000000000000000000000000",
  );

  const stablecoin = getStablecoin(event.address);
  const sender = getHolder(event.params.sender);
  const recipient = getHolder(event.params.recipient);
  const amount = event.params.amount;

  // Mint, Burn, or Transfer
  if (event.params.sender.equals(ZERO_ADDRESS)) {
    // Mint to recipient
    if (!amount.equals(BigInt.fromI32(0))) {
      recipient.received = recipient.received.plus(amount);

      const receivedSnap = new ReceivedSnapshot(TIMESERIES_ID);
      receivedSnap.account = recipient.id;
      receivedSnap.amount = amount;
      receivedSnap.blockNumber = event.block.number;
      receivedSnap.transactionHash = event.transaction.hash;
      receivedSnap.logIndex = event.logIndex;
      receivedSnap.save();

      stablecoin.minted = stablecoin.minted.plus(amount);

      // Stablecoin supply snapshot for mint
      const supplyAfterMint = stablecoin.minted.minus(stablecoin.burned);
      stablecoin.supply = supplyAfterMint;
      const supplySnapMint = new SupplySnapshot(TIMESERIES_ID);
      supplySnapMint.amount = supplyAfterMint;
      supplySnapMint.stablecoin = stablecoin.id;
      supplySnapMint.blockNumber = event.block.number;
      supplySnapMint.transactionHash = event.transaction.hash;
      supplySnapMint.logIndex = event.logIndex;
      supplySnapMint.delta = amount.toBigDecimal();
      supplySnapMint.operation = "MINT";
      supplySnapMint.save();
    }
  } else if (event.params.recipient.equals(ZERO_ADDRESS)) {
    // Burn from sender
    if (!amount.equals(BigInt.fromI32(0))) {
      sender.sent = sender.sent.plus(amount);

      const sentSnap = new SentSnapshot(TIMESERIES_ID);
      sentSnap.account = sender.id;
      sentSnap.amount = amount;
      sentSnap.blockNumber = event.block.number;
      sentSnap.transactionHash = event.transaction.hash;
      sentSnap.logIndex = event.logIndex;
      sentSnap.save();

      stablecoin.burned = stablecoin.burned.plus(amount);

      // Stablecoin supply snapshot for burn
      const supplyAfterBurn = stablecoin.minted.minus(stablecoin.burned);
      stablecoin.supply = supplyAfterBurn;
      const supplySnapBurn = new SupplySnapshot(TIMESERIES_ID);
      supplySnapBurn.amount = supplyAfterBurn;
      supplySnapBurn.stablecoin = stablecoin.id;
      supplySnapBurn.blockNumber = event.block.number;
      supplySnapBurn.transactionHash = event.transaction.hash;
      supplySnapBurn.logIndex = event.logIndex;
      supplySnapBurn.delta = amount
        .toBigDecimal()
        .times(BigDecimal.fromString("-1"));
      supplySnapBurn.operation = "BURN";
      supplySnapBurn.save();
    }
  } else {
    // Regular transfer between holders
    if (!amount.equals(BigInt.fromI32(0))) {
      sender.sent = sender.sent.plus(amount);
      recipient.received = recipient.received.plus(amount);

      const sentSnap = new SentSnapshot(TIMESERIES_ID);
      sentSnap.account = sender.id;
      sentSnap.amount = amount;
      sentSnap.blockNumber = event.block.number;
      sentSnap.transactionHash = event.transaction.hash;
      sentSnap.logIndex = event.logIndex;
      sentSnap.save();

      const receivedSnap = new ReceivedSnapshot(TIMESERIES_ID);
      receivedSnap.account = recipient.id;
      receivedSnap.amount = amount;
      receivedSnap.blockNumber = event.block.number;
      receivedSnap.transactionHash = event.transaction.hash;
      receivedSnap.logIndex = event.logIndex;
      receivedSnap.save();
    }
  }

  // Update lastUpdate markers
  stablecoin.lastUpdate = event.block.timestamp.toI32();
  stablecoin.save();

  sender.lastUpdate = event.block.timestamp.toI32();
  sender.save();

  recipient.lastUpdate = event.block.timestamp.toI32();
  recipient.save();

  // Persist the TransferSnapshot timeseries
  const transferSnap = new TransferSnapshot(TIMESERIES_ID);
  transferSnap.sender = event.params.sender;
  transferSnap.recipient = event.params.recipient;
  transferSnap.amount = event.params.amount;
  transferSnap.blockNumber = event.block.number;
  transferSnap.transactionHash = event.transaction.hash;
  transferSnap.logIndex = event.logIndex;
  transferSnap.save();
}

export function handleYieldClaimed(event: YieldClaimedEvent): void {
  // Update aggregate on Stablecoin
  const stablecoin = getStablecoin(event.address);
  stablecoin.claimed = stablecoin.claimed.plus(event.params.yield_);

  const unclaimed = getUnclaimedYield();
  const newAccruedYield = calculateAccruedYield(stablecoin.claimed, unclaimed);
  stablecoin.accruedYield = newAccruedYield;
  stablecoin.lastUpdate = event.block.timestamp.toI32();
  stablecoin.save();

  // Emit YieldSnapshot reflecting the claim
  const yieldSnap = new YieldSnapshot(TIMESERIES_ID);
  yieldSnap.amount = newAccruedYield;
  yieldSnap.claimed = stablecoin.claimed;
  yieldSnap.unclaimed = unclaimed;
  yieldSnap.blockNumber = event.block.number;
  yieldSnap.save();
}

// Runs on every block; snapshot unclaimed yield once per hour
export function handleBlock(block: ethereum.Block): void {
  let currentHour = hourBucket(block.timestamp);

  // Run only if new hour detected
  let meta = YieldMeta.load("singleton");
  if (meta == null) {
    meta = new YieldMeta("singleton");
    meta.lastHour = 0;
  }
  if (meta.lastHour == currentHour) {
    return;
  }

  // Update stablecoin aggregates
  const unclaimed = getUnclaimedYield();
  const stablecoin = getStablecoin(dataSource.address());
  const newAccruedYield = calculateAccruedYield(stablecoin.claimed, unclaimed);

  stablecoin.accruedYield = newAccruedYield;
  stablecoin.lastUpdate = block.timestamp.toI32();
  stablecoin.save();

  // Emit YieldSnapshot for the day's unclaimed yield
  const yieldSnap = new YieldSnapshot(TIMESERIES_ID);
  yieldSnap.amount = newAccruedYield;
  yieldSnap.claimed = stablecoin.claimed;
  yieldSnap.unclaimed = unclaimed;
  yieldSnap.blockNumber = block.number;
  yieldSnap.save();

  // Update tracker
  meta.lastHour = currentHour as i32;
  meta.save();
}

function hourBucket(timestamp: BigInt): i64 {
  let startOfHour = timestamp.toI64();
  return startOfHour - (startOfHour % 3600); // floor to start of the hour
}

function getUnclaimedYield(): BigInt {
  const contract = USDZContract.bind(dataSource.address());
  let unclaimed = BigInt.fromI32(0);
  const res = contract.try_yield_();
  if (!res.reverted) {
    unclaimed = res.value;
  }

  return unclaimed;
}

function calculateAccruedYield(claimed: BigInt, unclaimed: BigInt): BigInt {
  return claimed.plus(unclaimed);
}
