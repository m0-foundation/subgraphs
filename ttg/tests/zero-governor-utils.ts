import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  AllowedCashTokensSet,
  ProposalCreated,
  ProposalExecuted,
  QuorumNumeratorUpdated,
  ResetExecuted,
  ThresholdRatioSet,
  VoteCast
} from "../generated/ZeroGovernor/ZeroGovernor"

export function createAllowedCashTokensSetEvent(
  allowedCashTokens: Array<Address>
): AllowedCashTokensSet {
  let allowedCashTokensSetEvent = changetype<AllowedCashTokensSet>(
    newMockEvent()
  )

  allowedCashTokensSetEvent.parameters = new Array()

  allowedCashTokensSetEvent.parameters.push(
    new ethereum.EventParam(
      "allowedCashTokens",
      ethereum.Value.fromAddressArray(allowedCashTokens)
    )
  )

  return allowedCashTokensSetEvent
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

export function createQuorumNumeratorUpdatedEvent(
  oldQuorumNumerator: BigInt,
  newQuorumNumerator: BigInt
): QuorumNumeratorUpdated {
  let quorumNumeratorUpdatedEvent = changetype<QuorumNumeratorUpdated>(
    newMockEvent()
  )

  quorumNumeratorUpdatedEvent.parameters = new Array()

  quorumNumeratorUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldQuorumNumerator",
      ethereum.Value.fromUnsignedBigInt(oldQuorumNumerator)
    )
  )
  quorumNumeratorUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newQuorumNumerator",
      ethereum.Value.fromUnsignedBigInt(newQuorumNumerator)
    )
  )

  return quorumNumeratorUpdatedEvent
}

export function createResetExecutedEvent(
  bootstrapToken: Address,
  standardGovernor: Address,
  emergencyGovernor: Address,
  powerToken: Address
): ResetExecuted {
  let resetExecutedEvent = changetype<ResetExecuted>(newMockEvent())

  resetExecutedEvent.parameters = new Array()

  resetExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "bootstrapToken",
      ethereum.Value.fromAddress(bootstrapToken)
    )
  )
  resetExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "standardGovernor",
      ethereum.Value.fromAddress(standardGovernor)
    )
  )
  resetExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "emergencyGovernor",
      ethereum.Value.fromAddress(emergencyGovernor)
    )
  )
  resetExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "powerToken",
      ethereum.Value.fromAddress(powerToken)
    )
  )

  return resetExecutedEvent
}

export function createThresholdRatioSetEvent(
  thresholdRatio: i32
): ThresholdRatioSet {
  let thresholdRatioSetEvent = changetype<ThresholdRatioSet>(newMockEvent())

  thresholdRatioSetEvent.parameters = new Array()

  thresholdRatioSetEvent.parameters.push(
    new ethereum.EventParam(
      "thresholdRatio",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(thresholdRatio))
    )
  )

  return thresholdRatioSetEvent
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
