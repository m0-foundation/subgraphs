import { BigInt } from "@graphprotocol/graph-ts"
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
  ProposalExecuted,
  ProposalFeeSentToVault,
  ProposalFeeSet,
  VoteCast,
  ProposalParticipation,
} from "../generated/schema"
import {
  createProposalCreatedEntity,
  handleProposalParticipation,
  powerToken_pastTotalSupply,
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
  createProposalCreatedEntity("standard", event)

  const proposalId = event.params.proposalId.toString()
  const participation = new ProposalParticipation(proposalId)
  participation.proposal = proposalId
  participation.yesVotes = new BigInt(0)
  participation.noVotes = new BigInt(0)

  // Use the voteStart minus one to get the total supply at the start of the voting period
  // current epoch may already finished and inflation may have occurred
  const targetEpoch = event.params.voteStart.minus(new BigInt(1))
  participation.totalSupply = powerToken_pastTotalSupply(targetEpoch)

  participation.save()
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
