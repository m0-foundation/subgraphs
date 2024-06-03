import {
  Claim as ClaimEvent,
  Distribution as DistributionEvent,
  EIP712DomainChanged as EIP712DomainChangedEvent,
} from "../generated/DistributionVault/DistributionVault"
import { Claim, Distribution, EIP712DomainChanged } from "../generated/schema"

export function handleClaim(event: ClaimEvent): void {
  let entity = new Claim(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.token = event.params.token
  entity.account = event.params.account
  entity.startEpoch = event.params.startEpoch
  entity.endEpoch = event.params.endEpoch
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDistribution(event: DistributionEvent): void {
  let entity = new Distribution(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.token = event.params.token
  entity.epoch = event.params.epoch
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleEIP712DomainChanged(
  event: EIP712DomainChangedEvent,
): void {
  let entity = new EIP712DomainChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
