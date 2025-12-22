import {
  AdminBurn as AdminBurnEvent,
  Bridge as BridgeEvent,
  Mint as MintEvent,
  OffchainRedeem as OffchainRedeemEvent,
  Transfer as TransferEvent,
} from "../generated/Superstate/Superstate";
import {
  AdminBurn,
  Bridge,
  Mint,
  OffchainRedeem,
  Transfer,
} from "../generated/schema";

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
