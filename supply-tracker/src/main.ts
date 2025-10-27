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
} from "../generated/M0/Stablecoin";
import { YieldMeta } from "../generated/schema";
import { getStablecoin } from "./stablecoin";
import { getHolder } from "./holder";
import {
  toMicroseconds,
  hourBucket,
  getUnclaimedYield,
  calculateAccruedYield,
} from "./utils";
import {
  createReceivedSnapshot,
  createSentSnapshot,
  createSupplySnapshot,
  createTransferSnapshot,
  createYieldSnapshot,
  createHoldersSnapshot,
} from "./creators";

export function handleTransfer(event: TransferEvent): void {
  const ZERO_ADDRESS = Address.fromString(
    "0x0000000000000000000000000000000000000000",
  );

  const stablecoin = getStablecoin(event.address);
  const sender = getHolder(event.params.sender);
  const recipient = getHolder(event.params.recipient);
  const amount = event.params.amount;
  const ZERO = BigInt.fromI32(0);

  // Mint, Burn, or Transfer
  if (event.params.sender.equals(ZERO_ADDRESS)) {
    // Mint to recipient
    if (!amount.equals(ZERO)) {
      recipient.received = recipient.received.plus(amount);

      const recipientPrev = recipient.balance;
      recipient.balance = recipient.balance.plus(amount);
      createReceivedSnapshot({
        account: recipient.id,
        amount,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        logIndex: event.logIndex,
      });

      stablecoin.minted = stablecoin.minted.plus(amount);

      // Stablecoin supply snapshot for mint
      const supplyAfterMint = stablecoin.minted.minus(stablecoin.burned);
      stablecoin.supply = supplyAfterMint;
      createSupplySnapshot({
        amount: supplyAfterMint,
        stablecoin: stablecoin.id,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        logIndex: event.logIndex,
        delta: amount.toBigDecimal(),
        operation: "MINT",
      });

      // holdersCount join detection
      if (recipientPrev.equals(ZERO) && recipient.balance.gt(ZERO)) {
        stablecoin.holdersCount = (stablecoin.holdersCount as i32) + 1;

        createHoldersSnapshot({
          amount: stablecoin.holdersCount as i32,
          blockNumber: event.block.number,
          transactionHash: event.transaction.hash,
          logIndex: event.logIndex,
        });
      }
    }
  } else if (event.params.recipient.equals(ZERO_ADDRESS)) {
    // Burn from sender
    if (!amount.equals(ZERO)) {
      sender.sent = sender.sent.plus(amount);

      const senderPrev = sender.balance;
      sender.balance = sender.balance.minus(amount);
      createSentSnapshot({
        account: sender.id,
        amount,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        logIndex: event.logIndex,
      });

      stablecoin.burned = stablecoin.burned.plus(amount);

      // Stablecoin supply snapshot for burn
      const supplyAfterBurn = stablecoin.minted.minus(stablecoin.burned);
      stablecoin.supply = supplyAfterBurn;
      createSupplySnapshot({
        amount: supplyAfterBurn,
        stablecoin: stablecoin.id,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        logIndex: event.logIndex,
        delta: amount.toBigDecimal().times(BigDecimal.fromString("-1")),
        operation: "BURN",
      });

      // holdersCount leave detection
      if (senderPrev.gt(ZERO) && sender.balance.equals(ZERO)) {
        stablecoin.holdersCount = (stablecoin.holdersCount as i32) - 1;

        createHoldersSnapshot({
          amount: stablecoin.holdersCount as i32,
          blockNumber: event.block.number,
          transactionHash: event.transaction.hash,
          logIndex: event.logIndex,
        });
      }
    }
  } else {
    // Regular transfer between holders
    if (!amount.equals(ZERO)) {
      sender.sent = sender.sent.plus(amount);
      recipient.received = recipient.received.plus(amount);

      const senderPrev = sender.balance;
      const recipientPrev = recipient.balance;
      sender.balance = sender.balance.minus(amount);
      recipient.balance = recipient.balance.plus(amount);

      createSentSnapshot({
        account: sender.id,
        amount,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        logIndex: event.logIndex,
      });

      createReceivedSnapshot({
        account: recipient.id,
        amount,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        logIndex: event.logIndex,
      });

      // holdersCount join/leave detection for both sides
      let delta = 0;
      if (senderPrev.gt(ZERO) && sender.balance.equals(ZERO)) {
        delta -= 1;
      }
      if (recipientPrev.equals(ZERO) && recipient.balance.gt(ZERO)) {
        delta += 1;
      }
      if (delta != 0) {
        stablecoin.holdersCount =
          (stablecoin.holdersCount as i32) + (delta as i32);

        createHoldersSnapshot({
          amount: stablecoin.holdersCount as i32,
          blockNumber: event.block.number,
          transactionHash: event.transaction.hash,
          logIndex: event.logIndex,
        });
      }
    }
  }

  // Update lastUpdate markers
  stablecoin.lastUpdate = toMicroseconds(event.block.timestamp);
  stablecoin.save();

  sender.lastUpdate = toMicroseconds(event.block.timestamp);
  sender.save();

  recipient.lastUpdate = toMicroseconds(event.block.timestamp);
  recipient.save();

  // Persist the TransferSnapshot timeseries
  createTransferSnapshot({
    sender: event.params.sender,
    recipient: event.params.recipient,
    amount: event.params.amount,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
    logIndex: event.logIndex,
  });
}

export function handleYieldClaimed(event: YieldClaimedEvent): void {
  // Update aggregate on Stablecoin
  const stablecoin = getStablecoin(event.address);
  stablecoin.claimed = stablecoin.claimed.plus(event.params.yield_);

  const unclaimed = getUnclaimedYield();
  const newAccruedYield = calculateAccruedYield(stablecoin.claimed, unclaimed);
  stablecoin.accruedYield = newAccruedYield;
  stablecoin.lastUpdate = toMicroseconds(event.block.timestamp);
  stablecoin.save();

  // Emit YieldSnapshot reflecting the claim
  createYieldSnapshot({
    amount: newAccruedYield,
    claimed: stablecoin.claimed,
    unclaimed: unclaimed,
    blockNumber: event.block.number,
  });
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
  stablecoin.lastUpdate = toMicroseconds(block.timestamp);
  stablecoin.save();

  // Emit YieldSnapshot for the day's unclaimed yield
  createYieldSnapshot({
    amount: newAccruedYield,
    claimed: stablecoin.claimed,
    unclaimed: unclaimed,
    blockNumber: block.number,
  });

  // Update tracker
  meta.lastHour = currentHour as i32;
  meta.save();
}
