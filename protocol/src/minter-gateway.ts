import { ethereum, Address, BigInt, dataSource } from "@graphprotocol/graph-ts";

import {
  BurnExecuted as BurnExecutedEvent,
  BurnExecuted1 as BurnExecuted1Event,
  CollateralUpdated as CollateralUpdatedEvent,
  IndexUpdated as IndexUpdatedEvent,
  MintCanceled as MintCanceledEvent,
  MintExecuted as MintExecutedEvent,
  MintProposed as MintProposedEvent,
  MinterActivated as MinterActivatedEvent,
  MinterDeactivated as MinterDeactivatedEvent,
  MinterFrozen as MinterFrozenEvent,
  MissedIntervalsPenaltyImposed as MissedIntervalsPenaltyImposedEvent,
  RetrievalCreated as RetrievalCreatedEvent,
  RetrievalResolved as RetrievalResolvedEvent,
  UndercollateralizedPenaltyImposed as UndercollateralizedPenaltyImposedEvent,
  MinterGateway as MinterGatewayContract,
} from "../generated/MinterGateway/MinterGateway";
import {
  BurnExecuted,
  CollateralUpdated,
  IndexUpdated,
  MintCanceled,
  MintExecuted,
  MintProposed,
  MinterActivated,
  MinterDeactivated,
  MinterFrozen,
  MissedIntervalsPenaltyImposed,
  RetrievalCreated,
  RetrievalResolved,
  UndercollateralizedPenaltyImposed,
  PrincipalOfTotalActiveOwedM,
  TotalOwedM,
  TotalActiveOwedM,
  TotalActiveOwedMDailySnapshot,
  TotalInactiveOwedM,
  TotalExcessOwedM,
  MinterActiveOwedMOf,
  MinterInactiveOwedMOf,
  MinterPrincipalOfActiveOwedMOf,
  MinterCollateralOf,
} from "../generated/schema";

import { dayFromTimestamp } from "./utils";

export function handleBurnExecutedActiveOwedM(event: BurnExecutedEvent): void {
  let entity = new BurnExecuted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.minter = event.params.minter;
  entity.amount = event.params.amount;
  entity.payer = event.params.payer;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  handleMinterAttributes<BurnExecutedEvent>(event);
}

export function handleBurnExecutedInactiveOwedM(
  event: BurnExecuted1Event
): void {
  let entity = new BurnExecuted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.minter = event.params.minter;
  entity.amount = event.params.amount;
  entity.payer = event.params.payer;
  entity.principalAmount = event.params.principalAmount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  handleMinterAttributes<BurnExecuted1Event>(event);
}

export function handleCollateralUpdated(event: CollateralUpdatedEvent): void {
  let entity = new CollateralUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.minter = event.params.minter;
  entity.collateral = event.params.collateral;
  entity.totalResolvedCollateralRetrieval =
    event.params.totalResolvedCollateralRetrieval;
  entity.metadataHash = event.params.metadataHash;
  entity.timestamp = event.params.timestamp;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  handleMinterAttributes<CollateralUpdatedEvent>(event);
}

export function handleIndexUpdated(event: IndexUpdatedEvent): void {
  let entity = new IndexUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.index = event.params.index;
  entity.rate = event.params.rate;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMintCanceled(event: MintCanceledEvent): void {
  let entity = new MintCanceled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.mintId = event.params.mintId;
  entity.minter = event.params.minter;
  entity.canceller = event.params.canceller;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  handleMinterAttributes<MintCanceledEvent>(event);
}

export function handleMintExecuted(event: MintExecutedEvent): void {
  let entity = new MintExecuted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.mintId = event.params.mintId;
  entity.minter = event.params.minter;
  entity.principalAmount = event.params.principalAmount;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  handleMinterAttributes<MintExecutedEvent>(event);
}

export function handleMintProposed(event: MintProposedEvent): void {
  let entity = new MintProposed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.mintId = event.params.mintId;
  entity.minter = event.params.minter;
  entity.amount = event.params.amount;
  entity.destination = event.params.destination;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMinterActivated(event: MinterActivatedEvent): void {
  let entity = new MinterActivated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.minter = event.params.minter;
  entity.caller = event.params.caller;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  handleMinterAttributes<MinterActivatedEvent>(event);
}

export function handleMinterDeactivated(event: MinterDeactivatedEvent): void {
  let entity = new MinterDeactivated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.minter = event.params.minter;
  entity.inactiveOwedM = event.params.inactiveOwedM;
  entity.caller = event.params.caller;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  handleMinterAttributes<MinterDeactivatedEvent>(event);
}

export function handleMinterFrozen(event: MinterFrozenEvent): void {
  let entity = new MinterFrozen(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.minter = event.params.minter;
  entity.frozenUntil = event.params.frozenUntil;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  handleMinterAttributes<MinterFrozenEvent>(event);
}

export function handleMissedIntervalsPenaltyImposed(
  event: MissedIntervalsPenaltyImposedEvent
): void {
  let entity = new MissedIntervalsPenaltyImposed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.minter = event.params.minter;
  entity.missedIntervals = event.params.missedIntervals;
  entity.penaltyAmount = event.params.penaltyAmount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  handleMinterAttributes<MissedIntervalsPenaltyImposedEvent>(event);
}

export function handleRetrievalCreated(event: RetrievalCreatedEvent): void {
  let entity = new RetrievalCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.retrievalId = event.params.retrievalId;
  entity.minter = event.params.minter;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  handleMinterAttributes<RetrievalCreatedEvent>(event);
}

export function handleRetrievalResolved(event: RetrievalResolvedEvent): void {
  let entity = new RetrievalResolved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.retrievalId = event.params.retrievalId;
  entity.minter = event.params.minter;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  handleMinterAttributes<RetrievalResolvedEvent>(event);
}

export function handleUndercollateralizedPenaltyImposed(
  event: UndercollateralizedPenaltyImposedEvent
): void {
  let entity = new UndercollateralizedPenaltyImposed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.minter = event.params.minter;
  entity.excessOwedM = event.params.excessOwedM;
  entity.timeSpan = event.params.timeSpan;
  entity.penaltyAmount = event.params.penaltyAmount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  handleMinterAttributes<UndercollateralizedPenaltyImposedEvent>(event);
}
//
// Timeseries entities
//
export function handlePrincipalOfTotalActiveOwedM(block: ethereum.Block): void {
  // Bind the contract to the address that emitted the event
  let contract = MinterGatewayContract.bind(dataSource.address());
  let amount = contract.principalOfTotalActiveOwedM();
  let entity = new PrincipalOfTotalActiveOwedM(block.hash);
  createTimeseriesEntity<PrincipalOfTotalActiveOwedM>(entity, amount, block);
}

export function handleTotalOwedM(block: ethereum.Block): void {
  let contract = MinterGatewayContract.bind(dataSource.address());
  let amount = contract.totalOwedM();
  let entity = new TotalOwedM(block.hash);
  createTimeseriesEntity<TotalOwedM>(entity, amount, block);
}

export function handleTotalActiveOwedM(block: ethereum.Block): void {
  let contract = MinterGatewayContract.bind(dataSource.address());
  let amount = contract.totalActiveOwedM();
  let entity = new TotalActiveOwedM(block.hash);
  entity = createTimeseriesEntity<TotalActiveOwedM>(entity, amount, block);

  createTotalActiveOwedMDailySnapshot(entity);
}

function createTotalActiveOwedMDailySnapshot(owedM: TotalActiveOwedM): void {
  let day = dayFromTimestamp(owedM.blockTimestamp);
  let existing = TotalActiveOwedMDailySnapshot.load(owedM.id);

  if (existing == null) {
    let entity = new TotalActiveOwedMDailySnapshot(owedM.id);
    entity.amount = owedM.amount;
    entity.blockNumber = owedM.blockNumber;
    entity.blockTimestamp = owedM.blockTimestamp;
    entity.dayTimestamp = day;
    entity.save();
  }
}

export function handleTotalInactiveOwedM(block: ethereum.Block): void {
  // Bind the contract to the address that emitted the event
  let contract = MinterGatewayContract.bind(dataSource.address());
  let amount = contract.totalInactiveOwedM();
  let entity = new TotalInactiveOwedM(block.hash);
  createTimeseriesEntity<TotalInactiveOwedM>(entity, amount, block);
}

export function handleTotalExcessOwedM(block: ethereum.Block): void {
  let contract = MinterGatewayContract.bind(dataSource.address());
  let amount = contract.excessOwedM();
  let entity = new TotalExcessOwedM(block.hash);
  createTimeseriesEntity<TotalExcessOwedM>(entity, amount, block);
}

function createTimeseriesEntity<E extends TotalOwedM>(
  entity: E,
  amount: BigInt,
  block: ethereum.Block
): E {
  if (amount && amount.gt(BigInt.fromI32(0))) {
    entity.amount = amount;
    entity.blockNumber = block.number;
    entity.blockTimestamp = block.timestamp;
    entity.save();
  }

  return entity;
}

export function handleNewBlock(block: ethereum.Block): void {
  handlePrincipalOfTotalActiveOwedM(block);
  handleTotalOwedM(block);
  handleTotalActiveOwedM(block);
  handleTotalInactiveOwedM(block);
  handleTotalExcessOwedM(block);
}
//
// Minter entities
//
export class HasMinterParams {
  _event: HasMinterEvent;

  constructor(event: HasMinterEvent) {
    this._event = event;
  }

  get minter(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}
export class HasMinterEvent extends ethereum.Event {
  get params(): HasMinterParams {
    return new HasMinterParams(this);
  }
}

export function handleMinterAttributes<T extends HasMinterEvent>(
  event: T
): void {
  handleNewBlock(event.block);
  handleMinterActiveOwedMOf<T>(event);
  handleMinterInactiveOwedMOf<T>(event);
  handleMinterPrincipalOfActiveOwedMOf<T>(event);
  handleMinterCollateralOf<T>(event);
}

export function handleMinterActiveOwedMOf<T extends HasMinterEvent>(
  event: T
): void {
  let contract = MinterGatewayContract.bind(event.address);
  let amount = contract.activeOwedMOf(event.params.minter);
  let entity = new MinterActiveOwedMOf(
    event.params.minter
      .toString()
      .concat("-")
      .concat(event.block.number.toString())
  );
  createMinterAttributeEntity<MinterActiveOwedMOf, T>(entity, amount, event);
}

export function handleMinterInactiveOwedMOf<T extends HasMinterEvent>(
  event: T
): void {
  let contract = MinterGatewayContract.bind(event.address);
  let amount = contract.inactiveOwedMOf(event.params.minter);
  let entity = new MinterInactiveOwedMOf(
    event.params.minter
      .toString()
      .concat("-")
      .concat(event.block.number.toString())
  );
  createMinterAttributeEntity<MinterInactiveOwedMOf, T>(entity, amount, event);
}

export function handleMinterPrincipalOfActiveOwedMOf<T extends HasMinterEvent>(
  event: T
): void {
  let contract = MinterGatewayContract.bind(event.address);
  let amount = contract.principalOfActiveOwedMOf(event.params.minter);
  let entity = new MinterPrincipalOfActiveOwedMOf(
    event.params.minter
      .toString()
      .concat("-")
      .concat(event.block.number.toString())
  );
  createMinterAttributeEntity<MinterPrincipalOfActiveOwedMOf, T>(
    entity,
    amount,
    event
  );
}

export function handleMinterCollateralOf<T extends HasMinterEvent>(
  event: T
): void {
  let contract = MinterGatewayContract.bind(event.address);
  let amount = contract.collateralOf(event.params.minter);
  let entity = new MinterCollateralOf(
    event.params.minter
      .toString()
      .concat("-")
      .concat(event.block.number.toString())
  );
  createMinterAttributeEntity<MinterCollateralOf, T>(entity, amount, event);
}
// assemblescript does not support union type then can be achieved by using generic type
// https://www.assemblyscript.org/concepts.html
function createMinterAttributeEntity<
  E extends MinterActiveOwedMOf,
  T extends HasMinterEvent,
>(entity: E, amount: BigInt, event: T): void {
  if (amount) {
    entity.amount = amount;
    entity.minter = event.params.minter;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.save();
  }
}
