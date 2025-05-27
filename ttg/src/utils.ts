import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts"
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

export function powerToken_pastTotalSupply(epoch: BigInt): BigInt {
  let token = PowerToken.bind(
    Address.fromString("0x5983B89FA184f14917013B9C3062afD9434C5b03"),
  )
  const supply_result = token.try_totalSupply()

  if (supply_result.reverted) {
    log.warning("powerToken_totalSupply reverted for epoch {} at address {}", [
      epoch.toString(),
      token._address.toHexString(),
    ])

    const test = token.try_name()
    if (test.reverted) {
      log.warning("powerToken_name reverted for epoch {} at address {}", [
        epoch.toString(),
        token._address.toHexString(),
      ])
    } else {
      log.warning("powerToken_name: {}", [test.value])
    }

    return BigInt.fromI32(1)
  }

  return supply_result.value
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

export function createProposalParticipationEntity(
  proposalId: string,
  proposalVoteStart: BigInt,
): void {
  let participation = new ProposalParticipation(proposalId)
  participation.proposal = proposalId
  participation.yesVotes = new BigInt(0)
  participation.noVotes = new BigInt(0)

  // Use the voteStart minus one to get the total supply at the start of the voting period
  // current epoch may already finished and inflation may have occurred
  const targetEpoch = proposalVoteStart.minus(new BigInt(1))
  participation.totalSupply = powerToken_pastTotalSupply(targetEpoch)

  participation.save()
}

export function handleProposalParticipation<T extends VoteCastEvent>(
  event: T,
): void {
  const proposalId = event.params.proposalId.toString()

  let participation = ProposalParticipation.load(proposalId)

  if (!participation) {
    throw new Error(
      `Participation entity not found for proposal ID: ${proposalId}`,
    )
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
