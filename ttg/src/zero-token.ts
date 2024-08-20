import {
  AuthorizationCanceled as AuthorizationCanceledEvent,
  AuthorizationUsed as AuthorizationUsedEvent,
  DelegateChanged as DelegateChangedEvent,
  DelegateVotesChanged as DelegateVotesChangedEvent,
} from "../generated/ZeroToken/ZeroToken"
import {
  ZeroTokenAuthorizationCanceled as AuthorizationCanceled,
  ZeroTokenAuthorizationUsed as AuthorizationUsed,
  ZeroTokenDelegateChanged  as DelegateChanged,
  ZeroTokenDelegateVotesChanged as DelegateVotesChanged,
  ZeroTokenDelegator,
} from "../generated/schema"
import {
  zeroToken_balanceOf,
} from "./utils"

export function handleAuthorizationCanceled(
  event: AuthorizationCanceledEvent,
): void {
  let entity = new AuthorizationCanceled(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.authorizer = event.params.authorizer
  entity.nonce = event.params.nonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAuthorizationUsed(event: AuthorizationUsedEvent): void {
  let entity = new AuthorizationUsed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.authorizer = event.params.authorizer
  entity.nonce = event.params.nonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDelegateChanged(event: DelegateChangedEvent): void {
  let entity = new DelegateChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.delegator = event.params.delegator
  entity.fromDelegatee = event.params.fromDelegatee
  entity.toDelegatee = event.params.toDelegatee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let delegation = ZeroTokenDelegator.load(event.params.delegator);
  if (!delegation) { 
    delegation = new ZeroTokenDelegator(event.params.delegator);
  }
  delegation.delegation = event.params.toDelegatee;
  delegation.updatedAt = event.block.timestamp;
  delegation.transactionHash = event.transaction.hash;
  delegation.balance = zeroToken_balanceOf(event.address, event.params.delegator);
  delegation.save();
}

export function handleDelegateVotesChanged(
  event: DelegateVotesChangedEvent,
): void {
  let entity = new DelegateVotesChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.delegatee = event.params.delegatee
  entity.previousBalance = event.params.previousBalance
  entity.newBalance = event.params.newBalance

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}