import {
  AuthorizationCanceled as AuthorizationCanceledEvent,
  AuthorizationUsed as AuthorizationUsedEvent,
  IndexUpdated as IndexUpdatedEvent,
  StartedEarning as StartedEarningEvent,
  StoppedEarning as StoppedEarningEvent,
} from "../generated/MToken/MToken"
import {
  MTokenAuthorizationCanceled as AuthorizationCanceled,
  MTokenAuthorizationUsed as AuthorizationUsed,
  MTokenIndexUpdated as IndexUpdated,
  MTokenStartedEarning as StartedEarning,
  MTokenStoppedEarning as StoppedEarning,
} from "../generated/schema"

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

export function handleIndexUpdated(event: IndexUpdatedEvent): void {
  let entity = new IndexUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.index = event.params.index
  entity.rate = event.params.rate

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleStartedEarning(event: StartedEarningEvent): void {
  let entity = new StartedEarning(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleStoppedEarning(event: StoppedEarningEvent): void {
  let entity = new StoppedEarning(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
