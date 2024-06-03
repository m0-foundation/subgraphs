import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  BurnExecuted,
  BurnExecuted1,
  CollateralUpdated,
  EIP712DomainChanged,
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
} from "../generated/MinterGateway/MinterGateway"

export function createBurnExecutedEvent(
  minter: Address,
  amount: BigInt,
  payer: Address
): BurnExecuted {
  let burnExecutedEvent = changetype<BurnExecuted>(newMockEvent())

  burnExecutedEvent.parameters = new Array()

  burnExecutedEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  burnExecutedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  burnExecutedEvent.parameters.push(
    new ethereum.EventParam("payer", ethereum.Value.fromAddress(payer))
  )

  return burnExecutedEvent
}

export function createBurnExecuted1Event(
  minter: Address,
  principalAmount: BigInt,
  amount: BigInt,
  payer: Address
): BurnExecuted1 {
  let burnExecuted1Event = changetype<BurnExecuted1>(newMockEvent())

  burnExecuted1Event.parameters = new Array()

  burnExecuted1Event.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  burnExecuted1Event.parameters.push(
    new ethereum.EventParam(
      "principalAmount",
      ethereum.Value.fromUnsignedBigInt(principalAmount)
    )
  )
  burnExecuted1Event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  burnExecuted1Event.parameters.push(
    new ethereum.EventParam("payer", ethereum.Value.fromAddress(payer))
  )

  return burnExecuted1Event
}

export function createCollateralUpdatedEvent(
  minter: Address,
  collateral: BigInt,
  totalResolvedCollateralRetrieval: BigInt,
  metadataHash: Bytes,
  timestamp: BigInt
): CollateralUpdated {
  let collateralUpdatedEvent = changetype<CollateralUpdated>(newMockEvent())

  collateralUpdatedEvent.parameters = new Array()

  collateralUpdatedEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  collateralUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "collateral",
      ethereum.Value.fromUnsignedBigInt(collateral)
    )
  )
  collateralUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "totalResolvedCollateralRetrieval",
      ethereum.Value.fromUnsignedBigInt(totalResolvedCollateralRetrieval)
    )
  )
  collateralUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "metadataHash",
      ethereum.Value.fromFixedBytes(metadataHash)
    )
  )
  collateralUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return collateralUpdatedEvent
}

export function createEIP712DomainChangedEvent(): EIP712DomainChanged {
  let eip712DomainChangedEvent = changetype<EIP712DomainChanged>(newMockEvent())

  eip712DomainChangedEvent.parameters = new Array()

  return eip712DomainChangedEvent
}

export function createIndexUpdatedEvent(
  index: BigInt,
  rate: BigInt
): IndexUpdated {
  let indexUpdatedEvent = changetype<IndexUpdated>(newMockEvent())

  indexUpdatedEvent.parameters = new Array()

  indexUpdatedEvent.parameters.push(
    new ethereum.EventParam("index", ethereum.Value.fromUnsignedBigInt(index))
  )
  indexUpdatedEvent.parameters.push(
    new ethereum.EventParam("rate", ethereum.Value.fromUnsignedBigInt(rate))
  )

  return indexUpdatedEvent
}

export function createMintCanceledEvent(
  mintId: BigInt,
  minter: Address,
  canceller: Address
): MintCanceled {
  let mintCanceledEvent = changetype<MintCanceled>(newMockEvent())

  mintCanceledEvent.parameters = new Array()

  mintCanceledEvent.parameters.push(
    new ethereum.EventParam("mintId", ethereum.Value.fromUnsignedBigInt(mintId))
  )
  mintCanceledEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  mintCanceledEvent.parameters.push(
    new ethereum.EventParam("canceller", ethereum.Value.fromAddress(canceller))
  )

  return mintCanceledEvent
}

export function createMintExecutedEvent(
  mintId: BigInt,
  minter: Address,
  principalAmount: BigInt,
  amount: BigInt
): MintExecuted {
  let mintExecutedEvent = changetype<MintExecuted>(newMockEvent())

  mintExecutedEvent.parameters = new Array()

  mintExecutedEvent.parameters.push(
    new ethereum.EventParam("mintId", ethereum.Value.fromUnsignedBigInt(mintId))
  )
  mintExecutedEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  mintExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "principalAmount",
      ethereum.Value.fromUnsignedBigInt(principalAmount)
    )
  )
  mintExecutedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return mintExecutedEvent
}

export function createMintProposedEvent(
  mintId: BigInt,
  minter: Address,
  amount: BigInt,
  destination: Address
): MintProposed {
  let mintProposedEvent = changetype<MintProposed>(newMockEvent())

  mintProposedEvent.parameters = new Array()

  mintProposedEvent.parameters.push(
    new ethereum.EventParam("mintId", ethereum.Value.fromUnsignedBigInt(mintId))
  )
  mintProposedEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  mintProposedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  mintProposedEvent.parameters.push(
    new ethereum.EventParam(
      "destination",
      ethereum.Value.fromAddress(destination)
    )
  )

  return mintProposedEvent
}

export function createMinterActivatedEvent(
  minter: Address,
  caller: Address
): MinterActivated {
  let minterActivatedEvent = changetype<MinterActivated>(newMockEvent())

  minterActivatedEvent.parameters = new Array()

  minterActivatedEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  minterActivatedEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )

  return minterActivatedEvent
}

export function createMinterDeactivatedEvent(
  minter: Address,
  inactiveOwedM: BigInt,
  caller: Address
): MinterDeactivated {
  let minterDeactivatedEvent = changetype<MinterDeactivated>(newMockEvent())

  minterDeactivatedEvent.parameters = new Array()

  minterDeactivatedEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  minterDeactivatedEvent.parameters.push(
    new ethereum.EventParam(
      "inactiveOwedM",
      ethereum.Value.fromUnsignedBigInt(inactiveOwedM)
    )
  )
  minterDeactivatedEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )

  return minterDeactivatedEvent
}

export function createMinterFrozenEvent(
  minter: Address,
  frozenUntil: BigInt
): MinterFrozen {
  let minterFrozenEvent = changetype<MinterFrozen>(newMockEvent())

  minterFrozenEvent.parameters = new Array()

  minterFrozenEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  minterFrozenEvent.parameters.push(
    new ethereum.EventParam(
      "frozenUntil",
      ethereum.Value.fromUnsignedBigInt(frozenUntil)
    )
  )

  return minterFrozenEvent
}

export function createMissedIntervalsPenaltyImposedEvent(
  minter: Address,
  missedIntervals: BigInt,
  penaltyAmount: BigInt
): MissedIntervalsPenaltyImposed {
  let missedIntervalsPenaltyImposedEvent =
    changetype<MissedIntervalsPenaltyImposed>(newMockEvent())

  missedIntervalsPenaltyImposedEvent.parameters = new Array()

  missedIntervalsPenaltyImposedEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  missedIntervalsPenaltyImposedEvent.parameters.push(
    new ethereum.EventParam(
      "missedIntervals",
      ethereum.Value.fromUnsignedBigInt(missedIntervals)
    )
  )
  missedIntervalsPenaltyImposedEvent.parameters.push(
    new ethereum.EventParam(
      "penaltyAmount",
      ethereum.Value.fromUnsignedBigInt(penaltyAmount)
    )
  )

  return missedIntervalsPenaltyImposedEvent
}

export function createRetrievalCreatedEvent(
  retrievalId: BigInt,
  minter: Address,
  amount: BigInt
): RetrievalCreated {
  let retrievalCreatedEvent = changetype<RetrievalCreated>(newMockEvent())

  retrievalCreatedEvent.parameters = new Array()

  retrievalCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "retrievalId",
      ethereum.Value.fromUnsignedBigInt(retrievalId)
    )
  )
  retrievalCreatedEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  retrievalCreatedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return retrievalCreatedEvent
}

export function createRetrievalResolvedEvent(
  retrievalId: BigInt,
  minter: Address
): RetrievalResolved {
  let retrievalResolvedEvent = changetype<RetrievalResolved>(newMockEvent())

  retrievalResolvedEvent.parameters = new Array()

  retrievalResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "retrievalId",
      ethereum.Value.fromUnsignedBigInt(retrievalId)
    )
  )
  retrievalResolvedEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )

  return retrievalResolvedEvent
}

export function createUndercollateralizedPenaltyImposedEvent(
  minter: Address,
  excessOwedM: BigInt,
  timeSpan: BigInt,
  penaltyAmount: BigInt
): UndercollateralizedPenaltyImposed {
  let undercollateralizedPenaltyImposedEvent =
    changetype<UndercollateralizedPenaltyImposed>(newMockEvent())

  undercollateralizedPenaltyImposedEvent.parameters = new Array()

  undercollateralizedPenaltyImposedEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  )
  undercollateralizedPenaltyImposedEvent.parameters.push(
    new ethereum.EventParam(
      "excessOwedM",
      ethereum.Value.fromUnsignedBigInt(excessOwedM)
    )
  )
  undercollateralizedPenaltyImposedEvent.parameters.push(
    new ethereum.EventParam(
      "timeSpan",
      ethereum.Value.fromUnsignedBigInt(timeSpan)
    )
  )
  undercollateralizedPenaltyImposedEvent.parameters.push(
    new ethereum.EventParam(
      "penaltyAmount",
      ethereum.Value.fromUnsignedBigInt(penaltyAmount)
    )
  )

  return undercollateralizedPenaltyImposedEvent
}
