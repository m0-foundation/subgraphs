import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts"
import { PowerToken } from "../generated/PowerToken/PowerToken"
import { ZeroToken } from "../generated/ZeroToken/ZeroToken"
import { ProposalParticipation, ProposalCreated } from "../generated/schema"
import {
  VoteCast as VoteCastEvent,
  ProposalCreated as ProposalCreatedEvent,
} from "../generated/StandardGovernor/StandardGovernor"

interface Token {
  balanceOf(account_: Address): BigInt
  try_balanceOf(account_: Address): ethereum.CallResult<BigInt>
}

export function powerToken_balanceOf(
  tokenAddress: Address,
  accountAddress: Address,
): BigInt {
  let token = PowerToken.bind(tokenAddress) //bind token
  return balanceOf<PowerToken>(token, accountAddress)
}

export function powerToken_pastTotalSupply(
  tokenAddress: Address,
  epoch: BigInt,
): BigInt {
  let token = PowerToken.bind(tokenAddress) //bind token
  return token.pastTotalSupply(epoch)
}

export function zeroToken_balanceOf(
  tokenAddress: Address,
  accountAddress: Address,
): BigInt {
  let token = ZeroToken.bind(tokenAddress) //bind token
  return balanceOf<ZeroToken>(token, accountAddress)
}

export function balanceOf<T extends Token>(
  token: T,
  accountAddress: Address,
): BigInt {
  return token.balanceOf(accountAddress)
}

export function createProposalCreatedEntity(
  type: "emergency" | "standard" | "zero",
  event: ProposalCreatedEvent,
): ProposalCreated {
  let entity = new ProposalCreated(event.params.proposalId.toString())
  entity.type = type
  entity.proposalId = event.params.proposalId
  entity.proposer = event.params.proposer
  // entity.targets = event.params.targets
  entity.values = event.params.values
  entity.signatures = event.params.signatures
  entity.callDatas = event.params.callDatas
  entity.voteStart = event.params.voteStart
  entity.voteEnd = event.params.voteEnd
  entity.description = event.params.description

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  return entity
}

export function handleProposalParticipation<T extends VoteCastEvent>(
  event: T,
): void {
  const proposalId = event.params.proposalId.toString()

  let participation = ProposalParticipation.load(proposalId)

  if (!participation) {
    participation = new ProposalParticipation(proposalId)
    participation.proposal = proposalId
    participation.yesVotes = new BigInt(0)
    participation.noVotes = new BigInt(0)
  }

  if (event.params.support) {
    participation.yesVotes = participation.yesVotes.plus(event.params.weight)
  } else {
    participation.noVotes = participation.noVotes.plus(event.params.weight)
  }

  participation.save()
}

export function decodeUint256(value: Bytes): BigInt {
  return ethereum.decode("uint256", value)!.toBigInt()
}

export function safeDecodeBytes(value: Bytes): string {
  let str = value.toString()

  if (str.length === 0) {
    return value.toHexString()
  }

  // Simple check: is at least 80% of characters printable?
  let printable = 0
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i)
    if (code >= 32 && code <= 126) {
      printable++
    }
  }

  let ratio = (printable * 100) / str.length
  if (ratio < 80) {
    // Fallback to hex if it's mostly garbage
    return value.toHexString()
  }

  return str
}
