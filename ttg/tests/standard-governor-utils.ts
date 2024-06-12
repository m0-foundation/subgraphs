import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  CashTokenSet,
  HasVotedOnAllProposals,
  ProposalCreated,
  ProposalExecuted,
  ProposalFeeSentToVault,
  ProposalFeeSet,
  VoteCast
} from "../generated/StandardGovernor/StandardGovernor"

export function createCashTokenSetEvent(cashToken: Address): CashTokenSet {
  let cashTokenSetEvent = changetype<CashTokenSet>(newMockEvent())

  cashTokenSetEvent.parameters = new Array()

  cashTokenSetEvent.parameters.push(
    new ethereum.EventParam("cashToken", ethereum.Value.fromAddress(cashToken))
  )

  return cashTokenSetEvent
}



export function createHasVotedOnAllProposalsEvent(
  voter: Address,
  currentEpoch: BigInt
): HasVotedOnAllProposals {
  let hasVotedOnAllProposalsEvent = changetype<HasVotedOnAllProposals>(
    newMockEvent()
  )

  hasVotedOnAllProposalsEvent.parameters = new Array()

  hasVotedOnAllProposalsEvent.parameters.push(
    new ethereum.EventParam("voter", ethereum.Value.fromAddress(voter))
  )
  hasVotedOnAllProposalsEvent.parameters.push(
    new ethereum.EventParam(
      "currentEpoch",
      ethereum.Value.fromUnsignedBigInt(currentEpoch)
    )
  )

  return hasVotedOnAllProposalsEvent
}

export function createProposalCreatedEvent(
  proposalId: BigInt,
  proposer: Address,
  targets: Array<Address>,
  values: Array<BigInt>,
  signatures: Array<string>,
  callDatas: Array<Bytes>,
  voteStart: BigInt,
  voteEnd: BigInt,
  description: string
): ProposalCreated {
  let proposalCreatedEvent = changetype<ProposalCreated>(newMockEvent())

  proposalCreatedEvent.parameters = new Array()

  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "proposalId",
      ethereum.Value.fromUnsignedBigInt(proposalId)
    )
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam("proposer", ethereum.Value.fromAddress(proposer))
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam("targets", ethereum.Value.fromAddressArray(targets))
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "values",
      ethereum.Value.fromUnsignedBigIntArray(values)
    )
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "signatures",
      ethereum.Value.fromStringArray(signatures)
    )
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "callDatas",
      ethereum.Value.fromBytesArray(callDatas)
    )
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "voteStart",
      ethereum.Value.fromUnsignedBigInt(voteStart)
    )
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "voteEnd",
      ethereum.Value.fromUnsignedBigInt(voteEnd)
    )
  )
  proposalCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "description",
      ethereum.Value.fromString(description)
    )
  )

  return proposalCreatedEvent
}

export function createProposalExecutedEvent(
  proposalId: BigInt
): ProposalExecuted {
  let proposalExecutedEvent = changetype<ProposalExecuted>(newMockEvent())

  proposalExecutedEvent.parameters = new Array()

  proposalExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "proposalId",
      ethereum.Value.fromUnsignedBigInt(proposalId)
    )
  )

  return proposalExecutedEvent
}

export function createProposalFeeSentToVaultEvent(
  proposalId: BigInt,
  cashToken: Address,
  amount: BigInt
): ProposalFeeSentToVault {
  let proposalFeeSentToVaultEvent = changetype<ProposalFeeSentToVault>(
    newMockEvent()
  )

  proposalFeeSentToVaultEvent.parameters = new Array()

  proposalFeeSentToVaultEvent.parameters.push(
    new ethereum.EventParam(
      "proposalId",
      ethereum.Value.fromUnsignedBigInt(proposalId)
    )
  )
  proposalFeeSentToVaultEvent.parameters.push(
    new ethereum.EventParam("cashToken", ethereum.Value.fromAddress(cashToken))
  )
  proposalFeeSentToVaultEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return proposalFeeSentToVaultEvent
}

export function createProposalFeeSetEvent(proposalFee: BigInt): ProposalFeeSet {
  let proposalFeeSetEvent = changetype<ProposalFeeSet>(newMockEvent())

  proposalFeeSetEvent.parameters = new Array()

  proposalFeeSetEvent.parameters.push(
    new ethereum.EventParam(
      "proposalFee",
      ethereum.Value.fromUnsignedBigInt(proposalFee)
    )
  )

  return proposalFeeSetEvent
}

export function createVoteCastEvent(
  voter: Address,
  proposalId: BigInt,
  support: i32,
  weight: BigInt,
  reason: string
): VoteCast {
  let voteCastEvent = changetype<VoteCast>(newMockEvent())

  voteCastEvent.parameters = new Array()

  voteCastEvent.parameters.push(
    new ethereum.EventParam("voter", ethereum.Value.fromAddress(voter))
  )
  voteCastEvent.parameters.push(
    new ethereum.EventParam(
      "proposalId",
      ethereum.Value.fromUnsignedBigInt(proposalId)
    )
  )
  voteCastEvent.parameters.push(
    new ethereum.EventParam(
      "support",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(support))
    )
  )
  voteCastEvent.parameters.push(
    new ethereum.EventParam("weight", ethereum.Value.fromUnsignedBigInt(weight))
  )
  voteCastEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )

  return voteCastEvent
}
