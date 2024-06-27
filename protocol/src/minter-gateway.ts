import {
  ethereum,
  Address,
  BigInt,
  dataSource,
} from "@graphprotocol/graph-ts";

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
} from "../generated/MinterGateway/MinterGateway"
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
  TotalActiveOwedM,
  ActiveOwedM
} from "../generated/schema"

export function handleBurnExecutedActiveOwedM(event: BurnExecutedEvent): void {
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

export function handleBurnExecutedInactiveOwedM(event: BurnExecuted1Event): void {
  let entity = new BurnExecuted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.minter = event.params.minter
  entity.amount = event.params.amount
  entity.payer = event.params.payer
  entity.principalAmount = event.params.principalAmount

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

  handleActiveOwedM<CollateralUpdatedEvent>(event);
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

  handleActiveOwedM<MintExecutedEvent>(event);
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








export class ActiveOwedM__Params {
  _event: ActiveOwedMEvent;

  constructor(event: ActiveOwedMEvent) {
    this._event = event;
  }

  get minter(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class ActiveOwedMEvent extends ethereum.Event {
  get params(): ActiveOwedM__Params {
    return new ActiveOwedM__Params(this);
  }
}

export function handleActiveOwedM<T extends ActiveOwedMEvent>(event: T): void {
  // Bind the contract to the address that emitted the event
let contract = MinterGatewayContract.bind(event.address)
    // Access state variables and functions by calling them
let activeOwedM = contract.activeOwedMOf(event.params.minter)

let entity = new ActiveOwedM(
  event.params.minter.toString().concat("-").concat(event.block.number.toString())
)
if(activeOwedM) {
  entity.minter = event.params.minter
  entity.amount = activeOwedM
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.save()
}
}




export function handleTotalActiveOwedM(block: ethereum.Block): void {
  // Bind the contract to the address that emitted the event
  let contract = MinterGatewayContract.bind(dataSource.address())
  // Access state variables and functions by calling them
  let totalActiveOwedM = contract.totalActiveOwedM()

  let entity = new TotalActiveOwedM(block.hash)
  // totalActiveOwedM > 0 then save
  if(totalActiveOwedM && totalActiveOwedM.gt(BigInt.fromI32(0))) {
    entity.amount = totalActiveOwedM
    entity.blockNumber = block.number
    entity.blockTimestamp = block.timestamp
    entity.save()
  }
}



export function handleNewBlock(event: ethereum.Block): void {

  handleTotalActiveOwedM(event);
}