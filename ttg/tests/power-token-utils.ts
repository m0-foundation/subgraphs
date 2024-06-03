import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  Approval,
  AuthorizationCanceled,
  AuthorizationUsed,
  Buy,
  DelegateChanged,
  DelegateVotesChanged,
  EIP712DomainChanged,
  NextCashTokenSet,
  Sync,
  Tagline,
  TargetSupplyInflated,
  Transfer
} from "../generated/PowerToken/PowerToken"

export function createApprovalEvent(
  account: Address,
  spender: Address,
  amount: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return approvalEvent
}

export function createAuthorizationCanceledEvent(
  authorizer: Address,
  nonce: Bytes
): AuthorizationCanceled {
  let authorizationCanceledEvent = changetype<AuthorizationCanceled>(
    newMockEvent()
  )

  authorizationCanceledEvent.parameters = new Array()

  authorizationCanceledEvent.parameters.push(
    new ethereum.EventParam(
      "authorizer",
      ethereum.Value.fromAddress(authorizer)
    )
  )
  authorizationCanceledEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromFixedBytes(nonce))
  )

  return authorizationCanceledEvent
}

export function createAuthorizationUsedEvent(
  authorizer: Address,
  nonce: Bytes
): AuthorizationUsed {
  let authorizationUsedEvent = changetype<AuthorizationUsed>(newMockEvent())

  authorizationUsedEvent.parameters = new Array()

  authorizationUsedEvent.parameters.push(
    new ethereum.EventParam(
      "authorizer",
      ethereum.Value.fromAddress(authorizer)
    )
  )
  authorizationUsedEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromFixedBytes(nonce))
  )

  return authorizationUsedEvent
}

export function createBuyEvent(
  buyer: Address,
  amount: BigInt,
  cost: BigInt
): Buy {
  let buyEvent = changetype<Buy>(newMockEvent())

  buyEvent.parameters = new Array()

  buyEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  buyEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  buyEvent.parameters.push(
    new ethereum.EventParam("cost", ethereum.Value.fromUnsignedBigInt(cost))
  )

  return buyEvent
}

export function createDelegateChangedEvent(
  delegator: Address,
  fromDelegatee: Address,
  toDelegatee: Address
): DelegateChanged {
  let delegateChangedEvent = changetype<DelegateChanged>(newMockEvent())

  delegateChangedEvent.parameters = new Array()

  delegateChangedEvent.parameters.push(
    new ethereum.EventParam("delegator", ethereum.Value.fromAddress(delegator))
  )
  delegateChangedEvent.parameters.push(
    new ethereum.EventParam(
      "fromDelegatee",
      ethereum.Value.fromAddress(fromDelegatee)
    )
  )
  delegateChangedEvent.parameters.push(
    new ethereum.EventParam(
      "toDelegatee",
      ethereum.Value.fromAddress(toDelegatee)
    )
  )

  return delegateChangedEvent
}

export function createDelegateVotesChangedEvent(
  delegatee: Address,
  previousBalance: BigInt,
  newBalance: BigInt
): DelegateVotesChanged {
  let delegateVotesChangedEvent = changetype<DelegateVotesChanged>(
    newMockEvent()
  )

  delegateVotesChangedEvent.parameters = new Array()

  delegateVotesChangedEvent.parameters.push(
    new ethereum.EventParam("delegatee", ethereum.Value.fromAddress(delegatee))
  )
  delegateVotesChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousBalance",
      ethereum.Value.fromUnsignedBigInt(previousBalance)
    )
  )
  delegateVotesChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newBalance",
      ethereum.Value.fromUnsignedBigInt(newBalance)
    )
  )

  return delegateVotesChangedEvent
}

export function createEIP712DomainChangedEvent(): EIP712DomainChanged {
  let eip712DomainChangedEvent = changetype<EIP712DomainChanged>(newMockEvent())

  eip712DomainChangedEvent.parameters = new Array()

  return eip712DomainChangedEvent
}

export function createNextCashTokenSetEvent(
  startingEpoch: i32,
  nextCashToken: Address
): NextCashTokenSet {
  let nextCashTokenSetEvent = changetype<NextCashTokenSet>(newMockEvent())

  nextCashTokenSetEvent.parameters = new Array()

  nextCashTokenSetEvent.parameters.push(
    new ethereum.EventParam(
      "startingEpoch",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(startingEpoch))
    )
  )
  nextCashTokenSetEvent.parameters.push(
    new ethereum.EventParam(
      "nextCashToken",
      ethereum.Value.fromAddress(nextCashToken)
    )
  )

  return nextCashTokenSetEvent
}

export function createSyncEvent(account: Address): Sync {
  let syncEvent = changetype<Sync>(newMockEvent())

  syncEvent.parameters = new Array()

  syncEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return syncEvent
}

export function createTaglineEvent(tagline: string): Tagline {
  let taglineEvent = changetype<Tagline>(newMockEvent())

  taglineEvent.parameters = new Array()

  taglineEvent.parameters.push(
    new ethereum.EventParam("tagline", ethereum.Value.fromString(tagline))
  )

  return taglineEvent
}

export function createTargetSupplyInflatedEvent(
  targetEpoch: i32,
  targetSupply: BigInt
): TargetSupplyInflated {
  let targetSupplyInflatedEvent = changetype<TargetSupplyInflated>(
    newMockEvent()
  )

  targetSupplyInflatedEvent.parameters = new Array()

  targetSupplyInflatedEvent.parameters.push(
    new ethereum.EventParam(
      "targetEpoch",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(targetEpoch))
    )
  )
  targetSupplyInflatedEvent.parameters.push(
    new ethereum.EventParam(
      "targetSupply",
      ethereum.Value.fromUnsignedBigInt(targetSupply)
    )
  )

  return targetSupplyInflatedEvent
}

export function createTransferEvent(
  sender: Address,
  recipient: Address,
  amount: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return transferEvent
}
