import {
  AuthorizationCanceled as AuthorizationCanceledEvent,
  AuthorizationUsed as AuthorizationUsedEvent,
  Buy as BuyEvent,
  DelegateChanged as DelegateChangedEvent,
  DelegateVotesChanged as DelegateVotesChangedEvent,
  NextCashTokenSet as NextCashTokenSetEvent,
  TargetSupplyInflated as TargetSupplyInflatedEvent,
} from "../generated/PowerToken/PowerToken"
import {
  PowerTokenAuthorizationCanceled as AuthorizationCanceled,
  PowerTokenAuthorizationUsed as AuthorizationUsed,
  PowerTokenBuy as Buy,
  PowerTokenDelegateChanged as DelegateChanged,
  PowerTokenDelegateVotesChanged as DelegateVotesChanged,
  PowerTokenNextCashTokenSet as NextCashTokenSet,
  PowerTokenTargetSupplyInflated as TargetSupplyInflated,
  PowerTokenDelegatee,
} from "../generated/schema"

export function handleAuthorizationCanceled(
  event: AuthorizationCanceledEvent
): void {
  let entity = new AuthorizationCanceled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
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
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.authorizer = event.params.authorizer
  entity.nonce = event.params.nonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBuy(event: BuyEvent): void {
  let entity = new Buy(event.transaction.hash.concatI32(event.logIndex.toI32()))
  entity.buyer = event.params.buyer
  entity.amount = event.params.amount
  entity.cost = event.params.cost

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDelegateChanged(event: DelegateChangedEvent): void {
  let entity = new DelegateChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.delegator = event.params.delegator
  entity.fromDelegatee = event.params.fromDelegatee
  entity.toDelegatee = event.params.toDelegatee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()


  let delegatee = PowerTokenDelegatee.load(event.params.toDelegatee);
  if (!delegatee) { 
    delegatee = new PowerTokenDelegatee(event.params.toDelegatee);
  }
  delegatee.delegator = event.params.delegator;
  delegatee.updatedAt = event.block.timestamp;
  delegatee.transactionHash = event.transaction.hash;
  delegatee.save();
}

export function handleDelegateVotesChanged(
  event: DelegateVotesChangedEvent
): void {
  let entity = new DelegateVotesChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.delegatee = event.params.delegatee
  entity.previousBalance = event.params.previousBalance
  entity.newBalance = event.params.newBalance

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let delegatee = PowerTokenDelegatee.load(event.params.delegatee);
  if (delegatee) {
    delegatee.balance = event.params.newBalance;
    delegatee.updatedAt = event.block.timestamp;
    delegatee.save();
  }
}


export function handleNextCashTokenSet(event: NextCashTokenSetEvent): void {
  let entity = new NextCashTokenSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.startingEpoch = event.params.startingEpoch
  entity.nextCashToken = event.params.nextCashToken

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTargetSupplyInflated(
  event: TargetSupplyInflatedEvent
): void {
  let entity = new TargetSupplyInflated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.targetEpoch = event.params.targetEpoch
  entity.targetSupply = event.params.targetSupply

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}