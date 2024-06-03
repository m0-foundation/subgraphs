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
  UndercollateralizedPenaltyImposed as UndercollateralizedPenaltyImposedEvent
} from "../generated/MinterGateway/MinterGateway"
import {
  BurnExecuted,
  BurnExecuted1,
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
  UndercollateralizedPenaltyImposed
} from "../generated/schema"

export function handleBurnExecuted(event: BurnExecutedEvent): void {
  let entity = new BurnExecuted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.minter = event.params.minter
  entity.amount = event.params.amount
  entity.payer = event.params.payer

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBurnExecuted1(event: BurnExecuted1Event): void {
  let entity = new BurnExecuted1(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.minter = event.params.minter
  entity.principalAmount = event.params.principalAmount
  entity.amount = event.params.amount
  entity.payer = event.params.payer

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCollateralUpdated(event: CollateralUpdatedEvent): void {
  let entity = new CollateralUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.minter = event.params.minter
  entity.collateral = event.params.collateral
  entity.totalResolvedCollateralRetrieval =
    event.params.totalResolvedCollateralRetrieval
  entity.metadataHash = event.params.metadataHash
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}


export function handleIndexUpdated(event: IndexUpdatedEvent): void {
  let entity = new IndexUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.index = event.params.index
  entity.rate = event.params.rate

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMintCanceled(event: MintCanceledEvent): void {
  let entity = new MintCanceled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.mintId = event.params.mintId
  entity.minter = event.params.minter
  entity.canceller = event.params.canceller

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMintExecuted(event: MintExecutedEvent): void {
  let entity = new MintExecuted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.mintId = event.params.mintId
  entity.minter = event.params.minter
  entity.principalAmount = event.params.principalAmount
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMintProposed(event: MintProposedEvent): void {
  let entity = new MintProposed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.mintId = event.params.mintId
  entity.minter = event.params.minter
  entity.amount = event.params.amount
  entity.destination = event.params.destination

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMinterActivated(event: MinterActivatedEvent): void {
  let entity = new MinterActivated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.minter = event.params.minter
  entity.caller = event.params.caller

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMinterDeactivated(event: MinterDeactivatedEvent): void {
  let entity = new MinterDeactivated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.minter = event.params.minter
  entity.inactiveOwedM = event.params.inactiveOwedM
  entity.caller = event.params.caller

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMinterFrozen(event: MinterFrozenEvent): void {
  let entity = new MinterFrozen(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.minter = event.params.minter
  entity.frozenUntil = event.params.frozenUntil

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMissedIntervalsPenaltyImposed(
  event: MissedIntervalsPenaltyImposedEvent
): void {
  let entity = new MissedIntervalsPenaltyImposed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.minter = event.params.minter
  entity.missedIntervals = event.params.missedIntervals
  entity.penaltyAmount = event.params.penaltyAmount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRetrievalCreated(event: RetrievalCreatedEvent): void {
  let entity = new RetrievalCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.retrievalId = event.params.retrievalId
  entity.minter = event.params.minter
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRetrievalResolved(event: RetrievalResolvedEvent): void {
  let entity = new RetrievalResolved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.retrievalId = event.params.retrievalId
  entity.minter = event.params.minter

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUndercollateralizedPenaltyImposed(
  event: UndercollateralizedPenaltyImposedEvent
): void {
  let entity = new UndercollateralizedPenaltyImposed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.minter = event.params.minter
  entity.excessOwedM = event.params.excessOwedM
  entity.timeSpan = event.params.timeSpan
  entity.penaltyAmount = event.params.penaltyAmount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
