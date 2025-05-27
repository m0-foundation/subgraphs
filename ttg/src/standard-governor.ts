import {
  CashTokenSet as CashTokenSetEvent,
  HasVotedOnAllProposals as HasVotedOnAllProposalsEvent,
  ProposalCreated as ProposalCreatedEvent,
  ProposalExecuted as ProposalExecutedEvent,
  ProposalFeeSentToVault as ProposalFeeSentToVaultEvent,
  ProposalFeeSet as ProposalFeeSetEvent,
  VoteCast as VoteCastEvent,
} from "../generated/StandardGovernor/StandardGovernor"
import {
  CashTokenSet,
  HasVotedOnAllProposal,
  ProposalCreated,
  ProposalExecuted,
  ProposalFeeSentToVault,
  ProposalFeeSet,
  VoteCast,
} from "../generated/schema"
import {
  createProposalParticipationEntity,
  handleProposalParticipation,
} from "./utils"

export function handleCashTokenSet(event: CashTokenSetEvent): void {
  let entity = new CashTokenSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.cashToken = event.params.cashToken

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleHasVotedOnAllProposals(
  event: HasVotedOnAllProposalsEvent,
): void {
  let entity = new HasVotedOnAllProposal(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.voter = event.params.voter
  entity.currentEpoch = event.params.currentEpoch

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleProposalCreated(event: ProposalCreatedEvent): void {
  const proposalId = event.params.proposalId.toString()

  let entity = new ProposalCreated(proposalId)
  entity.proposalId = event.params.proposalId
  entity.proposer = event.params.proposer
  // entity.targets = event.params.targets
  entity.values = event.params.values
  entity.signatures = event.params.signatures
  entity.callDatas = event.params.callDatas
  entity.voteStart = event.params.voteStart
  entity.voteEnd = event.params.voteEnd
  entity.description = event.params.description
  entity.type = "standard"

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  createProposalParticipationEntity(proposalId, entity.voteStart)
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

export function handleProposalFeeSentToVault(
  event: ProposalFeeSentToVaultEvent,
): void {
  let entity = new ProposalFeeSentToVault(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.proposalId = event.params.proposalId
  entity.cashToken = event.params.cashToken
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleProposalFeeSet(event: ProposalFeeSetEvent): void {
  let entity = new ProposalFeeSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.proposalFee = event.params.proposalFee

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

  handleProposalParticipation(event)
}
