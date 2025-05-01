import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts"
import { PowerToken } from "../generated/PowerToken/PowerToken"
import { ZeroToken } from "../generated/ZeroToken/ZeroToken"
import { ProposalParticipation } from "../generated/schema"
import { VoteCast as VoteCastEvent } from "../generated/StandardGovernor/StandardGovernor"

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
