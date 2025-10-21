import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  Transfer as TransferEvent,
  YieldClaimed as YieldClaimedEvent,
} from "../generated/USDZ/USDZ";
import {
  Transfer,
  YieldClaimedSnapshot,
  ReceivedSnapshot,
  SentSnapshot,
  MintedSnapshot,
  BurnedSnapshot,
  StablecoinSupply,
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
  const timestamp = event.block.timestamp.toI32();
  const amount = event.params.amount;

  // Mint, Burn, or Transfer
  if (event.params.sender.equals(ZERO_ADDRESS)) {
    // Mint to recipient
    if (!amount.equals(BigInt.fromI32(0))) {
      recipient.received = recipient.received.plus(amount);

      const receivedId = `${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`;
      const receivedSnap = new ReceivedSnapshot(receivedId);
      receivedSnap.timestamp = timestamp;
      receivedSnap.account = recipient.id;
      receivedSnap.amount = amount;
      receivedSnap.save();

      stablecoin.minted = stablecoin.minted.plus(amount);

      const mintedSnap = new MintedSnapshot(1); // overridden by subgraph
      mintedSnap.timestamp = timestamp;
      mintedSnap.amount = amount;
      mintedSnap.save();
    }
  } else if (event.params.recipient.equals(ZERO_ADDRESS)) {
    // Burn from sender
    if (!amount.equals(BigInt.fromI32(0))) {
      sender.sent = sender.sent.plus(amount);

      const sentId = `${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`;
      const sentSnap = new SentSnapshot(sentId);
      sentSnap.timestamp = timestamp;
      sentSnap.account = sender.id;
      sentSnap.amount = amount;
      sentSnap.save();

      stablecoin.burned = stablecoin.burned.plus(amount);

      const burnedSnap = new BurnedSnapshot(1); // overridden by subgraph
      burnedSnap.timestamp = timestamp;
      burnedSnap.amount = amount;
      burnedSnap.save();
    }
  } else {
    // Regular transfer between holders
    if (!amount.equals(BigInt.fromI32(0))) {
      sender.sent = sender.sent.plus(amount);
      recipient.received = recipient.received.plus(amount);

      const sentId = `${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`;
      const sentSnap = new SentSnapshot(sentId);
      sentSnap.timestamp = timestamp;
      sentSnap.account = sender.id;
      sentSnap.amount = amount;
      sentSnap.save();

      const receivedId = `${event.transaction.hash.toHexString()}-${event.logIndex.toI32().toString()}`;
      const receivedSnap = new ReceivedSnapshot(receivedId);
      receivedSnap.timestamp = timestamp;
      receivedSnap.account = recipient.id;
      receivedSnap.amount = amount;
      receivedSnap.save();
    }
  }

  // Update supply snapshot each transfer (mint/burn affect net supply)
  const supply = stablecoin.minted.minus(stablecoin.burned);
  const supplySnap = new StablecoinSupply(1); // overridden by subgraph
  supplySnap.timestamp = timestamp;
  supplySnap.amount = supply;
  supplySnap.stablecoin = stablecoin.id;
  supplySnap.save();

  // Update lastUpdate markers
  stablecoin.lastUpdate = timestamp;
  stablecoin.save();

  sender.lastUpdate = timestamp;
  sender.save();

  recipient.lastUpdate = timestamp;
  recipient.save();

  // Persist the Transfer entity
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
  let entity = new YieldClaimedSnapshot(1); // overriden by subgraph
  entity.amount = event.params.yield_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
