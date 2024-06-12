import {
  Claim as ClaimEvent,
  Distribution as DistributionEvent,
} from "../generated/DistributionVault/DistributionVault"
import { Claim, Distribution } from "../generated/schema"

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

