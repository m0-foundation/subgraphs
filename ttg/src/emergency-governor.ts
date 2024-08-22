import {
  ProposalCreated as ProposalCreatedEvent,
  ProposalExecuted as ProposalExecutedEvent,
  QuorumNumeratorUpdated as QuorumNumeratorUpdatedEvent,
  ThresholdRatioSet as ThresholdRatioSetEvent,
  VoteCast as VoteCastEvent,
} from "../generated/EmergencyGovernor/EmergencyGovernor"
import {
  ProposalCreated,
  ProposalExecuted,
  QuorumNumeratorUpdated,
  ThresholdRatioSet,
  VoteCast,
} from "../generated/schema"



export function handleProposalCreated(event: ProposalCreatedEvent): void {
  let entity = new ProposalCreated(
    event.params.proposalId.toString(),
  )
  entity.proposalId = event.params.proposalId
  entity.proposer = event.params.proposer
  // entity.targets = event.params.targets
  entity.values = event.params.values
  entity.signatures = event.params.signatures
  entity.callDatas = event.params.callDatas
  entity.voteStart = event.params.voteStart
  entity.voteEnd = event.params.voteEnd
  entity.description = event.params.description
  entity.type = "emergency"

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleProposalExecuted(event: ProposalExecutedEvent): void {
  let entity = new ProposalExecuted(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.proposalId = event.params.proposalId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleQuorumNumeratorUpdated(
  event: QuorumNumeratorUpdatedEvent,
): void {
  let entity = new QuorumNumeratorUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.oldQuorumNumerator = event.params.oldQuorumNumerator
  entity.newQuorumNumerator = event.params.newQuorumNumerator

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleThresholdRatioSet(event: ThresholdRatioSetEvent): void {
  let entity = new ThresholdRatioSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.thresholdRatio = event.params.thresholdRatio

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVoteCast(event: VoteCastEvent): void {
  let entity = new VoteCast(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.voter = event.params.voter
  entity.proposalId = event.params.proposalId
  entity.support = event.params.support
  entity.weight = event.params.weight
  entity.reason = event.params.reason

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
