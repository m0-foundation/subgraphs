import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import {
  Transfer as TransferEvent,
  YieldClaimed as YieldClaimedEvent,
} from "../generated/USDZ/USDZ";
import {
  TransferSnapshot,
  YieldClaimedSnapshot,
  ReceivedSnapshot,
  SentSnapshot,
  SupplySnapshot,
} from "../generated/schema";
import { getStablecoin } from "./token";
import { getHolder } from "./holder";

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

      const receivedSnap = new ReceivedSnapshot(1); // overridden by subgraph
      receivedSnap.timestamp = event.block.timestamp.toI32();
      receivedSnap.account = recipient.id;
      receivedSnap.amount = amount;
      receivedSnap.blockNumber = event.block.number;
      receivedSnap.transactionHash = event.transaction.hash;
      receivedSnap.logIndex = event.logIndex;
      receivedSnap.save();

      stablecoin.minted = stablecoin.minted.plus(amount);

      // Stablecoin supply snapshot for mint
      const supplyAfterMint = stablecoin.minted.minus(stablecoin.burned);
      const supplySnapMint = new SupplySnapshot(1); // overridden by subgraph
      supplySnapMint.timestamp = event.block.timestamp.toI32();
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

      const sentSnap = new SentSnapshot(1); // overridden by subgraph
      sentSnap.timestamp = event.block.timestamp.toI32();
      sentSnap.account = sender.id;
      sentSnap.amount = amount;
      sentSnap.blockNumber = event.block.number;
      sentSnap.transactionHash = event.transaction.hash;
      sentSnap.logIndex = event.logIndex;
      sentSnap.save();

      stablecoin.burned = stablecoin.burned.plus(amount);

      // Stablecoin supply snapshot for burn
      const supplyAfterBurn = stablecoin.minted.minus(stablecoin.burned);
      const supplySnapBurn = new SupplySnapshot(1); // overridden by subgraph
      supplySnapBurn.timestamp = event.block.timestamp.toI32();
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

      const sentSnap = new SentSnapshot(1); // overridden by subgraph
      sentSnap.timestamp = event.block.timestamp.toI32();
      sentSnap.account = sender.id;
      sentSnap.amount = amount;
      sentSnap.blockNumber = event.block.number;
      sentSnap.transactionHash = event.transaction.hash;
      sentSnap.logIndex = event.logIndex;
      sentSnap.save();

      const receivedSnap = new ReceivedSnapshot(1); // overridden by subgraph
      receivedSnap.timestamp = event.block.timestamp.toI32();
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
  const transferSnap = new TransferSnapshot(1); // overridden by subgraph
  transferSnap.timestamp = event.block.timestamp.toI32();
  transferSnap.sender = event.params.sender;
  transferSnap.recipient = event.params.recipient;
  transferSnap.amount = event.params.amount;
  transferSnap.blockNumber = event.block.number;
  transferSnap.transactionHash = event.transaction.hash;
  transferSnap.logIndex = event.logIndex;
  transferSnap.save();
}

export function handleYieldClaimed(event: YieldClaimedEvent): void {
  let entity = new YieldClaimedSnapshot(1); // overriden by subgraph
  entity.amount = event.params.yield_;

  entity.blockNumber = event.block.number;
  entity.transactionHash = event.transaction.hash;
  entity.logIndex = event.logIndex;

  entity.save();
}
